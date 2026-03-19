import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

const marketingRoutes = ['/', '/pricing'];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_APP_URL;
  const lastModified = new Date();

  return marketingRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.8,
  }));
}
