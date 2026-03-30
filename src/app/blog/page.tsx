import type { Metadata } from 'next'
import BlogPage from '@/components/blog/BlogPage'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Artigos sobre Dermopigmentação, cuidados com sobrancelhas, dicas de beleza e novidades do estúdio Francielly Costa em Braga, Portugal.',
}

export default function Blog() {
  return <BlogPage />
}
