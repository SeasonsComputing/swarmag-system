/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Wrap Supabase shim                                                           ║
║ Deno.serve entry wrapper for Supabase Edge Functions.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Wraps a Deno.serve handler with uniform edge-function observability. Logs slow
or failed invocations without adding noise on the fast/successful path, and
races the handler against a timeout so a hung awaited call fails loud with a
proper CORS-safe response instead of riding out an unexplained platform idle
shutdown. A hung handler is not cancelled — it keeps running after the
timeout response is sent — so its eventual outcome is watched and logged too.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
WrapSupabaseShimConfig    Shim configuration (timeout, CORS).
wrapSupabaseShim(handler, config)  Wrap a Deno.serve handler with timeout + logging.
*/

import { HttpCodes, type HttpHandlerConfig, makeCorsHeaders } from '@core/stdx'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC TYPES
// ────────────────────────────────────────────────────────────────────────────

/** Shim configuration for timeout and CORS behavior. */
export type WrapSupabaseShimConfig = {
  /** Milliseconds before an in-flight handler is treated as hung. Default: 30000. */
  timeoutMs?: number
  /** CORS configuration applied to the timeout fallback response. Default: true. */
  cors?: HttpHandlerConfig['cors']
}

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

/** Wrap a Deno.serve handler with a request timeout and slow/failure logging. */
export const wrapSupabaseShim = (
  handler: (request: Request) => Promise<Response>,
  config: WrapSupabaseShimConfig = {}
): (request: Request) => Promise<Response> => {
  const timeoutMs = config.timeoutMs ?? 30_000
  const cors = config.cors ?? true

  return async (request: Request): Promise<Response> => {
    const start = performance.now()
    const handlerPromise = handler(request)

    const outcome = await Promise.race([
      handlerPromise.then((response): Outcome => ({ kind: 'handled', response })),
      wait(timeoutMs).then((): Outcome => ({ kind: 'timedOut' }))
    ])

    if (outcome.kind === 'timedOut') {
      console.error('[edge] handler timed out', { method: request.method, url: request.url, timeoutMs })
      watchAbandonedHandler(request, handlerPromise, start)
      return timeoutResponse(cors)
    }

    const elapsedMs = Math.round(performance.now() - start)
    if (outcome.response.status >= HttpCodes.internalError || elapsedMs > timeoutMs * 0.5) {
      console.error('[edge] slow or failed invocation', {
        method: request.method,
        url: request.url,
        status: outcome.response.status,
        elapsedMs
      })
    }
    return outcome.response
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE
// ────────────────────────────────────────────────────────────────────────────

type Outcome = { kind: 'handled'; response: Response } | { kind: 'timedOut' }

const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

const timeoutResponse = (cors: NonNullable<HttpHandlerConfig['cors']> | boolean): Response =>
  new Response(JSON.stringify({ error: 'Request timed out' }), {
    status: HttpCodes.gatewayTimeout,
    headers: { 'content-type': 'application/json', ...makeCorsHeaders(cors) }
  })

// the handler is not cancelled on timeout — it keeps running until it settles
// or the isolate is reaped, so watch it and log whatever eventually happens
const watchAbandonedHandler = (
  request: Request,
  handlerPromise: Promise<Response>,
  start: number
): void => {
  handlerPromise
    .then(response => {
      console.error('[edge] handler resolved after timeout response already sent', {
        method: request.method,
        url: request.url,
        status: response.status,
        totalElapsedMs: Math.round(performance.now() - start)
      })
    })
    .catch(error => {
      console.error('[edge] handler threw after timeout response already sent', {
        method: request.method,
        url: request.url,
        error: error instanceof Error ? { name: error.name, message: error.message } : String(error),
        totalElapsedMs: Math.round(performance.now() - start)
      })
    })
}
