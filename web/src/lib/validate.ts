export type ContactField = 'name' | 'email' | 'message'

export type ContactValues = Record<ContactField, string>

export type ContactError = 'required' | 'emailMissingAt' | 'emailIncompleteDomain' | 'emailUnusable'

export type ContactErrors = Partial<Record<ContactField, ContactError>>

export const CONTACT_FIELDS: readonly ContactField[] = ['name', 'email', 'message']

const MAX_EMAIL = 254

const blank = (value: string) => value.trim() === ''

const DOMAIN = /^[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/

const LOCAL = /^[^\s@,;]+$/

const emailError = (raw: string): ContactError | undefined => {
  const value = raw.trim()
  if (blank(value)) return 'required'
  if (value.length > MAX_EMAIL) return 'emailUnusable'

  const at = value.indexOf('@')
  if (at <= 0 || at === value.length - 1) return 'emailMissingAt'
  if (value.indexOf('@', at + 1) !== -1) return 'emailUnusable'

  if (!LOCAL.test(value.slice(0, at))) return 'emailUnusable'
  if (!DOMAIN.test(value.slice(at + 1))) return 'emailIncompleteDomain'
  return undefined
}

export function validateField(field: string, value: string): ContactError | undefined {
  if (field === 'email') return emailError(value)
  if (field === 'name' || field === 'message') return blank(value) ? 'required' : undefined
  return undefined
}

export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {}
  for (const field of CONTACT_FIELDS) {
    const error = validateField(field, values[field])
    if (error) errors[field] = error
  }
  return errors
}

export const isContactField = (name: string): name is ContactField =>
  CONTACT_FIELDS.some((field) => field === name)
