import { Injectable } from '@nestjs/common';
import { BillingPeriod } from '@prisma/client';

export interface TimedAmount {
  occurredAt: Date;
  amountCents: number;
  merchantNorm: string;
}

export interface RecurrenceResult {
  isRecurring: boolean;
  period: BillingPeriod;
  confidence: number;
  medianAmount: number;
  sampleSize: number;
  rationale: string;
}

/**
 * Detects recurrence from time-series of merchant charges.
 * Heuristic: same merchant + similar amount + regular intervals.
 */
@Injectable()
export class RecurrenceDetector {
  detect(events: TimedAmount[]): RecurrenceResult {
    if (events.length < 2) {
      return {
        isRecurring: false,
        period: BillingPeriod.MONTHLY,
        confidence: 0,
        medianAmount: events[0]?.amountCents ?? 0,
        sampleSize: events.length,
        rationale: 'Menos de 2 eventos para inferir recorrência',
      };
    }

    const sorted = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
    const amounts = sorted.map((e) => e.amountCents).sort((a, b) => a - b);
    const medianAmount = amounts[Math.floor(amounts.length / 2)];

    // Amount consistency: within 5% of median
    const amountOk = amounts.filter(
      (a) => Math.abs(a - medianAmount) <= Math.max(100, medianAmount * 0.05),
    ).length;
    const amountScore = amountOk / amounts.length;

    const gapsDays: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const days =
        (sorted[i].occurredAt.getTime() - sorted[i - 1].occurredAt.getTime()) /
        (1000 * 60 * 60 * 24);
      gapsDays.push(days);
    }
    const medianGap = gapsDays.sort((a, b) => a - b)[Math.floor(gapsDays.length / 2)];
    const { period, periodScore } = this.classifyPeriod(medianGap, gapsDays);

    const confidence = Math.min(0.99, amountScore * 0.5 + periodScore * 0.5);
    const isRecurring = confidence >= 0.55 && events.length >= 2;

    return {
      isRecurring,
      period,
      confidence,
      medianAmount,
      sampleSize: events.length,
      rationale: `Intervalo mediano ~${Math.round(medianGap)} dias; consistência de valor ${(amountScore * 100).toFixed(0)}%`,
    };
  }

  private classifyPeriod(
    medianGap: number,
    gaps: number[],
  ): { period: BillingPeriod; periodScore: number } {
    const targets: Array<{ period: BillingPeriod; days: number }> = [
      { period: BillingPeriod.WEEKLY, days: 7 },
      { period: BillingPeriod.MONTHLY, days: 30 },
      { period: BillingPeriod.QUARTERLY, days: 91 },
      { period: BillingPeriod.SEMIANNUAL, days: 182 },
      { period: BillingPeriod.YEARLY, days: 365 },
    ];

    let best = targets[1];
    let bestDiff = Infinity;
    for (const t of targets) {
      const d = Math.abs(medianGap - t.days);
      if (d < bestDiff) {
        bestDiff = d;
        best = t;
      }
    }

    const tolerance = best.days * 0.2;
    const within = gaps.filter((g) => Math.abs(g - best.days) <= tolerance).length;
    const periodScore = gaps.length ? within / gaps.length : 0;

    if (bestDiff > best.days * 0.35) {
      return { period: BillingPeriod.CUSTOM, periodScore: periodScore * 0.5 };
    }
    return { period: best.period, periodScore };
  }
}
