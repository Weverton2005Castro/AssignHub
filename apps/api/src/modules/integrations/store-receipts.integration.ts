import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { IntegrationType, SubscriptionSource } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { IngestEventInput } from '../detection/detection.service';
import { GmailIntegrationService } from './gmail.integration';

/**
 * Google Play, Apple, Amazon e Microsoft:
 * não há API pública de assinaturas do consumidor final.
 * Fonte real: e-mails de recibo da loja, via Gmail OAuth já conectado.
 */
@Injectable()
export class StoreReceiptsIntegrationService {
  private readonly logger = new Logger(StoreReceiptsIntegrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gmail: GmailIntegrationService,
  ) {}

  private queryFor(type: IntegrationType): string {
    switch (type) {
      case IntegrationType.GOOGLE_PLAY:
        return 'from:(googleplay-noreply@google.com OR payments-noreply@google.com OR play-developer-noreply) OR "Google Play" OR "Google One"';
      case IntegrationType.APPLE:
        return 'from:(apple.com OR itunes.com) OR "App Store" OR iCloud OR "Apple Cash" OR "Your invoice from Apple"';
      case IntegrationType.AMAZON:
        return 'from:(amazon.com.br OR amazon.com OR digital-no-reply@amazon) OR "Amazon Prime" OR "Pedido Amazon" OR "Your Amazon"';
      case IntegrationType.MICROSOFT:
        return 'from:(microsoft.com OR accountprotection.microsoft.com OR store-microsoft) OR "Microsoft 365" OR Xbox OR "Office 365"';
      default:
        throw new BadRequestException('Tipo de loja inválido');
    }
  }

  private sourceFor(type: IntegrationType): SubscriptionSource {
    switch (type) {
      case IntegrationType.GOOGLE_PLAY:
        return SubscriptionSource.GOOGLE_PLAY;
      case IntegrationType.APPLE:
        return SubscriptionSource.APPLE;
      case IntegrationType.AMAZON:
        return SubscriptionSource.AMAZON;
      case IntegrationType.MICROSOFT:
        return SubscriptionSource.MICROSOFT;
      default:
        return SubscriptionSource.EMAIL;
    }
  }

  async fetchFromGmail(
    userId: string,
    storeConnectionId: string,
    type: IntegrationType,
  ): Promise<IngestEventInput[]> {
    const gmailConn = await this.prisma.integrationConnection.findFirst({
      where: { userId, type: IntegrationType.GMAIL, status: 'CONNECTED' },
    });
    if (!gmailConn) {
      throw new BadRequestException(
        'Conecte o Gmail primeiro. As lojas usam recibos reais do e-mail (não há API pública de assinaturas do consumidor).',
      );
    }

    const events = await this.gmail.fetchSubscriptionEmails(userId, gmailConn.id, {
      queryExtra: this.queryFor(type),
      maxResults: 40,
    });

    const source = this.sourceFor(type);
    const mapped = events.map((e) => ({
      ...e,
      source,
      connectionId: storeConnectionId,
      payload: {
        ...e.payload,
        storeType: type,
        via: 'gmail_receipts',
        real: true,
      },
    }));

    this.logger.log(`${type} via Gmail: ${mapped.length} eventos reais`);
    return mapped;
  }
}
