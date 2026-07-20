import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportFormat } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller({ path: 'reports', version: '1' })
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const f = from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
    const t = to ?? new Date().toISOString().slice(0, 10);
    return this.reports.summary(user.id, f, t);
  }

  @Post('export')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  export(
    @CurrentUser() user: AuthUser,
    @Body()
    body: { type: string; format: ReportFormat; from: string; to: string },
  ) {
    return this.reports.export(user.id, body);
  }

  @Get('export/:jobId')
  getExport(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string) {
    return this.reports.getExport(user.id, jobId);
  }
}
