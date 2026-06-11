/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ UX stage smoke test                                                         ║
║ Validates deployed UX apps with HTTP checks and a real browser boot check.  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Checks deployed UX apps strongly enough to catch static-success/runtime-failure
states such as a permanent spinner.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(script entry point — no exported symbols)
*/

import type { Dictionary } from '@core/std'

type Json =
  | boolean
  | number
  | string
  | null
  | Json[]
  | { [key: string]: Json }

type CdpMessage = {
  id?: number
  method?: string
  params?: Json
  result?: Json
  error?: Json
}

type PendingCommand = {
  resolve: (value: Json | undefined) => void
  reject: (reason: Error) => void
}

type SmokeTarget = {
  app: string
  url: string
}

type SmokeArgs = {
  chromePath: string | null
  targets: SmokeTarget[]
}

type SmokeFailure = {
  target: SmokeTarget
  reason: string
}

const DEFAULT_TARGETS: SmokeTarget[] = [
  { app: 'admin', url: 'https://admin-stage.swarmag.com' },
  { app: 'ops', url: 'https://ops-stage.swarmag.com' },
  { app: 'customer', url: 'https://customer-stage.swarmag.com' }
]

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'google-chrome',
  'chromium',
  'chromium-browser'
].filter(Boolean)

const BOOT_TIMEOUT_MS = 12_000
const HTTP_TIMEOUT_MS = 8_000
const CDP_CONNECT_TIMEOUT_MS = 5_000
const CDP_COMMAND_TIMEOUT_MS = 15_000
const CHROME_STOP_TIMEOUT_MS = 2_000
const POLL_MS = 250

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> =>
  new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs)
    promise.then(
      value => {
        clearTimeout(timeout)
        resolve(value)
      },
      error => {
        clearTimeout(timeout)
        reject(error)
      }
    )
  })

const isRecord = (value: unknown): value is Dictionary => typeof value === 'object' && value !== null

const asString = (value: unknown): string => typeof value === 'string' ? value : ''

const parseArgs = (): SmokeArgs => {
  let chromePath: string | null = null
  const targetArgs: string[] = []

  for (const arg of Deno.args) {
    if (arg.startsWith('chrome=')) {
      chromePath = arg.slice('chrome='.length)
      continue
    }
    targetArgs.push(arg)
  }

  if (targetArgs.length === 0) return { chromePath, targets: DEFAULT_TARGETS }

  const targets = targetArgs.map(arg => {
    const [app, url] = arg.includes('=') ? arg.split('=', 2) : ['', arg]
    const inferredApp = app || new URL(url).hostname.split('-stage')[0].split('--').pop() || 'app'
    return { app: inferredApp, url }
  })
  return { chromePath, targets }
}

const findChrome = async (explicitChromePath: string | null): Promise<string> => {
  for (const candidate of [explicitChromePath ?? '', ...CHROME_CANDIDATES].filter(Boolean)) {
    if (candidate.includes('/')) {
      try {
        const stat = await Deno.stat(candidate)
        if (stat.isFile) return candidate
      } catch {
        // try next candidate
      }
      continue
    }

    const command = new Deno.Command('sh', {
      args: ['-c', `command -v ${candidate}`],
      stdout: 'piped',
      stderr: 'null'
    })
    const output = await command.output()
    if (output.success) {
      const path = new TextDecoder().decode(output.stdout).trim()
      if (path) return path
    }
  }

  throw new Error('Chrome executable not found; pass chrome=/path/to/chrome to run UX smoke tests')
}

class ChromeProcess {
  readonly userDataDir: string
  readonly child: Deno.ChildProcess

  constructor(userDataDir: string, child: Deno.ChildProcess) {
    this.userDataDir = userDataDir
    this.child = child
  }

  static async start(
    explicitChromePath: string | null
  ): Promise<{ chrome: ChromeProcess; port: string }> {
    const chromePath = await findChrome(explicitChromePath)
    const userDataDir = await Deno.makeTempDir({ prefix: 'swarmag-ux-smoke-' })
    const command = new Deno.Command(chromePath, {
      args: [
        '--headless=new',
        '--disable-gpu',
        '--disable-component-update',
        '--disable-extensions',
        '--no-first-run',
        '--disable-background-networking',
        '--disable-dev-shm-usage',
        '--remote-debugging-port=0',
        `--user-data-dir=${userDataDir}`,
        'about:blank'
      ],
      stdout: 'null',
      stderr: 'null'
    })
    const child = command.spawn()
    const chrome = new ChromeProcess(userDataDir, child)
    const port = await chrome.waitForPort()
    return { chrome, port }
  }

  async waitForPort(): Promise<string> {
    const activePortFile = `${this.userDataDir}/DevToolsActivePort`
    for (let i = 0; i < 80; i += 1) {
      try {
        const source = await Deno.readTextFile(activePortFile)
        const [port] = source.split('\n')
        if (port) return port
      } catch {
        await sleep(100)
      }
    }
    throw new Error('Timed out waiting for Chrome DevTools port')
  }

  async stop(): Promise<void> {
    try {
      this.child.kill('SIGTERM')
    } catch {
      // already stopped
    }
    try {
      await withTimeout(this.child.status, CHROME_STOP_TIMEOUT_MS, 'Chrome shutdown')
    } catch {
      try {
        this.child.kill('SIGKILL')
        await withTimeout(this.child.status, CHROME_STOP_TIMEOUT_MS, 'Chrome kill')
      } catch {
        // ignore process shutdown races
      }
    }
    await Deno.remove(this.userDataDir, { recursive: true }).catch(() => {})
  }
}

class CdpClient {
  #nextId = 1
  #pending = new Map<number, PendingCommand>()
  readonly errors: string[] = []
  readonly requestedUrls: string[] = []
  readonly socket: WebSocket

  private constructor(socket: WebSocket) {
    this.socket = socket
    this.socket.onmessage = event => this.#handleMessage(event.data)
    this.socket.onclose = () => this.#rejectPending('Chrome DevTools websocket closed')
  }

  static async connect(webSocketUrl: string): Promise<CdpClient> {
    const socket = new WebSocket(webSocketUrl)
    try {
      await withTimeout(
        new Promise<void>((resolve, reject) => {
          socket.onopen = () => resolve()
          socket.onerror = () => reject(new Error('Failed to connect to Chrome DevTools'))
        }),
        CDP_CONNECT_TIMEOUT_MS,
        'Chrome DevTools websocket connection'
      )
    } catch (error) {
      socket.close()
      throw error
    }
    return new CdpClient(socket)
  }

  send(method: string, params: Dictionary<Json> = {}): Promise<Json | undefined> {
    const id = this.#nextId
    this.#nextId += 1
    const payload = JSON.stringify({ id, method, params })
    const result = new Promise<Json | undefined>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.#pending.delete(id)
        reject(new Error(`Chrome DevTools command timed out: ${method}`))
      }, CDP_COMMAND_TIMEOUT_MS)
      this.#pending.set(id, {
        resolve: value => {
          clearTimeout(timeout)
          resolve(value)
        },
        reject: error => {
          clearTimeout(timeout)
          reject(error)
        }
      })
    })
    this.socket.send(payload)
    return result
  }

  close(): void {
    this.#rejectPending('Chrome DevTools websocket closed')
    this.socket.close()
  }

  #rejectPending(reason: string): void {
    for (const [, pending] of this.#pending) pending.reject(new Error(reason))
    this.#pending.clear()
  }

  #handleMessage(data: unknown): void {
    const message = JSON.parse(String(data)) as CdpMessage
    if (message.id) {
      const pending = this.#pending.get(message.id)
      if (!pending) return
      this.#pending.delete(message.id)
      if (message.error) {
        pending.reject(new Error(JSON.stringify(message.error)))
      } else {
        pending.resolve(message.result)
      }
      return
    }

    if (message.method === 'Runtime.exceptionThrown') {
      this.errors.push(`exception: ${JSON.stringify(message.params)}`)
    }
    if (message.method === 'Network.requestWillBeSent') {
      const params = isRecord(message.params) ? message.params : {}
      const request = isRecord(params.request) ? params.request : {}
      const url = asString(request.url)
      if (url) this.requestedUrls.push(url)
    }
    if (message.method === 'Inspector.targetCrashed') {
      this.errors.push(`target crashed: ${JSON.stringify(message.params)}`)
    }
    if (message.method === 'Page.javascriptDialogOpening') {
      this.errors.push(`dialog: ${JSON.stringify(message.params)}`)
    }
    if (message.method === 'Log.entryAdded') {
      const params = isRecord(message.params) ? message.params : {}
      const entry = isRecord(params.entry) ? params.entry : {}
      if (entry.level === 'error') this.errors.push(`log: ${asString(entry.text)}`)
    }
    if (message.method === 'Runtime.consoleAPICalled') {
      const params = isRecord(message.params) ? message.params : {}
      const type = asString(params.type)
      if (type !== 'error' && type !== 'assert') return
      this.errors.push(`console.${type}: ${JSON.stringify(params.args ?? [])}`)
    }
  }
}

const createBrowserPage = async (port: string): Promise<CdpClient> => {
  const response = await fetch(`http://127.0.0.1:${port}/json/new`, {
    method: 'PUT',
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS)
  })
  if (!response.ok) throw new Error(`Could not create Chrome page: ${response.status}`)
  const target = await response.json() as { webSocketDebuggerUrl?: string }
  if (!target.webSocketDebuggerUrl) throw new Error('Chrome page did not expose a websocket URL')
  const cdp = await CdpClient.connect(target.webSocketDebuggerUrl)
  await cdp.send('Runtime.enable')
  await cdp.send('Log.enable')
  await cdp.send('Network.enable')
  await cdp.send('Page.enable')
  return cdp
}

const evaluate = async (cdp: CdpClient, expression: string): Promise<Json | undefined> => {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true
  })
  if (!isRecord(result)) return undefined
  const value = isRecord(result.result) ? result.result.value : undefined
  return value as Json | undefined
}

const collectedBrowserErrors = (cdp: CdpClient): string =>
  cdp.errors.length > 0 ? ` browserErrors=${JSON.stringify(cdp.errors)}` : ''

const waitForLoginReady = async (cdp: CdpClient): Promise<void> => {
  const started = Date.now()
  while (Date.now() - started < BOOT_TIMEOUT_MS) {
    const value = await evaluate(cdp, `Boolean(document.body.innerText.includes('Send Code'))`)
      .catch(error => {
        throw new Error(
          `Login UI DOM probe failed: ${error instanceof Error ? error.message : String(error)}.${
            collectedBrowserErrors(cdp)
          }`
        )
      })
    if (value === true) return
    await sleep(POLL_MS)
  }

  const text = await evaluate(cdp, 'document.body.innerText.slice(0, 500)').catch(error =>
    `DOM probe failed: ${error instanceof Error ? error.message : String(error)}`
  )
  const rootHtml = await evaluate(cdp, 'document.querySelector("#root")?.innerHTML.slice(0, 500) ?? ""')
    .catch(error => `DOM probe failed: ${error instanceof Error ? error.message : String(error)}`)
  throw new Error(
    `Login UI did not become ready. body=${JSON.stringify(text)} root=${JSON.stringify(rootHtml)}.${
      collectedBrowserErrors(cdp)
    }`
  )
}

const rootUrl = (target: SmokeTarget): string => new URL('/', target.url).href

const loginUrl = (target: SmokeTarget): string => new URL('/login', target.url).href

const dashboardUrl = (target: SmokeTarget): string => new URL('/dashboard', target.url).href

const assertHttpOk = async (url: string, label: string): Promise<Response> => {
  const response = await fetch(url, { signal: AbortSignal.timeout(HTTP_TIMEOUT_MS) })
  if (!response.ok) throw new Error(`${label} returned ${response.status}: ${url}`)
  return response
}

const assertStaticAssets = async (target: SmokeTarget): Promise<void> => {
  const baseUrl = rootUrl(target)
  const root = await assertHttpOk(baseUrl, `${target.app} index`)
  const html = await root.text()

  const metadata = await assertHttpOk(
    new URL('/build-meta.jsonc', baseUrl).href,
    `${target.app} build metadata`
  )
  const metadataValue = await metadata.json() as Dictionary
  if (metadataValue.target !== 'stage') {
    throw new Error(`${target.app} build metadata target is not stage`)
  }

  await assertHttpOk(new URL('/sw.js', baseUrl).href, `${target.app} service worker`)

  const cssPath = html.match(/href="([^"]+index-[^"]+[.]css)"/)?.[1]
  if (!cssPath) throw new Error(`${target.app} index did not reference a CSS asset`)
  const css = await (await assertHttpOk(new URL(cssPath, baseUrl).href, `${target.app} css`)).text()
  const fontPaths = [...css.matchAll(/url\(([^)]*?[.]woff2)\)/g)]
    .map(match => match[1].replaceAll('"', '').replaceAll('\'', ''))
  if (fontPaths.length === 0) throw new Error(`${target.app} CSS did not reference font assets`)
  for (const fontPath of new Set(fontPaths)) {
    await assertHttpOk(new URL(fontPath, baseUrl).href, `${target.app} font`)
  }
}

const smokeBrowser = async (target: SmokeTarget, port: string): Promise<void> => {
  const cdp = await createBrowserPage(port)
  try {
    await cdp.send('Page.navigate', { url: loginUrl(target) })
    await waitForLoginReady(cdp)
    if (cdp.errors.length > 0) {
      throw new Error(`${target.app} browser errors:\n${cdp.errors.join('\n')}`)
    }
  } finally {
    cdp.close()
  }
}

const smokeProtectedRoute = async (target: SmokeTarget, port: string): Promise<void> => {
  const cdp = await createBrowserPage(port)
  try {
    await cdp.send('Page.navigate', { url: dashboardUrl(target) })
    await waitForLoginReady(cdp)
    const state = await evaluate(
      cdp,
      `({
        href: location.href,
        text: document.body.innerText
      })`
    )
    const href = isRecord(state) ? asString(state.href) : ''
    const text = isRecord(state) ? asString(state.text) : ''
    if (!href.endsWith('/login')) {
      throw new Error(`${target.app} protected route did not settle on /login: ${href}`)
    }
    if (text.includes('Ops Dashboard')) {
      throw new Error(`${target.app} protected route rendered dashboard content`)
    }
    const backendRequests = cdp.requestedUrls.filter(url => url.includes('data-stage.swarmag.com'))
    if (backendRequests.length > 0) {
      throw new Error(`${target.app} protected route contacted backend: ${backendRequests.join(', ')}`)
    }
    if (cdp.errors.length > 0) {
      throw new Error(`${target.app} protected route browser errors:\n${cdp.errors.join('\n')}`)
    }
  } finally {
    cdp.close()
  }
}

const smokeTarget = async (target: SmokeTarget, port: string): Promise<void> => {
  console.log(`UX_SMOKE_CHECK ${target.app} ${target.url}`)
  await assertStaticAssets(target)
  await smokeBrowser(target, port)
  await smokeProtectedRoute(target, port)
  console.log(`UX_SMOKE_PASS ${target.app} ${target.url}`)
}

const main = async () => {
  const { chromePath, targets } = parseArgs()
  const { chrome, port } = await ChromeProcess.start(chromePath)
  const failures: SmokeFailure[] = []

  try {
    for (const target of targets) {
      try {
        await smokeTarget(target, port)
      } catch (error) {
        failures.push({ target, reason: error instanceof Error ? error.message : String(error) })
      }
    }
  } finally {
    await chrome.stop()
  }

  if (failures.length > 0) {
    console.error('UX smoke failed:')
    for (const failure of failures) {
      console.error(`- ${failure.target.app} ${failure.target.url}: ${failure.reason}`)
    }
    Deno.exit(1)
  }
}

await main()
