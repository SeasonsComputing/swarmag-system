/**
 * Environment validation helpers for startup checks.
 */

/**
 * Ensures the provided environment variable names are present and non-empty.
 *
 * @param required - Environment variable names that must be set.
 * @throws {Error} When any required variables are missing.
 */
export const validateRequiredVars = (required: readonly string[]) => {
  const env = Deno.env.toObject()
  const missing = required.filter(key => !env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required .env variables: ${missing.join(', ')}`)
  }
}
