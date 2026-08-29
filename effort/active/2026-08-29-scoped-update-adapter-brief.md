# Scoped Update Adapters — Backlog Brief

**Backlog, not dispatched.** Captured at the close of a session that shipped the Index/Detail
shell foundation (wizard drill navigation, `PanelHeaderTitle`, `CollectionPanel` styling) and,
in review of that work, found a real data-loss bug this brief exists to prevent as a class,
not just patch once.

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

**`domain/*` and `core/*` are strict scrutiny — minimize the footprint there.** The only
foundation-level change is making `makeAdapter`'s return shape field-addressable, additive to
the existing `Adapter<T>` interface:

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

## Open questions, not settled

- Does this apply retroactively to every existing multi-stage-shares-one-record surface
  (`AbstractionManager`'s editor forms included?), or only to new work going forward? Retrofit
  scope needs its own decision, separate from building the mechanism.
- Naming: `FieldAdapter`, `makeScopedUpdate`, `ScopedUpdateAdapter`, `updateScoped` are working
  names from conversation, not reviewed against STYLE-GUIDE §4 naming conventions.
- Whether `updateScoped` becomes the default entry point on every `makeCrudSupabaseClient<T>`
  client or is added narrowly where a real multi-form-one-record case exists today (Customer is
  the only confirmed case so far — contact info, address, and sites are three separate stages
  writing to one record).
- Whether the narrow interim fix (omit `sites` from `stageCustomer.commit`'s existing update
  object, already verified as correct and sufficient on its own) should land now as a stopgap
  ahead of this brief being picked up, or wait for the real mechanism. Not decided this session
  — deliberately deferred together with the rest of this brief.

## Sequencing (CONSTITUTION §8 — documentation leads code)

Not sequenced yet — this brief is the design capture, not an authorized production plan. Picking
this up starts with CA reviewing the design above, not with code.

_End of Backlog Brief_
