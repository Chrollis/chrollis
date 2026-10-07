export const allGlyphs = [
  'crosshair',
  'wave',
  'neural',
  'orbit',
  'blocks',
  'grid',
  'terminal',
  'layers',
  'pulse',
  'circuit',
] as const

export type ProjectGlyph = (typeof allGlyphs)[number]

const glyphSet: ReadonlySet<string> = new Set(allGlyphs)

function isGlyph(value: string): value is ProjectGlyph {
  return glyphSet.has(value)
}

export const FEATURED_TOPIC = 'featured'

export const HIDDEN_TOPIC = 'noindex'

export const GLYPH_PREFIX = 'glyph-'

export const PROFILE_TOPIC = 'profile'

export const pagesRepoFor = (owner: string): string => `${owner}.github.io`

export interface CurationOptions {
  selfRepo?: string
}

const LANGUAGE_GLYPHS: Record<string, ProjectGlyph> = {
  Rust: 'wave',
  Python: 'neural',
  Zig: 'grid',
}

const GLYPH_KEYWORDS: readonly (readonly [ProjectGlyph, readonly string[]])[] = [
  ['crosshair', ['crosshair', 'aim', 'overlay']],
  [
    'terminal',
    ['library', 'compiler', 'interpreter', 'parser', 'splitter', 'juman', 'lrc', 'command-line'],
  ],
  ['wave', ['karaoke', 'subtitle', 'lyric', 'audio', 'music', 'waveform']],
  ['neural', ['mnist', 'neural', 'digit', 'recogni', 'classifier', 'machine-learning']],
  ['pulse', ['snake', 'realtime', 'real-time', 'telemetry', 'stream']],
  ['layers', ['shader', 'graphics', 'renderer', 'rendering', 'image', 'drawing', 'cg']],
  ['grid', ['algorithm', 'data-structure', 'struct', 'sorting', 'matrix']],
  ['orbit', ['tank', 'battle', 'physics', 'simulation', 'space']],
  ['blocks', ['editor', 'dashboard', 'component', 'framework', 'template', 'playground']],
  ['circuit', ['win32', 'driver', 'kernel', 'embedded', 'firmware']],
]

function preferencesFor(repo: CuratableRepo, topics: readonly string[]): ProjectGlyph[] {
  const out: ProjectGlyph[] = []

  const requested = topics
    .find((topic) => topic.startsWith(GLYPH_PREFIX))
    ?.slice(GLYPH_PREFIX.length)
  if (isGlyph(requested ?? '')) out.push(requested as ProjectGlyph)

  const byLanguage = LANGUAGE_GLYPHS[repo.language ?? '']
  if (byLanguage) out.push(byLanguage)

  const haystack = [repo.name, repo.description ?? '', ...topics].join(' ').toLowerCase()
  for (const [glyph, keywords] of GLYPH_KEYWORDS) {
    if (out.includes(glyph)) continue
    if (keywords.some((keyword) => haystack.includes(keyword))) out.push(glyph)
  }

  return out
}

export interface Curated<T> {
  repo: T
  featured: boolean
  hidden: boolean
  glyph: ProjectGlyph
}

export interface CuratableRepo {
  name: string
  language: string | null
  description?: string | null
  topics?: readonly string[]
}

function hashName(name: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < name.length; i++) {
    hash ^= name.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return Math.abs(hash)
}

export function curate<T extends CuratableRepo>(
  repos: readonly T[],
  options: CurationOptions = {},
): Curated<T>[] {
  const selfRepo = options.selfRepo?.toLowerCase() ?? ''

  const rows = repos.map((repo) => {
    const topics = (repo.topics ?? []).map((topic) => topic.toLowerCase())

    const requested = topics
      .find((topic) => topic.startsWith(GLYPH_PREFIX))
      ?.slice(GLYPH_PREFIX.length)
    const explicit = isGlyph(requested ?? '') ? (requested as ProjectGlyph) : undefined

    const hidden =
      topics.includes(HIDDEN_TOPIC) ||
      topics.includes(PROFILE_TOPIC) ||
      (selfRepo !== '' && repo.name.toLowerCase() === selfRepo)

    return {
      repo,
      featured: topics.includes(FEATURED_TOPIC),
      hidden,
      explicit,
      preferences: hidden ? [] : preferencesFor(repo, topics),
      glyph: undefined as ProjectGlyph | undefined,
    }
  })

  const byName = [...rows].sort((a, b) => a.repo.name.localeCompare(b.repo.name))

  const taken = new Set<string>(
    rows.filter((row) => !row.hidden && row.explicit).map((row) => row.explicit as ProjectGlyph),
  )

  for (const row of byName) {
    if (row.hidden || row.explicit) continue

    for (const candidate of row.preferences) {
      if (taken.has(candidate)) continue
      row.glyph = candidate
      taken.add(candidate)
      break
    }
  }

  for (const row of byName) {
    if (row.hidden || row.explicit || row.glyph) continue

    const start = hashName(row.repo.name) % allGlyphs.length
    for (let step = 0; step < allGlyphs.length; step++) {
      const candidate = allGlyphs[(start + step) % allGlyphs.length]
      if (taken.has(candidate)) continue
      row.glyph = candidate
      taken.add(candidate)
      break
    }

    row.glyph ??= allGlyphs[start]
  }

  for (const row of rows) {
    row.glyph = row.explicit ?? row.glyph
  }

  return rows.map((row) => ({
    repo: row.repo,
    featured: row.featured,
    hidden: row.hidden,
    glyph: row.glyph ?? allGlyphs[hashName(row.repo.name) % allGlyphs.length],
  }))
}
