/**
 * Supabase edge runtime configuration bootstrap
 */

import { Config } from '@core/cfg/config.ts'
import { SupabaseProvider } from '@core/cfg/supabase-provider.ts'

Config.init(
  new SupabaseProvider(),
  ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  {
    SUPABASE_PUBLIC_KEY: 'SUPABASE_ANON_KEY',
    SUPABASE_SERVICE_KEY: 'SUPABASE_SERVICE_ROLE_KEY'
  }
)

export { Config }
