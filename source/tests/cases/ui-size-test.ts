/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Readable byte size tests                                                     ║
║ Verify decimal units, rounding boundaries, and locale number formatting.     ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { assertEquals } from '@std/assert'
import { UiText } from '@ux/ui/components/ui-helpers.ts'

Deno.test('size uses decimal units and precision from the rounded size', () => {
  for (
    const [bytes, value, unit, digits] of [
      [1000, 1, 'KB', 1],
      [2400, 2.4, 'KB', 1],
      [9999, 10, 'KB', 0],
      [10_000, 10, 'KB', 0],
      [38_508, 38.508, 'KB', 0],
      [999_999, 1, 'MB', 1],
      [1_000_000, 1, 'MB', 1],
      [2_080_000, 2, 'MB', 1],
      [2_100_000, 2.1, 'MB', 1],
      [2_400_000, 2.4, 'MB', 1],
      [2_900_000, 2.9, 'MB', 1],
      [2_940_000, 3, 'MB', 1],
      [10_000_000, 10, 'MB', 0],
      [156_000_000, 156, 'MB', 0],
      [999_999_999, 1, 'GB', 1],
      [1_000_000_000, 1, 'GB', 1],
      [1_200_000_000, 1.2, 'GB', 1],
      [10_000_000_000, 10, 'GB', 0],
      [1_000_000_000_000, 1000, 'GB', 0]
    ] as const
  ) {
    const number = value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits
    })
    assertEquals(UiText.size(bytes), `${number} ${unit}`)
  }
  for (const bytes of [0, 1, 999]) assertEquals(UiText.size(bytes), '< 1 KB')
})
