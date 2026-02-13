/**
 * App runtime configuration bootstrap.
 * Detects Solid vs Deno environment and initializes appropriate provider.
 */

import { RuntimeConfig } from '@core-std'

let Config: RuntimeConfig

if ('Deno' in self) {
  const { ConfigureDeno } = await import('@utility/configure-deno.ts')
  Config = ConfigureDeno
} else {
  const { ConfigureSolid } = await import('../lib/configure-solid.ts')
  Config = ConfigureSolid
}

Config.init(['VITE_API_URL'])

export { Config }
