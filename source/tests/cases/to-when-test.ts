/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Datetime checker tests                                                       ║
║ Verify Date serialization, exact string preservation, and uniform failures.  ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { isWhen, toWhen, ValidatorError } from '@core/std'
import { assert, assertEquals, assertThrows } from '@std/assert'

Deno.test('toWhen serializes a valid Date without changing its instant', () => {
  const at = new Date(Date.UTC(2026, 9, 27, 12, 34, 56, 789))
  const instant = at.getTime()
  const checked = toWhen(at)
  assert(isWhen(checked))
  assertEquals(checked, at.toISOString())
  assertEquals(at.getTime(), instant)
})

Deno.test('toWhen retains checked strings with and without milliseconds unchanged', () => {
  const canonical = new Date(Date.UTC(2026, 9, 27)).toISOString()
  const seconds = canonical.replace('.000Z', 'Z')
  assertEquals(toWhen(canonical), canonical)
  assertEquals(toWhen(seconds), seconds)
})

Deno.test('toWhen rejects unsupported strings and runtime inputs without parsing', () => {
  const canonical = new Date(Date.UTC(2026, 9, 27)).toISOString()
  const INVALID: unknown[] = [
    '',
    'invalid',
    canonical.replace('Z', '+00:00'),
    canonical.replace('.000Z', '.000001Z'),
    canonical.toLowerCase(),
    ` ${canonical} `,
    null,
    undefined,
    42,
    {},
    { toISOString: () => canonical }
  ]
  for (const value of INVALID) {
    assertThrows(() => toWhen(value as string), ValidatorError, 'Invalid When')
  }
})

Deno.test('toWhen rejects an invalid Date through the same validation failure', () => {
  const fromDate = assertThrows(() => toWhen(new Date(NaN)), ValidatorError)
  const fromString = assertThrows(() => toWhen('invalid'), ValidatorError)
  assertEquals(fromDate.message, fromString.message)
})
