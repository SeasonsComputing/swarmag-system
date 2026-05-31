/**
 * Test runtime configuration bootstrap.
 */

import { Config } from '@core/cfg/config.ts'
import { DenoProvider } from '@core/cfg/deno-provider.ts'

Config.init(new DenoProvider(), ['SUPABASE_RDBMS_URL', 'SUPABASE_PUBLIC_KEY', 'SUPABASE_CLIENT_MODE'])

export { Config }
