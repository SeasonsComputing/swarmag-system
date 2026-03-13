/**
 * Provides reusable validators (`is*`) and validator helpers (`expect*`) used
 * throughout the system.
 */

import { isWhen } from './datetime.ts'
import { isId } from './identifier.ts'
import {
  isCompositionMany,
  isCompositionOne,
  isCompositionOptional,
  isCompositionPositive
} from './relations.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR CONSUMERS
// ────────────────────────────────────────────────────────────────────────────

/** Error thrown for failed validation. */
export class ValidatorError extends Error {
  constructor(message: string, public readonly details?: string) {
    super(message)
    this.name = 'ValidatorError'
  }
}

/** Throw ValidatorError with message. */
export const notValid = (message: string): never => {
  throw new ValidatorError(message)
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR OF TYPE
// ────────────────────────────────────────────────────────────────────────────

/** Check whether value is a non-empty string. */
export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

/** Check whether value is a string. */
export const isString = (value: unknown): value is string => typeof value === 'string'

/** Check whether value is a positive number. */
export const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0

/** Check whether value is a boolean. */
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'

/** Check whether value is a member of a const-enum tuple. */
export const isConstEnum = <T extends readonly string[]>(
  value: unknown,
  values: T
): value is T[number] => typeof value === 'string' && values.includes(value as T[number])

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR GAURDS
// ────────────────────────────────────────────────────────────────────────────

/** Standard validator return value: error message or null. */
export type ExpectResult =
  | string
  | null

/** Type guard used by expectComposition helpers. */
export type ExpectGuard<T> = (entry: unknown) => entry is T

/** Return the first non-null validation result, or null when all are valid. */
export const expectValid = (...results: ExpectResult[]): ExpectResult =>
  results.find(result => result !== null) ?? null

/** Validate a required or optional Id value. */
export const expectId = (value: unknown, field: string, optional = false): ExpectResult => {
  if (value === undefined) return optional ? null : `${field} must be a valid Id`
  return isId(value) ? null : `${field} must be a valid Id`
}

/** Validate a required or optional When value. */
export const expectWhen = (value: unknown, field: string, optional = false): ExpectResult => {
  if (value === undefined) return optional ? null : `${field} must be a valid When`
  return isWhen(value) ? null : `${field} must be a valid When`
}

/** Validate a required or optional non-empty string value. */
export const expectNonEmptyString = (
  value: unknown,
  field: string,
  optional = false
): ExpectResult => {
  if (value === undefined) return optional ? null : `${field} must be a non-empty string`
  return isNonEmptyString(value) ? null : `${field} must be a non-empty string`
}

/** Validate a required or optional positive number value. */
export const expectPositiveNumber = (
  value: unknown,
  field: string,
  optional = false
): ExpectResult => {
  if (value === undefined) return optional ? null : `${field} must be a positive number`
  return isPositiveNumber(value) ? null : `${field} must be a positive number`
}

/** Validate a required or optional boolean value. */
export const expectBoolean = (
  value: unknown,
  field: string,
  optional = false
): ExpectResult => {
  if (value === undefined) return optional ? null : `${field} must be a boolean`
  return isBoolean(value) ? null : `${field} must be a boolean`
}

/** Validate a required or optional const-enum value. */
export const expectConstEnum = <T extends readonly string[]>(
  value: unknown,
  field: string,
  values: T,
  optional = false
): ExpectResult => {
  if (value === undefined) return optional ? null : `${field} must be a valid value`
  return isConstEnum(value, values) ? null : `${field} must be a valid value`
}

/** Validate a required or optional CompositionOne value. */
export const expectCompositionOne = <T>(
  value: unknown,
  field: string,
  guard: ExpectGuard<T>,
  optional = false
): ExpectResult => {
  if (value === undefined) {
    return optional ? null : `${field} must be a single-element composition`
  }
  return isCompositionOne(value, guard)
    ? null
    : `${field} must be a single-element composition`
}

/** Validate a required or optional CompositionOptional value. */
export const expectCompositionOptional = <T>(
  value: unknown,
  field: string,
  guard: ExpectGuard<T>,
  optional = false
): ExpectResult => {
  if (value === undefined) return optional ? null : `${field} must be an optional composition`
  return isCompositionOptional(value, guard)
    ? null
    : `${field} must be an optional composition`
}

/** Validate a required or optional CompositionMany value. */
export const expectCompositionMany = <T>(
  value: unknown,
  field: string,
  guard: ExpectGuard<T>,
  optional = false
): ExpectResult => {
  if (value === undefined) return optional ? null : `${field} must be an array composition`
  return isCompositionMany(value, guard) ? null : `${field} must be an array composition`
}

/** Validate a required or optional CompositionPositive value. */
export const expectCompositionPositive = <T>(
  value: unknown,
  field: string,
  guard: ExpectGuard<T>,
  optional = false
): ExpectResult => {
  if (value === undefined) {
    return optional ? null : `${field} must be a non-empty array composition`
  }
  return isCompositionPositive(value, guard)
    ? null
    : `${field} must be a non-empty array composition`
}
