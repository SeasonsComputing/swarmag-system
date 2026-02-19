/**
 * Operations app runtime configuration bootstrap
 */

import { Config } from '@core/cfg/config.ts'
import { SolidProvider } from '@core/cfg/solid-provider.ts'

Config.init(
  new SolidProvider(),
  // Propertie
  [
    'VITE_SUPABASE_EDGE_URL',
    'VITE_SUPABASE_RDBMS_URL',
    'VITE_SUPABASE_SERVICE_KEY',
    'VITE_JWT_SECRET'
  ],
  // Aliases
  {
    'SUPABASE_EDGE_URL': 'VITE_SUPABASE_EDGE_URL',
    'SUPABASE_RDBMS_URL': 'VITE_SUPABASE_RDBMS_URL',
    'SUPABASE_SERVICE_KEY': 'VITE_SUPABASE_SERVICE_KEY',
    'JWT_SECRET': 'VITE_JWT_SECRET'
  }
)

export { Config }
