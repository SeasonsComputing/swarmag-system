/**
 * Serverless runtime configuration bootstrap.
 * Detects Netlify vs Deno environment and initializes appropriate provider.
 */

import { RuntimeConfig } from '@utils'

let Config: RuntimeConfig

if ('Deno' in self) {
  const { ConfigureDeno } = await import('@utils/configure-deno.ts')
  Config = ConfigureDeno
} else {
  const { ConfigureNetlify } = await import('@back-lib/configure-netlify.ts')
  Config = ConfigureNetlify
}

Config.init(['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'])

export { Config }
