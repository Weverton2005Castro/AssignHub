import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-sm font-semibold tracking-tight">SubscriptionHub</span>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Criar conta</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16">
        <p className="text-sm font-medium text-muted-foreground">Copiloto Financeiro Pessoal</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Você nunca mais precisa lembrar quais serviços paga.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
          Descubra, organize e analise assinaturas e cobranças recorrentes com inteligência
          artificial. Preveja gastos, identifique desperdícios e tome decisões com clareza.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/register">
            <Button size="lg">Começar gratuitamente</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Já tenho conta
            </Button>
          </Link>
        </div>

        <section className="mt-24 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: 'Descoberta automática',
              body: 'Open Finance, e-mail e lojas digitais alimentam o motor de detecção.',
            },
            {
              title: 'Copiloto com IA',
              body: 'Pergunte em linguagem natural e receba números verificáveis e ações.',
            },
            {
              title: 'Alertas inteligentes',
              body: 'Cobranças, trials, aumentos de preço e economias possíveis.',
            },
          ].map((f) => (
            <div key={f.title} className="rounded-lg border p-5">
              <h2 className="text-sm font-medium">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
