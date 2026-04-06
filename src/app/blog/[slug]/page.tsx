import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import BlogPostPage from '@/components/blog/BlogPostPage'
import { blogArticles } from '@/components/blog/blogContent'

interface Props { params: { slug: string } }

export async function generateStaticParams() {
  return blogArticles.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = blogArticles.find((a) => a.slug === params.slug)
  if (!article) return {}
  return { title: article.title, description: article.excerpt }
}

export default function BlogPost({ params }: Props) {
  const article = blogArticles.find((a) => a.slug === params.slug)
  if (!article) notFound()
  return <BlogPostPage article={article} />
}
