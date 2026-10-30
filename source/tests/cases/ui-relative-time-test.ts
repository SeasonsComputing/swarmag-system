/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Relative timestamp tests                                                     ║
║ Verify relative text, local calendar boundaries, and readable dates.         ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { toWhen } from '@core/std'
import { assertEquals } from '@std/assert'
import { UiText } from '@ux/ui/components/ui-helpers.ts'

Deno.test('relativeTime uses Just now below one minute and whole minutes/hours today', () => {
  const now = new Date(2026, 9, 30, 16, 30)
  withClock(now, () => {
    for (const seconds of [0, 1, 59]) {
      assertEquals(UiText.relativeTime(toWhen(new Date(now.getTime() - seconds * 1000))), 'Just now')
    }
    const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
    for (
      const [seconds, count, unit] of [
        [60, -1, 'minute'],
        [659, -10, 'minute'],
        [3599, -59, 'minute'],
        [3600, -1, 'hour'],
        [10_799, -2, 'hour']
      ] as const
    ) {
      assertEquals(
        UiText.relativeTime(toWhen(new Date(now.getTime() - seconds * 1000))),
        relative.format(count, unit)
      )
    }
  })
})

Deno.test('relativeTime uses yesterday across month and year boundaries', () => {
  for (
    const [now, previous] of [
      [new Date(2026, 10, 1, 16), new Date(2026, 9, 31, 15, 15)],
      [new Date(2027, 0, 1, 16), new Date(2026, 11, 31, 15, 15)],
      [new Date(2026, 10, 2, 16), new Date(2026, 10, 1, 15, 15)]
    ]
  ) {
    const timestamp = toWhen(previous)
    withClock(now, () => {
      assertEquals(UiText.relativeTime(timestamp), `Yesterday at ${periodTime(previous)}`)
    })
  }
})

Deno.test('relativeTime keeps a sub-minute timestamp Just now across midnight', () => {
  withClock(new Date(2026, 9, 30, 0, 0, 10), () => {
    assertEquals(UiText.relativeTime(toWhen(new Date(2026, 9, 29, 23, 59, 50))), 'Just now')
  })
})

Deno.test('relativeTime uses weekday names until the seven-day boundary', () => {
  withClock(new Date(2026, 9, 30, 16, 30), () => {
    for (const previous of [new Date(2026, 9, 26, 15, 15), new Date(2026, 9, 23, 16, 31)]) {
      const weekday = previous.toLocaleDateString(undefined, { weekday: 'long' })
      assertEquals(UiText.relativeTime(toWhen(previous)), `${weekday} at ${periodTime(previous)}`)
    }
    const boundary = new Date(2026, 9, 23, 16, 30)
    const month = boundary.toLocaleDateString(undefined, { month: 'long' })
    assertEquals(UiText.relativeTime(toWhen(boundary)), `${month} 23rd at ${localTime(boundary)}`)
  })
})

Deno.test('relativeTime applies English ordinal suffixes, including teen exceptions', () => {
  withClock(new Date(2026, 11, 15, 16), () => {
    for (
      const [day, ordinal] of [
        [1, '1st'],
        [2, '2nd'],
        [3, '3rd'],
        [4, '4th'],
        [11, '11th'],
        [12, '12th'],
        [13, '13th'],
        [21, '21st'],
        [22, '22nd'],
        [23, '23rd'],
        [31, '31st']
      ] as const
    ) {
      const previous = new Date(2026, 9, day, 15, 15)
      const month = previous.toLocaleDateString(undefined, { month: 'long' })
      assertEquals(
        UiText.relativeTime(toWhen(previous)),
        `${month} ${ordinal} at ${localTime(previous)}`
      )
    }
  })
})

Deno.test('relativeTime includes the year only for older dates outside the current year', () => {
  withClock(new Date(2026, 9, 30, 16), () => {
    for (const year of [2025, 2026]) {
      const previous = new Date(year, 9, 1, 9, 5)
      const month = previous.toLocaleDateString(undefined, { month: 'long' })
      const expectedYear = year === 2025 ? ', 2025' : ''
      assertEquals(
        UiText.relativeTime(toWhen(previous)),
        `${month} 1st${expectedYear} at ${localTime(previous)}`
      )
    }
  })
})

Deno.test('relativeTime expands AM/PM cues for recent days and retains 24-hour locale time', () => {
  const originalTime = Date.prototype.toLocaleTimeString
  try {
    for (
      const [time, expected] of [
        ['9:05 AM', '9:05 in the morning'],
        ['3:15 PM', '3:15 in the evening'],
        ['15:15', '15:15']
      ]
    ) {
      Date.prototype.toLocaleTimeString = () => time
      withClock(new Date(2026, 9, 30, 16), () => {
        assertEquals(
          UiText.relativeTime(toWhen(new Date(2026, 9, 29, 15, 15))),
          `Yesterday at ${expected}`
        )
      })
    }
  } finally {
    Date.prototype.toLocaleTimeString = originalTime
  }
})

const withClock = (now: Date, run: () => void): void => {
  const OriginalDate = globalThis.Date
  const instant = now.getTime()
  class FixedDate extends OriginalDate {
    constructor(
      value: string | number = instant,
      month?: number,
      day = 1,
      hours = 0,
      minutes = 0,
      seconds = 0,
      milliseconds = 0
    ) {
      super(
        month === undefined
          ? value
          : new OriginalDate(value as number, month, day, hours, minutes, seconds, milliseconds)
            .getTime()
      )
    }
    static override now(): number {
      return instant
    }
  }
  globalThis.Date = FixedDate as DateConstructor
  try {
    run()
  } finally {
    globalThis.Date = OriginalDate
  }
}

const localTime = (value: Date): string =>
  value.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

const periodTime = (value: Date): string => {
  const time = localTime(value)
  const period = time.match(/\s*(AM|PM)/i)
  if (period === null) return time
  const wording = period[1].toUpperCase() === 'AM' ? 'in the morning' : 'in the evening'
  return `${time.slice(0, period.index)} ${wording}`
}
