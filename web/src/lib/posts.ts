import { parseFrontmatter } from './frontmatter'
import { readingTime, stripMarkdown } from './utils'

export interface PostMeta {
  slug: string
  title: string
  description: string
  date: string
  category: string
  tags: string[]
  code: string
  readingMinutes: number
  searchText: string
}

export interface Post extends PostMeta {
  content: string
}

const modules = import.meta.glob('../content/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function toPost(path: string, raw: string): Post {
  const { data, content } = parseFrontmatter(raw)
  const fileSlug = path.split('/').pop()!.replace(/\.md$/, '')
  const slug = typeof data.slug === 'string' && data.slug ? data.slug : fileSlug
  const title = typeof data.title === 'string' && data.title ? data.title : fileSlug

  return {
    slug,
    title,
    description:
      typeof data.description === 'string' && data.description
        ? data.description
        : stripMarkdown(content, 90),
    date: typeof data.date === 'string' ? data.date : new Date().toISOString().slice(0, 10),
    category: typeof data.category === 'string' ? data.category : 'NOTE',
    tags: Array.isArray(data.tags) ? data.tags : [],
    code: 'DOC-000',
    readingMinutes: readingTime(content),
    searchText: stripMarkdown(content, 4000),
    content,
  }
}

const allPosts: Post[] = Object.entries(modules)
  .filter(([, raw]) => {
    if (!import.meta.env.PROD) return true
    const { data } = parseFrontmatter(raw)
    return data.draft !== true && data.draft !== 'true'
  })
  .map(([path, raw]) => toPost(path, raw))
  .sort((a, b) => b.date.localeCompare(a.date))
  .map((post, index) => ({ ...post, code: `DOC-${String(index + 1).padStart(3, '0')}` }))

export const posts = allPosts

export const postMetas: PostMeta[] = allPosts.map(({ content: _content, ...meta }) => meta)

export function getPost(slug: string): Post | undefined {
  return allPosts.find((post) => post.slug === slug)
}

export function getAdjacentPosts(slug: string): { prev?: PostMeta; next?: PostMeta } {
  const index = postMetas.findIndex((post) => post.slug === slug)
  if (index === -1) return {}
  return { prev: postMetas[index + 1], next: postMetas[index - 1] }
}

export function getAllTags(): { tag: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const post of postMetas) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
}
