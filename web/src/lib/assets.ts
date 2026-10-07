export const BASE_URL = import.meta.env.BASE_URL

export function assetUrl(path: string): string {
  return `${BASE_URL}${path.replace(/^\/+/, '')}`
}

export function withBase(path: string): string {
  return `${BASE_URL}${path.replace(/^\/+/, '')}`
}

export const isProduction = import.meta.env.PROD
export const isDevelopment = import.meta.env.DEV
