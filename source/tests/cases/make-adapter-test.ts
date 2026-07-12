/**
 * Unit tests for make-adapter patch and NULL semantics: absent keys leave
 * columns untouched, null clears, falsy values write through, and storage
 * NULL maps to domain absence.
 */

import { type AdapterPatch, makeAdapter } from '@core/stdx'
import { assertEquals } from '@std/assert'

type Gauge = { kind: string; reading: number }
type Widget = {
  id: string
  active: boolean
  count: number
  label: string
  note?: string
  gauges?: Gauge[]
}

const GaugeAdapter = makeAdapter<Gauge>({
  kind: ['kind'],
  reading: ['reading']
})

const WidgetAdapter = makeAdapter<Widget>({
  id: ['id'],
  active: ['is_active'],
  count: ['count'],
  label: ['label'],
  note: ['note'],
  gauges: ['gauges', GaugeAdapter]
})

Deno.test('fromDomain writes falsy values through', () => {
  const record = WidgetAdapter.fromDomain({ active: false, count: 0, label: '' })
  assertEquals(record, { is_active: false, count: 0, label: '' })
})

Deno.test('fromDomain skips absent keys and maps null to a column clear', () => {
  const patch: AdapterPatch<Widget> = { id: 'w1', note: null }
  const record = WidgetAdapter.fromDomain(patch)
  assertEquals(record, { id: 'w1', note: null })
})

Deno.test('toDomain omits NULL and undefined storage columns', () => {
  const widget = WidgetAdapter.toDomain({
    id: 'w1',
    is_active: false,
    count: 0,
    label: '',
    note: null
  })
  assertEquals(widget, { id: 'w1', active: false, count: 0, label: '' } as Widget)
})

Deno.test('round-trip preserves nested compositions and falsy values', () => {
  const widget: Widget = {
    id: 'w2',
    active: false,
    count: 0,
    label: 'ok',
    gauges: [{ kind: 'psi', reading: 0 }]
  }
  const record = WidgetAdapter.fromDomain(widget)
  assertEquals(record, {
    id: 'w2',
    is_active: false,
    count: 0,
    label: 'ok',
    gauges: [{ kind: 'psi', reading: 0 }]
  })
  assertEquals(WidgetAdapter.toDomain(record), widget)
})
