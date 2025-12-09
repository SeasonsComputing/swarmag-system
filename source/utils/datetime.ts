/**
 * Common types and utilities for handling ISO datetime strings.
 * Provides type safety and validation for date-time values.
 */

/** Represents a date-time in ISO 8601 string format. */
export type When = string

const ISO_DATETIME_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/

/** Gets the current UTC datetime as an ISO string */
export const when = (): When => new Date().toISOString()

/** Checks if a string is a valid ISO date-time. */
export const isWhen = (value: string): value is When => ISO_DATETIME_REGEX.test(value)
