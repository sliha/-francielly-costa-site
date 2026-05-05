import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BlogPostPage from '@/components/blog/BlogPostPage'
import { blogArticles } from '@/components/blog/blogContent'
import JsonLd, { articleSchema, breadcrumbSchema, SITE_URL } from '@/components/JsonLd'

interface Props { params: { slug: string } }

export async function generateStaticParams() {
  return blogArticles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = blogArticles.find((a) => a.slug === params.slug)
  if (!article) return {}
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
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: ['/og-image.jpg'],
    },
  }
}

export default function BlogPost({ params }: Props) {
  const article = blogArticles.find((a) => a.slug === params.slug)
  if (!article) notFound()
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
