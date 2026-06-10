/**
 * UX shell configuration.
 */

import { Config } from '@ux/config/ux-config.ts'

/** Identity of the application shell. */
export type ShellIdentity = {
  productName: string
  applicationName: string
}

/** Datum for shell configuration. */
export type ShellDatum = {
  config: string
  label: string
}

/** Datum and value for shell configuration. */
export type ShellDatumValue = ShellDatum & {
  value: string
}

/** Shell configuration. */
export type ShellConfig = readonly ShellDatumValue[]

/** Shell identity and config data. */
export type ShellMetadata = {
  identity: ShellIdentity
  config: ShellConfig
}

/** Build shell identity and config values. */
export function getShellMetadata(): ShellMetadata {
  return {
    identity: {
      productName: Config.get('PRODUCT_NAME'),
      applicationName: Config.get('APPLICATION_NAME')
    },
    config: buildShellConfig()
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// SHELL CONFIG IMPLEMENTATION
// ───────────────────────────────────────────────────────────────────────────────

/** Runtime config keys approved for shell diagnostics. */
const SHELL_CONFIG_DATA: readonly ShellDatum[] = [
  { config: 'PACKAGE_APP_ID', label: 'Application' },
  { config: 'PACKAGE_VERSION', label: 'Client' },
  { config: 'SUPABASE_RDBMS_URL', label: 'Server' }
]

/** Shell config values. */
function buildShellConfig(): ShellConfig {
  const shellValue = (datum: ShellDatum): string => {
    const value = Config.get(datum.config)
    switch (datum.config) {
      case 'SUPABASE_EDGE_URL':
      case 'SUPABASE_RDBMS_URL':
        return extractServerId(value) ?? value
      default:
        return value
    }
  }
  return SHELL_CONFIG_DATA.map(datum => ({ ...datum, value: shellValue(datum) }))
}

/** Extract the server identifier from a URL. */
function extractServerId(url: string): string | null {
  const hostname = url
    .replace(/(https?:\/\/)?(www\.)?/, '') // temporarily strip protocol/www to find the path
    .split('/')[0] // remove paths (e.g., /path/to/page)
    .split(':')[0] // remove ports (e.g., :3000)
  const match = hostname.split('.')
  return match.length > 0 ? match[0] : null
}
