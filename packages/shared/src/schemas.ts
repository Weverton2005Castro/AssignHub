import { z } from 'zod';
import {
  BillingPeriod,
  ChargeStatus,
  GoalType,
  NotificationChannel,
  PaymentMethodType,
  SubscriptionSource,
  SubscriptionStatus,
} from './enums';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './constants';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const registerSchema = z.object({
  email: z.string().email().max(320),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Za-z]/, 'Senha deve conter letra')
    .regex(/[0-9]/, 'Senha deve conter número'),
  name: z.string().min(1).max(120),
  acceptTerms: z.literal(true),
  acceptPrivacy: z.literal(true),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createSubscriptionSchema = z.object({
  name: z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  categoryId: z.string().uuid(),
  amountCents: z.number().int().min(0),
  currency: z.string().length(3).default('BRL'),
  billingPeriod: z.nativeEnum(BillingPeriod),
  customPeriodDays: z.number().int().positive().optional(),
  nextBillingDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  autoRenew: z.boolean().default(true),
  paymentMethodId: z.string().uuid().optional().nullable(),
  planName: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  officialUrl: z.string().url().optional().or(z.literal('')),
  status: z.nativeEnum(SubscriptionStatus).default(SubscriptionStatus.ACTIVE),
  logoUrl: z.string().url().optional().or(z.literal('')),
  unused: z.boolean().optional(),
});

export const updateSubscriptionSchema = createSubscriptionSchema.partial();

export const listSubscriptionsSchema = paginationSchema.extend({
  status: z.nativeEnum(SubscriptionStatus).optional(),
  categoryId: z.string().uuid().optional(),
  source: z.nativeEnum(SubscriptionSource).optional(),
  q: z.string().max(200).optional(),
  minAmountCents: z.coerce.number().int().optional(),
  maxAmountCents: z.coerce.number().int().optional(),
});

export const createPaymentMethodSchema = z.object({
  type: z.nativeEnum(PaymentMethodType),
  label: z.string().min(1).max(120),
  brand: z.string().max(40).optional(),
  last4: z.string().regex(/^\d{4}$/).optional(),
  bankName: z.string().max(120).optional(),
  isDefault: z.boolean().optional(),
});

export const createGoalSchema = z.object({
  type: z.nativeEnum(GoalType),
  title: z.string().min(1).max(200),
  targetCents: z.number().int().positive().optional(),
  targetCount: z.number().int().positive().optional(),
  categoryId: z.string().uuid().optional(),
  deadline: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
});

export const aiChatSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
});

export const notificationPreferencesSchema = z.object({
  channels: z.array(z.nativeEnum(NotificationChannel)).min(1),
  chargeReminders: z.boolean(),
  priceIncrease: z.boolean(),
  newDetections: z.boolean(),
  savingsTips: z.boolean(),
  marketing: z.boolean().default(false),
});

export const updateChargeSchema = z.object({
  status: z.nativeEnum(ChargeStatus),
});

export const exportReportSchema = z.object({
  type: z.enum(['monthly', 'annual', 'category', 'company', 'custom']),
  format: z.enum(['pdf', 'csv']),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type AiChatInput = z.infer<typeof aiChatSchema>;
export type ExportReportInput = z.infer<typeof exportReportSchema>;
