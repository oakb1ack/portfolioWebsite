import type { MetadataRoute } from 'next';

import { site } from '@/lib/data';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['', '/resume', '/contact'];
  const staticRoutes = paths.map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1 : 0.8,
  }));
  return staticRoutes;
}
