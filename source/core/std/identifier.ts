/**
 * Common types and utilities for unique identifiers using UUID v7.
 * Provides generation and validation of unique IDs.
 */

/** Represents a unique identifier as a UUID string. */
export type Id = string

/** Valid Id format regex. */
const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Creates a new UUID v7 identifier. */
let lastTimestamp = -1
export const id = (): string => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)

  let timestamp = Date.now()

  // Simple Monotonicity: Ensure timestamp never goes backwards
  if (timestamp <= lastTimestamp) {
    timestamp = lastTimestamp
  } else {
    lastTimestamp = timestamp
  }

  const tsBig = BigInt(timestamp)

  // 48-bit timestamp
  bytes[0] = Number(tsBig >> 40n)
  bytes[1] = Number(tsBig >> 32n)
  bytes[2] = Number(tsBig >> 24n)
  bytes[3] = Number(tsBig >> 16n)
  bytes[4] = Number(tsBig >> 8n)
  bytes[5] = Number(tsBig & 0xffn)

  // Set Version 7 (0111)
  bytes[6] = (bytes[6] & 0x0f) | 0x70
  // Set Variant 1 (10xx)
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  // Convert bytes to hex string in a single pass, directly over the Uint8Array,
  // avoiding the intermediate array allocations of Array.from().map().join()
  let hex = ''
  for (let i = 0; i < 16; i++) hex += bytes[i].toString(16).padStart(2, '0')

  // dprint-ignore
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** Validates if a string is a valid UUID v7. */
export const isId = (value: unknown): value is Id =>
  typeof value === 'string' && UUID_V7_REGEX.test(value)
