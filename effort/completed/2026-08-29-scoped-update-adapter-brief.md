# Scoped Update Adapters — Backlog Brief

**CLOSED 2026-08-31.** Shipped, reviewed by ACE, and independently re-verified. Originally
captured at the close of a session that shipped the Index/Detail shell foundation (wizard
drill navigation, `PanelHeaderTitle`, `CollectionPanel` styling) and, in review of that work,
found a real data-loss bug this brief exists to prevent as a class, not just patch once.

## The incident that surfaced this

`onboarding.tsx`'s `stageCustomer.commit` builds one `CustomerCreate` object reused for both
create and update, including `sites: state.customer()?.sites ?? []`. `state.customer()` is
only ever refreshed by `stageCustomer.commit` itself — nothing on the Job Sites stage updates
it — so it's a stale snapshot, `[]` from first creation, forever. Every time a user revisits
"Customer address" after adding a job site and clicks Next again, this re-commits and
overwrites the server's `sites` column with that stale `[]`, silently discarding any site
added since. If the user finishes the wizard normally, `stageSites.commit` resubmits the real
`state.sites()` at Finish and self-corrects — but abandon or crash the tab between the two
commits and the site is gone with no error surfaced.

The narrow fix (omit `sites` from the object passed to the update call, verified end to end —
`make-supabase-client.ts`'s `update()` only sends keys present on the patch object, and
`makeAdapter`'s `fromDomain` only visits `Object.keys(source)`, so an omitted key never
reaches the database) would close this one instance. This brief is the deeper fix: make the
mistake unconstructable, not just corrected.

## Why this happened, precisely

Two different things both get spelled `key?: Type` on `CustomerUpdate`
(`UpdateFromInstantiable<T>` → `Clearable<FromInstantiable<T>>`), and the type system doesn't
distinguish them:

- **Domain-optional attribute** — the abstraction itself can legitimately lack this value
  (`Customer.line2`, no unit/suite). A fact about the entity.
- **Dirty-column update omission** — a persistence-protocol concept, unrelated to whether the
  field can ever be absent on the entity. `sites` is required on `Customer`, always a real
  array — but a given PATCH might not be touching it, because the screen doing the editing has
  nothing to do with sites.

`sites` being "optional" on `CustomerUpdate` reads, at a glance, like the first case — as
though a fallback value should be supplied. It's actually the second — the correct move was to
omit it entirely, never provide a stand-in. Nothing in the type signature tells a caller which
situation it's in. That's institutional knowledge the type erases, and it's exactly the kind of
thing a human forgets under a full evening of shell/CSS work.

## The design

Declare, per form, the exact write-surface that form is authorized to persist — not inferred
from `Object.keys()` at runtime, not caught by review, unconstructable at compile time.

**`domain/*` and `core/*` are strict scrutiny — minimize the footprint there.** There are two
foundation-level changes total, both additive, both in `core/std`: this one — making
`makeAdapter`'s return shape field-addressable — and the universal `ScopedUpdate<T,K>` type in
`core/std/protocols.ts` (below, shared by both Customer's and User's realizations). Nothing in
`domain/*` changes for either.

```ts
// core/std/make-adapter.ts

export type FieldAdapter<T, K extends keyof T> = {
  readonly key: K
  fromDomain: (value: T[K]) => Dictionary
}

export type Adapter<T> =
  & { toDomain(source: Dictionary): T; fromDomain(patch: AdapterPatch<T>): Dictionary }
  & { [K in keyof T]: FieldAdapter<T, K> }

// makeAdapter's construction is otherwise unchanged — each metadata entry also
// becomes an addressable FieldAdapter on the returned object.
```

```ts
// core/std/make-adapter.ts — generic composition helper, alongside makeAdapter

export function makeScopedUpdate<T, F extends FieldAdapter<T, keyof T>>(
  fields: readonly F[]
): ScopedUpdateAdapter<T, F['key']> {
  return {
    fromDomain: patch => {
      const record: Dictionary = {}
      for (const f of fields) if (f.key in patch) Object.assign(record, f.fromDomain(patch[f.key]!))
      return record
    }
  }
}
```

**`domain/adapters/customer-adapter.ts` does not change at all** — it keeps calling
`makeAdapter<Customer>({...})` exactly as today and inherits field-addressability for free.

**The scoped adapter is declared where the form lives**, not in `domain/`:

```ts
// onboarding.tsx

const CustomerAddressUpdateAdapter = makeScopedUpdate([
  CustomerAdapter.name,
  CustomerAdapter.status,
  CustomerAdapter.primaryContact,
  CustomerAdapter.line1,
  CustomerAdapter.line2,
  CustomerAdapter.city,
  CustomerAdapter.state,
  CustomerAdapter.postalCode,
  CustomerAdapter.country
])

const CustomerSitesUpdateAdapter = makeScopedUpdate([CustomerAdapter.sites])
```

`stageCustomer.commit` would call `api.Customers.updateScoped(customer.id,
CustomerAddressUpdateAdapter, {...address fields...})` — `sites` isn't a key that type-checks
in that call at all. Not a discipline reminder, a compile error.

## Why two independently declared lists (form fields, adapter scope) — not one derived from the other

Raised and rejected during the same conversation: deriving the adapter's key-set from the
form's field list (or vice versa) looks like it prevents drift, but it re-introduces exactly
the coupling `Clearable<T>`'s per-field optionality exists to avoid. The reason update payloads
are optional-per-field in the first place is so a new column added to the domain model doesn't
retroactively break every existing caller that has nothing to do with it. Deriving one
declaration from the other would make the same class of ripple possible one layer up: evolving
one form/adapter pair could unintentionally affect another. Two independently declared lists
that are expected to agree — each maintained where it belongs (the adapter's scope where the
domain field is, the form's fields where the UI is) — is what lets `stageContact`,
`stageCustomer`, and `stageSites` keep operating unchanged when the schema grows somewhere
else. This isn't a gap to close; it's the same decoupling principle one level up.

## Client layer addition

```ts
// core/client/make-supabase-client.ts

async updateScoped<K extends keyof T>(
  id: Id,
  scoped: ScopedUpdateAdapter<T, K>,
  patch: Pick<AdapterPatch<T>, K>
): Promise<T> {
  const record = scoped.fromDomain(patch)
  const { data, error } = await Supabase.client()
    .from(table).update({ ...record, updated_at: when() })
    .eq('id', id).is('deleted_at', null).select().single()
  checkApiError(error, 'Failed to update record', Supabase.errorToStatus)
  return adapter.toDomain(data)
}
```

## The universal type, and User Manager's realization

`ScopedUpdateAdapter`/`makeScopedUpdate` above are the _composition_ mechanism — building a
Supabase column dictionary from a declared set of `FieldAdapter`s. That's specific to the
plain-table CRUD path (`makeCrudSupabaseClient`), because it exists to do the client-side
`fromDomain` translation `Customers` needs. It doesn't apply to `Users`, whose writes go through
`makeAuthUsers()` — a composed wrapper delegating to privileged edge functions
(`user-create`/`user-update`), never calling `adapter.fromDomain` or writing to a Supabase table
directly. The edge function does its own server-side mapping; there's nothing client-side to
compose.

What _is_ universal, and belongs in `core/std/protocols.ts` alongside `Clearable` rather than in
`make-adapter.ts`, is the type-level shape of a declared scope, independent of how it eventually
gets persisted:

```ts
// core/std/protocols.ts

/** Update payload restricted to a declared field set — required within scope, still
    nullable only where the domain field was already optional. */
export type ScopedUpdate<T extends Instantiable, K extends keyof FromInstantiable<T>> =
  & Pick<T, 'id'>
  & {
    [P in K]: undefined extends FromInstantiable<T>[P] ? FromInstantiable<T>[P] | null
      : FromInstantiable<T>[P]
  }
```

This keeps `Clearable`'s value-nullability rule (null only if the field was already
domain-optional) but drops key-optionality for anything inside `K` — declaring a scope is a
commitment to supply everything in it, not just permission to touch it if convenient. That
matters even for a scope covering every field: it's a strictly stronger guarantee than
`UpdateFromInstantiable<T>`, which permits any field to be omitted because it has to support
_any_ caller touching _any_ subset.

**Customer's realization** composes `ScopedUpdate` through `makeScopedUpdate`'s `FieldAdapter`
selection into an actual Supabase patch — the mechanism above, unchanged.

**User's realization needs no composition at all.** `UserEditor.userDraft()` already builds
every field, unconditionally, on every save — there's no omission logic in it today. So
`AuthUsersContract.update`'s signature just narrows from `UpdateFromInstantiable<User>` (permits
partial, never exercised) to `ScopedUpdate<User, AllUserKeys>` (requires everything the one real
caller already guarantees), with `AllUserKeys` derived from `UserAdapter`'s own key-set — no new
field enumeration for the full-record case. No adapter composition, no dictionary building, no
runtime behavior change: just a tighter type at the exact seam where `checkValidatorError`
already stands guard, before the edge dispatch:

```ts
// make-auth-users.ts — same seam, tighter type, same runtime shape, inside the
// returned AuthUsersContract object

const scopedUpdate = (input: ScopedUpdate<User, AllUserKeys>): Promise<User> => {
  checkValidatorError(validateUserUpdate(input))
  return update.run(input as Dictionary)
}
```

If a second User-editing surface is ever built scoped to fewer fields, it gets its own
`ScopedUpdate<User, K>` narrower than `AllUserKeys` — the same pattern COW already needs today,
just not yet exercised on the User side.

## Decided (2026-08-30)

- **Naming, amended post-production (2026-08-31):** `FieldAdapter`, `makeScopedUpdate`,
  `ScopedUpdateAdapter` are final as written above. `updateScoped` is not — during review it
  became clear `ApiCrudContract<T>`'s original loose `update(input: UpdateFromInstantiable<T>)`
  had zero remaining callers once Customer's retrofit landed, and `Users` had already proven the
  better shape by tightening `update` itself in place rather than adding a parallel method. So
  `updateScoped` was collapsed into `update` — one required-scope method per contract, no
  looser escape hatch sitting unused in the foundation. Every `updateScoped` reference in this
  brief's code samples below is now `update`; not rewritten in place to preserve the reasoning
  trail, but the actual shipped signature is `update<K>(id, scoped, patch)` everywhere,
  including on `ApiCrudContract<T>` itself.
- **Retrofit scope is User Manager and Customer Onboarding Wizard. Full stop, nothing else.**
  Not a narrowed subset of a larger candidate list — these two are the proving ground. The
  strategy is deliberate: lock the mechanism against these two real surfaces first; a broader
  rollout is its own future production, authorized separately, only once this one proves the
  mechanism holds.
- **Standing SOP, effective now, independent of retrofit scope:** every new form designed in
  the system must consider its own update scope as a matter of course — the same way D6 made
  validators non-optional rather than a nice-to-have. This binds new design work immediately;
  it does not retroactively obligate touching any form beyond the two named above.
- The narrow interim fix (omit `sites` from `stageCustomer.commit`'s update object) is
  superseded, not needed as a separate stopgap — the COW retrofit below ships the real fix
  directly.
- `Users` is a composed wrapper (`makeAuthUsers()`, delegating to privileged edge functions),
  not a plain `makeCrudSupabaseClient` the way `Customers` is. Its retrofit is a signature
  tightening at `make-auth-users.ts`'s existing validation seam — `ScopedUpdate<User,
  AllUserKeys>` in place of `UpdateFromInstantiable<User>` — not a copy of Customer's
  `makeScopedUpdate` composition path. No adapter/dictionary machinery involved.

## Closing tasks

- Refresh `documentation/architecture/architecture-core.md` with the data-binding throughline
  this closes: adapters translate, validators judge (D6, shipped), write-scope is declared not
  inferred (this brief). State the SOP rule above as binding, not just describe the mechanism
  as available.
  **Also state why, not just what:** shell (Index-Detail/Sequence navigation, `PanelHeaderTitle`,
  `CollectionPanel`) and arch (D6 + this brief) together are the foundation. Customer Onboarding
  Wizard and User Manager are not just features that happen to exercise it — they are the
  reference implementations, one per backing-store shape (plain-table CRUD, edge-function-
  mediated CRUD). Once both are genuinely correct, the remaining ~80% of the app (Assets,
  Chemicals, Jobs, Services, Workflows — all currently commented out in `api.ts`, not yet built)
  is meant to be stamped out from these two references by future agentic production, not
  re-discovered from scratch each time. Complement, not restatement, of the "prove at a higher
  layer before promoting to foundation" principle (2026-08-30, HelmWidget retrospective): that
  one is about discipline while building the foundation; this is about the foundation's purpose
  once proven.
- Protect the still-open task to update `documentation/ux/ux-design-archetypes.md` with the
  Index-Detail and Decomposition-Sequence reusable principles from the 2026-08-29 session — a
  different topic, parked here only so it has a home and doesn't fall through the cracks
  alongside this one.

## Amended (2026-08-31): interface decomposition + id-in-source

Production shipped and was reviewed (`core/api/api-contract.ts`, all three client makers,
`make-auth-users.ts`, call sites, tests). Two loose ends surfaced in that review, both pure
type/call-shape cleanup with no runtime behavior change:

- **`ApiCrudContract<T>` is one flat interface; `CrudHttpContract<T>` and `AuthUsersContract`
  each work around it via `Omit<ApiCrudContract<T>, 'update'> & {override}`.** Decompose into
  named capability interfaces instead: `IBase<T>` (`create`, `get`, `delete`), `IMutateAdapted<T>`
  (`update(scoped: ScopedUpdateAdapter<T,K>, source: ScopedUpdate<T,K>): Promise<T>` —
  Supabase/IndexedDB), `IMutateDirect<T>` (`update(source: ScopedUpdate<T,K>): Promise<T>` —
  HTTP), `IMutateFixed<T,K>` (same signature, `K` pinned at the interface level — Users), and
  `IQueryBasic<T>` (`list`). `ApiCrudContract<T>` becomes `IBase<T> & IMutateAdapted<T> &
  IQueryBasic<T>` — same name, same resolved shape, so `make-supabase-client.ts` and
  `make-indexeddb-client.ts` need no edits beyond the id-folding below. `CrudHttpContract<T>`
  becomes `IBase<T> & IMutateDirect<T> & IQueryBasic<T>`; `AuthUsersContract` becomes `IBase<User>
  & IMutateFixed<User, AllUserKeys> & IQueryBasic<User> & { eject, hasAccess }`. Neither
  workaround-`Omit` pattern survives.
- **Every `update` currently takes `id` as a separate parameter and reassembles `{id, ...patch}`
  at the top of the function body.** `ScopedUpdate<T,K>` already carries `id` via `Pick<T,'id'>`,
  so the split is dead reassembly, not logic. Fold `id` into `source` everywhere: drop the `id:
  Id` parameter and the `Omit<ScopedUpdate<T,K>,'id'>` patch type from all three client makers
  and `make-auth-users.ts`. Update the two call sites that currently pass `id` separately —
  `onboarding.tsx`'s two `Customers.update(id, scoped, {...})` calls and `make-auth-users.ts`'s
  own `update.run(input)` construction — to pass `id` inside the source object instead.

`make-adapter-test.ts` and `users-api-test.ts` need matching signature updates. Nothing here
changes what any maker does at runtime — only how the shape is named and how `id` travels.

**Renamed post-production (2026-08-31):** the `I`-prefixed names above (`IBase`, `IMutateAdapted`,
`IMutateDirect`, `IMutateFixed`, `IQueryBasic`) were conversational shorthand, not a considered
naming choice — no interface anywhere in this codebase carries Hungarian decoration, and slipping
one in via `core/` would have been a silent new convention. Shipped names are unprefixed and
match how `DeleteResult`/`ListResult` already sit alongside `ApiCrudContract` in the same file:
`CrudBase<T>`, `AdaptedUpdate<T>`, `DirectUpdate<T>`, `PinnedUpdate<T,K>`, `CrudList<T>`. Two
went through a second pass. `FixedUpdate` read as "corrected" in a codebase full of bug-fix
language, not "K pinned at the interface level"; `PinnedUpdate` says the actual fact with no
competing meaning. `CrudQuery` invented vocabulary this file doesn't use — `ListOptions`,
`ListResult`, and the method itself all say "List," and "Query" was squatting on the name a
future richer query capability (filter/sort/search beyond pagination) would actually want when
it exists; `CrudList` matches the existing lexicon and leaves "Query" free. None of the five
gained a `Contract` suffix — that suffix is reserved in this codebase for a complete, mounted
API surface some maker actually returns and some caller actually holds (`ApiCrudContract`,
`CrudHttpContract`, `AuthUsersContract`, `ApiBusRuleContract`); these five are composable
fragments nobody holds bare, the same category `Validator<T>` and `Adapter<T>` already occupy
unsuffixed. Not rewritten above to preserve the reasoning trail; the shipped code uses the
renamed forms throughout.

**Reopened and re-decided (2026-08-31):** the no-`Contract`-suffix argument above rested on a
false precedent — `Adapter<T>` is held bare as a typed field (`CrudSupabaseSpecification.adapter:
Adapter<T>`), contradicting the claimed "fragments are never held bare" test. The real risk is
narrower and did survive: `AdaptedUpdate<T>`/`DirectUpdate<T>`/`PinnedUpdate<T,K>` sit in the same
file as `ScopedUpdate<T,K>`, a plain payload shape, not an interface — a name ending in `Update`
doesn't say by itself which kind of thing it is. Decided in favor of the suffix: `CrudBaseContract<T>`,
`AdaptedUpdateContract<T>`, `DirectUpdateContract<T>`, `PinnedUpdateContract<T,K>`,
`CrudListContract<T>`. `ApiCrudContract<T>` and `CrudHttpContract<T>`'s composition lines now
exceed the 105-char single-line budget and format as multiline `&`-per-line, matching the style
`AuthUsersContract` already used. Shipped code uses the `Contract`-suffixed forms throughout.

## Sequencing (CONSTITUTION §8 — documentation leads code)

Design is settled. Next step is a production-gate scope statement for the code itself:
`core/std/protocols.ts` (`ScopedUpdate<T,K>`, shared by both realizations),
`core/std/make-adapter.ts` and `core/client/make-supabase-client.ts` (Customer's composition
path + the COW retrofit), and `make-auth-users.ts` (User's signature-only retrofit) — not more
planning.

**2026-08-31 addendum:** plus the interface-decomposition + id-in-source scope above —
`core/api/api-contract.ts`, `core/client/make-supabase-client.ts`, `core/client/make-indexeddb-
client.ts`, `core/client/make-http-client.ts`, `front/api/make-auth-users.ts`,
`front/app-admin/onboarding/onboarding.tsx`, `tests/cases/make-adapter-test.ts`,
`tests/cases/users-api-test.ts`.

## Closed out (2026-08-31): ACE review + final cleanup

ACE reviewed the shipped effort independently and confirmed the addenda strengthened it: the
`updateScoped`/`update` collapse and the capability-interface decomposition were both read as the
right calls, and the `sites` incident is now structurally unconstructable rather than merely
patched. ACE flagged one real staleness — `architecture-core.md`'s `ApiCrudContract` snippet
still showed the pre-decomposition `update(id, scoped, patch)` shape. Verified against the actual
code and fixed, along with two more staleness spots ACE didn't catch: the maker table listed
`makeCrudHttpClient` under `ApiCrudContract` instead of `CrudHttpContract`, and §5.2.5's "Uniform
interfaces — same method signatures regardless of underlying storage" bullet directly contradicted
the decomposition's whole point (`update` now legitimately differs per backing-store family).
ACE's residual-risk note (`@ts-expect-error` compile fixtures for the unconstructable guarantees)
is real but logged to the existing testing-gap backlog rather than pulled into this effort.

Three more loose ends closed in discussion after the review:

- **`Clearable<T>` inlined out of existence.** It was already unexported with zero external
  references; as a standalone top-level type it was still a discoverable, reusable handle for
  the exact conflation that caused the original incident. Collapsed into `UpdateFromInstantiable<T>`
  at its one use site in `core/std/protocols.ts` — no named thing left to reach for.
  `OptionalKey<T,K>`'s `Record<string, never>` idiom was reconsidered and kept as-is: it's Deno
  lint's own recommended replacement for the banned bare-`{}` "empty object" trick
  (`ban-types` hints `Record<PropertyKey, never>` specifically), not a `Dictionary<V>` use case —
  `Dictionary<never>` would've been _less_ correct (pinned to `string` keys) than the
  already-shipped form, not more.
- **`guard-architecture.ts`'s `UX_FORBIDDEN_IMPORTS` entry for `@domain/adapters/` removed.**
  Traced its history: the original January 2026 guard had no such carve-out (`apps` could import
  all of `domain` freely). The entry first appears in commit `ec67411` ("Renamed to prefix 'guard'
  file designation," 2026-02-16) — a commit that silently rewrote the file (139 → 255 lines)
  under a message describing only a rename, no design rationale recorded anywhere. On inspection
  the rule didn't do the job its defense claimed: `make-supabase-client.ts`'s `update()` validates
  `source` unconditionally regardless of where the `ScopedUpdateAdapter` argument was constructed,
  so there was never a validator bypass to prevent — only a column-name-encapsulation preference,
  not worth a compile-time guard. Removed; `check:guards` clean afterward.
- **`CustomerUpdateScopes` extracted to its own file, `front/api/api-update-scopes.ts`** — a
  companion seam to `api.ts`, not a member of `api.Customers` (would have widened `Customers`'s
  type past `ApiCrudContract<Customer>`, breaking the uniformity the whole decomposition exists
  to guarantee, and diverged from how `AuthUsersContract` already expresses User's one scope
  through `PinnedUpdateContract<User, AllUserKeys>` at the type level rather than a runtime
  property). One file, one named export per domain, growing the same way `api.ts`'s own PUBLIC
  block grows per domain client — not a per-domain file, since these declarations are thin enough
  that a dedicated file per domain would be ceremony, unlike `make-auth-users.ts`'s genuine
  complexity. `api.ts` is back to strictly composing `api`; `onboarding.tsx` imports
  `CustomerUpdateScopes` from the new file.

Types, lint, fmt, and the full guard suite are clean (the one persistent `check:guards` failure —
`guard:leaf` on `.DS_Store`/`core/cfg/*`/`domain/protocols/*` — predates and is unrelated to this
effort). Nothing committed; this effort is ready for Ted's own commit.

_End of Backlog Brief_
