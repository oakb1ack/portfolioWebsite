import type { MetadataRoute } from 'next';

import { getProjectSlugs } from '@/lib/content';
import { site } from '@/lib/data';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ['', '/about', '/projects', '/experience', '/contact'];
  const staticRoutes = paths.map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: 'monthly' as const,
    priority: path === '' ? 1 : 0.8,
  }));
  const projects = getProjectSlugs().map((slug) => ({
    url: `${site.url}/projects/${slug}`,
    changeFrequency: 'yearly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...projects];
}
