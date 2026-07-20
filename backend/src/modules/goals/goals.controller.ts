import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GoalStatus, GoalType } from '@prisma/client';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { GoalsService } from './goals.service';

@ApiTags('goals')
@ApiBearerAuth()
@Controller({ path: 'goals', version: '1' })
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.goals.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      type: GoalType;
      title: string;
      targetCents?: number;
      targetCount?: number;
      categoryId?: string;
      deadline?: string;
    },
  ) {
    return this.goals.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      title: string;
      targetCents: number;
      targetCount: number;
      currentCents: number;
      currentCount: number;
      status: GoalStatus;
    }>,
  ) {
    return this.goals.update(user.id, id, body);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.goals.cancel(user.id, id);
  }
}
