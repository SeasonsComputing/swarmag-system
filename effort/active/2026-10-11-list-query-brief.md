# List Query — Brief

**Active, not yet dispatched.** Recorded 2026-10-11 from a CA + AI Architect session. A Foundation
evolution of the core list contract, from pagination-only to declared, typed queries. It resolves
the parking-lot entry "Customers query API — status filter & ordering" (parked 2026-07-21), which
deferred the design until a real consumer pinned its requirements. The User picker in
`effort/active/2026-10-08-account-manager-brief.md` is that consumer. It awaits AI Coding Engine
review and the production gate.

## What triggered it

The User picker lists active Users holding given roles. `ListOptions` is `{ limit?, cursor? }`, so
the only way to answer is to load every User and filter in the browser.

## What the repository holds

- **`ListOptions = { limit?: number; cursor?: number }`** and
  **`ListResult<T> = { data: T[]; cursor: number; hasMore: boolean }`** in
  `core/api/api-contract.ts`, unchanged since `a43c3d8` (2026-02-15). `cursor` is an offset.
- **Three list implementations:** `make-supabase-client.ts` filters soft-deleted rows, orders by
  `created_at`, and ranges by offset; `make-indexeddb-client.ts` and `make-http-client.ts` take the
  same two options.
- **List callers:** User Manager and Customer Manager (`limit: 100`, ignoring `hasMore`), and
  `facets-state.ts` (no options).
- **`FieldAdapter<T, K>`** exposes `key` and `fromDomain(value)`. It does not expose its storage
  column; `makeScope` uses it only to project values.
- **`front/api/form-scopes.ts`** hosts the declared write scopes beside `api.ts`.

## Consumers

| Consumer                        | Needs                                                     |
| ------------------------------- | --------------------------------------------------------- |
| User picker                     | Active Users holding any of the given roles               |
| Prospects widget (stories §1.2) | Customers with `status` prospect, oldest first            |
| Sales Ops subject               | Jobs of Customers the session User is account manager for |
| Crew Ops subject                | Jobs the session User is assigned to                      |
| Portal                          | The session User's Customers and their Jobs               |
| Workflow seeding                | Workflows sharing a facet reference with a Service        |
| Managers                        | The whole Collection, paged                               |

The crew and Portal rows are largely answered by RLS: once their policies exist, an unfiltered list
returns only the session User's rows.

## Survey

**ORM libraries.** Fluent query builders (Kysely, Drizzle, PostgREST's client) bind a query to one
backend. Declarative criteria objects (Prisma, Hasura) are typed data keyed by model fields, with a
small operator set per field kind and relation operators for junctions. Local-first stores (RxDB,
Dexie) run one Mango-style query object over several storage engines, evaluating in memory when
needed. The Specification pattern names domain predicates that can be both translated and
evaluated.

**Mature API teams.** Stripe allowlists filters per resource, offers a separate Search API, and
pages by object id. Google's AIP-132/160 standardizes `List(filter, order_by, page_size,
page_token)` with per-resource filterable fields and an opaque page token. GitHub and Linear
generate typed filter inputs from their schemas. Meta's Ent generates a typed predicate per field
and enforces privacy beneath the query.

**Where practice agrees:** criteria are typed data keyed by model fields; the operator set is small
and typed by field kind; filterable fields are declared per resource; pagination is keyset with an
opaque cursor; access scoping is applied beneath the query, never sent by the caller; hard joins
move server-side.

## Decisions (CA, 2026-10-11)

1. **A query is declared by a maker** from adapter fields, as `makeScope` declares a write scope:

   ```ts
   export const queries = {
     Users: {
       byRole: makeQuery({
         filter: [UserAdapter.roles, UserAdapter.status],
         search: [UserAdapter.displayName, UserAdapter.primaryEmail, UserAdapter.phoneNumber],
         order: [UserAdapter.displayName]
       })
     }
   }
   ```

2. **Declarations live in `front/api/queries.ts`,** beside `api.ts` and the scopes. Application code
   never imports adapters (`architecture-core.md` §5.2.6).
3. **`front/api/form-scopes.ts` is renamed `front/api/scopes.ts`.**
4. **Criteria are typed data,** built from the declaration, keyed by domain field, and joined by
   `and`. Operators follow the field kind:

   | Field kind                                    | Operators                      |
   | --------------------------------------------- | ------------------------------ |
   | scalar or const-enum                          | `eq`, `in`                     |
   | `When` or number                              | `eq`, `gt`, `gte`, `lt`, `lte` |
   | string                                        | `contains`                     |
   | `Composition*` of scalars (`roles`, `facets`) | `hasSome`, `hasEvery`          |

   ```ts
   api.Users.list({
     query: queries.Users.byRole.where({ roles: { hasSome: ['sales'] }, status: { eq: 'active' } }),
     order: 'displayName',
     limit: 50
   })
   ```

5. **Text search.** `contains` is a case-insensitive substring match: `ilike` on Supabase, a
   lowercase `includes` in memory, so online and offline return the same rows. Full-text search is
   not used; it cannot be reproduced in IndexedDB.
6. **Search is a declared field set.** One term, matched by `contains` across the declared `search`
   fields, `or`-ed among them and `and`-ed with the other criteria. A query offers search only if it
   declares the fields, and a surface shows a search box only as a considered feature of that
   surface.
7. **The caller chooses the order** from the declared `order` fields, defaulting to the first. `id`
   is always the final tie-breaker.
8. **The cursor is an opaque keyset token.** `ListResult.cursor` becomes `string | null`, encoding
   the last row's sort value and `id`.
9. **`list()` with no query** returns every row, ordered by `createdAt` then `id`, with the keyset
   cursor. Declaring a query only to say "all" is ceremony.
10. **One declaration, every store.** The Supabase client translates criteria to PostgREST; the
    IndexedDB client evaluates them in memory against the same declaration.
11. **`FieldAdapter` exposes its column** as `readonly column: string`, set by `makeAdapter` from
    the metadata it already holds. Only the Supabase client needs it; the IndexedDB client evaluates
    criteria on domain objects after `toDomain`. The column was never hidden by principle: the
    scoped-update brief (`effort/completed/2026-08-29-scoped-update-adapter-brief.md`) added
    `FieldAdapter` at minimum footprint and called column-name encapsulation "only a
    column-name-encapsulation preference". Deriving the column from `fromDomain`'s output was
    rejected as clever rather than explicit (`CONVENTIONS.md` §7.1).
12. **Filterable fields are limited by type.** `makeQuery` accepts only fields whose domain type is
    a scalar, `When`, const-enum, or composition of scalars, enforced through `T[K]`: a field with a
    delegate (`notes`, `sites`) does not compile in a declaration.
13. **Stores receive data, never the declaration.** A declaration's `where(...)` returns plain,
    serializable criteria keyed by domain field. The declaration supplies typing and the allowlist
    when a query is built; each client resolves columns through its own adapter
    (`adapter[field].column`), the IndexedDB client evaluates criteria on domain objects, and the
    HTTP client forwards them unchanged in its JSON body, as it forwards `limit` and `cursor` today.
    `makeCrudHttpClient` has no consumer and no edge endpoint implements `list`. It belongs to
    `core/`, a library intended for other projects, so a maker without a consumer here is expected
    (CA). It dates from the original three-tier architecture with CRUD services on Netlify, and may
    serve this project or a third-party integration.

## What it leaves out, and what that costs

**Access scoping stays in RLS.** Subject narrowing is an ordinary criterion; access is not.
IndexedDB has no RLS: local reads are safe because the deep clone is built server-side under RLS.
A row hidden by RLS is silently absent, so access questions are answered in SQL. Nothing
precluded.

**No joins.** A cross-table read needs SQL, and works offline only if precomputed into the clone.
Many joins compose as two queries through `in`, at the cost of a round trip and URL length for long
lists. Server-side joins are **views exposed as resources**, read-only clients with adapters that
take part in the query contract, not ad-hoc RPCs that return untyped, unpaged results. A relation
field kind remains addable later; preferring views keeps RPCs from accreting first.

**No general `or`.** Same-field alternatives are `in`; cross-field text matching is declared
search. Cross-field `or` otherwise needs two queries or a view. Addable later as
`{ or: [criteria, …] }`.

**Reserved names:** `and`, `or`, `not`, and `search` are reserved in the criteria shape so no domain
field can claim them.

## Scope the production will touch

- `core/api/api-contract.ts`: `ListOptions`, `ListResult`, and the cursor helpers.
- `core/std/make-adapter.ts`: `FieldAdapter.column`.
- `makeQuery` and its types, beside `makeScope`, exported through `@core/stdx`.
- `core/cli/make-supabase-client.ts` and `make-indexeddb-client.ts`: translation and evaluation.
- `front/api/queries.ts` (new) and `front/api/scopes.ts` (renamed), with every importer.
- List callers: both managers and `facets-state.ts`, paging through `hasMore`. This resolves the
  backlog entry "Managers load only the first page of their Collection".
- Tests: translation, in-memory evaluation, keyset paging, and escaping of `%`, `_`, `,`, and
  parentheses in a search term.
- `architecture-core.md` §5.2.1 and §5.2.6, and `architecture-front.md` §2 and §7.4.

## Open

1. **Searching inside compositions** (a Customer's primary contact name, note content) needs JSONB
   paths. Deferred; a view can flatten it when a surface needs it.
2. **Index support.** `ilike '%…%'` uses no ordinary index; a `pg_trgm` GIN index serves a table
   that grows. Added per table when needed, without changing the contract.

_End of Brief_
