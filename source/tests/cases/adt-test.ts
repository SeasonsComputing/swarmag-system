/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Algebraic data primitive tests                                               ║
║ Verify the dictionary guard accepts only plain or null-prototype objects.    ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { isDictionary } from '@core/std'
import { assertEquals } from '@std/assert'

Deno.test('isDictionary accepts plain objects regardless of their fields', () => {
  for (const value of [{}, { key: 'value' }, { constructor: null }, { nested: [] }]) {
    assertEquals(isDictionary(value), true)
  }
})

Deno.test('isDictionary accepts empty and populated null-prototype objects', () => {
  assertEquals(isDictionary(Object.create(null)), true)
  assertEquals(isDictionary(Object.assign(Object.create(null), { key: 'value' })), true)
})

Deno.test('isDictionary rejects primitives and functions', () => {
  for (const value of [undefined, null, false, true, '', 'value', 0, 1, NaN, 0n, Symbol(), () => {}]) {
    assertEquals(isDictionary(value), false)
  }
})

Deno.test('isDictionary rejects arrays, built-ins, and custom prototypes', () => {
  class Example {
    key = 'value'
  }

  for (
    const value of [
      [],
      ['value'],
      Object.assign([], { key: 'value' }),
      new Date(),
      new Map(),
      new Set(),
      /value/,
      new Example(),
      Object.create({ key: 'value' })
    ]
  ) {
    assertEquals(isDictionary(value), false)
  }
})
