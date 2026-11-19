import type { Metadata } from 'next';
import { absoluteUrl, siteDescription, siteName } from '@/lib/seo';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: { url: '/' },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', '@id': absoluteUrl('/#website'), url: absoluteUrl('/'), name: siteName, inLanguage: 'pt-BR' },
    { '@type': 'SoftwareApplication', '@id': absoluteUrl('/#application'), name: siteName, url: absoluteUrl('/'), description: siteDescription, applicationCategory: 'FinanceApplication', operatingSystem: 'Web' },
  ],
};

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-sm font-semibold tracking-tight">SubscriptionHub</span>
        <nav aria-label="Navegação principal" className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Criar conta</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16">
        <p className="text-sm font-medium text-muted-foreground">Copiloto Financeiro Pessoal</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Controle suas assinaturas e gastos recorrentes em um só lugar.
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
        <section className="mt-20" aria-labelledby="como-funciona">
          <h2 id="como-funciona" className="text-2xl font-semibold">Como organizar suas assinaturas</h2>
          <ol className="mt-6 space-y-4 text-muted-foreground">
            <li><strong>1. Reúna seus serviços.</strong> Cadastre suas assinaturas e confira os valores e os ciclos de cobrança.</li>
            <li><strong>2. Acompanhe os vencimentos.</strong> Consulte o calendário e as cobranças para planejar os próximos pagamentos.</li>
            <li><strong>3. Revise seus gastos.</strong> Compare os serviços que utiliza e decida quais assinaturas fazem sentido manter.</li>
          </ol>
        </section>
        <section className="mt-20" aria-labelledby="perguntas">
          <h2 id="perguntas" className="text-2xl font-semibold">Perguntas sobre controle de assinaturas</h2>
          <div className="mt-6 space-y-6">
            <div><h3 className="font-medium">O que é um gerenciador de assinaturas?</h3><p className="mt-2 text-muted-foreground">É uma ferramenta para reunir serviços recorrentes, valores e datas de cobrança. O SubscriptionHub ajuda a acompanhar essas informações para facilitar a revisão dos seus gastos.</p></div>
            <div><h3 className="font-medium">Quais gastos recorrentes posso organizar?</h3><p className="mt-2 text-muted-foreground">Você pode registrar serviços como streaming, softwares, academia e outras assinaturas. Informe o valor e a periodicidade de cada serviço para acompanhar os compromissos cadastrados.</p></div>
            <div><h3 className="font-medium">Como identificar assinaturas que posso cancelar?</h3><p className="mt-2 text-muted-foreground">Revise os serviços cadastrados, o custo de cada um e a frequência de uso. Compare opções semelhantes e confirme as condições de cancelamento diretamente com cada fornecedor.</p></div>
          </div>
        </section>
      </main>
      <footer className="mx-auto max-w-5xl border-t px-6 py-8 text-sm text-muted-foreground">
        <Link href="/">SubscriptionHub — controle de assinaturas e gastos recorrentes</Link>
      </footer>
    </div>
  );
}
