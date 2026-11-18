/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Manager selection browser tests                                              ║
║ Exercises the living specimen through persisted selection and dirty exits.   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Opt in with --browser and --allow-run=node while the style guide is served at
http://127.0.0.1:5197. Uses the workspace Playwright installation and local Chrome.
No stage data or backend services are involved.
*/

import { assertEquals } from '@std/assert'

Deno.test({
  name: 'Manager returns persisted Items, awaits callbacks, and preserves ordinary management',
  ignore: !Deno.args.includes('--browser'),
  fn: async () => {
    const result = await new Deno.Command('node', {
      args: ['--input-type=module', '-e', BROWSER_SCRIPT],
      stdout: 'piped',
      stderr: 'piped'
    }).output()
    assertEquals(result.code, 0, new TextDecoder().decode(result.stderr))
  }
})

/** Browser-only dependencies are loaded in the explicitly opted-in subprocess. */
const BROWSER_SCRIPT = `
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(process.cwd() + '/package.json')
const { chromium } = require('playwright')
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true
})
try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 850 } })
    page.setDefaultTimeout(10000)
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto('http://127.0.0.1:5197')
    const button = name => page.getByRole('button', { name, exact: true })
    const input = page.getByRole('textbox', { name: 'Question label', exact: true })
    const dialog = page.getByRole('dialog')
    const manager = page.locator("[data-shell='manager'][data-shell-panel='container']")
    await button('Open to Add').click()
    assert.equal(await manager.getAttribute('data-shell-layout'), 'collapsed')
    assert.equal(await button('Add').isDisabled(), true)
    await page.getByRole('row').filter({ hasText: 'Saved question' }).click()
    await input.fill('Unsaved question')
    await button('Add').click()
    await page.getByText('Discard unsaved changes?', { exact: true }).waitFor()
    await page.getByRole('dialog').last().getByRole('button', { name: 'Cancel', exact: true }).click()
    assert.equal(await input.inputValue(), 'Unsaved question')
    await button('Add').click()
    await button('Discard').click()
    await page.getByText('Returned: Saved question', { exact: true }).waitFor()
    assert.equal(await dialog.count(), 0)

    await page.getByRole('checkbox', { name: 'Reject the returned Item' }).focus()
    await page.keyboard.press('Space')
    await button('Open to Add').click()
    await button('New Question').click()
    await input.fill('Created question')
    await button('Save').click()
    await page.getByText('Example caller rejected the Item.', { exact: true }).waitFor()
    assert.equal(await input.inputValue(), 'Created question')
    assert.equal(
      await page.getByRole('row', { includeHidden: true }).filter({ hasText: 'Created question' })
        .count(),
      1
    )
    await button('Add').click()
    await page.getByText('Example caller rejected the Item.', { exact: true }).waitFor()
    assert.equal(
      await page.getByRole('row', { includeHidden: true }).filter({ hasText: 'Created question' })
        .count(),
      1
    )
    await button('Cancel').click()
    await page.getByRole('checkbox', { name: 'Reject the returned Item' }).focus()
    await page.keyboard.press('Space')
    await button('Open to Add').click()
    await button('New Question').click()
    await input.fill('Returned new question')
    await button('Save').click()
    await page.getByText('Returned: Returned new question', { exact: true }).waitFor()
    assert.equal(await dialog.count(), 0)

    await button('Open to Manage').click()
    assert.equal(await manager.getAttribute('data-shell-layout'), null)
    assert.equal(await button('Add').count(), 0)
    await button('New Question').click()
    await input.fill('Managed question')
    await button('Save').click()
    await page.getByText('Created Managed question.', { exact: true }).waitFor()
    assert.equal(await dialog.count(), 1)
    await button('Cancel').click()
    assert.deepEqual(errors, [])
    await page.close()
  }
} finally {
  await browser.close()
}
`
