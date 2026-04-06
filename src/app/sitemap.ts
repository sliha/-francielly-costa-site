import { MetadataRoute } from 'next'
import { services } from '@/data/services'
import { blogArticles } from '@/components/blog/blogContent'

const BASE_URL = 'https://franciellycosta.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/servicos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/galeria`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/sobre`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/contacto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/consulta-virtual`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${BASE_URL}/servicos/${service.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.85,
  }))

  // Premium service pages not in the services array
  const premiumPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/servicos/fiberbrows`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.95 },
    { url: `${BASE_URL}/servicos/tricopigmentacao`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
  ]

  const blogPages: MetadataRoute.Sitemap = blogArticles.map((article) => ({
    url: `${BASE_URL}/blog/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // Merge and deduplicate service pages (fiberbrows/tricopigmentacao may appear twice)
  const allServiceSlugs = new Set<string>()
  const deduplicatedServices: MetadataRoute.Sitemap = []
  for (const page of [...premiumPages, ...servicePages]) {
    const slug = page.url.split('/').pop() ?? ''
    if (!allServiceSlugs.has(slug)) {
      allServiceSlugs.add(slug)
      deduplicatedServices.push(page)
    }
  }

  return [...staticPages, ...deduplicatedServices, ...blogPages]
}
