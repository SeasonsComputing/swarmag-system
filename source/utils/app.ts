/**
 * App facade helpers for startup checks and platform utilities.
 */

import { assert } from '@std/assert'

/** Registered environment variable names. */
type Variables = Set<string>

/** Deno test function signature. */
type TestFn = (t: Deno.TestContext) => void | Promise<void>
type TestOpts = Omit<Deno.TestDefinition, 'name' | 'fn'>

/** App facade for environment validation and test registration. */
export class App {
  /** Indicates whether App.init has completed. */
  static #initialized = false
  /** Registered environment variable names. */
  static #cache: Variables = new Set()

  /**
   * Validate required environment variables and cache their names.
   * @param required - Environment variable names to validate and register.
   * @returns Nothing.
   */
  static init(required: readonly string[]): void {
    assert(!App.#initialized, 'App already initialized')
    App.#cache = new Set(required)
    App.#validate(required)
    App.#initialized = true
  }

  /**
   * Return a required environment variable value.
   * @param name - Environment variable name to read.
   * @returns Environment variable value.
   */
  static get(name: string): string {
    assert(App.#initialized, 'App not initialized')
    assert(App.#cache.has(name), `App variable not registered: ${name}`)
    const value = Deno.env.get(name)
    assert(value, `${name} validated during init but missing at runtime`)
    return value
  }

  /**
   * Register a test case via the Deno test runner.
   * @param name - Test name.
   * @param opts - Test definition options.
   * @param fn - Optional test function when using explicit options.
   * @returns Nothing.
   */
  static test(name: string, fn: TestFn): void
  static test(name: string, opts: TestOpts, fn: TestFn): void
  static test(name: string, optsOrFn: TestOpts | TestFn, fn?: TestFn): void {
    if (typeof optsOrFn === 'function') {
      Deno.test(name, optsOrFn)
    } else {
      Deno.test({ name, ...optsOrFn, fn: fn! })
    }
  }

  /**
   * Validate that required environment variables are present.
   * @param required - Environment variable names to check.
   * @returns Nothing.
   */
  static #validate(required: readonly string[]): void {
    const env = Deno.env.toObject()
    const missing = required.filter(key => !env[key])
    assert(missing.length === 0, `Missing required .env variables: ${missing.join(', ')}`)
  }
}
