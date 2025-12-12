import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const sourceDir = path.resolve(rootDir, 'source')

export default defineConfig({
  resolve: {
    alias: {
      '@': sourceDir,
      '@api': path.resolve(sourceDir, 'api'),
      '@domain': path.resolve(sourceDir, 'domain'),
      '@utils': path.resolve(sourceDir, 'utils'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    dir: 'source/tests',
  },
})
