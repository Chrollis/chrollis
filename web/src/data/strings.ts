import { en } from './locales/en'
import type { DeepPartial, Strings } from './locales/en'
import { zh } from './locales/zh'

export type { DeepPartial, Strings }

export type LocaleCode = 'en' | 'zh'

function mergeValue(base: unknown, patch: unknown): unknown {
  if (patch === undefined) return base
  if (Array.isArray(base) || typeof base !== 'object' || base === null) return patch
  if (typeof patch !== 'object' || patch === null) return patch

  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
    if (value === undefined) continue
    out[key] = mergeValue((base as Record<string, unknown>)[key], value)
  }
  return out
}

export function mergeLocale<T>(base: T, patch: DeepPartial<T>): T {
  return mergeValue(base, patch) as T
}

export const locales: Record<LocaleCode, Strings> = {
  en,
  zh: mergeLocale<Strings>(en, zh),
}

export const LOCALE_CODES: readonly LocaleCode[] = ['en', 'zh']

export const REFERENCE_LOCALE: LocaleCode = 'en'

export const DEFAULT_LOCALE: LocaleCode = 'en'

export const LOCALE_TAGS: Record<LocaleCode, { html: string; og: string }> = {
  en: { html: 'en', og: 'en_US' },
  zh: { html: 'zh-Hans', og: 'zh_CN' },
}

export function isLocaleCode(value: string | null | undefined): value is LocaleCode {
  return value === 'en' || value === 'zh'
}

export function resolveLocale(tags: readonly string[]): LocaleCode {
  for (const tag of tags) {
    const primary = tag.toLowerCase().split('-')[0]
    if (isLocaleCode(primary)) return primary
  }
  return DEFAULT_LOCALE
}
