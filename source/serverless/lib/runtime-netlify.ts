/**
 * Netlify Edge-backed runtime environment access.
 *
 * Uses Netlify.env and enforces required parameter validation.
 */

import { assert } from '@std/assert'
import type { RuntimeEnv } from '@utils/runtime-env.ts'

type NetlifyRuntime = {
  env: {
    get: (name: string) => string | undefined
  }
}

export class NetlifyEnv implements RuntimeEnv {
  static #initialized = false
  static #cache: Set<string> = new Set()

  /**
   * Register and validate required runtime parameters.
   * @param required - Parameter names that must be present.
   */
  static init(required: readonly string[]): void {
    assert(!NetlifyEnv.#initialized, 'NetlifyEnv already initialized')
    NetlifyEnv.#cache = new Set(required)
    NetlifyEnv.#validate(required)
    NetlifyEnv.#initialized = true
  }

  /**
   * Return a validated runtime parameter value.
   * @param name - Parameter name to read.
   */
  static get(name: string): string {
    assert(NetlifyEnv.#initialized, 'NetlifyEnv not initialized')
    assert(NetlifyEnv.#cache.has(name), `NetlifyEnv variable not registered: ${name}`)
    const value = NetlifyEnv.#read(name)
    assert(value, `${name} validated during init but missing at runtime`)
    return value
  }

  /**
   * Read a raw runtime parameter value from Netlify.env.
   * @param name - Parameter name to read.
   */
  static #read(name: string): string | undefined {
    const netlify = (globalThis as { Netlify?: NetlifyRuntime }).Netlify
    assert(netlify?.env?.get, 'Netlify.env.get is unavailable')
    return netlify.env.get(name)
  }

  /**
   * Validate that required runtime parameters are present.
   * @param required - Parameter names to check.
   */
  static #validate(required: readonly string[]): void {
    const missing = required.filter(key => !NetlifyEnv.#read(key))
    assert(missing.length === 0, `Missing required runtime variables: ${missing.join(', ')}`)
  }
}
