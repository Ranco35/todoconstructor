import type { MetadataRoute } from 'next';

const SITE_URL = 'https://todoconstructor.cl';

// Solo las páginas públicas del catálogo. El dashboard y el login quedan fuera.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: '/website', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/website/categories', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/website/promotions', priority: 0.8, changeFrequency: 'daily' as const },
    { path: '/website/about', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/website/contact', priority: 0.5, changeFrequency: 'monthly' as const },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
