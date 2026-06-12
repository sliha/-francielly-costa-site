import 'server-only'
import { cache } from 'react'
import { supabaseAdmin } from './supabase/admin'
import { rowToPost, type BlogPost } from './blogTypes'

export type { BlogPost, BlogBlock } from './blogTypes'

// cache() deduplica chamadas no mesmo request (generateMetadata + página
// chamavam a BD duas vezes por pedido).
export const getPublishedPosts = cache(async (): Promise<BlogPost[]> => {
  const { data, error } = await supabaseAdmin()
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('date', { ascending: false })
  if (error || !data) return []
  return data.map(rowToPost)
})

export const getPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  const { data } = await supabaseAdmin()
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return data ? rowToPost(data) : null
})
