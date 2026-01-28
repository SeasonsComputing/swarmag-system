/**
 * Deno-backed runtime environment access.
 *
 * Centralizes Deno.env usage and enforces required parameter validation.
 */

import { assert } from '@std/assert'
import type { RuntimeEnv } from '@utils/runtime-env.ts'

export class DenoEnv implements RuntimeEnv {
  static #initialized = false
  static #cache: Set<string> = new Set()

  /**
   * Register and validate required runtime parameters.
   * @param required - Parameter names that must be present.
   */
  static init(required: readonly string[]): void {
    assert(!DenoEnv.#initialized, 'DenoEnv already initialized')
    DenoEnv.#cache = new Set(required)
    DenoEnv.#validate(required)
    DenoEnv.#initialized = true
  }

  /**
   * Return a validated runtime parameter value.
   * @param name - Parameter name to read.
   */
  static get(name: string): string {
    assert(DenoEnv.#initialized, 'DenoEnv not initialized')
    assert(DenoEnv.#cache.has(name), `DenoEnv variable not registered: ${name}`)
    const value = Deno.env.get(name)
    assert(value, `${name} validated during init but missing at runtime`)
    return value
  }

  /**
   * Validate that required runtime parameters are present.
   * @param required - Parameter names to check.
   */
  static #validate(required: readonly string[]): void {
    const env = Deno.env.toObject()
    const missing = required.filter(key => !env[key])
    assert(missing.length === 0, `Missing required runtime variables: ${missing.join(', ')}`)
  }
}
