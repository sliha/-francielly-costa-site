import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BlogPostPage from '@/components/blog/BlogPostPage'
import { getPostBySlug } from '@/lib/blog'
import JsonLd, { articleSchema, breadcrumbSchema, SITE_URL } from '@/components/JsonLd'

// ISR: cache de 5 min — artigos carregam instantaneamente e a BD descansa.
export const revalidate = 300

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getPostBySlug(params.slug)
  if (!article || !article.published) return {}
  const url = `${SITE_URL}/blog/${article.slug}`
  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url,
      siteName: 'Francielly Costa',
      locale: 'pt_PT',
      type: 'article',
      publishedTime: article.date,
      authors: ['Francielly Costa'],
      images: [{ url: article.coverUrl || '/og-image.png', width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.coverUrl || '/og-image.png'],
    },
  }
}

export default async function BlogPost({ params }: Props) {
  const article = await getPostBySlug(params.slug)
  if (!article || !article.published) notFound()
  const url = `${SITE_URL}/blog/${article.slug}`
  return (
    <>
      <JsonLd
        id={`ld-breadcrumb-${article.slug}`}
        data={breadcrumbSchema([
          { name: 'Início', url: SITE_URL },
          { name: 'Blog', url: `${SITE_URL}/blog` },
          { name: article.title, url },
        ])}
      />
      <JsonLd
        id={`ld-article-${article.slug}`}
        data={articleSchema({
          headline: article.title,
          description: article.excerpt,
          url,
          datePublished: article.date,
        })}
      />
      <BlogPostPage article={article} />
    </>
  )
}
