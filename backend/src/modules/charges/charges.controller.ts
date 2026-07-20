import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ChargeStatus } from '@prisma/client';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChargesService } from './charges.service';

@ApiTags('charges')
@ApiBearerAuth()
@Controller({ path: 'charges', version: '1' })
export class ChargesController {
  constructor(private readonly charges: ChargesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.charges.list(user.id, from, to);
  }

  @Get('calendar')
  calendar(
    @CurrentUser() user: AuthUser,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = Number(year) || new Date().getUTCFullYear();
    const m = Number(month) || new Date().getUTCMonth() + 1;
    return this.charges.calendar(user.id, y, m);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('status') status: ChargeStatus,
  ) {
    return this.charges.updateStatus(user.id, id, status);
  }
}
