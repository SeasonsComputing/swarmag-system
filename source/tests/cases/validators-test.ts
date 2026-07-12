/**
 * Unit tests for validator guard null/undefined semantics: optional fields
 * admit undefined (absent) and null (clear marker); required fields reject
 * both.
 */

import { expectBoolean, expectNonEmptyString, expectPositiveNumber } from '@core/std'
import { assertEquals, assertNotEquals } from '@std/assert'

Deno.test('optional fields admit undefined and null', () => {
  assertEquals(expectNonEmptyString(undefined, 'avatarUrl', true), null)
  assertEquals(expectNonEmptyString(null, 'avatarUrl', true), null)
  assertEquals(expectPositiveNumber(null, 'acreage', true), null)
  assertEquals(expectBoolean(null, 'required', true), null)
})

Deno.test('required fields reject undefined and null', () => {
  assertNotEquals(expectNonEmptyString(undefined, 'displayName'), null)
  assertNotEquals(expectNonEmptyString(null, 'displayName'), null)
  assertNotEquals(expectBoolean(null, 'active'), null)
})

Deno.test('falsy legal values still validate on their own merits', () => {
  assertEquals(expectBoolean(false, 'active'), null)
  assertNotEquals(expectPositiveNumber(0, 'amount'), null)
  assertNotEquals(expectNonEmptyString('', 'label'), null)
})
