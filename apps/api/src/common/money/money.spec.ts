import { formatMoney, toCents, toMonthlyCents, toYearlyCents } from '@subscriptionhub/shared';

describe('money utils', () => {
  it('converts to and from cents', () => {
    expect(toCents(55.9)).toBe(5590);
  });

  it('formats BRL', () => {
    expect(formatMoney(5590)).toMatch(/55/);
  });

  it('monthly and yearly normalization', () => {
    expect(toMonthlyCents(24000, 'YEARLY')).toBe(2000);
    expect(toYearlyCents(2000, 'MONTHLY')).toBe(24000);
  });
});
