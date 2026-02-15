/**
 * Operations app runtime configuration bootstrap
 */

import { Config } from '@core/runtime/config.ts'
import { SolidProvider } from '@core/runtime/solid-provider.ts'

Config.init(new SolidProvider(), [
  'VITE_SUPABASE_EDGE_URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_SERVICE_KEY',
  'VITE_JWT_SECRET'
])

export { Config }
