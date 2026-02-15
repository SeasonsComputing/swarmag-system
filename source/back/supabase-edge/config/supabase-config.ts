/**
 * Supabase edge runtime configuration bootstrap
 */

import { Config } from '@core/runtime/config.ts'
import { ProviderNetlify } from '@core/runtime/supabase-provider.ts'

Config.provider(new SupabaseProvider())
Config.init(['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'])

export { Config }
