/**
 * Domain validator helpers.
 */

/**
 * Type guard for non-empty string values.
 * @param value - Value to check.
 * @returns True when value is a non-empty string.
 */
export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

/**
 * Type guard to ensure a value is an array of string IDs.
 * Useful when reading untyped JSON columns from Supabase.
 * @param value Unknown value to check.
 * @returns True when the value is an array of strings.
 */
export const isIdArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(entry => typeof entry === 'string')
