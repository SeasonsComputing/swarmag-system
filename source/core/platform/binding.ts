/** Default pagination limit when not specified. */
const DEFAULT_LIMIT = 25
/** Maximum allowed pagination limit. */
const MAX_LIMIT = 100
/** Default pagination cursor when not specified. */
const DEFAULT_CURSOR = 0

/**
 * Clamp a pagination limit to the range 1-100, defaulting to 25 when unset.
 * @param value Raw limit value from the query string.
 * @returns Clamped limit value.
 */
export const clampLimit = (value?: string | null): number => {
  const parsed = Number.parseInt(value ?? '', 10)
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_LIMIT
  return Math.min(parsed, MAX_LIMIT)
}

/**
 * Parse a pagination cursor to a non-negative integer, defaulting to 0.
 * @param value Raw cursor value from the query string.
 * @returns Parsed cursor.
 */
export const parseCursor = (value?: string | null): number => {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isNaN(parsed) || parsed < 0 ? DEFAULT_CURSOR : parsed
}

/**
 * Type guard to ensure a value is an array of string IDs.
 * Useful when reading untyped JSON columns from Supabase.
 * @param value Unknown value to check.
 * @returns True when the value is an array of strings.
 */
export const isIdArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === 'string')

/**
 * Type guard to ensure a non-empty string value.
 * @param value Unknown value to check.
 * @returns True when the value is a trimmed, non-empty string.
 */
export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0
