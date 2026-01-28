/**
 * Runtime environment contract for declaring and reading required parameters.
 */

export interface RuntimeEnv {
  /**
   * Register and validate required runtime parameters.
   * @param required - Parameter names that must be present.
   */
  init(required: readonly string[]): void

  /**
   * Return a validated runtime parameter value.
   * @param name - Parameter name to read.
   */
  get(name: string): string
}
