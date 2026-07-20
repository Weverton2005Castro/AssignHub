import { Module } from '@nestjs/common';
import { DetectionController } from './detection.controller';
import { DetectionService } from './detection.service';
import { MerchantNormalizer } from './merchant-normalizer';
import { RecurrenceDetector } from './recurrence-detector';

@Module({
  controllers: [DetectionController],
  providers: [DetectionService, MerchantNormalizer, RecurrenceDetector],
  exports: [DetectionService, MerchantNormalizer, RecurrenceDetector],
})
export class DetectionModule {}
