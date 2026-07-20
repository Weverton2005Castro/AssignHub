import { PERIOD_TO_MONTHLY_FACTOR } from './constants';
import { BillingPeriod } from './enums';

/** Converte reais (decimal) para centavos inteiros com arredondamento bancário simples */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

export function formatMoney(
  cents: number,
  currency = 'BRL',
  locale = 'pt-BR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(fromCents(cents));
}

export function toMonthlyCents(amountCents: number, period: BillingPeriod | string): number {
  const factor = PERIOD_TO_MONTHLY_FACTOR[period] ?? 1;
  return Math.round(amountCents * factor);
}

export function toYearlyCents(amountCents: number, period: BillingPeriod | string): number {
  return Math.round(toMonthlyCents(amountCents, period) * 12);
}
