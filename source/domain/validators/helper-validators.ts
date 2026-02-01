/**
 * Type guard for non-empty string values.
 * @param value - Value to check.
 * @returns True when value is a non-empty string.
 */
export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0
