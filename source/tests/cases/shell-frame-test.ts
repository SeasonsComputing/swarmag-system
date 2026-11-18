/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Shell frame browser tests                                                    ║
║ Checks empty-page footer placement and long-page header stability.          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Opt in with --browser and --allow-run=node while the style guide is served at
http://127.0.0.1:5197. Uses workspace Playwright and local Chrome, with no backend.
*/

import { assertEquals } from '@std/assert'

Deno.test({
  name: 'ShellFrame fills empty pages and scrolls long content below a fixed header',
  ignore: !Deno.args.includes('--browser'),
  fn: async () => {
    const result = await new Deno.Command('node', {
      args: ['-e', BROWSER_SCRIPT],
      stdout: 'piped',
      stderr: 'piped'
    }).output()
    assertEquals(result.code, 0, new TextDecoder().decode(result.stderr))
  }
})

const BROWSER_SCRIPT = String.raw`
const { chromium } = require(process.cwd() + '/node_modules/playwright')
;(async () => {
  const b = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true
  })
  try {
    for (const width of [1280, 390]) {
      const p = await b.newPage({ viewport: { width, height: 850 } })
      await p.goto('http://127.0.0.1:5197')
      const result = await p.evaluate(async root => {
        const { ShellFrame } = await import('/@fs/' + root + '/source/ux/shell/runtime/shell-frame.tsx')
        const source = await (await fetch('/@fs/' + root + '/source/ux/shell/runtime/shell-frame.tsx'))
          .text()
        const webPath = source.match(/from ["']([^"']*solid-js_web[^"']*)["']/)[1]
        const { render } = await import(webPath)
        const host = document.createElement('div')
        document.body.replaceChildren(host)
        const footer = document.createElement('footer')
        footer.textContent = 'Footer'
        footer.style.height = '60px'
        const content = document.createElement('div')
        render(
          () => ShellFrame({ header: { brand: 'Brand' }, footer: () => footer, children: content }),
          host
        )
        await new Promise(r => requestAnimationFrame(r))
        const frame = host.querySelector('[data-shell="shell-frame"]')
        const scroll = host.querySelector('[data-shell="shell-frame-scroll"]')
        const header = host.querySelector('header')
        const emptyBottom = footer.getBoundingClientRect().bottom
        const frameBottom = frame.getBoundingClientRect().bottom
        content.style.height = '1800px'
        await new Promise(r => requestAnimationFrame(r))
        const longTop = footer.getBoundingClientRect().top
        const headerTop = header.getBoundingClientRect().top
        scroll.scrollTop = scroll.scrollHeight
        await new Promise(r => requestAnimationFrame(r))
        return {
          footerHeight: footer.getBoundingClientRect().height,
          emptyBottom,
          frameBottom,
          longTop,
          headerTop,
          afterHeaderTop: header.getBoundingClientRect().top,
          afterFooterBottom: footer.getBoundingClientRect().bottom
        }
      }, process.cwd())
      console.log(width, result)
      const assert = require('node:assert/strict')
      assert.equal(result.footerHeight, 60)
      assert.ok(Math.abs(result.emptyBottom - result.frameBottom) < 2)
      assert.ok(result.longTop > 1500)
      assert.equal(result.headerTop, result.afterHeaderTop)
      assert.ok(Math.abs(result.afterFooterBottom - result.frameBottom) < 2)
      await p.close()
    }
  } finally {
    await b.close()
  }
})().catch(e => {
  console.error(e)
  process.exitCode = 1
})
`
