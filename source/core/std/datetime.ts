/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Datetime primitive                                                           ║
║ ISO UTC timestamp type, factory, and validator.                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the canonical system timestamp primitive and provides helpers for
creating and validating ISO 8601 UTC datetime strings.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
When            ISO 8601 UTC datetime string.
when()          Return the current UTC datetime as an ISO string.
isWhen(value)   Check whether value is a valid When.
*/

/** Represents a date-time in ISO 8601 string format. */
export type When = string

/** Valid ISO datetime format regex. */
const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/

/** Gets the current UTC datetime as an ISO string */
export const when = (): When => new Date().toISOString()

/** Checks if a string is a valid ISO date-time. */
export const isWhen = (value: unknown): value is When =>
  typeof value === 'string' && ISO_DATETIME_REGEX.test(value)
