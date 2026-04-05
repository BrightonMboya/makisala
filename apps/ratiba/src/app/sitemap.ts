import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { getAllCompetitorSlugs } from '@/lib/competitors';

const staticRoutes = ['/', '/pricing', '/demo'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.8,
  }));

  // Compare pages (Ratiba vs competitor)
  const compareEntries: MetadataRoute.Sitemap = getAllCompetitorSlugs().map((slug) => ({
    url: `${baseUrl}/compare/${slug}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...compareEntries];
}
