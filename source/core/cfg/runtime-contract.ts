/**
 * Runtime contract -- contact for runtime configuration providers
 */
export interface RuntimeContract {
  /**
   * Retrieve an environment variable value.
   * @param key - Environment variable name to read.
   * @returns Environment variable value.
   */
  get(key: string): string | undefined

  /**
   * Fail with a message.
   * @param msg - Failure message.
   */
  fail(msg: string): never
}
