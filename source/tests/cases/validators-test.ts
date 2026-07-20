/**
 * Unit tests for validator guard null/undefined semantics: optional fields
 * admit undefined (absent) and null (clear marker); required fields reject
 * both. Also covers domain guards with substance rules (isLocation).
 */

import {
  expectBoolean,
  expectEmail,
  expectNonEmptyString,
  expectPositiveNumber,
  isEmail,
  toEmail,
  toTrimmed
} from '@core/std'
import { isLocation } from '@domain/validators/common-validator.ts'
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

Deno.test('isEmail accepts valid email addresses', () => {
  assertEquals(isEmail('ted@example.com'), true)
  assertEquals(isEmail('a.b+c@sub.example.co'), true)
})

Deno.test('isEmail rejects invalid email addresses', () => {
  assertEquals(isEmail(''), false)
  assertEquals(isEmail('plainaddress'), false)
  assertEquals(isEmail('a@'), false)
  assertEquals(isEmail('@b.com'), false)
  assertEquals(isEmail('a b@c.com'), false)
  assertEquals(isEmail('a@-bad.com'), false)
})

Deno.test('isEmail rejects non-strings', () => {
  assertEquals(isEmail(42), false)
  assertEquals(isEmail(null), false)
  assertEquals(isEmail(undefined), false)
})

Deno.test('expectEmail returns null for valid email', () => {
  assertEquals(expectEmail('ted@example.com', 'email'), null)
})

Deno.test('expectEmail returns error for invalid email', () => {
  assertNotEquals(expectEmail('plainaddress', 'email'), null)
})

Deno.test('expectEmail with optional=true admits undefined and null', () => {
  assertEquals(expectEmail(undefined, 'email', true), null)
  assertEquals(expectEmail(null, 'email', true), null)
})

Deno.test('expectEmail with optional=false rejects undefined and null', () => {
  assertNotEquals(expectEmail(undefined, 'email'), null)
  assertNotEquals(expectEmail(null, 'email'), null)
})

Deno.test('toTrimmed trims whitespace and preserves interior', () => {
  assertEquals(toTrimmed('  a b  '), 'a b')
})

Deno.test('toEmail trims and lowercases', () => {
  assertEquals(toEmail('  Ted@Example.COM '), 'ted@example.com')
})

Deno.test('toEmail preserves plus-addressing', () => {
  assertEquals(toEmail('A+Tag@X.com'), 'a+tag@x.com')
})

Deno.test('isLocation accepts coordinate substance alone', () => {
  assertEquals(isLocation({ latitude: 31.9686, longitude: -99.9018 }), true)
})

Deno.test('isLocation accepts address substance alone', () => {
  assertEquals(isLocation({ line1: '1200 AgriTech Way', city: 'Lubbock' }), true)
})

Deno.test('isLocation accepts both substances together', () => {
  assertEquals(
    isLocation({
      latitude: 33.5779,
      longitude: -101.8552,
      line1: '1200 AgriTech Way',
      city: 'Lubbock',
      state: 'TX',
      postalCode: '79401',
      country: 'US'
    }),
    true
  )
})

Deno.test('isLocation rejects absence of both substances', () => {
  assertEquals(isLocation({}), false)
  assertEquals(isLocation({ description: 'somewhere out west' }), false)
})

Deno.test('isLocation rejects a half coordinate even with address substance', () => {
  assertEquals(isLocation({ latitude: 31.9686 }), false)
  assertEquals(isLocation({ longitude: -99.9018 }), false)
  assertEquals(isLocation({ latitude: 31.9686, line1: '1200 AgriTech Way', city: 'Lubbock' }), false)
})

Deno.test('isLocation rejects partial address substance', () => {
  assertEquals(isLocation({ city: 'Lubbock' }), false)
  assertEquals(isLocation({ line1: '1200 AgriTech Way' }), false)
})

Deno.test('isLocation rejects empty-string address fields', () => {
  assertEquals(isLocation({ line1: '', city: 'Lubbock' }), false)
  assertEquals(isLocation({ latitude: 31.9686, longitude: -99.9018, line1: '' }), false)
})

Deno.test('isLocation rejects mistyped coordinates', () => {
  assertEquals(isLocation({ latitude: '31.9686', longitude: -99.9018 }), false)
  assertEquals(
    isLocation({
      latitude: '31.9686',
      longitude: '-99.9018',
      line1: '1200 AgriTech Way',
      city: 'Lubbock'
    }),
    false
  )
})

Deno.test('isLocation rejects non-objects', () => {
  assertEquals(isLocation(null), false)
  assertEquals(isLocation(undefined), false)
  assertEquals(isLocation(42), false)
  assertEquals(isLocation('Lubbock'), false)
})
