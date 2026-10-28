/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Identifier checker tests                                                     ║
║ Verify UUID v7 checking, lowercase normalization, and rejected inputs.       ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { id, isId, toId, ValidatorError } from '@core/std'
import { assert, assertEquals, assertThrows } from '@std/assert'

Deno.test('toId accepts a generated identifier and lowercases uppercase input', () => {
  const generated = id()
  const checked = toId(generated)
  assert(isId(checked))
  assertEquals(checked, generated)
  assertEquals(toId(generated.toUpperCase()), generated)
})

Deno.test('toId rejects invalid formats and runtime inputs through ValidatorError', () => {
  const generated = id()
  const INVALID: unknown[] = [
    '',
    'invalid',
    `${generated.slice(0, 14)}4${generated.slice(15)}`,
    `${generated.slice(0, 19)}0${generated.slice(20)}`,
    ` ${generated} `,
    null,
    undefined,
    42,
    {}
  ]
  for (const value of INVALID) {
    assertThrows(() => toId(value as string), ValidatorError, 'Invalid Id')
  }
})
