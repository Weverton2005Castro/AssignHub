import { Injectable } from '@nestjs/common';
import { MERCHANT_NORMALIZATION_RULES } from '../../common/constants';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MerchantNormalizer {
  constructor(private readonly prisma: PrismaService) {}

  normalizeRaw(raw: string): string {
    return raw
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9*+\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  applyGlobalRules(raw: string): string | null {
    for (const rule of MERCHANT_NORMALIZATION_RULES) {
      if (rule.pattern.test(raw)) return rule.canonical;
    }
    return null;
  }

  async resolveCanonical(userId: string, raw: string): Promise<{
    normalized: string;
    canonical: string;
    fromAlias: boolean;
  }> {
    const normalized = this.normalizeRaw(raw);
    const alias = await this.prisma.merchantAlias.findUnique({
      where: { userId_normalizedAlias: { userId, normalizedAlias: normalized } },
    });
    if (alias) {
      await this.prisma.merchantAlias.update({
        where: { id: alias.id },
        data: { hitCount: { increment: 1 } },
      });
      return { normalized, canonical: alias.canonicalName, fromAlias: true };
    }

    const global = this.applyGlobalRules(raw) ?? this.applyGlobalRules(normalized);
    if (global) {
      return { normalized, canonical: global, fromAlias: false };
    }

    // Title-case fallback from cleaned merchant
    const canonical = normalized
      .split(' ')
      .filter(Boolean)
      .slice(0, 4)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return { normalized, canonical, fromAlias: false };
  }

  async learn(
    userId: string,
    rawOrNormalized: string,
    canonicalName: string,
    opts?: { company?: string; categorySlug?: string; subscriptionId?: string },
  ) {
    const normalizedAlias = this.normalizeRaw(rawOrNormalized);
    return this.prisma.merchantAlias.upsert({
      where: { userId_normalizedAlias: { userId, normalizedAlias } },
      create: {
        userId,
        normalizedAlias,
        canonicalName,
        company: opts?.company,
        categorySlug: opts?.categorySlug,
        subscriptionId: opts?.subscriptionId,
      },
      update: {
        canonicalName,
        company: opts?.company,
        categorySlug: opts?.categorySlug,
        subscriptionId: opts?.subscriptionId,
        hitCount: { increment: 1 },
      },
    });
  }
}
