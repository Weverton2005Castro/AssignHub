import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { AuthUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiService } from './ai.service';

class ChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('chat')
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  chat(@CurrentUser() user: AuthUser, @Body() dto: ChatDto) {
    return this.ai.chat(user.id, dto.message, dto.conversationId);
  }

  @Get('conversations')
  conversations(@CurrentUser() user: AuthUser) {
    return this.ai.listConversations(user.id);
  }

  @Get('conversations/:id')
  conversation(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ai.getConversation(user.id, id);
  }

  @Get('insights')
  insights(@CurrentUser() user: AuthUser) {
    return this.ai.listInsights(user.id);
  }

  @Post('insights/refresh')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  refresh(@CurrentUser() user: AuthUser) {
    return this.ai.refreshInsights(user.id);
  }
}
