/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Make Supabase edge auth                                                      ║
║ Supabase Edge caller verification handshake for privileged functions.        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Verifies the caller JWT and provides the caller-scoped and service-role
Supabase clients used by privileged edge orchestration. Platform handshake
only — domain authorization predicates remain with the orchestration caller.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
SupabaseEdgeAuthSpecification  Edge auth configuration values.
EdgeClients                    Provisioned Supabase clients for an invocation.
EdgeCallerContext              Verified caller identity with clients.
SupabaseEdgeAuthContract       Edge caller verification contract.
makeSupabaseEdgeAuth(spec)     Build the edge caller verification handshake.
*/

import { HttpServiceError } from '@core/service/wrap-busrule-http-handler.ts'
import { type Id } from '@core/std'
import { HEADER_AUTHORIZATION, HttpCodes, type HttpRequest } from '@core/stdx'
import { createClient, type SupabaseClient } from '@supabase/client'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC TYPES
// ────────────────────────────────────────────────────────────────────────────

/** Edge auth configuration values. */
export type SupabaseEdgeAuthSpecification = {
  url: string
  publicKey: string
  serviceKey: string
}

/** Supabase clients provisioned for a verified edge invocation. */
export type EdgeClients = {
  callerClient: SupabaseClient
  serviceClient: SupabaseClient
}

/** Verified caller identity with provisioned clients. */
export type EdgeCallerContext = EdgeClients & { authUserId: Id }

/** Edge caller verification contract. */
export interface SupabaseEdgeAuthContract {
  verifyCaller(request: HttpRequest): Promise<EdgeCallerContext>
}

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

/** Maker to produce the edge caller verification handshake. */
export const makeSupabaseEdgeAuth = (spec: SupabaseEdgeAuthSpecification): SupabaseEdgeAuthContract => ({
  async verifyCaller(request: HttpRequest): Promise<EdgeCallerContext> {
    const authorization = request.headers[HEADER_AUTHORIZATION]
    const token = bearerToken(authorization)
    if (!token) throw new HttpServiceError(HttpCodes.unauthorized, 'Authentication required')

    const serviceClient = supabaseClient(spec, spec.serviceKey)
    const { data, error } = await serviceClient.auth.getUser(token)
    if (error || !data.user) {
      throw new HttpServiceError(HttpCodes.unauthorized, 'Authentication required')
    }

    return {
      authUserId: data.user.id as Id,
      callerClient: supabaseClient(spec, spec.publicKey, authorization),
      serviceClient
    }
  }
})

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE
// ────────────────────────────────────────────────────────────────────────────

const bearerToken = (authorization: string | undefined): string | null => {
  if (!authorization?.startsWith('Bearer ')) return null
  const token = authorization.slice('Bearer '.length).trim()
  return token.length > 0 ? token : null
}

const supabaseClient = (
  spec: SupabaseEdgeAuthSpecification,
  key: string,
  authorization?: string
): SupabaseClient =>
  createClient(spec.url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    ...(authorization ? { global: { headers: { Authorization: authorization } } } : {})
  })
