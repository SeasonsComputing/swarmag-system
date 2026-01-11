/**
 * App facade helpers for startup checks and platform utilities.
 */

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
   * @throws {Error} When called more than once or required variables are missing.
   */
  static init(required: readonly string[]): void {
    if (App.#initialized) throw new Error('App already initialized')
    App.#cache = new Set(required)
    App.#validate(required)
    App.#initialized = true
  }

  /**
   * Return a required environment variable value.
   * @param name - Environment variable name to read.
   * @returns Environment variable value.
   * @throws {Error} When called before init, the variable is unregistered, or missing.
   */
  static get(name: string): string {
    if (!App.#initialized) throw new Error('App not initialized')
    if (!App.#cache.has(name)) throw new Error(`App variable not registered: ${name}`)
    const value = Deno.env.get(name)
    if (!value) throw new Error(`Missing required .env variable: ${name}`)
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
   * @throws {Error} When any required variables are missing.
   */
  static #validate(required: readonly string[]): void {
    const env = Deno.env.toObject()
    const missing = required.filter(key => !env[key])
    if (missing.length > 0) {
      throw new Error(`Missing required .env variables: ${missing.join(', ')}`)
    }
  }
}
