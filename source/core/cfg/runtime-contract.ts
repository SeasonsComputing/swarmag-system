/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Runtime provider contract                                                    ║
║ Configuration access and failure behavior for deployment runtimes.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the provider interface used by Config to read runtime configuration
values and fail according to the active platform's error semantics.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
RuntimeContract   Runtime configuration provider interface.
├ get(key)        Retrieve an environment variable value.
└ fail(msg)       Fail with a runtime-specific error path.
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
