/**
 * Implementation internals of the runtime configuration.
 */

import { StringSet } from './adt.ts'

/**
 * Runtime provider -- specialized provider for runtime configuration.
 */
export interface RuntimeProvider {
  /**
   * Retrieve an environment variable value.
   * @param key - Environment variable name to read.
   * @returns Environment variable value.
   */
  get(key: string):
    | string
    | undefined

  /**
   * Fail with a message.
   * @param msg - Failure message.
   */
  fail(msg: string): never
}

/**
 * Runtime configuration
 * Provides a priori validation and fast-fail validation
 * @UtilityClass
 */
export class RuntimeConfig implements RuntimeProvider {
  /** Registered environment variable names. */
  #cache: StringSet | null = null

  /** Runtime environment provider. */
  #provider: RuntimeProvider

  /**
   * Initialize the runtime configuration.
   * @param runtime - Runtime provider.
   */
  constructor(runtime: RuntimeProvider) {
    this.#provider = runtime
  }

  /**
   * Validate required environment variables and cache their names.
   * @param required - Environment variable names to validate and register.
   */
  init(required: readonly string[]): void {
    if (this.#cache) this.#provider.fail('Already initialized')
    const missing = required.filter(key => !this.#provider.get(key))
    if (missing.length > 0) {
      this.#provider.fail(`Missing required config: ${missing.join(', ')}`)
    }
    this.#cache = new StringSet(required)
  }

  /**
   * Return a required environment variable value.
   * @param name - Environment variable name to read.
   * @returns Environment variable value.
   */
  get(name: string): string {
    if (!this.#cache) this.#provider.fail('Not initialized')
    if (!this.#cache.has(name)) this.#provider.fail(`Config not registered: ${name}`)
    const value = this.#provider.get(name)
    if (!value) this.#provider.fail(`${name} missing at runtime`)
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
