/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ API contracts for CRUD, List & business rule operations                      ║
║ Shared transport-agnostic contracts and pagination helpers                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the canonical client contracts used across the API composition layer:
CRUD operations, business-rule operations, uniform delete/list result shapes,
and keyset cursor validation.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ApiCrudContract<T> - CrudBaseContract<T> & AdaptedUpdateContract<T> & CrudListContract<T>
ApiBusRuleContract<TParams, TResult> - Generic business-rule execution contract.
└ run(params)  Execute business rule and return typed result.

ERROR HANDLING
───────────────────────────────────────────────────────────────────────────────
ApiError - Standard API failure error shape.
├ message  Error message.
├ status   HTTP-like status code.
└ details  Optional provider detail/code.
ApiErrorDetail - Normalized error detail shape for mapping.
├ message  Optional provider message.
├ status   Optional provider status.
├ details  Optional provider detail.
└ code     Optional provider code.
checkApiError(error, ...): void    Throw ApiError when provider error exists.
throwApiError(error, ...): never   Always throw ApiError from provider error.
apiError(error): boolean           Runtime type guard and logger for ApiError.
checkValidatorError(result): void  Throw ApiError 422 when a validator rejects a payload.

CRUD CONTRACTS
───────────────────────────────────────────────────────────────────────────────
CrudBaseContract<T> - Non-mutating-shape CRUD primitives shared by every realization.
├ create(input)  Create one resource.
├ get(id)        Read one resource.
└ delete(id)     Delete one resource and return DeleteResult.
AdaptedUpdateContract<T> - Scoped update via a client-side ScopedUpdateAdapter (Supabase, IndexedDB).
└ update(scoped, source)  Update declared fields through an adapter translation.
DirectUpdateContract<T> - Scoped update with no adapter translation (abstraction-oriented HTTP).
└ update(source)  Update declared fields directly.
DeleteResult - Uniform soft-delete response payload.
├ id         Deleted resource id.
└ deletedAt  Soft-delete timestamp.

LISTING CONTRACTS
───────────────────────────────────────────────────────────────────────────────
CrudListContract<T> - Paginated listing.
└ list(options?)  List resources with pagination.
DEFAULT_LIMIT - Default list page size.
MAX_LIMIT - Maximum list page size.
ListOptions<T> - Query and pagination request options.
├ query   Built query, or unfiltered default ordering.
├ limit   Requested page size.
└ cursor  Requested pagination cursor.
ListResult<T> - Pagination response payload.
├ data     Page data set.
├ cursor   Cursor for next read position.
└ hasMore  True when more rows remain.
listPageLimit(number): number      Clamp the numeric page size.
listAll(client, query)             Iterate records with paging internal.
listPage(rows, ...)                Assemble a page and its cursor.
resolveQueryFields(...)            Resolve query fields or throw ApiError 400.
listQuery(options)                 Resolve a query or default ordering.
listFingerprint(query)             Stable criteria/search fingerprint.
readListCursor(token, issuer, query) Validate a store-local keyset cursor.
writeListCursor(issuer, query, value, id) Encode a keyset cursor.
ListQuery<T>                        Resolved query data without a brand.
ListCursor                         Decoded store-local cursor.
*/

import type { Dictionary } from './adt.ts'
import type { When } from './datetime.ts'
import { isId } from './identifier.ts'
import type { Id } from './identifier.ts'
import type { FromInstantiable, Instantiable } from './instance.ts'
import type { Adapter, AnyFieldAdapter, FieldAdapter, ScopedUpdateAdapter } from './make-adapter.ts'
import type { Query, QueryDirection } from './make-query.ts'
import type { CreateFromInstantiable, ScopedUpdate } from './protocols.ts'
import type { ExpectResult } from './validators.ts'

// ────────────────────────────────────────────────────────────────────────────
// ERROR HANDLING
// ────────────────────────────────────────────────────────────────────────────

/** Error thrown when an API call fails. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Normalized provider-error shape for ApiError mapping. */
export type ApiErrorDetail = {
  message?: string
  status?: number
  details?: string
  code?: string
}

/**
 * Throw ApiError when provider error is present.
 * Uses fallback message when provider message is empty.
 * Details default to provider details, then provider code.
 */
export function checkApiError<T extends ApiErrorDetail>(
  error: T | null | undefined,
  fallback: string,
  status: number | ((error: T) => number),
  details?: (error: T) => string | undefined
): void {
  if (!error) return
  throwApiError(error, fallback, status, details)
}

/**
 * Always throw ApiError using provider-error details.
 * Uses fallback message when provider message is empty.
 * Details default to provider details, then provider code.
 */
export function throwApiError<T extends ApiErrorDetail>(
  error: T,
  fallback: string,
  status: number | ((error: T) => number),
  details?: (error: T) => string | undefined
): never {
  const mappedStatus = typeof status === 'function' ? status(error) : status
  const mappedDetails = details ? details(error) : error.details ?? error.code
  throw new ApiError(error.message || fallback, mappedStatus, mappedDetails)
}

/** ApiError handler */
export function apiError(error: unknown): boolean {
  if (error instanceof ApiError) {
    console.error(`${error.status}: ${error.message}`)
    if (error.details) console.error(error.details)
    return true
  }
  return false
}

/**
 * Throw ApiError 422 when a validator rejects a payload.
 * The result string is already the message — validation failures are
 * expected, user-correctable feedback, not a fault worth a console trace.
 */
export function checkValidatorError(result: ExpectResult): void {
  if (result !== null) throw new ApiError(result, 422)
}

// ────────────────────────────────────────────────────────────────────────────
// CRUD & BUSINESS RULE API CONTRACTS
// ────────────────────────────────────────────────────────────────────────────

/** Non-mutating-shape CRUD primitives shared by every ApiCrudContract realization. */
export interface CrudBaseContract<T extends Instantiable> {
  create(input: CreateFromInstantiable<T>): Promise<T>
  get(id: Id): Promise<T>
  delete(id: Id): Promise<DeleteResult>
}

/** Scoped update via a client-side ScopedUpdateAdapter (Supabase, IndexedDB). */
export interface AdaptedUpdateContract<T extends Instantiable> {
  update<K extends keyof FromInstantiable<T>>(
    scoped: ScopedUpdateAdapter<T, K>,
    source: ScopedUpdate<T, K>
  ): Promise<T>
}

/** Scoped update with no adapter translation (abstraction-oriented HTTP endpoints). */
export interface DirectUpdateContract<T extends Instantiable> {
  update<K extends keyof FromInstantiable<T>>(source: ScopedUpdate<T, K>): Promise<T>
}

/** Paginated listing. */
export interface CrudListContract<T> {
  list(options?: ListOptions<T>): Promise<ListResult<T>>
}

/** CRUD API contract for adapter-translated backing stores (Supabase, IndexedDB). */
export type ApiCrudContract<T extends Instantiable> =
  & CrudBaseContract<T>
  & AdaptedUpdateContract<T>
  & CrudListContract<T>

/**
 * Every record a list yields, in order; paging is internal.
 * @param client List capability to read.
 * @param query Optional built query; omission uses the client's default order.
 * @returns Records across MAX_LIMIT pages; callers may stop iteration early.
 */
export async function* listAll<T>(
  client: CrudListContract<T>,
  query?: Query<T>
): AsyncGenerator<T> {
  let cursor: string | undefined
  do {
    const page = await client.list({ query, limit: MAX_LIMIT, cursor })
    yield* page.data
    cursor = page.cursor ?? undefined
  } while (cursor !== undefined)
}

/** Business rule API contract. Type parameters default to Dictionary for backward compatibility. */
export interface ApiBusRuleContract<
  TParams extends Dictionary = Dictionary,
  TResult = Dictionary
> {
  run(params: TParams): Promise<TResult>
}

/** Deletion result with timestamp. */
export type DeleteResult = {
  id: Id
  deletedAt: When
}

// ────────────────────────────────────────────────────────────────────────────
// LIST API CONTRACTS
// ────────────────────────────────────────────────────────────────────────────

/** Default pagination limit when not specified. */
export const DEFAULT_LIMIT = 25

/** Maximum allowed pagination limit. */
export const MAX_LIMIT = 100

/** Pagination options for list operations. */
export type ListOptions<T> = { query?: Query<T>; limit?: number; cursor?: string }

/** Paginated list result. */
export type ListResult<T> = { data: T[]; cursor: string | null; hasMore: boolean }

/**
 * Clamp a numeric page limit to 1–MAX_LIMIT, defaulting when omitted.
 * @param limit Requested number of records.
 * @returns Integer page size within the contract's limits.
 */
export const listPageLimit = (limit: number = DEFAULT_LIMIT): number =>
  Number.isNaN(limit) ? DEFAULT_LIMIT : Math.max(1, Math.min(Math.floor(limit), MAX_LIMIT))

/** Resolved list query data, including the default queryless ordering. */
export type ListQuery<T> = Pick<Query<T>, 'where' | 'search' | 'order'>

/** Decoded cursor preserving the issuing store's exact sort value. */
export type ListCursor = {
  issuer: string
  field: string
  direction: QueryDirection
  fingerprint: string
  value: string | number
  id: Id
}

/** Resolve a supplied query or the unfiltered createdAt/id ascending order. */
export const listQuery = <T extends Instantiable>(options?: ListOptions<T>): ListQuery<T> =>
  options?.query ?? { where: {}, order: { field: 'createdAt', direction: 'asc' } }

/** Stable fingerprint independent of object-key insertion order. */
export const listFingerprint = <T>(query: ListQuery<T>): string =>
  JSON.stringify(stableValue({ where: query.where, search: query.search }))

/**
 * Validate a cursor at the untrusted token boundary; absence starts the list.
 * @param token Opaque base64url cursor, or undefined for the first page.
 * @param issuer Store family and resource identity, including the local database when relevant.
 * @param query Resolved criteria, search, and order expected by the current call.
 * @returns Decoded matching cursor; throws ApiError 400 for malformed or mismatched tokens.
 */
export const readListCursor = <T>(
  token: string | undefined,
  issuer: string,
  query: ListQuery<T>
): ListCursor | undefined => {
  if (token === undefined) return undefined
  let input: Dictionary
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(token)) throw new Error('Invalid base64url')
    const bytes = Uint8Array.from(
      atob(token.replaceAll('-', '+').replaceAll('_', '/')),
      char => char.charCodeAt(0)
    )
    input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    if (input === null || typeof input !== 'object' || Array.isArray(input)) {
      throw new Error('Invalid cursor shape')
    }
  } catch {
    throw new ApiError('Malformed list cursor', 400)
  }
  if (
    typeof input.issuer !== 'string' || typeof input.field !== 'string'
    || typeof input.fingerprint !== 'string' || !isId(input.id)
    || !(typeof input.value === 'string'
      || (typeof input.value === 'number' && Number.isFinite(input.value)))
  ) {
    throw new ApiError('Malformed list cursor', 400)
  }
  if (
    input.issuer !== issuer || input.field !== query.order.field
    || input.direction !== query.order.direction || input.fingerprint !== listFingerprint(query)
  ) {
    throw new ApiError('List cursor does not match this store, resource, or query', 400)
  }
  return input as ListCursor
}

/**
 * Encode a store/resource-bound cursor without reformatting the returned sort value.
 * @param issuer Store family and resource identity.
 * @param query Resolved query used to select the page.
 * @param value Exact primary sort value from the last returned row.
 * @param id Last returned row's identity, the secondary sort key.
 * @returns Opaque base64url token for the next page.
 */
export const writeListCursor = <T>(
  issuer: string,
  query: ListQuery<T>,
  value: string | number,
  id: Id
): string => {
  const cursor = {
    issuer,
    field: query.order.field,
    direction: query.order.direction,
    fingerprint: listFingerprint(query),
    value,
    id
  }
  const bytes = new TextEncoder().encode(JSON.stringify(cursor))
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))
    .replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

/**
 * Assemble a page from a store's limit + 1 rows and retain its exact sort value.
 * @param rows Ordered rows already restricted to at most one extra record.
 * @param limit Requested page size.
 * @param issuer Issuing store and resource identity.
 * @param query Resolved query for the page's cursor fingerprint.
 * @param sortValue Read the store-native primary sort value from a row.
 * @param identity Read a row's id, the tie-breaker.
 * @returns The visible rows and an opaque next-page cursor, or null at the end.
 */
export const listPage = <T, Row>(
  rows: readonly Row[],
  limit: number,
  issuer: string,
  query: ListQuery<T>,
  sortValue: (row: Row) => string | number,
  identity: (row: Row) => Id
): ListResult<Row> => {
  const hasMore = rows.length > limit
  const data = rows.slice(0, limit)
  const last = data[data.length - 1]
  return {
    data,
    cursor: hasMore ? writeListCursor(issuer, query, sortValue(last), identity(last)) : null,
    hasMore
  }
}

/**
 * Resolve every named query field and the id tie-breaker against explicit adapter metadata.
 * @param adapter Domain adapter carrying field keys and columns.
 * @param query Resolved query, including the unfiltered default when applicable.
 * @returns Named field metadata; throws ApiError 400 on an unknown field.
 */
export const resolveQueryFields = <T>(
  adapter: Adapter<T>,
  query: Pick<Query<T>, 'where' | 'search' | 'order'>
): Dictionary<AnyFieldAdapter<T>> => {
  const resolved: Dictionary<AnyFieldAdapter<T>> = {}
  const metadata: { [K in keyof T]-?: FieldAdapter<T, K> } = adapter
  const keys = ['id', query.order.field, ...Object.keys(query.where), ...(query.search?.fields ?? [])]
  for (const key of keys) {
    const field = metadata[key as keyof T]
    if (!field || field.key !== key || typeof field.column !== 'string') {
      throw new ApiError(`Unknown query field: ${String(key)}`, 400)
    }
    resolved[key as string] = field
  }
  return resolved
}

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue)
  if (value === null || typeof value !== 'object') return value
  const source = value as Dictionary
  const result: Dictionary = {}
  for (const key of Object.keys(source).sort()) {
    if (source[key] !== undefined) result[key] = stableValue(source[key])
  }
  return result
}
