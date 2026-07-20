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

/**
 * Open Finance Brasil via Pluggy (iniciador/agregador certificado).
 * Docs: https://docs.pluggy.ai
 *
 * Fluxo real:
 * 1. API Key com clientId/clientSecret
 * 2. Connect Token por usuário
 * 3. Widget Pluggy no frontend
 * 4. itemId gravado nas credenciais
 * 5. Sync de transações reais
 */
@Injectable()
export class OpenFinanceIntegrationService {
  private readonly logger = new Logger(OpenFinanceIntegrationService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {
    this.baseUrl = (
      this.config.get<string>('PLUGGY_API_URL') ?? 'https://api.pluggy.ai'
    ).replace(/\/$/, '');
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.get<string>('PLUGGY_CLIENT_ID') &&
        this.config.get<string>('PLUGGY_CLIENT_SECRET'),
    );
  }

  private ensureConfigured() {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Open Finance não configurado. Defina PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET (Pluggy — Open Finance Brasil).',
      );
    }
  }

  async createApiKey(): Promise<string> {
    this.ensureConfigured();
    const res = await fetch(`${this.baseUrl}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: this.config.get<string>('PLUGGY_CLIENT_ID'),
        clientSecret: this.config.get<string>('PLUGGY_CLIENT_SECRET'),
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new ServiceUnavailableException(`Pluggy auth falhou: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { apiKey: string };
    return data.apiKey;
  }

  /** Token para o widget Pluggy Connect no frontend */
  async createConnectToken(userId: string, connectionId: string): Promise<{
    connectToken: string;
    connectionId: string;
    provider: 'pluggy';
  }> {
    this.ensureConfigured();
    const apiKey = await this.createApiKey();
    const webhookUrl = this.config.get<string>('PLUGGY_WEBHOOK_URL');

    const res = await fetch(`${this.baseUrl}/connect_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        clientUserId: userId,
        webhookUrl: webhookUrl || undefined,
        // evita contas de investimento no MVP; foca em conta corrente/cartão
        // options: https://docs.pluggy.ai
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new ServiceUnavailableException(`Pluggy connect_token falhou: ${res.status} ${text}`);
    }

    const data = (await res.json()) as { accessToken: string };
    return {
      connectToken: data.accessToken,
      connectionId,
      provider: 'pluggy',
    };
  }

  async saveItem(
    userId: string,
    connectionId: string,
    itemId: string,
  ): Promise<void> {
    this.ensureConfigured();
    // valida item no Pluggy
    const apiKey = await this.createApiKey();
    const res = await fetch(`${this.baseUrl}/items/${itemId}`, {
      headers: { 'X-API-KEY': apiKey },
    });
    if (!res.ok) {
      throw new BadRequestException(`Item Open Finance inválido: ${itemId}`);
    }
    const item = (await res.json()) as {
      id: string;
      connector?: { name?: string };
      status?: string;
    };

    const credentials = {
      provider: 'pluggy',
      itemId: item.id,
      connectorName: item.connector?.name,
      status: item.status,
      obtainedAt: new Date().toISOString(),
    };

    await this.prisma.integrationConnection.updateMany({
      where: { id: connectionId, userId },
      data: {
        status: 'CONNECTED',
        externalAccountId: item.id,
        credentialsEnc: this.encryption.encrypt(JSON.stringify(credentials)),
        lastError: null,
        metadata: { connectorName: item.connector?.name, provider: 'pluggy' },
      },
    });
  }

  async fetchTransactions(
    userId: string,
    connectionId: string,
  ): Promise<IngestEventInput[]> {
    this.ensureConfigured();

    const connection = await this.prisma.integrationConnection.findFirst({
      where: { id: connectionId, userId },
    });
    if (!connection?.credentialsEnc) {
      throw new BadRequestException('Open Finance sem item conectado. Conclua o consentimento.');
    }

    const creds = JSON.parse(
      this.encryption.decrypt(connection.credentialsEnc),
    ) as { itemId?: string; accessToken?: string };

    if (!creds.itemId || creds.accessToken === 'mock') {
      throw new BadRequestException(
        'Conexão Open Finance inválida ou mock. Reconecte via Pluggy.',
      );
    }

    const apiKey = await this.createApiKey();

    // Contas do item
    const accountsRes = await fetch(
      `${this.baseUrl}/accounts?itemId=${encodeURIComponent(creds.itemId)}`,
      { headers: { 'X-API-KEY': apiKey } },
    );
    if (!accountsRes.ok) {
      throw new ServiceUnavailableException(
        `Falha ao listar contas Open Finance: ${accountsRes.status}`,
      );
    }
    const accountsBody = (await accountsRes.json()) as {
      results?: Array<{ id: string; name?: string; type?: string }>;
    };
    const accounts = accountsBody.results ?? [];

    const from = new Date();
    from.setMonth(from.getMonth() - 12);
    const fromStr = from.toISOString().slice(0, 10);

    const events: IngestEventInput[] = [];

    for (const account of accounts) {
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 20) {
        const url = new URL(`${this.baseUrl}/transactions`);
        url.searchParams.set('accountId', account.id);
        url.searchParams.set('from', fromStr);
        url.searchParams.set('pageSize', '100');
        url.searchParams.set('page', String(page));

        const txRes = await fetch(url.toString(), {
          headers: { 'X-API-KEY': apiKey },
        });
        if (!txRes.ok) {
          this.logger.warn(`transactions account=${account.id} status=${txRes.status}`);
          break;
        }
        const txBody = (await txRes.json()) as {
          results?: Array<{
            id: string;
            description?: string;
            descriptionRaw?: string;
            amount: number;
            currencyCode?: string;
            date: string;
            type?: string;
            merchant?: { name?: string; businessName?: string };
            category?: string;
          }>;
          totalPages?: number;
          page?: number;
        };

        const rows = txBody.results ?? [];
        for (const tx of rows) {
          // valores Pluggy: positivos/negativos; assinaturas costumam ser débitos (amount < 0)
          const amountAbs = Math.abs(tx.amount);
          const amountCents = Math.round(amountAbs * 100);
          const merchant =
            tx.merchant?.businessName ||
            tx.merchant?.name ||
            tx.descriptionRaw ||
            tx.description ||
            'Transação';

          events.push({
            source: SubscriptionSource.OPEN_FINANCE,
            connectionId,
            occurredAt: new Date(tx.date),
            amountCents,
            currency: tx.currencyCode ?? 'BRL',
            merchantRaw: merchant,
            description: tx.description ?? merchant,
            payload: {
              pluggyTransactionId: tx.id,
              accountId: account.id,
              accountName: account.name,
              category: tx.category,
              type: tx.type,
              real: true,
            },
          });
        }

        hasMore = page < (txBody.totalPages ?? page);
        page += 1;
      }
    }

    this.logger.log(
      `Open Finance sync user=${userId} item=${creds.itemId}: ${events.length} transações reais`,
    );
    return events;
  }

  /** @deprecated use createConnectToken — mantido para compat de assinatura */
  getConsentUrl(_userId: string, _connectionId: string): string {
    throw new ServiceUnavailableException(
      'Use o fluxo Pluggy Connect (connectToken). Configure PLUGGY_CLIENT_ID/SECRET.',
    );
  }
}
