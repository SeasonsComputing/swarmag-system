/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Bootstrap and Helm browser lifecycle tests                                   ║
║ Real Solid mount cleanup, command execution, and keyboard focus.             ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Opt-in local browser verification without API or hosted storage access. Run:
deno test --allow-env --allow-read --allow-run=node
source/tests/cases/bootstrap-lifecycle-test.ts -- --browser

Uses the existing local Vite and Playwright installations. A test-only Vite
transform captures render's existing disposer so disposal of bootstrap's actual
Solid root can be tested without extending bootstrap's production return type.
*/

import { assertEquals } from '@std/assert'

Deno.test({
  name: 'Bootstrap mount cleanup and Helm keyboard/async behavior in Chromium',
  ignore: !Deno.args.includes('--browser'),
  async fn() {
    const result = await new Deno.Command('node', {
      args: ['--input-type=module', '-e', BROWSER_TEST],
      stdout: 'inherit',
      stderr: 'inherit'
    }).spawn().status
    assertEquals(result.code, 0)
  }
})

const BROWSER_TEST = String.raw`
import { createServer } from 'vite'
import { chromium } from 'playwright'
import assert from 'node:assert/strict'

async function browserHarness() {
  const { Config } = await import('/source/core/cfg/config.ts')
  Config.init({ get: name => ({ LOCAL_DB_NAME: 'background-browser-test',
    SERVICE_WORKER_ENABLED: 'false' })[name], fail: message => { throw new Error(message) } },
    ['LOCAL_DB_NAME', 'SERVICE_WORKER_ENABLED'])
  const { bootstrap } = await import('/source/ux/shell/runtime/bootstrap.tsx')
  const { AppState } = await import('/source/ux/shell/runtime/app-state.ts')
  const { BackgroundTasks } = await import('/source/ux/shell/runtime/background-tasks.ts')
  const { BackgroundTaskWarnings } = await import(
    '/source/ux/shell/runtime/background-task-warnings.ts'
  )
  const { makeHelmWidget } = await import('/source/ux/widgets/make-helm-widget.tsx')
  const { HelmWidget } = await import('/source/ux/widgets/helm-widget.tsx')
  const { createComponent, createSignal, onCleanup } = await import('solid-js')
  AppState.init = async () => {}
  const events = []
  const [status, setStatus] = createSignal('Ready offline')
  const [disabled, setDisabled] = createSignal(false)
  let calls = 0
  let mode = 'success'
  let closedOnExecute = false
  const Widget = makeHelmWidget({
    commands: { '@sync': {
      disabled,
      execute: async () => {
        calls++
        closedOnExecute = !document.querySelector('[data-widget="helm-command-menu"]')
        BackgroundTasks.clear('@sync')
        if (mode === 'unexpected') throw new Error('Unexpected Sync programming failure')
        if (mode === 'expected') BackgroundTasks.publish('@sync', {
          label: 'Binder Sync', phase: 'failed', blocksExit: false, error: 'Unable to reach the server'
        })
      }
    } }, status: { ready: status }
  })
  const [settings, setSettings] = createSignal({
    actions: [
      { label: 'Backpack', icon: 'backpack', items: [
        { command: '/binder', label: 'Binder', icon: 'backpack' },
        { command: '@sync', label: 'Sync', icon: 'update' }, { status: 'ready' }
      ] },
      { command: '/about', label: 'About', icon: 'info-circled' },
      { command: '@theme', label: 'Theme', icon: 'moon', labelMode: 'hidden' },
      { command: '@tasks', label: 'Tasks', icon: 'update', labelMode: 'hidden' }
    ], themes: ['dark', 'light']
  })
  const session = {
    init() { events.push('session'); onCleanup(() => events.push('session-cleanup')) },
    clear() { BackgroundTasks.clearAll() }
  }
  const application = {
    session,
    shells: [{ component: () => createComponent(Widget, { get settings() { return settings() } }),
      initializers: [], routes: [
        { kind: 'index', path: '/' },
        { kind: 'page', path: '/about', component: () => null }
      ] }]
  }
  const mount = () => {
    events.push('mount')
    const stop = BackgroundTaskWarnings.start()
    return () => { events.push('cleanup'); stop() }
  }
  const leave = () => {
    const event = new Event('beforeunload', { cancelable: true })
    dispatchEvent(event)
    return event.defaultPrevented
  }
  globalThis.Harness = {
    events, setStatus, setDisabled, leave,
    calls: () => calls, closedOnExecute: () => closedOnExecute,
    mode: value => { mode = value },
    publish: (key, task) => BackgroundTasks.publish(key, task),
    clear: () => BackgroundTasks.clearAll(),
    reports: () => Object.keys(BackgroundTasks.store),
    dispose: () => globalThis.__disposeApplication(),
    remount: () => bootstrap(application, mount),
    defaultMount: () => bootstrap({ ...application, shells: [{ ...application.shells[0],
      component: () => createComponent(HelmWidget, { settings: { actions: [
        { command: '@theme', label: 'Theme', icon: 'moon', labelMode: 'hidden' }
      ], themes: ['dark', 'light'] } }) }] }),
    settings: setSettings
  }
  await bootstrap(application, mount)
  document.body.dataset.ready = 'true'
}

const server = await createServer({
  configFile: 'source/front/app-admin/vite.config.ts',
  root: process.cwd(),
  server: { port: 0, host: '127.0.0.1' },
  plugins: [{
    name: 'background-test-harness', enforce: 'pre',
    resolveId(id) { if (id === 'virtual:background-test') return '\0background-test' },
    load(id) { if (id === '\0background-test') return '(' + browserHarness.toString() + ')()' },
    transform(code, id) {
      if (id.endsWith('/shell/runtime/bootstrap.tsx')) return code.replace(
        /\brender\(/,
        'globalThis.__disposeApplication = render('
      )
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== '/') return next()
        res.setHeader('Content-Type', 'text/html')
        res.end('<!doctype html><html><body><div id="root"></div>' +
          '<script type="module" src="/@id/virtual:background-test"></script></body></html>')
      })
    }
  }]
})
let browser
try {
  await server.listen()
  browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } })
  page.setDefaultTimeout(10000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('http://127.0.0.1:' + server.httpServer.address().port)
  await page.waitForSelector('body[data-ready="true"]')
  assert.deepEqual(await page.evaluate(() => Harness.events), ['session', 'mount'])
  assert.equal(await page.getByRole('button', { name: 'Tasks', exact: true }).isDisabled(), true)
  const taskFrame = () => page.getByRole('button', { name: 'Tasks', exact: true })
    .locator('[data-widget="helm-action-frame"]').evaluate(element => {
      const style = getComputedStyle(element)
      return [style.width, style.height, style.borderWidth, style.borderStyle, style.borderRadius]
    })
  const actionFrame = await page.getByRole('button', { name: 'Theme', exact: true })
    .locator('[data-ui="action-button-frame"]').evaluate(element => {
      const style = getComputedStyle(element)
      return [style.width, style.height, style.borderWidth, style.borderStyle, style.borderRadius]
    })
  assert.deepEqual(await taskFrame(), actionFrame)
  await page.getByRole('button', { name: 'Backpack', exact: true }).focus()
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Sync', exact: true }).waitFor()
  assert.equal(await page.getByText('Ready offline', { exact: true }).getAttribute('tabindex'), null)
  await page.evaluate(() => Harness.setStatus('Prepared on device'))
  await page.getByText('Prepared on device', { exact: true }).waitFor()
  await page.evaluate(() => Harness.setDisabled(true))
  assert.equal(await page.getByRole('button', { name: 'Sync', exact: true }).isDisabled(), true)
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => document.activeElement?.textContent !== undefined &&
    document.activeElement?.querySelector('[aria-label="Backpack"]'))
  await page.evaluate(() => Harness.setDisabled(false))
  await page.getByRole('button', { name: 'Backpack', exact: true }).click()
  await page.evaluate(() => Harness.mode('expected'))
  await page.getByRole('button', { name: 'Sync', exact: true }).click()
  await page.waitForFunction(() => Harness.calls() === 1)
  assert.equal(await page.evaluate(() => Harness.closedOnExecute()), true)
  assert.equal(await page.evaluate(() => Harness.leave()), false)
  assert.deepEqual(await taskFrame(), actionFrame)
  await page.getByRole('button', { name: 'Tasks', exact: true }).click()
  await page.getByText('Unable to reach the server', { exact: true }).waitFor()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Backpack', exact: true }).click()
  await page.getByRole('button', { name: 'Sync', exact: true }).click()
  await page.waitForFunction(() => Harness.calls() === 2)
  assert.deepEqual(await page.evaluate(() => Harness.reports()), ['@sync'])
  await page.getByRole('button', { name: 'Tasks', exact: true }).click()
  await page.getByRole('button', { name: 'Dismiss Binder Sync', exact: true }).click()
  assert.deepEqual(await page.evaluate(() => Harness.reports()), [])
  assert.equal(await page.getByRole('button', { name: 'Tasks', exact: true }).isDisabled(), true)
  await page.waitForFunction(() => document.activeElement?.closest('[data-widget="helm-widget"]'))
  await page.getByRole('button', { name: 'Backpack', exact: true }).click()
  await page.evaluate(() => Harness.mode('unexpected'))
  await page.getByRole('button', { name: 'Sync', exact: true }).click()
  await page.waitForFunction(() => Harness.calls() === 3)
  await new Promise(resolve => setTimeout(resolve, 100))
  assert.deepEqual(errors, ['Unexpected Sync programming failure'])
  errors.length = 0
  assert.deepEqual(await page.evaluate(() => Harness.reports()), [])
  await page.evaluate(() => Harness.publish('delivery', {
    label: 'Attachment delivery', phase: 'waiting', blocksExit: true,
    remaining: { count: 3, unit: 'documents' }
  }))
  assert.equal(await page.evaluate(() => Harness.leave()), true)
  await page.getByRole('button', { name: 'Tasks', exact: true }).click()
  await page.getByText('3 documents remaining', { exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: /Dismiss/ }).count(), 0)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Theme', exact: true }).click()
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark')
  await page.setViewportSize({ width: 360, height: 740 })
  await page.getByRole('button', { name: 'More actions', exact: true }).click()
  await page.getByRole('button', { name: 'About', exact: true }).waitFor()
  await page.getByRole('button', { name: 'About', exact: true }).click()
  await page.waitForURL('**/about')
  await page.goBack()
  await page.getByRole('button', { name: 'More actions', exact: true }).click()
  await page.getByRole('button', { name: 'Backpack', exact: true }).click()
  await page.getByRole('button', { name: 'Sync', exact: true }).waitFor()
  assert.equal(await page.locator('[data-ui="popover"]').count(), 1)
  for (let round = 0; round < 2; round++) {
    await page.evaluate(() => Harness.dispose())
    assert.equal(await page.evaluate(() => Harness.leave()), false)
    assert.equal(await page.locator('[data-widget="helm-widget"]').count(), 0)
    await page.evaluate(() => Harness.remount())
    assert.equal(await page.evaluate(() => Harness.leave()), true)
  }
  await page.evaluate(() => { Harness.clear(); Harness.dispose() })
  assert.equal(await page.evaluate(() => Harness.leave()), false)
  const events = await page.evaluate(() => Harness.events)
  assert.equal(events.filter(event => event === 'mount').length, 3)
  assert.equal(events.filter(event => event === 'cleanup').length, 3)
  assert.equal(events.filter(event => event === 'session-cleanup').length, 3)
  await page.evaluate(() => Harness.defaultMount())
  await page.getByRole('button', { name: 'Theme', exact: true }).waitFor()
  await page.evaluate(() => Harness.dispose())
  assert.deepEqual(errors, [])
  console.log('PASS: root lifecycle, default widget, reactive status/disabled, failure ownership, ' +
    'dismissal, retry, counts, keyboard focus, theme, routes, and narrow overflow')
} finally {
  if (browser) await browser.close()
  await server.close()
}
`
