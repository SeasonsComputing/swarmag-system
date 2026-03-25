import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..')

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    alias: [
      { find: /^@core\/std$/, replacement: resolve(root, 'source/core/std/std.ts') },
      { find: /^@ux\/api$/, replacement: resolve(root, 'source/ux/api/api.ts') },
      { find: /^@core\/(.+)$/, replacement: `${resolve(root, 'source/core')}/$1` },
      { find: /^@domain\/(.+)$/, replacement: `${resolve(root, 'source/domain')}/$1` },
      { find: /^@back\/(.+)$/, replacement: `${resolve(root, 'source/back')}/$1` },
      { find: /^@ux\/(.+)$/, replacement: `${resolve(root, 'source/ux')}/$1` },
      { find: /^@devops\/(.+)$/, replacement: `${resolve(root, 'source/devops')}/$1` },
      { find: /^@tests\/(.+)$/, replacement: `${resolve(root, 'source/tests')}/$1` }
    ]
  },
  build: {
    outDir: resolve(root, 'dist/app-admin')
  }
})
