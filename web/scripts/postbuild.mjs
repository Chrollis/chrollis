import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(root, 'dist')

if (!existsSync(distDir)) {
  console.error('[postbuild] dist/ not found - run `vite build` first')
  process.exit(1)
}

copyFileSync(join(distDir, 'index.html'), join(distDir, '404.html'))
console.log('[postbuild] 404.html written from index.html (SPA fallback)')

mkdirSync(distDir, { recursive: true })
writeFileSync(join(distDir, '.nojekyll'), '')
console.log('[postbuild] .nojekyll written')
