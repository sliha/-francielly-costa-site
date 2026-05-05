import { MetadataRoute } from 'next'

const BASE_URL = 'https://www.franciellycosta.pt'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api',
          '/api/',
          '/agendamento',
          '/acompanhamento',
          '/consentimento',
          '/referencia',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
