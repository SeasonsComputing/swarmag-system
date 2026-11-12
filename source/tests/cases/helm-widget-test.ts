/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Helm configuration tests                                                     ║
║ Focused contract and lifecycle verification.                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { ValidatorError } from '@core/std'
import { assertEquals, assertThrows } from '@std/assert'
import { readHelmActions } from '@ux/widgets/helm-widget-contract.ts'
import type { HelmBindings } from '@ux/widgets/helm-widget-contract.ts'

const Commands: HelmBindings = {
  commands: { '@sync': { execute: () => {}, disabled: () => false } },
  status: { ready: () => 'Ready offline' }
}
const Route = { command: '/binder', label: 'Binder', icon: 'backpack' }
const Menu = { label: 'Backpack', icon: 'backpack', items: [Route, { status: 'ready' }] }

Deno.test('Helm accepts all current dashboards with empty bindings', async () => {
  for (const app of ['admin', 'ops', 'customer']) {
    const seed = JSON.parse(await Deno.readTextFile(`source/front/app-${app}/dashboard-${app}.json`))
    const helm = seed.header.widgets.find((widget: { type: string }) => widget.type === 'HelmWidget')
    const actions = readHelmActions(helm.settings.actions, {})
    assertEquals(actions.length, helm.settings.actions.length)
  }
  assertEquals(readHelmActions([Route], {}), [{ ...Route, labelMode: 'visible' }])
  assertEquals(readHelmActions([Menu], Commands), [{
    ...Menu,
    items: [{ ...Route, labelMode: 'visible' }, { status: 'ready' }]
  }])
  assertEquals(readHelmActions([{ ...Route, command: '@sync' }], Commands).length, 1)
})

Deno.test('Helm rejects ambiguous operations, nested menus, and absent bindings', () => {
  const invalid = [
    undefined,
    {},
    [null],
    [{ ...Route, command: '' }],
    [{ ...Route, command: '@missing' }],
    [{ ...Route, labelMode: 'compact' }],
    [{ ...Route, labelMode: null }],
    [{ ...Menu, labelMode: 'hidden' }],
    [{ ...Menu, command: '/binder' }],
    [{ ...Menu, status: 'ready' }],
    [{ ...Menu, items: [] }],
    [{ ...Menu, items: [Menu] }],
    [{ ...Menu, items: [{}] }],
    [{ ...Menu, items: [{ ...Route, status: 'ready' }] }],
    [{ ...Menu, items: [{ status: 'missing' }] }],
    [{ ...Menu, items: [{ status: 'ready', icon: 'update' }] }],
    [{ ...Menu, items: [{ ...Route, labelMode: 'hidden' }] }],
    [{ status: 'ready' }]
  ]
  for (const actions of invalid) assertThrows(() => readHelmActions(actions, Commands), ValidatorError)
})

Deno.test('Helm rejects reserved bindings and malformed behavior', () => {
  const invalid: unknown[] = [
    { commands: { '@theme': { execute: () => {} } } },
    { commands: { '@tasks': { execute: () => {} } } },
    { commands: { '/binder': { execute: () => {} } } },
    { commands: { '@sync': {} } },
    { commands: { '@sync': { execute: () => {}, disabled: true } } },
    { status: { ready: 'Ready' } }
  ]
  for (const bindings of invalid) {
    assertThrows(() => readHelmActions([], bindings as HelmBindings), ValidatorError)
  }
})
