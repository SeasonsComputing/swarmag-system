/**
 * Test runtime configuration bootstrap.
 */

import { Config } from '@core/cfg/config.ts'
import { DenoProvider } from '@core/cfg/deno-provider.ts'

Config.init(new DenoProvider(), ['SUPABASE_RDBMS_URL', 'SUPABASE_SERVICE_KEY'])

export { Config }
