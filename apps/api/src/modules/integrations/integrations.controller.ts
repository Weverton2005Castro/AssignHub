import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IntegrationType } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@ApiBearerAuth()
@Controller({ path: 'integrations', version: '1' })
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.integrations.list(user.id);
  }

  @Post(':type/connect')
  connect(@CurrentUser() user: AuthUser, @Param('type') type: IntegrationType) {
    return this.integrations.connect(user.id, type);
  }

  /** Pluggy / callbacks autenticados (itemId) */
  @Post(':type/callback')
  callback(
    @CurrentUser() user: AuthUser,
    @Param('type') type: IntegrationType,
    @Body() body: { code?: string; state?: string; itemId?: string; mock?: boolean },
  ) {
    return this.integrations.callback(user.id, type, body);
  }

  /** Redirect OAuth real (Google / Microsoft) — sem mock */
  @Public()
  @Get(':type/oauth/callback')
  async oauthCallback(
    @Param('type') type: IntegrationType,
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    const redirect = await this.integrations.handleOAuthRedirect(type, {
      code,
      state,
      error,
    });
    return res.redirect(redirect);
  }

  @Post(':type/sync')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  sync(@CurrentUser() user: AuthUser, @Param('type') type: IntegrationType) {
    return this.integrations.sync(user.id, type);
  }

  @Delete(':type')
  disconnect(
    @CurrentUser() user: AuthUser,
    @Param('type') type: IntegrationType,
    @Query('deleteData') deleteData?: string,
  ) {
    return this.integrations.disconnect(user.id, type, deleteData === 'true');
  }
}
