import type { Metadata } from 'next'
import BlogPage from '@/components/blog/BlogPage'
import JsonLd, { breadcrumbSchema, SITE_URL } from '@/components/JsonLd'
import { getPublishedPosts } from '@/lib/blog'

export const dynamic = 'force-dynamic'

const url = `${SITE_URL}/blog`

export const metadata: Metadata = {
  title: 'Blog — Dicas e Novidades sobre Dermopigmentação | Francielly Costa',
  description:
    'Artigos sobre Dermopigmentação, cuidados com sobrancelhas, dicas de beleza e novidades do estúdio Francielly Costa em Braga, Portugal.',
  alternates: { canonical: url },
  openGraph: {
    title: 'Blog — Francielly Costa | Dermopigmentação em Braga',
    description: 'Dicas, cuidados e novidades sobre Dermopigmentação.',
    url,
    siteName: 'Francielly Costa',
    locale: 'pt_PT',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Blog Francielly Costa' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog — Francielly Costa',
    description: 'Dicas, cuidados e novidades sobre Dermopigmentação.',
    images: ['/og-image.jpg'],
  },
}

export default async function Blog() {
  const posts = await getPublishedPosts()
  return (
    <>
      <JsonLd
        id="ld-breadcrumb-blog"
        data={breadcrumbSchema([
          { name: 'Início', url: SITE_URL },
          { name: 'Blog', url },
        ])}
      />
      <BlogPage posts={posts} />
    </>
  )
}
