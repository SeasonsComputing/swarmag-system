/**
 * Common types and utilities for unique identifiers using UUID v7.
 * Provides generation and validation of unique IDs.
 */

import { assert } from '@std/assert'

/** Represents a unique identifier as a UUID string. */
export type ID = string

/** Valid ID format regex. */
const UUID_V7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Creates a new UUID v7 identifier. */
export const id = (): ID => {
  const bytes = new Uint8Array(16)
  const timestamp = BigInt(Date.now())

  bytes[0] = Number((timestamp >> 40n) & 0xffn)
  bytes[1] = Number((timestamp >> 32n) & 0xffn)
  bytes[2] = Number((timestamp >> 24n) & 0xffn)
  bytes[3] = Number((timestamp >> 16n) & 0xffn)
  bytes[4] = Number((timestamp >> 8n) & 0xffn)
  bytes[5] = Number(timestamp & 0xffn)

  const { crypto } = self
  assert(crypto?.getRandomValues, 'crypto.getRandomValues required')
  crypto.getRandomValues(bytes.subarray(6))

  bytes[6] = (bytes[6] & 0x0f) | 0x70
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0'))
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${
    hex.slice(6, 8).join('')
  }-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`
}

/** Validates if a string is a valid UUID v7. */
export const isID = (value: string): value is ID => UUID_V7_REGEX.test(value)
