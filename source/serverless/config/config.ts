/**
 * Serverless runtime configuration bootstrap.
 * Detects Netlify vs Deno environment and initializes appropriate provider.
 */

import { ConfigureNetlify } from '@serverless-lib/configure-netlify.ts'
import { ConfigureDeno } from '@utils/configure-deno.ts'

const Config = 'Deno' in self ? ConfigureDeno : ConfigureNetlify

Config.init([
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'JWT_SECRET'
])

export { Config }
