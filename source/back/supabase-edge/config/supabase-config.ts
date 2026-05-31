/**
 * Supabase edge runtime configuration bootstrap
 */

import { Config } from '@core/cfg/config.ts'
import { SupabaseProvider } from '@core/cfg/supabase-provider.ts'

Config.init(new SupabaseProvider(), [
  'SUPABASE_RDBMS_URL',
  'SUPABASE_PUBLIC_KEY',
  'SUPABASE_CLIENT_MODE'
])

export { Config }
