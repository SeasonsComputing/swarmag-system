/**
 * Netlify edge runtime configuration bootstrap
 */

import { Config } from '@core/runtime/config.ts'
import { ProviderNetlify } from '@core/runtime/provider-netlify.ts'

Config.provider(new ProviderNetlify())
Config.init(['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'])

export { Config }
