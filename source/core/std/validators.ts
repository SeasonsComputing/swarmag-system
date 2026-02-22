/**
 * Generic validators
 */

 /** Error thrown for failed validation */
export class ValidatorError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: string
  ) {
    super(message)
    this.name = 'ValidatorError'
  }
}

/** Checks if the given value is a non-empty string */
export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.trim().length > 0

/** Checks if the given value is a positive number */
export const isPositiveNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v > 0
