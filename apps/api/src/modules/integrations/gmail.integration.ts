import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionSource } from '@prisma/client';
import { EncryptionService } from '../../common/crypto/encryption.service';
import { PrismaService } from '../../prisma/prisma.service';
import { IngestEventInput } from '../detection/detection.service';
import { EmailReceiptParser } from './email-receipt.parser';

export type OAuthCredentials = {
  accessToken: string;
  refreshToken?: string;
  expiryDate?: number;
  scope?: string;
  tokenType?: string;
  obtainedAt: string;
};

const GMAIL_QUERY =
  '(invoice OR receipt OR subscription OR "pagamento aprovado" OR renovação OR renovacao OR fatura OR recibo OR assinatura OR "your receipt" OR "payment received" OR billing OR cobrança OR cobranca) newer_than:365d';

@Injectable()
export class GmailIntegrationService {
  private readonly logger = new Logger(GmailIntegrationService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly parser: EmailReceiptParser,
  ) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('GOOGLE_CLIENT_ID') &&
        this.config.get<string>('GOOGLE_CLIENT_SECRET'),
    );
  }

  private ensureConfigured() {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Gmail não configurado. Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET no ambiente da API.',
      );
    }
  }

  private redirectUri() {
    const apiUrl = this.config.get<string>('API_URL') ?? 'http://localhost:4000';
    return `${apiUrl}/api/v1/integrations/GMAIL/oauth/callback`;
  }

  getAuthorizeUrl(userId: string, connectionId: string): string {
    this.ensureConfigured();
    const state = this.encryption.encrypt(
      JSON.stringify({ userId, connectionId, type: 'GMAIL', ts: Date.now() }),
    );
    const params = new URLSearchParams({
      client_id: this.config.getOrThrow('GOOGLE_CLIENT_ID'),
      redirect_uri: this.redirectUri(),
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'openid',
        'email',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
      include_granted_scopes: 'true',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<OAuthCredentials> {
    this.ensureConfigured();
    const body = new URLSearchParams({
      code,
      client_id: this.config.getOrThrow('GOOGLE_CLIENT_ID'),
      client_secret: this.config.getOrThrow('GOOGLE_CLIENT_SECRET'),
      redirect_uri: this.redirectUri(),
      grant_type: 'authorization_code',
    });
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      throw new BadRequestException(`Token Google falhou: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      token_type?: string;
    };
    if (!data.access_token) {
      throw new BadRequestException('Google não retornou access_token');
    }
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiryDate: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
      scope: data.scope,
      tokenType: data.token_type ?? 'Bearer',
      obtainedAt: new Date().toISOString(),
    };
  }

  parseState(state: string): { userId: string; connectionId: string } {
    try {
      const raw = JSON.parse(this.encryption.decrypt(state)) as {
        userId: string;
        connectionId: string;
      };
      if (!raw.userId || !raw.connectionId) throw new Error('invalid');
      return { userId: raw.userId, connectionId: raw.connectionId };
    } catch {
      throw new BadRequestException('State OAuth inválido ou expirado');
    }
  }

  private async loadCredentials(connectionId: string): Promise<OAuthCredentials> {
    const connection = await this.prisma.integrationConnection.findUnique({
      where: { id: connectionId },
    });
    if (!connection?.credentialsEnc) {
      throw new BadRequestException('Conexão Gmail sem credenciais. Reconecte a conta.');
    }
    const creds = JSON.parse(
      this.encryption.decrypt(connection.credentialsEnc),
    ) as OAuthCredentials;
    if (creds.accessToken === 'mock' || creds.refreshToken === 'mock') {
      throw new BadRequestException(
        'Conexão mock detectada. Desconecte e reconecte o Gmail com OAuth real.',
      );
    }
    return creds;
  }

  private async persistCredentials(connectionId: string, creds: OAuthCredentials) {
    await this.prisma.integrationConnection.update({
      where: { id: connectionId },
      data: { credentialsEnc: this.encryption.encrypt(JSON.stringify(creds)) },
    });
  }

  private async refreshIfNeeded(
    connectionId: string,
    creds: OAuthCredentials,
  ): Promise<OAuthCredentials> {
    if (creds.expiryDate && creds.expiryDate > Date.now() + 60_000) {
      return creds;
    }
    if (!creds.refreshToken) return creds;

    this.ensureConfigured();
    const body = new URLSearchParams({
      client_id: this.config.getOrThrow('GOOGLE_CLIENT_ID'),
      client_secret: this.config.getOrThrow('GOOGLE_CLIENT_SECRET'),
      refresh_token: creds.refreshToken,
      grant_type: 'refresh_token',
    });
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      throw new BadRequestException(
        `Refresh Gmail falhou. Reconecte a conta. ${await res.text()}`,
      );
    }
    const data = (await res.json()) as {
      access_token: string;
      expires_in?: number;
      scope?: string;
    };
    const next: OAuthCredentials = {
      ...creds,
      accessToken: data.access_token,
      expiryDate: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
      scope: data.scope ?? creds.scope,
      obtainedAt: new Date().toISOString(),
    };
    await this.persistCredentials(connectionId, next);
    return next;
  }

  private async gmailFetch(
    path: string,
    accessToken: string,
    init?: RequestInit,
  ): Promise<Response> {
    return fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init?.headers ?? {}),
      },
    });
  }

  /**
   * Busca e-mails reais no Gmail e extrai recibos/assinaturas.
   */
  async fetchSubscriptionEmails(
    userId: string,
    connectionId: string,
    options?: { queryExtra?: string; maxResults?: number },
  ): Promise<IngestEventInput[]> {
    let creds = await this.loadCredentials(connectionId);
    creds = await this.refreshIfNeeded(connectionId, creds);

    const maxResults = options?.maxResults ?? 50;
    const q = options?.queryExtra
      ? `(${GMAIL_QUERY}) (${options.queryExtra})`
      : GMAIL_QUERY;

    const listRes = await this.gmailFetch(
      `/messages?q=${encodeURIComponent(q)}&maxResults=${maxResults}`,
      creds.accessToken,
    );
    if (!listRes.ok) {
      throw new ServiceUnavailableException(
        `Gmail API list falhou: ${listRes.status} ${await listRes.text()}`,
      );
    }
    const list = (await listRes.json()) as { messages?: Array<{ id: string }> };
    const messages = list.messages ?? [];
    const events: IngestEventInput[] = [];

    for (const msg of messages) {
      try {
        const fullRes = await this.gmailFetch(
          `/messages/${msg.id}?format=full`,
          creds.accessToken,
        );
        if (!fullRes.ok) continue;
        const full = (await fullRes.json()) as {
          id: string;
          snippet?: string;
          internalDate?: string;
          payload?: {
            headers?: Array<{ name?: string; value?: string }>;
            body?: { data?: string };
            parts?: Array<{
              mimeType?: string;
              body?: { data?: string };
              parts?: unknown[];
            }>;
            mimeType?: string;
          };
        };

        const headers = full.payload?.headers ?? [];
        const subject =
          headers.find((h) => h.name?.toLowerCase() === 'subject')?.value ?? '';
        const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value ?? '';
        const dateHeader = headers.find((h) => h.name?.toLowerCase() === 'date')?.value;
        const date = dateHeader
          ? new Date(dateHeader)
          : new Date(Number(full.internalDate));

        const body = this.extractBody(full.payload);
        const parsed = this.parser.parse({ subject, from, body, date });

        events.push({
          source: SubscriptionSource.EMAIL,
          connectionId,
          occurredAt: parsed.occurredAt,
          amountCents: parsed.amountCents ?? undefined,
          currency: parsed.currency,
          merchantRaw: parsed.merchantRaw,
          description: parsed.description,
          payload: {
            gmailMessageId: msg.id,
            from,
            subject,
            planName: parsed.planName,
            snippet: full.snippet,
            real: true,
            userId,
          },
        });
      } catch (err) {
        this.logger.warn(`Falha ao ler mensagem ${msg.id}: ${err}`);
      }
    }

    this.logger.log(
      `Gmail sync user=${userId}: ${events.length} e-mails de recibo processados`,
    );
    return events;
  }

  private extractBody(payload: {
    body?: { data?: string };
    parts?: Array<{
      mimeType?: string;
      body?: { data?: string };
      parts?: unknown[];
    }>;
    mimeType?: string;
  } | null | undefined): string {
    if (!payload) return '';
    const decode = (data?: string) => {
      if (!data) return '';
      return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
        'utf8',
      );
    };

    if (payload.body?.data) return decode(payload.body.data);

    const parts = payload.parts ?? [];
    let text = '';
    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text += decode(part.body.data) + '\n';
      } else if (part.mimeType === 'text/html' && part.body?.data && !text) {
        text += decode(part.body.data)
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ');
      } else if (part.parts) {
        text += this.extractBody(part as typeof payload);
      }
    }
    return text.slice(0, 50_000);
  }
}
