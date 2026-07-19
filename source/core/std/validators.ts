/**
 * Provides reusable validators (`is*`), validator helpers (`expect*`), and
 * normalizers (`to*`) used throughout the system. Optional guard fields admit
 * undefined (absent) and null (clear marker); required fields reject both.
 */

import { isNullish } from './adt.ts'
import { isWhen } from './datetime.ts'
import { isId } from './identifier.ts'
import {
  isCompositionMany,
  isCompositionOne,
  isCompositionOptional,
  isCompositionPositive
} from './relations.ts'

// WHATWG HTML standard email regex — the exact rule browsers apply to
// input[type=email]
const WHATWG_EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

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
// VALIDATOR OF TYPE (is*)
// ────────────────────────────────────────────────────────────────────────────

/** Check whether value is a non-empty string. */
export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

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

/** Check whether value is an email per the WHATWG `input[type=email]` rule. */
export const isEmail = (value: unknown): value is string =>
  typeof value === 'string' && WHATWG_EMAIL.test(value)

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR GAURDS (expect*)
// ────────────────────────────────────────────────────────────────────────────

/** Standard validator return value: error message or null. */
export type ExpectResult = string | null

/** Type guard used by expectComposition helpers. */
export type ExpectGuard<T> = (entry: unknown) => entry is T

/** Return the first non-null validation result, or null when all are valid. */
export const expectValid = (...results: ExpectResult[]): ExpectResult =>
  results.find(result => result !== null) ?? null

/** Validate a required or optional Id value. */
export const expectId = (
  value: unknown,
  field: string,
  optional = false
): ExpectResult => {
  if ((isNullish(value) && optional) || isId(value)) return null
  return `${field} must be a valid Id`
}

/** Validate a required or optional When value. */
export const expectWhen = (
  value: unknown,
  field: string,
  optional = false
): ExpectResult => {
  if ((isNullish(value) && optional) || isWhen(value)) return null
  return `${field} must be a valid When`
}

/** Validate a required or optional non-empty string value. */
export const expectNonEmptyString = (
  value: unknown,
  field: string,
  optional = false
): ExpectResult => {
  if ((isNullish(value) && optional) || isNonEmptyString(value)) return null
  return `${field} must be a non-empty string`
}

/** Validate a required or optional positive number value. */
export const expectPositiveNumber = (
  value: unknown,
  field: string,
  optional = false
): ExpectResult => {
  if ((isNullish(value) && optional) || isPositiveNumber(value)) return null
  return `${field} must be a positive number`
}

/** Validate a required or optional boolean value. */
export const expectBoolean = (
  value: unknown,
  field: string,
  optional = false
): ExpectResult => {
  if ((isNullish(value) && optional) || isBoolean(value)) return null
  return `${field} must be a boolean`
}

/** Validate a required or optional const-enum value. */
export const expectConstEnum = <T extends readonly string[]>(
  value: unknown,
  field: string,
  values: T,
  optional = false
): ExpectResult => {
  if ((isNullish(value) && optional) || isConstEnum(value, values)) return null
  return `${field} must be a valid value`
}

/** Validate a required or optional email value. */
export const expectEmail = (
  value: unknown,
  field: string,
  optional = false
): ExpectResult => {
  if ((isNullish(value) && optional) || isEmail(value)) return null
  return `${field} must be a valid email address`
}

/** Validate a required or optional CompositionOne value. */
export const expectCompositionOne = <T>(
  value: unknown,
  field: string,
  guard: ExpectGuard<T>,
  optional = false
): ExpectResult => {
  if ((isNullish(value) && optional) || isCompositionOne(value, guard)) return null
  return `${field} must be a single-element composition`
}

/** Validate a required or optional CompositionOptional value. */
export const expectCompositionOptional = <T>(
  value: unknown,
  field: string,
  guard: ExpectGuard<T>,
  optional = false
): ExpectResult => {
  if ((isNullish(value) && optional) || isCompositionOptional(value, guard)) return null
  return `${field} must be an optional composition`
}

/** Validate a required or optional CompositionMany value. */
export const expectCompositionMany = <T>(
  value: unknown,
  field: string,
  guard: ExpectGuard<T>,
  optional = false
): ExpectResult => {
  if ((isNullish(value) && optional) || isCompositionMany(value, guard)) return null
  return `${field} must be an array composition`
}

/** Validate a required or optional CompositionPositive value. */
export const expectCompositionPositive = <T>(
  value: unknown,
  field: string,
  guard: ExpectGuard<T>,
  optional = false
): ExpectResult => {
  if ((isNullish(value) && optional) || isCompositionPositive(value, guard)) return null
  return `${field} must be a non-empty array composition`
}

// ────────────────────────────────────────────────────────────────────────────
// NORMALIZERS (to*)
// ────────────────────────────────────────────────────────────────────────────

/** Normalize a string by trimming leading and trailing whitespace. */
export const toTrimmed = (value: string): string => value.trim()

/** Normalize an email address: trim and lowercase. */
export const toEmail = (value: string): string => value.trim().toLowerCase()
