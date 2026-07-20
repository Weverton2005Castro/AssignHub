import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BillingPeriod, ProposalStatus } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { DetectionService } from './detection.service';

@ApiTags('detection')
@ApiBearerAuth()
@Controller({ path: 'detection', version: '1' })
export class DetectionController {
  constructor(private readonly detection: DetectionService) {}

  @Get('proposals')
  list(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: ProposalStatus,
  ) {
    return this.detection.listProposals(user.id, status ?? ProposalStatus.PENDING);
  }

  @Post('run')
  @Throttle({ default: { limit: 6, ttl: 3_600_000 } })
  run(@CurrentUser() user: AuthUser) {
    return this.detection.runForUser(user.id);
  }

  @Post('proposals/:id/confirm')
  confirm(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      categoryId?: string;
      amountCents?: number;
      billingPeriod?: BillingPeriod;
      nextBillingDate?: string;
    },
  ) {
    return this.detection.confirm(user.id, id, body);
  }

  @Post('proposals/:id/reject')
  reject(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.detection.reject(user.id, id);
  }

  @Post('proposals/:id/merge')
  merge(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('subscriptionId') subscriptionId: string,
  ) {
    return this.detection.merge(user.id, id, subscriptionId);
  }
}
