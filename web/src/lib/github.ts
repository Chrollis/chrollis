import { useEffect, useState } from 'react'

import data from '@/github.json'

export interface Repo {
  name: string
  fullName: string
  description: string | null
  url: string
  homepage: string | null
  language: string | null
  topics: string[]
  stars: number
  forks: number
  openIssues: number
  pushedAt: string
  createdAt: string
  archived: boolean
  fork: boolean
  license: string | null
  defaultBranch: string
}

export interface OverviewStat {
  label: string
  value: string
}

export interface LanguageStat {
  name: string
  percent: number
}

export const dataFetchedAt: string = data.fetchedAt

export const owner: string = data.owner

export const repos: Repo[] = data.repos as Repo[]

export const stats = data.stats as { overview: OverviewStat[]; languages: LanguageStat[] }

export const languageColours: Record<string, string> = data.languageColours

const README_CACHE_PREFIX = 'gh-readme:v3:'
const README_TTL = 30 * 60 * 1000

interface CacheEntry {
  at: number
  value: string | null
}

function readCachedReadme(key: string): string | null | undefined {
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as CacheEntry
    if (Date.now() - parsed.at > README_TTL) return undefined
    return parsed.value
  } catch {
    return undefined
  }
}

function writeCachedReadme(key: string, value: string | null) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), value } satisfies CacheEntry))
  } catch {}
}

async function fetchText(url: string, timeoutMs = 8000): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) return null
    return await response.text()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function fetchReadme(
  ownerName: string,
  repo: string,
  defaultBranch = 'main',
): Promise<string | null> {
  const cacheKey = `${README_CACHE_PREFIX}${ownerName}/${repo}@${defaultBranch}`
  const cached = readCachedReadme(cacheKey)
  if (cached !== undefined) return cached

  const branches = [...new Set([defaultBranch, 'main', 'master', 'develop', 'dev'])]
  const files = ['README.md', 'readme.md', 'Readme.md', 'README.MD']

  for (const branch of branches) {
    for (const file of files) {
      const text = await fetchText(
        `https://raw.githubusercontent.com/${ownerName}/${repo}/${branch}/${file}`,
      )
      if (text === null) continue
      if (text.trimStart().startsWith('<!DOCTYPE')) continue
      writeCachedReadme(cacheKey, text)
      return text
    }
  }

  writeCachedReadme(cacheKey, null)
  return null
}

export function useReadme(
  ownerName: string,
  repo: string,
  defaultBranch: string,
  enabled: boolean,
) {
  const key = `${ownerName}/${repo}@${defaultBranch}`
  const [settled, setSettled] = useState<{ key: string; markdown: string | null } | null>(null)

  useEffect(() => {
    if (!enabled) return
    let alive = true
    fetchReadme(ownerName, repo, defaultBranch).then((text) => {
      if (alive) setSettled({ key, markdown: text })
    })
    return () => {
      alive = false
    }
  }, [ownerName, repo, defaultBranch, enabled, key])

  const isSettled = settled?.key === key
  return {
    markdown: isSettled ? settled.markdown : null,
    loading: enabled && !isSettled,
  }
}
