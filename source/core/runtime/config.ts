/**
 * Implementation internals of the runtime configuration.
 */

import { StringSet } from '@core-std'
import { RuntimeProvider } from './runtime-provider'

/**
 * Runtime configuration
 * Provides a priori validation and runtime fast-fail
 */
class RuntimeConfig {
  /** Registered environment variable names. */
  #cache: StringSet = new StringSet()

  /** Runtime environment provider. */
  #provider: RuntimeProvider | null = null

  /**
   * Validate the runtime configuration.
   */
  #validate(): never {
    if (!this.#provider) throw new Error('Config provider not set')
  }

  /**
   * Validate required environment variables and cache their names.
   * @param provider - Runtime environment provider.
   * @param keys - Environment variable names to validate and register.
   */
  init(provider: RuntimeProvider, keys: readonly string[]): void {
    if (this.#provider) this.#provider.fail('Config already initialized')
    this.#provider = provider
    const missing = keys.filter(k => !this.#provider.get(k))
    if (missing.length > 0) this.#provider.fail(`Missing config keys: ${missing.join(', ')}`)
    this.#cache = new StringSet([...this.#cache, ...keys])
  }

  /**
   * Return a required environment variable value.
   * @param name - Environment variable name to read.
   * @returns Environment variable value.
   */
  get(name: string): string {
    this.#validate()
    if (this.#cache.empty()) this.#provider.fail('Config not initialized')
    if (!this.#cache.has(name)) this.#provider.fail(`Config property not registered: ${name}`)
    const value = this.#provider.get(name)
    if (!value) this.#provider.fail(`${name} missing at runtime`)
    return value
  }

  /**
   * Fail with a message.
   * @param msg - Failure message.
   */
  fail(msg: string): never {
    this.#validate()
    this.#provider.fail(msg)
  }
}

const Config = new RuntimeConfig()

export { Config }
