import type { MetadataRoute } from 'next';
import { absoluteUrl, isIndexable } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  return isIndexable ? [{ url: absoluteUrl('/') }] : [];
}
