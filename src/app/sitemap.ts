import { MetadataRoute } from 'next'
import { services } from '@/data/services'
import { blogArticles } from '@/components/blog/blogContent'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/servicos`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/galeria`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/sobre`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/contacto`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/certificacoes`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/consulta-virtual`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]

  const seen = new Set<string>()
  const servicePages: MetadataRoute.Sitemap = []
  for (const service of services) {
    if (seen.has(service.slug)) continue
    seen.add(service.slug)
    servicePages.push({
      url: `${BASE_URL}/servicos/${service.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    })
  }

  const blogPages: MetadataRoute.Sitemap = blogArticles.map((article) => ({
    url: `${BASE_URL}/blog/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...servicePages, ...blogPages]
}
