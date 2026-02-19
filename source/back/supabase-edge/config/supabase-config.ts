/**
 * Supabase edge runtime configuration bootstrap
 */

import { Config } from '@core/cfg/config.ts'
import { ProviderNetlify } from '@core/cfg/supabase-provider.ts'

Config.provider(new SupabaseProvider())
Config.init(['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'])

export { Config }
