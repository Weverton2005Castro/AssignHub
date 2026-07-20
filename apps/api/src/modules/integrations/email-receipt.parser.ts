import { Injectable } from '@nestjs/common';

export interface ParsedReceipt {
  merchantRaw: string;
  amountCents: number | null;
  currency: string;
  occurredAt: Date;
  description: string;
  planName?: string;
}

/**
 * Extrai merchant, valor e data de e-mails reais de fatura/recibo.
 * Heurísticas em pt-BR e en-US — sem dados sintéticos.
 */
@Injectable()
export class EmailReceiptParser {
  parse(input: {
    subject: string;
    from: string;
    body: string;
    date: Date;
  }): ParsedReceipt {
    const text = `${input.subject}\n${input.from}\n${input.body}`;
    const merchantRaw = this.detectMerchant(input.from, input.subject, input.body);
    const amount = this.detectAmount(text);
    const planName = this.detectPlan(text);

    return {
      merchantRaw,
      amountCents: amount?.cents ?? null,
      currency: amount?.currency ?? 'BRL',
      occurredAt: input.date,
      description: input.subject.slice(0, 500),
      planName,
    };
  }

  private detectMerchant(from: string, subject: string, body: string): string {
    const fromEmail = (from.match(/[\w.+-]+@[\w.-]+/)?.[0] ?? from).toLowerCase();
    const domain = fromEmail.split('@')[1] ?? '';

    const domainMap: Array<{ test: RegExp; name: string }> = [
      { test: /netflix/i, name: 'Netflix' },
      { test: /spotify/i, name: 'Spotify' },
      { test: /openai|chatgpt/i, name: 'OpenAI' },
      { test: /apple\.com|itunes|icloud/i, name: 'Apple' },
      { test: /google\.com|googleplay|play\.google/i, name: 'Google' },
      { test: /youtube/i, name: 'YouTube Premium' },
      { test: /amazon|primevideo|kindle/i, name: 'Amazon' },
      { test: /microsoft|office365|xbox/i, name: 'Microsoft' },
      { test: /disney/i, name: 'Disney+' },
      { test: /hbo|max\.com|wbd/i, name: 'Max' },
      { test: /github/i, name: 'GitHub' },
      { test: /adobe/i, name: 'Adobe' },
      { test: /dropbox/i, name: 'Dropbox' },
      { test: /notion/i, name: 'Notion' },
      { test: /slack/i, name: 'Slack' },
      { test: /zoom/i, name: 'Zoom' },
      { test: /uber/i, name: 'Uber' },
      { test: /ifood/i, name: 'iFood' },
      { test: /nu\.?bank|nubank/i, name: 'Nubank' },
    ];

    for (const rule of domainMap) {
      if (rule.test.test(from) || rule.test.test(subject) || rule.test.test(domain)) {
        return rule.name;
      }
    }

    // "from Display Name <email>"
    const display = from.replace(/<[^>]+>/, '').replace(/"/g, '').trim();
    if (display && display.length < 80 && !display.includes('@')) return display;

    if (domain) return domain.split('.')[0].replace(/^\w/, (c) => c.toUpperCase());
    return subject.slice(0, 60) || 'Desconhecido';
  }

  private detectAmount(text: string): { cents: number; currency: string } | null {
    // R$ 55,90 | R$55.90 | BRL 55,90
    const brl = text.match(/(?:R\$|BRL)\s*([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{2}|[0-9]+[.,][0-9]{2})/i);
    if (brl) {
      const raw = brl[1].replace(/\./g, '').replace(',', '.');
      const value = Number(raw);
      if (!Number.isNaN(value) && value > 0 && value < 1_000_000) {
        return { cents: Math.round(value * 100), currency: 'BRL' };
      }
    }

    // $12.99 / USD 12.99
    const usd = text.match(/(?:US\$|USD|\$)\s*([0-9]+(?:\.[0-9]{2})?)/i);
    if (usd) {
      const value = Number(usd[1]);
      if (!Number.isNaN(value) && value > 0 && value < 1_000_000) {
        return { cents: Math.round(value * 100), currency: 'USD' };
      }
    }

    // 55,90 BRL
    const suffix = text.match(/([0-9]+[.,][0-9]{2})\s*(BRL|USD|EUR)/i);
    if (suffix) {
      const value = Number(suffix[1].replace(',', '.'));
      if (!Number.isNaN(value)) {
        return { cents: Math.round(value * 100), currency: suffix[2].toUpperCase() };
      }
    }

    return null;
  }

  private detectPlan(text: string): string | undefined {
    const m = text.match(
      /(?:plano|plan|assinatura|subscription)\s*[:\-]?\s*([A-Za-z0-9+.\- ]{2,40})/i,
    );
    return m?.[1]?.trim();
  }
}
