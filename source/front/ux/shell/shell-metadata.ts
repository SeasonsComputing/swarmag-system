/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Shell metadata for UX application chrome                                    ║
║ Runtime shell identity and configuration diagnostics                        ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Reads runtime configuration values used to identify the active UX application
shell and expose approved diagnostic metadata for shell display surfaces.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ShellIdentity - Identity of the active UX application shell.
├ productName      Product name shown by the shell.
└ applicationName  Application name shown by the shell.

ShellDatum - Runtime configuration datum approved for shell diagnostics.
├ config  Runtime configuration key.
└ label   Display label for the datum.

ShellDatumValue - Runtime configuration datum with resolved value.
└ value  Runtime configuration value.

ShellConfig - Readonly shell diagnostic configuration values.

ShellMetadata - Shell identity and diagnostic configuration.
├ identity  Active shell identity.
└ config    Approved shell diagnostic configuration values.

getShellMetadata(): ShellMetadata  Return shell identity and config data.
getShellIdentity(): ShellIdentity  Return shell identity values.
getShellConfig(): ShellConfig      Return shell config values.
*/

import { Config } from '@front/config/ux-config.ts'

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

/** Returns the shell identity and config data from runtime config. */
export const getShellMetadata = (): ShellMetadata => {
  return {
    identity: getShellIdentity(),
    config: getShellConfig()
  }
}

/** Returns the shell identity values from runtime config. */
export const getShellIdentity = (): ShellIdentity => queryShellIdentity()

/** Returns the shell config values from runtime config. */
export const getShellConfig = (): ShellConfig => queryShellConfig()

// ───────────────────────────────────────────────────────────────────────────────
// SHELL METADATA IMPLEMENTATION
// ───────────────────────────────────────────────────────────────────────────────

/** Extract shell identity values from runtime config. */
function queryShellIdentity(): ShellIdentity {
  return {
    productName: Config.get('PRODUCT_NAME'),
    applicationName: Config.get('APPLICATION_NAME')
  }
}

/** Runtime config keys approved for shell diagnostics. */
const SHELL_CONFIG_DATA: readonly ShellDatum[] = [
  { config: 'PACKAGE_APP_ID', label: 'Application' },
  { config: 'PACKAGE_VERSION', label: 'Client' },
  { config: 'SUPABASE_RDBMS_URL', label: 'Server' }
]

/** Shell config values. */
function queryShellConfig(): ShellConfig {
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
