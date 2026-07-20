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
import { OAuthCredentials } from './gmail.integration';

/**
 * Microsoft Graph — leitura real de e-mails da caixa (recibos Microsoft 365 / Store).
 */
@Injectable()
export class MicrosoftIntegrationService {
  private readonly logger = new Logger(MicrosoftIntegrationService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly parser: EmailReceiptParser,
  ) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('MICROSOFT_CLIENT_ID') &&
        this.config.get<string>('MICROSOFT_CLIENT_SECRET'),
    );
  }

  private redirectUri() {
    const apiUrl = this.config.get<string>('API_URL') ?? 'http://localhost:4000';
    return `${apiUrl}/api/v1/integrations/MICROSOFT/oauth/callback`;
  }

  getAuthorizeUrl(userId: string, connectionId: string): string {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Microsoft não configurado. Defina MICROSOFT_CLIENT_ID e MICROSOFT_CLIENT_SECRET.',
      );
    }
    const state = this.encryption.encrypt(
      JSON.stringify({ userId, connectionId, type: 'MICROSOFT', ts: Date.now() }),
    );
    const params = new URLSearchParams({
      client_id: this.config.getOrThrow('MICROSOFT_CLIENT_ID'),
      response_type: 'code',
      redirect_uri: this.redirectUri(),
      response_mode: 'query',
      scope: 'offline_access User.Read Mail.Read',
      state,
    });
    const tenant = this.config.get<string>('MICROSOFT_TENANT') ?? 'common';
    return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params}`;
  }

  parseState(state: string): { userId: string; connectionId: string } {
    try {
      const raw = JSON.parse(this.encryption.decrypt(state)) as {
        userId: string;
        connectionId: string;
      };
      return { userId: raw.userId, connectionId: raw.connectionId };
    } catch {
      throw new BadRequestException('State OAuth Microsoft inválido');
    }
  }

  async exchangeCode(code: string): Promise<OAuthCredentials> {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException('Microsoft OAuth não configurado');
    }
    const tenant = this.config.get<string>('MICROSOFT_TENANT') ?? 'common';
    const body = new URLSearchParams({
      client_id: this.config.getOrThrow('MICROSOFT_CLIENT_ID'),
      client_secret: this.config.getOrThrow('MICROSOFT_CLIENT_SECRET'),
      code,
      redirect_uri: this.redirectUri(),
      grant_type: 'authorization_code',
      scope: 'offline_access User.Read Mail.Read',
    });
    const res = await fetch(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    );
    if (!res.ok) {
      throw new BadRequestException(`Token Microsoft falhou: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
      scope?: string;
    };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiryDate: data.expires_in
        ? Date.now() + data.expires_in * 1000
        : undefined,
      tokenType: data.token_type,
      scope: data.scope,
      obtainedAt: new Date().toISOString(),
    };
  }

  async fetchReceiptEmails(
    userId: string,
    connectionId: string,
  ): Promise<IngestEventInput[]> {
    const connection = await this.prisma.integrationConnection.findUnique({
      where: { id: connectionId },
    });
    if (!connection?.credentialsEnc) {
      throw new BadRequestException('Microsoft sem credenciais. Reconecte.');
    }
    const creds = JSON.parse(
      this.encryption.decrypt(connection.credentialsEnc),
    ) as OAuthCredentials;
    if (creds.accessToken === 'mock') {
      throw new BadRequestException('Conexão mock. Reconecte Microsoft com OAuth real.');
    }

    const filter =
      "contains(subject,'invoice') or contains(subject,'receipt') or contains(subject,'Microsoft 365') or contains(subject,'assinatura') or contains(subject,'subscription') or contains(subject,'Xbox')";
    const url = `https://graph.microsoft.com/v1.0/me/messages?$top=40&$select=id,subject,from,receivedDateTime,bodyPreview,body&$search="invoice OR receipt OR Microsoft 365 OR assinatura"`;

    let res = await fetch(url, {
      headers: { Authorization: `Bearer ${creds.accessToken}` },
    });

    // refresh se 401
    if (res.status === 401 && creds.refreshToken) {
      const refreshed = await this.refresh(creds.refreshToken);
      await this.prisma.integrationConnection.update({
        where: { id: connectionId },
        data: { credentialsEnc: this.encryption.encrypt(JSON.stringify(refreshed)) },
      });
      res = await fetch(url, {
        headers: { Authorization: `Bearer ${refreshed.accessToken}` },
      });
    }

    if (!res.ok) {
      // fallback filter syntax
      const alt = `https://graph.microsoft.com/v1.0/me/messages?$top=40&$filter=${encodeURIComponent(filter)}&$select=id,subject,from,receivedDateTime,bodyPreview,body`;
      res = await fetch(alt, {
        headers: { Authorization: `Bearer ${creds.accessToken}` },
      });
    }

    if (!res.ok) {
      throw new ServiceUnavailableException(
        `Graph Mail falhou: ${res.status} ${await res.text()}`,
      );
    }

    const data = (await res.json()) as {
      value?: Array<{
        id: string;
        subject?: string;
        from?: { emailAddress?: { address?: string; name?: string } };
        receivedDateTime?: string;
        bodyPreview?: string;
        body?: { content?: string };
      }>;
    };

    const events: IngestEventInput[] = [];
    for (const msg of data.value ?? []) {
      const from =
        msg.from?.emailAddress?.name ||
        msg.from?.emailAddress?.address ||
        'Microsoft';
      const date = msg.receivedDateTime
        ? new Date(msg.receivedDateTime)
        : new Date();
      const body = msg.body?.content ?? msg.bodyPreview ?? '';
      const parsed = this.parser.parse({
        subject: msg.subject ?? '',
        from,
        body: body.replace(/<[^>]+>/g, ' '),
        date,
      });

      events.push({
        source: SubscriptionSource.MICROSOFT,
        connectionId,
        occurredAt: parsed.occurredAt,
        amountCents: parsed.amountCents ?? undefined,
        currency: parsed.currency,
        merchantRaw: parsed.merchantRaw,
        description: parsed.description,
        payload: {
          graphMessageId: msg.id,
          real: true,
          userId,
        },
      });
    }

    this.logger.log(`Microsoft Graph: ${events.length} mensagens reais`);
    return events;
  }

  private async refresh(refreshToken: string): Promise<OAuthCredentials> {
    const tenant = this.config.get<string>('MICROSOFT_TENANT') ?? 'common';
    const body = new URLSearchParams({
      client_id: this.config.getOrThrow('MICROSOFT_CLIENT_ID'),
      client_secret: this.config.getOrThrow('MICROSOFT_CLIENT_SECRET'),
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
      scope: 'offline_access User.Read Mail.Read',
    });
    const res = await fetch(
      `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      },
    );
    if (!res.ok) throw new BadRequestException('Refresh Microsoft falhou');
    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
    };
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? refreshToken,
      expiryDate: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
      obtainedAt: new Date().toISOString(),
    };
  }
}
