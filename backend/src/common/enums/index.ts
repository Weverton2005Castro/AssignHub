export const AuthProvider = {
  EMAIL: 'EMAIL',
  GOOGLE: 'GOOGLE',
  APPLE: 'APPLE',
  MICROSOFT: 'MICROSOFT',
} as const;
export type AuthProvider = (typeof AuthProvider)[keyof typeof AuthProvider];

export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  CANCELLED: 'CANCELLED',
  TRIAL: 'TRIAL',
  EXPIRED: 'EXPIRED',
  UNKNOWN: 'UNKNOWN',
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];

export const BillingPeriod = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  SEMIANNUAL: 'SEMIANNUAL',
  YEARLY: 'YEARLY',
  CUSTOM: 'CUSTOM',
} as const;
export type BillingPeriod = (typeof BillingPeriod)[keyof typeof BillingPeriod];

export const SubscriptionSource = {
  MANUAL: 'MANUAL',
  OPEN_FINANCE: 'OPEN_FINANCE',
  EMAIL: 'EMAIL',
  GOOGLE_PLAY: 'GOOGLE_PLAY',
  APPLE: 'APPLE',
  AMAZON: 'AMAZON',
  MICROSOFT: 'MICROSOFT',
} as const;
export type SubscriptionSource = (typeof SubscriptionSource)[keyof typeof SubscriptionSource];

export const ChargeStatus = {
  SCHEDULED: 'SCHEDULED',
  PAID: 'PAID',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
  REFUNDED: 'REFUNDED',
} as const;
export type ChargeStatus = (typeof ChargeStatus)[keyof typeof ChargeStatus];

export const PaymentMethodType = {
  CREDIT_CARD: 'CREDIT_CARD',
  DEBIT_CARD: 'DEBIT_CARD',
  PIX: 'PIX',
  BANK_ACCOUNT: 'BANK_ACCOUNT',
  DIGITAL_WALLET: 'DIGITAL_WALLET',
  OTHER: 'OTHER',
} as const;
export type PaymentMethodType = (typeof PaymentMethodType)[keyof typeof PaymentMethodType];

export const IntegrationType = {
  OPEN_FINANCE: 'OPEN_FINANCE',
  GMAIL: 'GMAIL',
  GOOGLE_PLAY: 'GOOGLE_PLAY',
  APPLE: 'APPLE',
  AMAZON: 'AMAZON',
  MICROSOFT: 'MICROSOFT',
} as const;
export type IntegrationType = (typeof IntegrationType)[keyof typeof IntegrationType];

export const IntegrationStatus = {
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  ERROR: 'ERROR',
  PENDING: 'PENDING',
  EXPIRED: 'EXPIRED',
} as const;
export type IntegrationStatus = (typeof IntegrationStatus)[keyof typeof IntegrationStatus];

export const ProposalStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  MERGED: 'MERGED',
} as const;
export type ProposalStatus = (typeof ProposalStatus)[keyof typeof ProposalStatus];

export const NotificationChannel = {
  IN_APP: 'IN_APP',
  EMAIL: 'EMAIL',
  PUSH: 'PUSH',
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const NotificationType = {
  CHARGE_TOMORROW: 'CHARGE_TOMORROW',
  CHARGE_TODAY: 'CHARGE_TODAY',
  TRIAL_ENDING: 'TRIAL_ENDING',
  PRICE_INCREASE: 'PRICE_INCREASE',
  NEW_SUBSCRIPTION: 'NEW_SUBSCRIPTION',
  DUPLICATE: 'DUPLICATE',
  SAVINGS: 'SAVINGS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  SYSTEM: 'SYSTEM',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const GoalType = {
  SAVE_AMOUNT: 'SAVE_AMOUNT',
  CANCEL_COUNT: 'CANCEL_COUNT',
  REDUCE_CATEGORY: 'REDUCE_CATEGORY',
} as const;
export type GoalType = (typeof GoalType)[keyof typeof GoalType];

export const GoalStatus = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];

export const SystemCategorySlug = {
  STREAMING: 'streaming',
  GAMES: 'games',
  AI: 'ai',
  CLOUD: 'cloud',
  PRODUCTIVITY: 'productivity',
  EDUCATION: 'education',
  MUSIC: 'music',
  HEALTH: 'health',
  GYM: 'gym',
  TRANSPORT: 'transport',
  HOUSING: 'housing',
  FINANCE: 'finance',
  FOOD: 'food',
  TELEPHONY: 'telephony',
  OTHER: 'other',
} as const;
export type SystemCategorySlug = (typeof SystemCategorySlug)[keyof typeof SystemCategorySlug];
