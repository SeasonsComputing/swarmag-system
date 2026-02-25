/**
 * Supabase edge runtime configuration bootstrap
 */

import { Config } from '@core/cfg/config.ts'
import { SupabaseProvider } from '@core/cfg/supabase-provider.ts'

Config.init(new SupabaseProvider(), [
  'SUPABASE_RDBMS_URL',
  'SUPABASE_SERVICE_KEY',
  'JWT_SECRET'
])

export { Config }
