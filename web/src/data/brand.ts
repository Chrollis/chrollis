export const MARK_MIN_LEGIBLE_SIZE = 36

export const MARK_VIEW_BOX = '0 0 64 64'

export const MARK_INSET_VIEW_BOX = '-4 -4 72 72'

export const MARK_PATH =
  'M2 2H30L26 10H2m0 2H10l4 8H2m0 2H26l4 8H2M34 2H58l4 8H34m0 2H54l4 8H34m0 2H46l-4 8H34m16-8h8l4 8H50M2 34H10l4 8H2m0 2H10l4 8H2m0 2H26l4 8H2M34 34H62l-4 8H34m4 2H54l4 8H42m-4 2H62v8H34'

export const MARK_LETTERS: readonly string[] = MARK_PATH.match(/M[^M]*/g) ?? [MARK_PATH]

export const BRAND = {
  background: '#0b0b0c',
  onDark: '#ffffff',
  accent: '#ffd100',
  border: '#2a2a2e',
  grid: '#17171a',
} as const
