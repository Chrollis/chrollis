import { useCallback, useSyncExternalStore } from 'react'

import { DEFAULT_LOCALE, LOCALE_TAGS, locales, resolveLocale } from '@/data/strings'
import type { LocaleCode, Strings } from '@/data/strings'

const STORAGE_KEY = 'chrollis-locale'

let listeners: Array<() => void> = []
let current: LocaleCode = readStored() ?? detect()
apply(current)

function readStored(): LocaleCode | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'en' || value === 'zh') return value
    return null
  } catch {
    return null
  }
}

function detect(): LocaleCode {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  const tags = navigator.languages?.length ? navigator.languages : [navigator.language]
  return resolveLocale(tags.filter(Boolean))
}

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

function getSnapshot(): LocaleCode {
  return current
}

function apply(locale: LocaleCode) {
  document.documentElement.lang = LOCALE_TAGS[locale].html
}

export function setLocale(locale: LocaleCode) {
  if (locale === current) return
  current = locale
  apply(locale)
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {}
  emit()
}

export function toggleLocale() {
  setLocale(current === 'en' ? 'zh' : 'en')
}

export interface LocaleValue {
  locale: LocaleCode
  t: Strings
  setLocale: (locale: LocaleCode) => void
  toggle: () => void
}

export function useLocale(): LocaleValue {
  const locale = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_LOCALE)
  const set = useCallback((next: LocaleCode) => setLocale(next), [])
  const toggle = useCallback(() => toggleLocale(), [])
  return { locale, t: locales[locale], setLocale: set, toggle }
}
