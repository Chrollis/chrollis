import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { en } from '../src/data/locales/en.ts'
import { site } from '../src/data/site.ts'
import { parseFrontmatter } from '../src/lib/frontmatter.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(root, 'public')
const feedsDir = join(publicDir, 'feeds')
const postsDir = join(root, 'src', 'content', 'posts')

const FEED_LANGUAGE = 'en'
const FEED_DESCRIPTION = en.content.description

const ROUTE_HINTS = {
  '/': { changefreq: 'weekly', priority: '1.0' },
  '/projects': { changefreq: 'monthly', priority: '0.8' },
  '/about': { changefreq: 'monthly', priority: '0.7' },
  '/blog': { changefreq: 'weekly', priority: '0.8' },
  '/contact': { changefreq: 'yearly', priority: '0.6' },
}
const DEFAULT_HINT = { changefreq: 'monthly', priority: '0.5' }

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const posts = existsSync(postsDir)
  ? readdirSync(postsDir)
      .filter((file) => file.endsWith('.md'))
      .map((file) => {
        const { data } = parseFrontmatter(readFileSync(join(postsDir, file), 'utf8'))
        return {
          slug: String(data.slug || file.replace(/\.md$/, '')),
          title: String(data.title || file.replace(/\.md$/, '')),
          description: String(data.description || FEED_DESCRIPTION),
          date: String(data.date || new Date().toISOString().slice(0, 10)),
          draft: data.draft === true,
        }
      })
      .filter((post) => !post.draft)
      .sort((a, b) => b.date.localeCompare(a.date))
  : []

const today = new Date().toISOString().slice(0, 10)

const entries = [
  ...site.nav.map((item) => ({
    loc: `${site.url}${item.to === '/' ? '/' : item.to}`,
    lastmod: today,
    ...(ROUTE_HINTS[item.to] ?? DEFAULT_HINT),
  })),
  ...posts.map((post) => ({
    loc: `${site.url}/blog/${post.slug}`,
    lastmod: post.date.slice(0, 10),
    changefreq: 'monthly',
    priority: '0.6',
  })),
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) =>
      `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`,
  )
  .join('\n')}
</urlset>
`

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${site.url}</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>${FEED_LANGUAGE}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${site.url}/feeds/rss.xml" rel="self" type="application/rss+xml" />
${posts
  .map(
    (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${site.url}/blog/${post.slug}</link>
      <guid isPermaLink="true">${site.url}/blog/${post.slug}</guid>
      <description>${escapeXml(post.description)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>`,
  )
  .join('\n')}
  </channel>
</rss>
`

mkdirSync(feedsDir, { recursive: true })

writeFileSync(join(feedsDir, 'sitemap.xml'), sitemap, 'utf8')
console.log(`[feeds] public/feeds/sitemap.xml  ${entries.length} entries (${posts.length} posts)`)

writeFileSync(join(feedsDir, 'rss.xml'), rss, 'utf8')
console.log(`[feeds] public/feeds/rss.xml  ${posts.length} items`)
