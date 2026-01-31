/**
 * App runtime configuration bootstrap.
 * Detects Solid vs Deno environment and initializes appropriate provider.
 */

import { ConfigureSolid } from '@api/lib/configure-solid.ts'
import { ConfigureDeno } from '@utils/configure-deno.ts'

const Config = 'Deno' in self ? ConfigureDeno : ConfigureSolid

Config.init(['VITE_API_URL'])

export { Config }
