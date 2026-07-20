import {
  BillingPeriod,
  PrismaClient,
  SubscriptionSource,
  SubscriptionStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';
import { SYSTEM_CATEGORIES } from '@subscriptionhub/shared';

const prisma = new PrismaClient();

async function main() {
  // System categories (userId null)
  for (const cat of SYSTEM_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { isSystem: true, slug: cat.slug, userId: null },
    });
    if (!existing) {
      await prisma.category.create({
        data: {
          slug: cat.slug,
          name: cat.name,
          isSystem: true,
          sortOrder: cat.sortOrder,
          userId: null,
        },
      });
    }
  }

  if (process.env.NODE_ENV === 'production') {
    console.log('Seed: system categories only (production)');
    return;
  }

  const passwordHash = await argon2.hash('Demo1234!');
  const user = await prisma.user.upsert({
    where: { email: 'demo@subscriptionhub.local' },
    update: {},
    create: {
      email: 'demo@subscriptionhub.local',
      name: 'Usuário Demo',
      passwordHash,
      emailVerifiedAt: new Date(),
      onboardingDoneAt: new Date(),
      consents: {
        create: [
          { type: 'terms', version: '1.0', accepted: true },
          { type: 'privacy', version: '1.0', accepted: true },
        ],
      },
      notificationPreferences: {
        create: {
          channels: ['IN_APP', 'EMAIL'],
          chargeReminders: true,
          priceIncrease: true,
          newDetections: true,
          savingsTips: true,
          marketing: false,
        },
      },
    },
  });

  const categories = await prisma.category.findMany({ where: { isSystem: true } });
  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  const samples = [
    {
      name: 'Netflix',
      company: 'Netflix',
      slug: 'streaming',
      amountCents: 5590,
      period: BillingPeriod.MONTHLY,
      day: 5,
    },
    {
      name: 'Spotify',
      company: 'Spotify',
      slug: 'music',
      amountCents: 2190,
      period: BillingPeriod.MONTHLY,
      day: 12,
    },
    {
      name: 'ChatGPT Plus',
      company: 'OpenAI',
      slug: 'ai',
      amountCents: 11000,
      period: BillingPeriod.MONTHLY,
      day: 1,
    },
    {
      name: 'iCloud+',
      company: 'Apple',
      slug: 'cloud',
      amountCents: 350,
      period: BillingPeriod.MONTHLY,
      day: 20,
    },
    {
      name: 'GitHub Pro',
      company: 'GitHub',
      slug: 'productivity',
      amountCents: 24000,
      period: BillingPeriod.YEARLY,
      day: 15,
    },
  ];

  for (const s of samples) {
    const cat = bySlug[s.slug];
    if (!cat) continue;
    const existing = await prisma.subscription.findFirst({
      where: { userId: user.id, name: s.name, deletedAt: null },
    });
    if (existing) continue;

    const next = new Date();
    next.setUTCDate(s.day);
    if (next < new Date()) next.setUTCMonth(next.getUTCMonth() + 1);

    const sub = await prisma.subscription.create({
      data: {
        userId: user.id,
        categoryId: cat.id,
        name: s.name,
        company: s.company,
        amountCents: s.amountCents,
        billingPeriod: s.period,
        nextBillingDate: next,
        status: SubscriptionStatus.ACTIVE,
        source: SubscriptionSource.MANUAL,
        autoRenew: true,
        priceHistories: {
          create: {
            userId: user.id,
            amountCents: s.amountCents,
            currency: 'BRL',
          },
        },
        charges: {
          create: {
            userId: user.id,
            amountCents: s.amountCents,
            dueDate: next,
            status: 'SCHEDULED',
          },
        },
      },
    });
    console.log('Created subscription', sub.name);
  }

  console.log('Seed complete. Demo user: demo@subscriptionhub.local / Demo1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
