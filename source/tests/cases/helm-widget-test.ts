/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Helm configuration tests                                                     ║
║ Focused contract and lifecycle verification.                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { ValidatorError } from '@core/std'
import { assertEquals, assertThrows } from '@std/assert'
import { readHelmToolbar } from '@ux/widgets/helm-widget-contract.ts'
import type { HelmBindings } from '@ux/widgets/helm-widget-contract.ts'

const Commands: HelmBindings = {
  commands: { '@sync': { execute: () => {}, disabled: () => false } },
  status: { ready: () => 'Ready offline' }
}
const Route = { command: '/binder', label: 'Binder', icon: 'backpack' }
const Menu = { label: 'Backpack', icon: 'backpack', items: [Route, { status: 'ready' }] }
const Tasks = { command: '@tasks', label: 'Tasks', icon: 'update' }

const AdminBindings: HelmBindings = {
  commands: { '@sync-field-binder': { execute: () => {} } },
  status: { 'field-binder': () => 'Not downloaded' }
}

const toolbar = (...items: unknown[]) => ({ items })

Deno.test('Helm accepts current dashboards with their app bindings', async () => {
  for (const app of ['admin', 'ops', 'customer']) {
    const seed = JSON.parse(await Deno.readTextFile(`source/front/app-${app}/dashboard-${app}.json`))
    const helm = seed.header.widgets.find((widget: { type: string }) => widget.type === 'HelmWidget')
    const read = readHelmToolbar(helm.settings.toolbar, app === 'admin' ? AdminBindings : {})
    assertEquals(read, helm.settings.toolbar)
  }
})

Deno.test('Helm accepts routes, menus, Tasks, and bound commands and status', () => {
  assertEquals<unknown>(readHelmToolbar(toolbar(Route), {}), toolbar(Route))
  assertEquals<unknown>(readHelmToolbar(toolbar(Tasks, Menu), Commands), toolbar(Tasks, Menu))
  assertEquals(readHelmToolbar(toolbar({ ...Route, command: '@sync' }), Commands).items.length, 1)
})

Deno.test('Helm rejects label modes, misplaced items, nested menus, and absent bindings', () => {
  const invalid = [
    undefined,
    {},
    [Route],
    toolbar(),
    toolbar(null),
    toolbar({ ...Route, command: '' }),
    toolbar({ ...Route, command: '@missing' }),
    toolbar({ ...Route, labelMode: 'hidden' }),
    toolbar({ ...Route, lable: 'Binder' }),
    toolbar({ ...Menu, labelMode: 'hidden' }),
    toolbar({ ...Menu, command: '/binder' }),
    toolbar({ ...Menu, status: 'ready' }),
    toolbar({ ...Menu, items: [] }),
    toolbar({ ...Menu, items: [Menu] }),
    toolbar({ ...Menu, items: [{}] }),
    toolbar({ ...Menu, items: [Tasks] }),
    toolbar({ ...Menu, items: [{ ...Route, labelMode: 'visible' }] }),
    toolbar({ ...Menu, items: [{ ...Route, status: 'ready' }] }),
    toolbar({ ...Menu, items: [{ status: 'missing' }] }),
    toolbar({ ...Menu, items: [{ status: 'ready', icon: 'update' }] }),
    toolbar({ ...Menu, items: [{ separator: true }] }),
    toolbar({ status: 'ready' }),
    toolbar({ separator: true })
  ]
  for (const value of invalid) assertThrows(() => readHelmToolbar(value, Commands), ValidatorError)
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
    assertThrows(() => readHelmToolbar(toolbar(Route), bindings as HelmBindings), ValidatorError)
  }
})
