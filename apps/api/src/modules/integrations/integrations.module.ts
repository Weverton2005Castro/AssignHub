import { Module } from '@nestjs/common';
import { EncryptionService } from '../../common/crypto/encryption.service';
import { DetectionModule } from '../detection/detection.module';
import { EmailReceiptParser } from './email-receipt.parser';
import { GmailIntegrationService } from './gmail.integration';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { MicrosoftIntegrationService } from './microsoft.integration';
import { OpenFinanceIntegrationService } from './open-finance.integration';
import { StoreReceiptsIntegrationService } from './store-receipts.integration';

@Module({
  imports: [DetectionModule],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    GmailIntegrationService,
    OpenFinanceIntegrationService,
    StoreReceiptsIntegrationService,
    MicrosoftIntegrationService,
    EmailReceiptParser,
    EncryptionService,
  ],
  exports: [
    IntegrationsService,
    GmailIntegrationService,
    OpenFinanceIntegrationService,
    MicrosoftIntegrationService,
  ],
})
export class IntegrationsModule {}
