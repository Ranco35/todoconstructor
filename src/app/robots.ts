import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/website',
      disallow: ['/dashboard', '/admin', '/api', '/login', '/webemergencia'],
    },
    sitemap: 'https://todoconstructor.cl/sitemap.xml',
  };
}
