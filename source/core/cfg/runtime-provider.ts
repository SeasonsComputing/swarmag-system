/**
 * Runtime provider -- specialized provider for runtime configuration.
 */
export interface RuntimeProvider {
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
