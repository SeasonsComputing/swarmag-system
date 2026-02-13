/**
 * Serverless runtime configuration bootstrap.
 * Detects Netlify vs Deno environment and initializes appropriate provider.
 */

import { RuntimeConfig } from '@core-std'

let Config: RuntimeConfig

if ('Netlify' in self) {
  const { ConfigureNetlify } = await import('@back-netlify-lib/configure-supabase.ts')
  Config = ConfigureNetlify
} else if ('Supabase' in self) {
  const { ConfigureSupabase } = await import('@back-supabase-lib/configure-supabase.ts')
  Config = ConfigureSupabase
} else {
  const { ConfigureDeno } = await import('@utility/configure-deno.ts')
  Config = ConfigureDeno
}

Config.init(['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'])

export { Config }
