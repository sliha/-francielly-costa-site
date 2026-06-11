import 'server-only'
import { supabaseAdmin } from './supabase/admin'
import { rowToPost, type BlogPost } from './blogTypes'

export type { BlogPost, BlogBlock } from './blogTypes'

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabaseAdmin()
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('date', { ascending: false })
  if (error || !data) return []
  return data.map(rowToPost)
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data } = await supabaseAdmin()
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  return data ? rowToPost(data) : null
}
