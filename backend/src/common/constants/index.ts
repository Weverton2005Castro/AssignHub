import { SystemCategorySlug } from '../enums';

export const APP_NAME = 'SubscriptionHub';
export const APP_DESCRIPTION = 'Copiloto Financeiro Pessoal para assinaturas e gastos recorrentes';

export const DEFAULT_CURRENCY = 'BRL';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

export const SYSTEM_CATEGORIES: ReadonlyArray<{
  slug: SystemCategorySlug;
  name: string;
  sortOrder: number;
}> = [
  { slug: SystemCategorySlug.STREAMING, name: 'Streaming', sortOrder: 1 },
  { slug: SystemCategorySlug.GAMES, name: 'Jogos', sortOrder: 2 },
  { slug: SystemCategorySlug.AI, name: 'IA', sortOrder: 3 },
  { slug: SystemCategorySlug.CLOUD, name: 'Cloud', sortOrder: 4 },
  { slug: SystemCategorySlug.PRODUCTIVITY, name: 'Produtividade', sortOrder: 5 },
  { slug: SystemCategorySlug.EDUCATION, name: 'Educação', sortOrder: 6 },
  { slug: SystemCategorySlug.MUSIC, name: 'Música', sortOrder: 7 },
  { slug: SystemCategorySlug.HEALTH, name: 'Saúde', sortOrder: 8 },
  { slug: SystemCategorySlug.GYM, name: 'Academia', sortOrder: 9 },
  { slug: SystemCategorySlug.TRANSPORT, name: 'Transporte', sortOrder: 10 },
  { slug: SystemCategorySlug.HOUSING, name: 'Moradia', sortOrder: 11 },
  { slug: SystemCategorySlug.FINANCE, name: 'Financeiro', sortOrder: 12 },
  { slug: SystemCategorySlug.FOOD, name: 'Alimentação', sortOrder: 13 },
  { slug: SystemCategorySlug.TELEPHONY, name: 'Telefonia', sortOrder: 14 },
  { slug: SystemCategorySlug.OTHER, name: 'Outros', sortOrder: 99 },
] as const;

/** Multiplicadores para normalizar gasto mensal estimado */
export const PERIOD_TO_MONTHLY_FACTOR: Record<string, number> = {
  WEEKLY: 4.345,
  MONTHLY: 1,
  QUARTERLY: 1 / 3,
  SEMIANNUAL: 1 / 6,
  YEARLY: 1 / 12,
  CUSTOM: 1,
};

export const EMAIL_DETECTION_KEYWORDS = [
  'invoice',
  'receipt',
  'subscription',
  'purchase',
  'pagamento aprovado',
  'renovação',
  'renovacao',
  'upgrade',
  'downgrade',
  'cancelar',
  'recibo',
  'fatura',
  'assinatura',
] as const;

export const MERCHANT_NORMALIZATION_RULES: ReadonlyArray<{ pattern: RegExp; canonical: string }> = [
  { pattern: /google\s*\*?\s*spotify/i, canonical: 'Spotify' },
  { pattern: /spotify(\s+sao\s+paulo)?/i, canonical: 'Spotify' },
  { pattern: /netflix/i, canonical: 'Netflix' },
  { pattern: /amazon\s*prime|prime\s*video/i, canonical: 'Amazon Prime' },
  { pattern: /openai|chatgpt/i, canonical: 'OpenAI' },
  { pattern: /microsoft\s*365|office\s*365/i, canonical: 'Microsoft 365' },
  { pattern: /google\s*one|google\s*\*?\s*google\s*one/i, canonical: 'Google One' },
  { pattern: /icloud|apple\.com\/bill/i, canonical: 'iCloud' },
  { pattern: /youtube\s*premium|google\s*\*?\s*youtube/i, canonical: 'YouTube Premium' },
  { pattern: /disney\+?|disneyplus/i, canonical: 'Disney+' },
  { pattern: /hbo|max\.com/i, canonical: 'Max' },
  { pattern: /github/i, canonical: 'GitHub' },
  { pattern: /vercel/i, canonical: 'Vercel' },
  { pattern: /notion/i, canonical: 'Notion' },
  { pattern: /figma/i, canonical: 'Figma' },
];
