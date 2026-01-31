/**
 * App runtime configuration bootstrap.
 * Detects Solid vs Deno environment and initializes appropriate provider.
 */

import { ConfigureDeno } from '@utils/configure-deno.ts'
import { ConfigureSolid } from '@api/lib/configure-solid.ts'

const Config = 'Deno' in self ? ConfigureDeno : ConfigureSolid

Config.init(['VITE_API_URL'])

export { Config }
