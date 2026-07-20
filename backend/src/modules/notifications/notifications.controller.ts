import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationChannel } from '@prisma/client';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('unreadOnly') unreadOnly?: string) {
    return this.notifications.list(user.id, unreadOnly === 'true');
  }

  @Post('read-all')
  readAll(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user.id);
  }

  @Patch(':id/read')
  readOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Get('preferences')
  preferences(@CurrentUser() user: AuthUser) {
    return this.notifications.getPreferences(user.id);
  }

  @Put('preferences')
  updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      channels?: NotificationChannel[];
      chargeReminders?: boolean;
      priceIncrease?: boolean;
      newDetections?: boolean;
      savingsTips?: boolean;
      marketing?: boolean;
    },
  ) {
    return this.notifications.updatePreferences(user.id, body);
  }

  @Post('devices')
  registerDevice(
    @CurrentUser() user: AuthUser,
    @Body() body: { fcmToken: string; platform?: string },
  ) {
    return this.notifications.registerDevice(user.id, body.fcmToken, body.platform);
  }
}
