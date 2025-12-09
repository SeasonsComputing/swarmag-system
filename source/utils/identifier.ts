/**
 * Common types and utilities for unique identifiers using UUID v7.
 * Provides generation and validation of unique IDs.
 */

import { v7 as uuidv7 } from 'uuid'

/** Represents a unique identifier as a UUID string. */
export type ID = string

const UUID_V7_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Creates a new UUID v7 identifier. */
export const id = (): ID => uuidv7()

/** Validates if a string is a valid UUID v7. */
export const isID = (value: string): value is ID => UUID_V7_REGEX.test(value)
