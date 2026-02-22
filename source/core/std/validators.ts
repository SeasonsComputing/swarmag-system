/**
 * Generic validators
 */

/** Checks if the given value is a non-empty string */
export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0

/** Checks if the given value is a positive number */
export const isPositiveNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0
