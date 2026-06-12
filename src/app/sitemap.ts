import { MetadataRoute } from 'next'
import { SERVICES } from '@/data/services'
import { getPublishedPosts } from '@/lib/blog'
import { EBOOK } from '@/components/blog/ebookData'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'

export const revalidate = 3600 // regenerar no máximo de hora a hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/servicos`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/agendar`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/galeria`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/sobre`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/contacto`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/certificacoes`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/consulta-virtual`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ]

  const seen = new Set<string>()
  const servicePages: MetadataRoute.Sitemap = []
  for (const service of SERVICES) {
    if (seen.has(service.slug)) continue
    seen.add(service.slug)
    servicePages.push({
      url: `${BASE_URL}/servicos/${service.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    })
  }

  // Blog dinâmico: o sitemap reflete exatamente os posts publicados no Supabase
  // (a lista estática anterior gerava 404s e omitia posts novos).
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const posts = await getPublishedPosts()
    blogPages = posts
      .filter((p) => p.slug && p.slug !== EBOOK.slug)
      .map((p) => ({
        url: `${BASE_URL}/blog/${p.slug}`,
        lastModified: p.date ? new Date(p.date) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
  } catch {
    // Sem BD disponível (ex.: build local sem env) o sitemap sai sem o blog.
  }

  const ebookPage: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/blog/${EBOOK.slug}`,
      lastModified: new Date(EBOOK.date),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  return [...staticPages, ...servicePages, ...blogPages, ...ebookPage]
}
