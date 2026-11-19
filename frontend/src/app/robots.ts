import type { MetadataRoute } from 'next';
import { absoluteUrl, isIndexable } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    ...(isIndexable ? { sitemap: absoluteUrl('/sitemap.xml') } : {}),
  };
}
