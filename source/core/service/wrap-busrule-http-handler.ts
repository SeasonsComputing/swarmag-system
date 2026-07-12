/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ BusRule HTTP handler                                                         ║
║ Inbound service handler wrapper for BusRule-shaped HTTP operations.          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides the inbound service-side counterpart to BusRule client makers by
wrapping a request-body operation handler as a standardized HTTP handler.
HTTP parsing, response serialization, CORS, and low-level error handling remain
owned by the foundational HTTP handler primitive.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
BusRuleHttpContext          Context provider contract.
BusRuleHttpHandler          Service operation handler contract.
BusRuleHttpSpecification    Service handler wrapper specification.
HttpServiceError            Expected service error carrying an HTTP status.
wrapBusRuleHttpHandler(spec) Wrap a BusRule-shaped service as an HTTP handler.
*/

import {
  type HttpRequest,
  type HttpResponse,
  toInternalError,
  toMethodNotAllowed,
  toOk,
  wrapHttpHandler
} from '@core/std/wrap-http-handler.ts'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC TYPES
// ────────────────────────────────────────────────────────────────────────────

/** Context provider contract. */
export type BusRuleHttpContext<TContext> = (
  request: HttpRequest
) => Promise<TContext> | TContext

/** Service operation handler contract. */
export type BusRuleHttpHandler<TParams, TResult, TContext> = (
  params: TParams,
  context: TContext,
  request: HttpRequest<TParams>
) => Promise<TResult> | TResult

/** Service handler wrapper specification. */
export type BusRuleHttpSpecification<TParams, TResult, TContext> = {
  context: BusRuleHttpContext<TContext>
  handle: BusRuleHttpHandler<TParams, TResult, TContext>
}

/** Expected service error carrying an HTTP status. */
export class HttpServiceError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'HttpServiceError'
  }
}

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

/** Wrap a BusRule-shaped service as an HTTP handler. */
export const wrapBusRuleHttpHandler = <TParams, TResult, TContext>(
  spec: BusRuleHttpSpecification<TParams, TResult, TContext>
) =>
  wrapHttpHandler<TParams>(async (
    request: HttpRequest<TParams>
  ): Promise<HttpResponse<{ data: TResult } | { error: string; details?: string }>> => {
    try {
      if (request.method !== 'POST') return toMethodNotAllowed()
      const context = await spec.context(request)
      return toOk(await spec.handle(request.body, context, request))
    } catch (error) {
      return toServiceError(error)
    }
  }, { cors: true })

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE
// ────────────────────────────────────────────────────────────────────────────

const toServiceError = (error: unknown): HttpResponse<{ error: string; details?: string }> => {
  if (error instanceof HttpServiceError) return toError(error.statusCode, error.message)
  console.error('Unexpected HTTP service error:', error)
  return toInternalError('Internal Server Error')
}

const toError = (statusCode: number, error: string): HttpResponse<{ error: string }> => ({
  statusCode,
  body: { error }
})
