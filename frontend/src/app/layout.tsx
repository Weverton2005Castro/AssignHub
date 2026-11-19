import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import './globals.css';
import { isIndexable, siteDescription, siteName, siteUrl } from '@/lib/seo';

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: 'SubscriptionHub | Controle de assinaturas e gastos recorrentes',
    template: '%s | SubscriptionHub',
  },
  description: siteDescription,
  applicationName: siteName,
  robots: { index: isIndexable, follow: true },
  openGraph: {
    type: 'website', locale: 'pt_BR', siteName,
    title: 'SubscriptionHub | Controle de assinaturas',
    description: siteDescription,
  },
  twitter: { card: 'summary_large_image', title: 'SubscriptionHub | Controle de assinaturas', description: siteDescription },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || undefined },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('shub_theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}})()`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
