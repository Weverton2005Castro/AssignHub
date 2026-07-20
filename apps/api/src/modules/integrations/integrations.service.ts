import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationStatus, IntegrationType } from '@prisma/client';
import { EncryptionService } from '../../common/crypto/encryption.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DetectionService } from '../detection/detection.service';
import { GmailIntegrationService } from './gmail.integration';
import { MicrosoftIntegrationService } from './microsoft.integration';
import { OpenFinanceIntegrationService } from './open-finance.integration';
import { StoreReceiptsIntegrationService } from './store-receipts.integration';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly detection: DetectionService,
    private readonly gmail: GmailIntegrationService,
    private readonly openFinance: OpenFinanceIntegrationService,
    private readonly stores: StoreReceiptsIntegrationService,
    private readonly microsoft: MicrosoftIntegrationService,
    private readonly config: ConfigService,
  ) {}

  async list(userId: string) {
    const types = Object.values(IntegrationType);
    const connections = await this.prisma.integrationConnection.findMany({
      where: { userId },
    });
    const byType = Object.fromEntries(connections.map((c) => [c.type, c]));
    const gmailConnected =
      byType[IntegrationType.GMAIL]?.status === IntegrationStatus.CONNECTED;

    return types.map((type) => {
      const c = byType[type];
      return {
        type,
        status: c?.status ?? IntegrationStatus.DISCONNECTED,
        lastSyncAt: c?.lastSyncAt ?? null,
        lastError: c?.lastError ?? null,
        connected: c?.status === IntegrationStatus.CONNECTED,
        configured: this.isTypeConfigured(type),
        requiresGmail:
          type === IntegrationType.GOOGLE_PLAY ||
          type === IntegrationType.APPLE ||
          type === IntegrationType.AMAZON ||
          (type === IntegrationType.MICROSOFT && !this.microsoft.isConfigured()),
        gmailReady: gmailConnected,
        mode: this.modeLabel(type),
      };
    });
  }

  private isTypeConfigured(type: IntegrationType): boolean {
    switch (type) {
      case IntegrationType.GMAIL:
        return this.gmail.isConfigured();
      case IntegrationType.OPEN_FINANCE:
        return this.openFinance.isConfigured();
      case IntegrationType.MICROSOFT:
        // Graph OAuth ou fallback Gmail
        return this.microsoft.isConfigured() || this.gmail.isConfigured();
      case IntegrationType.GOOGLE_PLAY:
      case IntegrationType.APPLE:
      case IntegrationType.AMAZON:
        return this.gmail.isConfigured();
      default:
        return false;
    }
  }

  private modeLabel(type: IntegrationType): string {
    switch (type) {
      case IntegrationType.GMAIL:
        return 'OAuth Gmail API (e-mails reais)';
      case IntegrationType.OPEN_FINANCE:
        return 'Pluggy Open Finance (transações reais)';
      case IntegrationType.MICROSOFT:
        return this.microsoft.isConfigured()
          ? 'Microsoft Graph (e-mails reais)'
          : 'Recibos via Gmail (e-mails reais)';
      case IntegrationType.GOOGLE_PLAY:
      case IntegrationType.APPLE:
      case IntegrationType.AMAZON:
        return 'Recibos via Gmail (e-mails reais)';
      default:
        return 'real';
    }
  }

  async connect(userId: string, type: IntegrationType) {
    if (!Object.values(IntegrationType).includes(type)) {
      throw new BadRequestException('Tipo de integração inválido');
    }

    const connection = await this.prisma.integrationConnection.upsert({
      where: { userId_type: { userId, type } },
      create: {
        userId,
        type,
        status: IntegrationStatus.PENDING,
        scopes: this.defaultScopes(type),
      },
      update: { status: IntegrationStatus.PENDING, lastError: null },
    });

    if (type === IntegrationType.GMAIL) {
      if (!this.gmail.isConfigured()) {
        throw new BadRequestException(
          'Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET. Redirect URI: {API_URL}/api/v1/integrations/GMAIL/oauth/callback',
        );
      }
      return {
        connectionId: connection.id,
        flow: 'oauth_redirect' as const,
        authorizeUrl: this.gmail.getAuthorizeUrl(userId, connection.id),
      };
    }

    if (type === IntegrationType.OPEN_FINANCE) {
      if (!this.openFinance.isConfigured()) {
        throw new BadRequestException(
          'Configure PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET (Open Finance Brasil via Pluggy).',
        );
      }
      const token = await this.openFinance.createConnectToken(userId, connection.id);
      return {
        flow: 'pluggy_widget' as const,
        connectionId: token.connectionId,
        connectToken: token.connectToken,
        provider: token.provider,
      };
    }

    if (type === IntegrationType.MICROSOFT && this.microsoft.isConfigured()) {
      return {
        connectionId: connection.id,
        flow: 'oauth_redirect' as const,
        authorizeUrl: this.microsoft.getAuthorizeUrl(userId, connection.id),
      };
    }

    // Lojas: vinculam à conta e sincronizam via Gmail real
    if (
      type === IntegrationType.GOOGLE_PLAY ||
      type === IntegrationType.APPLE ||
      type === IntegrationType.AMAZON ||
      type === IntegrationType.MICROSOFT
    ) {
      const gmailConn = await this.prisma.integrationConnection.findFirst({
        where: { userId, type: IntegrationType.GMAIL, status: IntegrationStatus.CONNECTED },
      });
      if (!gmailConn) {
        throw new BadRequestException(
          'Conecte o Gmail primeiro. Esta loja importa recibos reais do e-mail (não há API pública de assinaturas do consumidor).',
        );
      }
      if (!this.gmail.isConfigured()) {
        throw new BadRequestException('Gmail OAuth não está configurado no servidor.');
      }

      await this.prisma.integrationConnection.update({
        where: { id: connection.id },
        data: {
          status: IntegrationStatus.CONNECTED,
          credentialsEnc: this.encryption.encrypt(
            JSON.stringify({
              via: 'gmail_receipts',
              gmailConnectionId: gmailConn.id,
              obtainedAt: new Date().toISOString(),
              real: true,
            }),
          ),
          lastError: null,
        },
      });

      return {
        connectionId: connection.id,
        flow: 'gmail_linked' as const,
        authorizeUrl: null,
        message:
          'Conta vinculada ao Gmail. Clique em Sincronizar para importar recibos reais da loja.',
      };
    }

    throw new BadRequestException('Integração não suportada');
  }

  /** Callback autenticado (ex.: itemId do Pluggy) */
  async callback(
    userId: string,
    type: IntegrationType,
    body: { code?: string; state?: string; itemId?: string; mock?: boolean },
  ) {
    if (body.mock) {
      throw new BadRequestException(
        'Modo mock desativado. Use OAuth/Pluggy reais para conectar.',
      );
    }

    const connection = await this.prisma.integrationConnection.findUnique({
      where: { userId_type: { userId, type } },
    });
    if (!connection) throw new NotFoundException('Conexão não iniciada');

    if (type === IntegrationType.OPEN_FINANCE) {
      if (!body.itemId) {
        throw new BadRequestException('itemId Pluggy obrigatório após o consentimento');
      }
      await this.openFinance.saveItem(userId, connection.id, body.itemId);
      return { status: IntegrationStatus.CONNECTED, type, real: true };
    }

    throw new BadRequestException(
      'Para Gmail/Microsoft use o redirect OAuth (/oauth/callback).',
    );
  }

  /** OAuth browser redirect (Google / Microsoft) */
  async handleOAuthRedirect(
    type: IntegrationType,
    query: { code?: string; state?: string; error?: string },
  ): Promise<string> {
    const appUrl = this.config.get<string>('APP_URL') ?? 'http://localhost:3000';
    if (query.error) {
      return `${appUrl}/integrations?error=${encodeURIComponent(query.error)}&type=${type}`;
    }
    if (!query.code || !query.state) {
      return `${appUrl}/integrations?error=missing_code&type=${type}`;
    }

    try {
      if (type === IntegrationType.GMAIL) {
        const { userId, connectionId } = this.gmail.parseState(query.state);
        const credentials = await this.gmail.exchangeCode(query.code);
        await this.prisma.integrationConnection.update({
          where: { id: connectionId },
          data: {
            status: IntegrationStatus.CONNECTED,
            credentialsEnc: this.encryption.encrypt(JSON.stringify(credentials)),
            lastError: null,
          },
        });
        // sanity: connection belongs to user
        await this.prisma.integrationConnection.updateMany({
          where: { id: connectionId, userId },
          data: { status: IntegrationStatus.CONNECTED },
        });
        return `${appUrl}/integrations?connected=GMAIL`;
      }

      if (type === IntegrationType.MICROSOFT) {
        const { userId, connectionId } = this.microsoft.parseState(query.state);
        const credentials = await this.microsoft.exchangeCode(query.code);
        await this.prisma.integrationConnection.updateMany({
          where: { id: connectionId, userId },
          data: {
            status: IntegrationStatus.CONNECTED,
            credentialsEnc: this.encryption.encrypt(JSON.stringify(credentials)),
            lastError: null,
          },
        });
        return `${appUrl}/integrations?connected=MICROSOFT`;
      }

      return `${appUrl}/integrations?error=unsupported_oauth&type=${type}`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'oauth_failed';
      return `${appUrl}/integrations?error=${encodeURIComponent(msg)}&type=${type}`;
    }
  }

  async sync(userId: string, type: IntegrationType) {
    const connection = await this.prisma.integrationConnection.findUnique({
      where: { userId_type: { userId, type } },
    });
    if (!connection || connection.status !== IntegrationStatus.CONNECTED) {
      throw new NotFoundException('Integração não conectada');
    }

    try {
      let events;
      if (type === IntegrationType.GMAIL) {
        events = await this.gmail.fetchSubscriptionEmails(userId, connection.id);
      } else if (type === IntegrationType.OPEN_FINANCE) {
        events = await this.openFinance.fetchTransactions(userId, connection.id);
      } else if (type === IntegrationType.MICROSOFT && this.microsoft.isConfigured()) {
        // se credenciais são Graph
        const credsRaw = connection.credentialsEnc
          ? this.encryption.decrypt(connection.credentialsEnc)
          : '';
        if (credsRaw.includes('accessToken') && !credsRaw.includes('gmail_receipts')) {
          events = await this.microsoft.fetchReceiptEmails(userId, connection.id);
        } else {
          events = await this.stores.fetchFromGmail(userId, connection.id, type);
        }
      } else if (
        type === IntegrationType.GOOGLE_PLAY ||
        type === IntegrationType.APPLE ||
        type === IntegrationType.AMAZON ||
        type === IntegrationType.MICROSOFT
      ) {
        events = await this.stores.fetchFromGmail(userId, connection.id, type);
      } else {
        throw new BadRequestException('Tipo sem sync implementado');
      }

      const result = await this.detection.ingest(userId, events);
      const detection = await this.detection.runForUser(userId);

      await this.prisma.integrationConnection.update({
        where: { id: connection.id },
        data: { lastSyncAt: new Date(), lastError: null, status: IntegrationStatus.CONNECTED },
      });

      return {
        ingested: result.ingested,
        eventsFetched: events.length,
        real: true,
        ...detection,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      await this.prisma.integrationConnection.update({
        where: { id: connection.id },
        data: { lastError: message, status: IntegrationStatus.ERROR },
      });
      throw err;
    }
  }

  async disconnect(userId: string, type: IntegrationType, deleteData = false) {
    const connection = await this.prisma.integrationConnection.findUnique({
      where: { userId_type: { userId, type } },
    });
    if (!connection) return { success: true };

    if (deleteData) {
      await this.prisma.rawEvent.deleteMany({
        where: { userId, connectionId: connection.id },
      });
    }

    await this.prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        status: IntegrationStatus.DISCONNECTED,
        credentialsEnc: null,
        externalAccountId: null,
        lastError: null,
      },
    });
    return { success: true };
  }

  private defaultScopes(type: IntegrationType): string[] {
    switch (type) {
      case IntegrationType.GMAIL:
        return ['https://www.googleapis.com/auth/gmail.readonly'];
      case IntegrationType.OPEN_FINANCE:
        return ['accounts', 'transactions'];
      case IntegrationType.MICROSOFT:
        return ['User.Read', 'Mail.Read', 'offline_access'];
      default:
        return ['gmail.receipts'];
    }
  }
}
