import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { getAllCompetitorSlugs } from '@/lib/competitors';
import { getAllGlossaryTermSlugs } from '@/lib/glossary';
import { getAllUseCaseSlugs } from '@/lib/use-cases';

const staticRoutes = ['/', '/features', '/pricing', '/demo', '/about', '/glossary'];

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

  // Glossary term pages
  const glossaryEntries: MetadataRoute.Sitemap = getAllGlossaryTermSlugs().map((slug) => ({
    url: `${baseUrl}/glossary/${slug}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  // Use-case pages (/for/[slug])
  const useCaseEntries: MetadataRoute.Sitemap = getAllUseCaseSlugs().map((slug) => ({
    url: `${baseUrl}/for/${slug}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...compareEntries, ...glossaryEntries, ...useCaseEntries];
}
