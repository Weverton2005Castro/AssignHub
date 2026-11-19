/** Set SITE_URL to the canonical production origin before building. */
const configuredUrl = process.env.SITE_URL || 'http://localhost:3000';
export const siteUrl = new URL(configuredUrl);
if (!['http:', 'https:'].includes(siteUrl.protocol) || siteUrl.pathname !== '/' || siteUrl.search || siteUrl.hash || siteUrl.username || siteUrl.password) {
  throw new Error('SITE_URL must be an HTTP(S) origin without a path, credentials, query or fragment.');
}
export const isIndexable = process.env.SEO_INDEXABLE === 'true' && siteUrl.protocol === 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(siteUrl.hostname);
export const siteName = 'SubscriptionHub';
export const siteDescription = 'Organize assinaturas e cobranças recorrentes em um só lugar. Acompanhe gastos, vencimentos e oportunidades de economia com o SubscriptionHub.';
export const absoluteUrl = (path: string) => new URL(path, siteUrl).toString();
