/**
 * Implementation internals of the runtime configuration.
 */

import { type Dictionary, StringSet } from '@core-std'
import { RuntimeProvider } from './runtime-provider.ts'

/** Config Aliases */
type RuntimeAliases = Dictionary<string>

/** Provider used until initialized */
export const nullProvider: RuntimeProvider = {
  get: (_key: string): string | undefined => undefined,
  fail: (msg: string): never => {
    throw new Error(msg)
  }
}

/**
 * Runtime configuration
 * Provides a priori validation and runtime fast-fail
 */
class RuntimeConfig {
  /** Registered environment variable names. */
  #cache: StringSet = new StringSet()

  /** Runtime environment provider. */
  #initialized: boolean = false
  #provider: RuntimeProvider = nullProvider
  #aliases: RuntimeAliases = {}

  /**
   * Validate required environment variables and cache their names.
   * @param provider - Runtime environment provider.
   * @param keys - Environment variable names to validate and register.
   */
  init(
    provider: RuntimeProvider,
    keys: readonly string[],
    aliases: RuntimeAliases = {}
  ): void {
    if (this.#initialized) this.#provider.fail('Config already initialized')

    this.#provider = provider
    const missing = keys.filter(k => !this.#provider.get(k))
    if (missing.length > 0) {
      this.#provider.fail(`Missing config keys: ${missing.join(', ')}`)
    }

    this.#cache = new StringSet([...keys])
    Object.assign(this.#aliases, aliases)
    this.#initialized = true
  }

  /**
   * Return a required environment variable value.
   * @param name - Environment variable name to read.
   * @returns Environment variable value.
   */
  get(name: string): string {
    if (!this.#initialized) this.#provider.fail('Config not initialized')

    const key = this.#aliases[name] ?? name
    if (!this.#cache.has(key)) {
      this.#provider.fail(`Config property not registered: ${key}`)
    }

    const value = this.#provider.get(key)
    if (value == undefined) this.#provider.fail(`Config ${key} missing at runtime`)
    return value
  }

  /**
   * Fail with a message.
   * @param msg - Failure message.
   */
  fail(msg: string): never {
    this.#provider.fail(msg)
  }
}

const Config = new RuntimeConfig()

export { Config }
