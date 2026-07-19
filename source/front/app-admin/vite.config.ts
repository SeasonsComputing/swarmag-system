import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..')

export default defineConfig({
  plugins: [solidPlugin()],
  cacheDir: resolve(root, 'build/cache/app-admin-vite'),
  optimizeDeps: {
    noDiscovery: true
  },
  server: {
    fs: {
      allow: ['..']
    }
  },
  resolve: {
    alias: [
      { find: /^@core\/std$/, replacement: resolve(root, 'source/core/std/std.ts') },
      { find: /^@core\/stdx$/, replacement: resolve(root, 'source/core/std/stdx.ts') },
      { find: /^@front\/api$/, replacement: resolve(root, 'source/front/api/api.ts') },
      {
        find: /^@front\/ux\/ui$/,
        replacement: resolve(root, 'source/front/ux/ui/components/ui.ts')
      },
      { find: /^@solid-js$/, replacement: 'solid-js' },
      { find: /^@solid-js\/jsx-runtime$/, replacement: 'solid-js/jsx-runtime' },
      { find: /^@solid-js\/store$/, replacement: 'solid-js/store' },
      { find: /^@solid-js\/web$/, replacement: 'solid-js/web' },
      { find: /^@chart-js$/, replacement: 'chart.js' },
      { find: /^@supabase\/client$/, replacement: '@supabase/supabase-js' },
      { find: /^@idb$/, replacement: 'idb' },
      { find: /^@core\/(.+)$/, replacement: `${resolve(root, 'source/core')}/$1` },
      { find: /^@domain\/(.+)$/, replacement: `${resolve(root, 'source/domain')}/$1` },
      { find: /^@back\/(.+)$/, replacement: `${resolve(root, 'source/back')}/$1` },
      { find: /^@front\/(.+)$/, replacement: `${resolve(root, 'source/front')}/$1` },
      { find: /^@devops\/(.+)$/, replacement: `${resolve(root, 'source/devops')}/$1` },
      { find: /^@tests\/(.+)$/, replacement: `${resolve(root, 'source/tests')}/$1` }
    ]
  },
  build: {
    outDir: resolve(root, 'dist/app-admin')
  }
})
