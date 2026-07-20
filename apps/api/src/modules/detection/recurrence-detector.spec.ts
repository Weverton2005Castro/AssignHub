import { BillingPeriod } from '@prisma/client';
import { RecurrenceDetector } from './recurrence-detector';

describe('RecurrenceDetector', () => {
  const detector = new RecurrenceDetector();

  it('detects monthly recurrence', () => {
    const base = new Date('2025-01-10T12:00:00Z');
    const events = [0, 1, 2, 3].map((i) => {
      const d = new Date(base);
      d.setUTCMonth(d.getUTCMonth() + i);
      return { occurredAt: d, amountCents: 5590, merchantNorm: 'netflix' };
    });
    const result = detector.detect(events);
    expect(result.isRecurring).toBe(true);
    expect(result.period).toBe(BillingPeriod.MONTHLY);
    expect(result.confidence).toBeGreaterThan(0.55);
    expect(result.medianAmount).toBe(5590);
  });

  it('returns low confidence for single event', () => {
    const result = detector.detect([
      { occurredAt: new Date(), amountCents: 1000, merchantNorm: 'x' },
    ]);
    expect(result.isRecurring).toBe(false);
  });
});
