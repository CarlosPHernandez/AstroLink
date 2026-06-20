import type { MetadataRoute } from 'next';
import { getProductionAppUrl } from '@/lib/app-url';

export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV !== 'production') {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/', '/session/', '/auth', '/booking', '/onboard'],
    },
    sitemap: `${getProductionAppUrl()}/sitemap.xml`,
  };
}