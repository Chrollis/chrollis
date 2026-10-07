export type SocialIcon =
  | 'github'
  | 'mail'
  | 'rss'
  | 'external'
  | 'twitter'
  | 'bilibili'
  | 'afdian'
  | 'zhihu'
  | 'steam'
  | 'youtube'

export type SocialKey = 'github' | 'bilibili' | 'afdian' | 'email'

export interface SocialLink {
  key: SocialKey
  href: string
  icon: SocialIcon
  code: string
}

export type NavKey = 'home' | 'projects' | 'about' | 'blog' | 'contact'

export interface NavItem {
  key: NavKey
  to: string
  index: string
}

export const site = {
  name: 'Chrollis',
  nameUpper: 'CHROLLIS',
  url: 'https://chrollis.github.io/chrollis',
  github: 'Chrollis',
  email: {
    user: 'chrollis.contact.countable246',
    domain: 'aleeas.com',
  },
  coordinates: '30.6N / 104.1E',

  socials: [
    { key: 'github', href: 'https://github.com/Chrollis', icon: 'github', code: 'GH' },
    { key: 'bilibili', href: 'https://space.bilibili.com/349484809', icon: 'bilibili', code: 'BL' },
    { key: 'afdian', href: 'https://afdian.com/a/chrollis', icon: 'afdian', code: 'AFD' },
    { key: 'email', href: '', icon: 'mail', code: 'MAIL' },
  ] as SocialLink[],

  nav: [
    { key: 'home', to: '/', index: '00' },
    { key: 'projects', to: '/projects', index: '01' },
    { key: 'about', to: '/about', index: '02' },
    { key: 'blog', to: '/blog', index: '03' },
    { key: 'contact', to: '/contact', index: '04' },
  ] as NavItem[],

  giscus: {
    enabled: false,
    repo: 'Chrollis/chrollis',
    repoId: '',
    category: 'Announcements',
    categoryId: '',
    mapping: 'pathname' as const,
    lang: 'en',
  },

  contactForm: {
    provider: 'formsubmit' as 'web3forms' | 'formsubmit' | 'none',
    web3formsKey: import.meta.env?.VITE_WEB3FORMS_KEY ?? '',
  },

  statsRepo: 'Chrollis/chrollis',

  since: 2026,
}

export const navItems = site.nav
export const isBlank = (value: string | undefined | null): boolean => !value || value.trim() === ''
export function fullEmail(): string {
  return `${site.email.user}@${site.email.domain}`
}
