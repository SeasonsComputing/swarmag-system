# List Query — Brief

**Active, not yet dispatched.** Recorded 2026-10-11 from a CA + AI Architect session. A Foundation
evolution of the core list contract, from pagination-only to declared, typed queries. It resolves
the parking-lot entry "Customers query API — status filter & ordering" (parked 2026-07-21), which
deferred the design until a real consumer pinned its requirements. The User picker in
`effort/active/2026-10-08-account-manager-brief.md` is that consumer. Reviewed by ACE 2026-10-11;
its findings are resolved below, and its third review found the brief ready for the production
gate.

## What triggered it

The User picker lists active Users holding given roles. `ListOptions` is `{ limit?, cursor? }`, so
the only way to answer is to load every User and filter in the browser.

## What the repository holds

- **`ListOptions = { limit?: number; cursor?: number }`** and
  **`ListResult<T> = { data: T[]; cursor: number; hasMore: boolean }`** in
  `core/api/api-contract.ts`, unchanged since `a43c3d8` (2026-02-15). `cursor` is an offset. The
  file is now `core/std/api-contracts.ts`, exported through `@core/stdx` (Core API Dissolution,
  `f246072`).
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
   | `Composition*` of scalars (`roles`, `facets`) | `hasAny`, `hasAll`             |

   This table is superseded by decision 15.

   ~~`api.Users.list({ query: queries.Users.byRole.where({ … }), order: 'displayName', limit: 50 })`~~
   Superseded by decision 14: the call shape is `build(...)` producing a `Query<T>`.

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
13. **Stores receive data, never the declaration.** ~~A declaration's `where(...)` returns plain,
    serializable criteria keyed by domain field.~~ A declaration's `build(...)` returns a plain,
    serializable `Query<T>` (decision 14). The declaration supplies typing and the allowlist
    when a query is built; each client resolves columns through its own adapter
    (`adapter[field].column`), the IndexedDB client evaluates criteria on domain objects, and the
    HTTP client forwards them unchanged in its JSON body, as it forwards `limit` and `cursor` today.
    `makeCrudHttpClient` has no consumer and no edge endpoint implements `list`. It belongs to
    `core/`, a library intended for other projects, so a maker without a consumer here is expected
    (CA). It dates from the original three-tier architecture with CRUD services on Netlify, and may
    serve this project or a third-party integration.

## ACE review (2026-10-11)

ACE's review found that the decisions above leave the contract underspecified. Its six items, and
where each stands:

1. **How declaration information reaches `list()`.** Resolved by decision 14.
2. **`T[K]` cannot tell `When` from text.** `When` is `string` (`core/std/datetime.ts`), so the
   operator table (decision 4), enforced through `T[K]` (decision 12), cannot give timestamps
   comparisons and text `contains`. Resolved by decision 15.
3. **Ordering and cursor semantics:** permitted order types, direction, null placement, comparison
   across stores, initial and terminal cursors, malformed tokens, and a cursor reused with different
   criteria or order. Resolved by decision 16.
4. **Search parity.** `ILIKE` follows the database locale; JavaScript lowercasing does not reproduce
   it. Bound the guarantee or define normalization. Escaping tests add backslash, quotes, and `*`,
   which PostgREST treats as `%`, exercised through translated requests. Resolved by decision 17.
5. **Composition operators.** `roles` and `facets` are JSONB, not Postgres arrays: `hasAll` is JSONB
   containment, `hasAny` alternatives of singleton containment. Empty `in`, `hasAny`, and `hasAll`,
   and absent optional fields, need defined results. Resolved by decision 18.
6. **Inventory.** Add `make-http-client.ts` (casts `cursor` to `number`), `make-auth-users.ts`
   (its `list` signature), `users-api-test.ts` (passes `cursor: 0`), generated edge copies through
   `deno task edge-sync`, and type-rejection tests for undeclared fields and orders, unsupported
   operators, object compositions, and reserved names, including inputs through typed variables.
   Resolved in the scope below.

### Decisions from the review (CA, 2026-10-11)

14. **A declared query is built into a branded value.** The declaration holds allowlists; `build`
    checks the caller's choices against them and returns plain, serializable data:

    ```ts
    const query = queries.Users.byRole.build({
      where: { roles: { hasAny: ['sales'] }, status: { eq: 'active' } },
      search: 'ada',
      order: { field: 'displayName', direction: 'asc' }
    })
    api.Users.list({ query, limit: 50 })

    type Query<T> = {
      readonly where: Criteria<T>
      readonly search?: { readonly term: string; readonly fields: readonly (keyof T)[] }
      readonly order: { readonly field: keyof T; readonly direction: 'asc' | 'desc' }
      readonly [queryBrand]: true
    }

    type ListOptions<T> = { query?: Query<T>; limit?: number; cursor?: string }
    ```

    - **`build` copies** the declared search fields and the resolved order into the value, so every
      store has what it needs without the declaration. A reference to the declaration by name was
      rejected: it would need a registry (`CONVENTIONS.md` §7.6), and the HTTP client could not
      forward it.
    - **The order resolves in `build`:** the caller's choice from the declared fields, or the first
      declared field ascending. ~~Stores never apply a default.~~ Stores never apply a default to a
      supplied query; a `list()` without one orders by `createdAt` then `id` (decision 9). The
      declaration's `order` list is a non-empty tuple, since its first member is the default.
    - **`build` is the only way to make a `Query<T>`.** A phantom brand, a `unique symbol` property
      that exists only in the type, makes a hand-built value fail to compile. ~~so the allowlist
      cannot be bypassed.~~ Amended 2026-10-11 (second ACE review): `build` enforces the
      declaration at compile time; the value's properties are `readonly`. Spreading a built query
      into a modified copy, or a cast, can still evade it: the brand is a design guard, not a
      security boundary, and RLS bounds what any query can read. It is erased at run time; stores
      and the HTTP body see plain data. The pattern simulates nominal typing in a structural type
      system, the role of Modula-3's `BRANDED`. Criteria are `readonly` throughout, down to
      operator values (third ACE review).
    - **Typing.** `build` is generic over the declaration's field sets; `list(options:
      ListOptions<T>)` is typed by the abstraction, so a `Query<User>` cannot reach
      `api.Customers.list`.
    - **Stores still fail fast** on a field their adapter has no column for (`CONVENTIONS.md` §7.2).

15. **Every string takes comparison operators.** ISO 8601 UTC strings collate chronologically, so
    no field-kind metadata is needed; on text a comparison is an alphabetical range. Comparison and
    text operators supplement `eq` and `in`:

    | Field kind                                          | Operators                     |
    | --------------------------------------------------- | ----------------------------- |
    | any scalar                                          | `eq`, `in`                    |
    | string (including `When` and const-enums) or number | adds `gt`, `gte`, `lt`, `lte` |
    | ~~string~~                                          | ~~adds `contains`~~           |
    | `Composition*` of scalars                           | `hasAny`, `hasAll`            |

    This supersedes decision 4's table. ~~Collation holds only for canonical timestamps, which
    timestamps read from Supabase are not; the canonical When brief establishes them and must ship
    first.~~ Amended 2026-10-11: that brief was withdrawn as heavier than the problem
    (`effort/completed/2026-10-11-canonical-when-brief.md`). Postgres compares timestamp criteria as
    times, whatever their string form. Lexical comparison of `When` matters only in the in-memory
    evaluator, over deep-cloned data, and is settled when the deep clone is built (roadmap §8).

    Amended 2026-10-11 (second ACE review): `contains` is removed as a filter operator. `When` is a
    string, so the table offered `contains` on timestamps, which `ilike` cannot apply to a
    `TIMESTAMPTZ` column. Text matching happens only through a declaration's `search` fields
    (decision 6), which by intent never list a timestamp: one text-matching mechanism, not two.

16. **Ordering and cursors.**
    - **Order fields are required scalars:** string (including `When` and const-enums) or number,
      and not optional, enforced through `T[K]`. Nulls never need ordering, so the next-page
      condition stays ~~`value > v OR (value = v AND id > i)` in every store and direction~~
      `value > v OR (value = v AND id > i)` ascending and `value < v OR (value = v AND id < i)`
      descending, in every store.
    - **Direction** is `asc` or `desc`, set in `build`; the `id` tie-breaker follows it.
    - ~~**Ordering is consistent within a store.** Timestamps and numbers order identically in
      every store. Text may differ between stores in case and accents: Postgres orders by the
      database collation, JavaScript by code point. Identical text order (a `"C"` collation, or a
      shared ordering rule) was weighed and not adopted.~~ Amended 2026-10-11: the premise was
      wrong. Stage's collation is ICU `en_US.UTF-8`, and browsers implement `Intl.Collator` with
      ICU, so the in-memory evaluator can match it at no cost.
    - ~~**Text orders by ICU `en-US` in every store.** Postgres orders by the database's ICU
      collation; the in-memory evaluator orders and compares cursors with
      `new Intl.Collator('en-US')`. Timestamps and numbers order identically everywhere.
      Differences can remain only where ICU versions disagree, at edge cases outside English and
      Spanish names.~~ Amended 2026-10-11 (second ACE review): `Intl.Collator` can return zero
      for distinct strings where Postgres would not, and the universal timestamp claim contradicted
      decision 15's deferral.
    - **Ordering and paging are consistent within each store; no parity between stores is
      promised.** The local store serves only the Ops runner, whose users never see Admin's lists
      beside it (CA). Postgres orders by its collation. The in-memory evaluator orders text with
      `new Intl.Collator('en-US')` for natural dictionary order, uses that one comparator for both
      sorting and cursor comparison, and breaks every tie, including collator ties, by `id`.
    - **The cursor is an opaque token,** base64url-encoded JSON holding the last row's sort value,
      exactly as the store returned it (never reformatted, so a store compares it against its own
      value exactly), and `id`, the order field and direction, and a fingerprint of the query's
      `where` and `search`. A cursor is valid only in the store that issued it, so it also names its
      issuing store and resource; the fingerprint alone cannot tell apart stores running the same
      query (third ACE review).
    - **No cursor is the first page.** The last page returns `cursor: null` and `hasMore: false`.
      Stores fetch `limit + 1` rows to determine `hasMore`.
    - **A malformed cursor throws** `ApiError` 400 (`CONVENTIONS.md` §7.2); it is never read as the
      first page.
    - **A cursor reused with a different query throws** `ApiError` 400 when its order field,
      direction, or fingerprint disagrees, so a screen that changes a filter but keeps its cursor
      fails loudly.

17. **Search behaves the same in every store, within stated bounds.** Checked on stage: `ILIKE`
    matches `JOSÉ` to `José` and `PEÑA` to `Peña`, and does not match `Jose` to `José`.
    - **Search is case-insensitive and accent-sensitive.** ~~`contains` is~~ Supabase uses `ilike` on
      `%term%`; the in-memory evaluator compares `toLocaleLowerCase('en-US')` of both sides. Both
      fold case the same way for Latin scripts, and neither ignores accents.
    - **`build` trims the term and normalizes it to Unicode NFC.** An empty term after trimming is
      no search. Stored text is assumed NFC; this is an assumption, not a guarantee, and neither
      store normalizes stored values.
    - **`build` removes `*` from the term.** PostgREST rewrites every `*` in a `like` pattern to `%`
      and offers no escape, so a literal star cannot be matched online; removing it keeps both stores
      in agreement (CA, second ACE review). The empty-term check runs after removal, trimming, and
      normalization, so `'*'` or `'* *'` is no search (third ACE review).
    - **Bounds.** Special casings (German `ß`, Turkish dotless `i`) may differ between stores.
      Accent-insensitive search is not offered.
    - **Escaping is the translator's job and is proven through real requests.** The Supabase client
      escapes `%`, `_`, and `\` for `ilike`, and quotes values inside PostgREST's `or=(…)` (commas,
      parentheses, double quotes, backslashes). ~~PostgREST rewrites `*` to `%` in `like` patterns:
      whether a literal `*` can be escaped is verified against the PostgREST documentation during
      production; if it cannot, `*` in a term matches anything, and that bound is recorded.~~ LIKE
      escaping applies first, then PostgREST quoting of the complete operand, then one URL encoding.
      Generated `or` groups (from `hasAny`, search, and the cursor) are joined by `and`; none
      replaces another. ~~Tests run the translated request against the database for each character
      named here, and for combinations of `or` groups.~~ Tests assert the constructed request as
      text for each character named here and for combined `or` groups; Postgres's handling is
      verified in the app (Verification).

18. **Set operators and absent values.**
    - **An empty set does not compile.** `in`, `hasAny`, and `hasAll` take a non-empty tuple
      type, declared within the query module's own criteria types; nothing existing in `core/std`
      changes, and there is no run-time check. A caller holding a run-time selection proves it
      non-empty before passing it, or omits the criterion to mean no filter.
    - **An absent optional value matches no operator,** as in Postgres; the in-memory evaluator
      matches that. Compositions are never absent (`domain-model.md` §3.3.1). Filtering for
      absence is not offered; it can be added as an explicit operator when a surface needs it.
    - **JSONB translation.** `hasAll` is containment (`roles=cs.["a","b"]`); `hasAny` is a
      generated `or` of single-element containments (`or=(roles.cs.["a"],roles.cs.["b"])`), an
      internal `or` no caller writes.

## Second ACE review (2026-10-11)

ACE's re-review found decisions 14–18 closer but not ready. Its corrections are applied in place
above, each marked:

- **Corrections:** the descending next-page predicate; the universal timestamp-order claim, which
  contradicted decision 15; the default order applying only to a supplied query, with a non-empty
  `order` declaration; LIKE escaping before PostgREST quoting, and combined `or` groups joined by
  `and`; the stored-NFC assumption stated as one; and the scope and verification gaps.
- **Decisions (CA):**
  - **The brand** guards the design at compile time with `readonly` properties; it is not an
    unbypassable guarantee (decision 14).
  - **`contains` is removed** as a filter operator; text matching is declared search only
    (decision 15).
  - **No parity between stores is promised.** Ordering and paging are consistent within each store;
    the local store serves only the Ops runner (decision 16).
  - **`build` removes `*`** from a search term, since PostgREST cannot escape it (decision 17).

## Third ACE review (2026-10-11)

ACE found the brief ready for the Foundation production gate, with no further CA decision. Its three
implementation details are recorded in decisions 14, 16, and 17: criteria `readonly` throughout, the
cursor naming its issuing store and resource, and the empty-term check after `*` removal and
normalization.

## Production review (CA + AI Architect, 2026-10-11)

Corrections to the production, for the AI Coding Engine to apply before closing.

1. **Collections are read through an iterator, not a copied loop.** The production repeated the
   same `while (hasMore)` loop in User Manager, Customer Manager, and `facets-state.ts`, against
   the backlog entry it resolves ("The fix belongs in one place both managers use, not duplicated
   per manager"). In its place, `core/std/api-contracts.ts`, beside `CrudListContract`, exports:

   ```ts
   /** Every record a list yields, in order; paging is internal. */
   export async function* listAll<T>(client: CrudListContract<T>, query?: Query<T>): AsyncGenerator<T>
   ```

   - The consumer supplies a query and receives records. Pages, cursors, and page size are the
     iterator's: it pages at `MAX_LIMIT` and follows the keyset cursor until it is `null`.
   - The three consumers read `Array.fromAsync(listAll(api.Users))` and the like; a consumer that
     needs only the first matches iterates with `for await` and stops.
   - Not a `CrudListContract` method: every implementation would then carry it, the duplication
     this removes.

2. **The Supabase client leverages the SDK's filter makers.** The production joined every
   condition into one string, wrapped it as `and(…)`, and passed it through `.or(…)`: correct, but
   it reads as the opposite of its meaning (`CONVENTIONS.md` §7.1).
   - Plain conditions use the SDK's targeted filters: `.eq`, `.in`, `.gt`, `.gte`, `.lt`, `.lte`,
     and `.contains` for `hasAll`. A JSONB column takes containment as a JSON string
     (`.contains(column, JSON.stringify(values))`); an array argument would be sent as a Postgres
     array literal.
   - Only the generated alternatives are `or` groups, each its own `.or(…)` call: `hasAny`,
     search, and the cursor. PostgREST ANDs separate parameters, so no outer wrapper is needed.
     These expressions still carry the quoting and LIKE escaping of decision 17.
   - For database-free tests, request construction returns the ordered filter operations
     (`{ method: 'eq', column, value }`, `{ method: 'or', expression }`), which `list` applies to
     the builder and tests assert on.

3. **Values in `or` expressions are quoted as PostgREST specifies, not as JSON.** The production
   quoted with `JSON.stringify(String(value))`, which also escapes control characters (`\n`, `\t`,
   `\u0000`); PostgREST reads a backslash and character as that character, so the value arrives
   altered. A cursor value is read from the database and can contain such characters. One function
   replaces it: escape `\` and `"` with a backslash, then wrap in double quotes. Tests include a
   newline and a tab in a search term and in a cursor value.

4. **The `make-supabase-client.ts` header correction stands.** The production replaced two
   nonexistent spec types in the header's PUBLIC list (`RpcSupabaseSpecification`,
   `EdgeSupabaseSpecification`) with the real `BusRuleSupabaseSpecification`, outside scope and
   unreported. The file was already in scope and the correction is accurate, so it is kept; the
   production report names it. The PUBLIC description column is realigned after correction 2
   reshapes the list-request exports.

5. **`make-query.ts` states the grammar once, as a union, and names its operator families.**
   - **The operators are the query's grammar,** stated once as a union:
     `QueryOperator = 'eq' | 'in' | 'gt' | 'gte' | 'lt' | 'lte' | 'hasAny' | 'hasAll'`. The
     production spelled them only as property names, in three places nothing kept in step: the
     types and both stores' `switch` statements. No const-enum tuple: nothing validates operators at
     run time (`CONVENTIONS.md` §8.2). A store receives a `Query<T>` made by `build`; its operator
     keys arrive as strings only because `Object.entries` widens them.
   - **Each store iterates criteria with keys typed as `QueryOperator`** and switches exhaustively,
     with no `default: throw` (§8.4). An operator added to the grammar fails to compile in every
     store that does not handle it.
   - **The operator families are named types** keyed from `QueryOperator` (§8.3, §8.4):
     `ScalarOperators` (`eq`, `in`), `RangeOperators` (adds `gt`, `gte`, `lt`, `lte`) for strings
     and numbers, and `SetOperators` (`hasAny`, `hasAll`) for compositions of scalars.
     `QueryOperators` chooses among them, replacing nested conditionals that typed range operators
     as `never` for booleans.
   - **`QueryDirection` is a plain union, `'asc' | 'desc'`.** It needs no run-time check:
     `readListCursor` requires the cursor's direction to equal the query's, so its
     `QUERY_DIRECTIONS.includes` check was redundant and goes. `api-contracts.ts` then imports only
     types from `make-query.ts`.
   - **Two comments say why:** `ExactCriteria` exists because excess-property checks apply only to
     literals, and the queries must also fail through typed variables; the one cast,
     `as unknown as Query<T>`, is the brand's construction.
6. **One helper resolves a query's fields against an adapter.** The Supabase client checked fields
   lazily (`queryColumn`), the IndexedDB client up front (`checkQueryFields`), with the same 400.
   One helper beside `FieldAdapter` resolves every field a query names, failing fast; Supabase reads
   `.column` from the result.
7. **One helper assembles a page.** Both clients fetched `limit + 1` rows, set `hasMore`, sliced,
   and wrote the cursor from the last row. A helper in `api-contracts.ts`, beside the cursor format,
   takes the rows, limit, issuer, query, and how to read a row's sort value and `id`.
8. **The IndexedDB `list` reads as named steps.** Its 40-line block becomes a short pipeline:
   `matchesQuery`, `compareRows`, `afterCursor`, then the page helper of correction 7. The operator
   logic remains written once per store: translation and evaluation are two implementations of one
   contract, not duplication.

9. **The page limit is clamped as a number.** `listPageLimitValue(value?: string)` parses text, a
   holdover from query-string paging; the clients converted a typed `number` to a string to call it.
   It becomes `listPageLimit(limit?: number): number`, clamping to 1–`MAX_LIMIT` and defaulting to
   `DEFAULT_LIMIT`, with no parsing.

10. **`resolveQueryFields` moves to `api-contracts.ts`, beside `listPage`.** Correction 6 said
    "beside `FieldAdapter`", and the helper landed in `make-adapter.ts`, which then imported
    `ApiError` and `Query`. That formed import cycles in `core/std`
    (`make-adapter` ↔ `api-contracts`, `make-adapter` ↔ `make-query`), type-only but real, where
    the brief said none would form. It also put query resolution in an adapter, whose job is
    serialization alone (`architecture-core.md` §10.1.3). In `api-contracts.ts`, which already
    depends on both, `make-adapter.ts` again imports only `adt` and `instance`, and `std` is
    acyclic. The IndexedDB client calls it only to fail fast; that call carries a short comment
    saying so.
11. **Operator families are plain named properties.** Correction 5 said "keyed from
    `QueryOperator`", and the families became mapped types over `Extract<QueryOperator, …>` with
    conditionals. They state their operators directly: `ScalarOperators<V>` is
    `{ readonly eq?: V; readonly in?: QuerySet<V> }`, and likewise for `RangeOperators` and
    `SetOperators`. The grammar stays enforced where it matters, by the stores' exhaustive
    `switch` over the `QueryOperator` union.

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

- `core/std/api-contracts.ts`: `ListOptions<T>`, `ListResult`, the cursor helpers, and
  `CrudListContract<T>`, whose `list` takes `ListOptions<T>` in every implementation.
- `core/std/make-adapter.ts`: `FieldAdapter.column`.
- `core/std/make-query.ts` (new), beside `make-scope.ts`: `makeQuery`, `build`, the branded
  `Query<T>`, and the criteria types, exported through `@core/stdx`. `api-contracts.ts` imports
  `Query<T>` from `./make-query.ts` for `ListOptions<T>`; `make-query.ts` imports `FieldAdapter`
  from `./make-adapter.ts`. Neither imports the other's barrel, so no cycle forms.
- Every list implementation:
  - `core/cli/make-supabase-client.ts`: translation, escaping, and keyset paging.
  - `core/cli/make-indexeddb-client.ts`: in-memory evaluation, the ICU `en-US` collator, and keyset
    paging.
  - `core/cli/make-http-client.ts`: forwards the query; its response `cursor` is no longer cast to
    `number`.
  - `front/api/make-auth-users.ts`: its `list` signature takes `ListOptions<User>`.
- `front/api/queries.ts` (new) and `front/api/scopes.ts` (renamed), with every importer.
- List callers: both managers and `facets-state.ts`, paging through `hasMore`. This resolves the
  backlog entry "Managers load only the first page of their Collection".
- Generated edge copies, through `deno task edge-sync`.
- Tests:
  - translation, in-memory evaluation, and keyset paging, including a reused or malformed cursor;
  - search escaping of `%`, `_`, `\`, `*`, quotes, commas, and parentheses, asserted on the
    Supabase request as constructed, without a database;
  - `build`: term trimming and NFC normalization;
  - compile-time rejection of an undeclared filter or order field, an operator the field's type
    does not allow, a filter on a composition of objects, a reserved name (`and`, `or`, `not`,
    `search`), and an empty set, each written inline and through a typed variable;
  - descending paging and ties; a cursor carrying a raw sub-millisecond timestamp; a reused, malformed,
    or foreign-store cursor; fingerprints stable across key insertion order and for an unqueried
    list;
  - `hasAny`, search, and cursor `or` groups combined in one request;
  - compile-time rejection of an empty `order` declaration and of mutating a built query;
  - `users-api-test.ts` omits its initial cursor, which was `cursor: 0`.
- `architecture-core.md` §5.2.1 and §5.2.6, and `architecture-front.md` §2, §7.2.3 (its
  unparameterized `ListOptions`), §7.4, and §10.1.6 (its `form-scopes.ts`).

## Verification

`deno task check`, `deno task fmt:check`, and the full `deno task test` suite; generated edge
copies verified after `deno task edge-sync`; a `STYLE_AUDIT` of changed code and headers.

**No automated test needs a database** (CA, 2026-10-11, at the production gate). Stage is the only
environment, no configured test runs routinely, and test writes would leave soft-deleted rows there
(backlog: "The shared test configuration cannot bootstrap `api`"). The Supabase client exposes its
request construction only as far as testing it requires. Postgres's behavior is verified by the CA in
the app, against a checklist the production report supplies, covering at least: search containing
`%` and `_`; paging past the first page of Users; descending order; the role filter; and a stale
cursor rejected after a filter change.

## Open

1. **Searching inside compositions** (a Customer's primary contact name, note content) needs JSONB
   paths. Deferred; a view can flatten it when a surface needs it.
2. **Index support.** `ilike '%…%'` uses no ordinary index; a `pg_trgm` GIN index serves a table
   that grows. Added per table when needed, without changing the contract.

_End of Brief_
