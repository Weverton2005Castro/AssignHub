import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes, randomUUID } from 'crypto';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
} from '@subscriptionhub/shared';
import { EncryptionService } from '../../common/crypto/encryption.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly encryption: EncryptionService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async register(dto: RegisterDto, meta?: { ip?: string; ua?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException({ error: 'EMAIL_IN_USE', message: 'E-mail já cadastrado' });

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        passwordHash,
        consents: {
          create: [
            {
              type: 'terms',
              version: '1.0',
              accepted: true,
              ipAddress: meta?.ip,
              userAgent: meta?.ua,
            },
            {
              type: 'privacy',
              version: '1.0',
              accepted: true,
              ipAddress: meta?.ip,
              userAgent: meta?.ua,
            },
          ],
        },
        notificationPreferences: {
          create: {
            channels: ['IN_APP', 'EMAIL'],
          },
        },
      },
    });

    await this.audit.log({
      userId: user.id,
      action: 'REGISTER',
      ipAddress: meta?.ip,
      userAgent: meta?.ua,
    });

    return this.issueTokens(user.id, user.email, meta);
  }

  async login(dto: LoginDto, meta?: { ip?: string; ua?: string }) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), deletedAt: null },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException({ error: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas' });
    }
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) {
      throw new UnauthorizedException({ error: 'INVALID_CREDENTIALS', message: 'Credenciais inválidas' });
    }

    await this.audit.log({
      userId: user.id,
      action: 'LOGIN',
      ipAddress: meta?.ip,
      userAgent: meta?.ua,
    });

    return this.issueTokens(user.id, user.email, meta);
  }

  async refresh(refreshToken: string, meta?: { ip?: string; ua?: string }) {
    const tokenHash = this.encryption.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      if (stored && !stored.revokedAt) {
        // Possible reuse — revoke family
        await this.prisma.refreshToken.updateMany({
          where: { familyId: stored.familyId },
          data: { revokedAt: new Date() },
        });
      }
      throw new UnauthorizedException({ error: 'INVALID_REFRESH', message: 'Refresh token inválido' });
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findFirst({
      where: { id: stored.userId, deletedAt: null },
    });
    if (!user) throw new UnauthorizedException();

    const tokens = await this.issueTokens(user.id, user.email, meta, stored.familyId);
    await this.prisma.refreshToken.update({
      where: { tokenHash: this.encryption.hashToken(tokens.refreshToken) },
      data: { replacedById: undefined },
    });
    return tokens;
  }

  async logout(refreshToken: string, userId?: string) {
    const tokenHash = this.encryption.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (stored) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId },
        data: { revokedAt: new Date() },
      });
      await this.audit.log({ userId: userId ?? stored.userId, action: 'LOGOUT' });
    }
    return { success: true };
  }

  private async issueTokens(
    userId: string,
    email: string,
    meta?: { ip?: string; ua?: string },
    familyId?: string,
  ) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      },
    );

    const refreshToken = randomBytes(48).toString('base64url');
    const tokenHash = this.encryption.hashToken(refreshToken);
    const family = familyId ?? randomUUID();
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        familyId: family,
        expiresAt,
        ipAddress: meta?.ip,
        userAgent: meta?.ua,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: { id: userId, email },
    };
  }
}
