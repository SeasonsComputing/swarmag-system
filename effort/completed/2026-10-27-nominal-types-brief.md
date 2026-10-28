# Nominal Types — Brief

**Completed 2026-10-27.** Shipped in `9ce287a`, with CONVENTIONS 1.2 in `30374a4`, reviewed by
the AI Architect and verified by the CA's review. Recorded 2026-10-27 from a CA + AI Architect session, while reviewing the document storage brief
(`effort/active/2026-10-23-document-storage-brief.md`), whose `DocumentPath` is a nominal string
built on `Id`. Chosen the same day, ahead of the storage production (no longer a prerequisite, per
Amendment 1): making `Id` nominal first means `DocumentPath` is built on a nominal `Id` rather than
retrofitted later.

## What triggered it

TypeScript types are shapes, not names. `type Id = string` and `type When = string` declare no type:
each is another name for `string`, so any string is an `Id`, any `Id` is a `When`, and the compiler
cannot tell them apart. The files around them were designed nominally: `identifier.ts` and
`datetime.ts` each own a producer (`id()`, `when()`), a guard (`isId`, `isWhen`), and a format,
which is the producer-owns-construction shape CONVENTIONS §10.2 sets for branded types (nominal
types, in this brief's vocabulary). Only the types are structural, and `id()` is declared to return
`string`, not `Id`. `When` is on hold (Design history); this brief makes `Id` nominal.

The idiom is applied once: `Query<T>` in `make-query.ts` carries a phantom `unique symbol` brand
declared in its own file (`effort/completed/2026-10-11-list-query-brief.md`), so only `build`
makes one. `Id` and `When` are the only primitive aliases in `core/` and `domain/`.

## The design

1. **A named idiom.** `NominalType<T, B>` in a `core/std` file of its own (`nominal-type.ts`), a
   primitive beside `identifier.ts` and `datetime.ts`, exported through `std.ts`. `T` is the base
   type, so the intersection is written once, and the idiom serves strings and objects alike.
2. **The brand stays with the producer.** Each nominal type is keyed by a brand: a
   `declare const … : unique symbol`, never exported, in its producer's file. The declaration emits
   no code; it exists only for the checker, a phantom type. Only that file can name the brand, so
   §10.2 holds: the producer constructs, everyone else receives.
3. **`Id` is nominal.** _Deferred by Amendment 1._ `id()` returns `Id`, and `isId` narrows to it. At
   runtime it stays a plain string: JSON, the database, and URLs do not change. `When` stays
   `string`.
4. **`Query<T>` adopts `NominalType`**, so the repository has one spelling of the idiom.
5. **`DocumentPath`** is the first type born nominal (document storage brief). _Superseded by
   Amendment 1: storage does not depend on this brief._
6. **Two entry points per type.** _Superseded by Amendment 2: producers generate; `toId` and
   `toWhen` check._ Each nominal type has a producer, for a new or a fixed value, and
   a guard; any other value crosses a data seam (moment 3).

   | Type   | Producer               | Guard           |
   | ------ | ---------------------- | --------------- |
   | `Id`   | `id()` / `id(literal)` | `isId(value)`   |
   | `When` | `when()` / `when(at)`  | `isWhen(value)` |

   `When` keeps the pair while it stays `string`, so the API is closed for both.

7. **Producer first, then the type.** _Amendment 1 produces the first step only._ The overload is
   additive and backward compatible, so the production runs in two steps. First `id()` gains its
   argument and the literal ids move onto it while `Id` is still `string`; every step type-checks.
   Then `Id` becomes nominal, which leaves only the sites the moments decide. The first step stands
   on its own if the second stops.

```ts
// core/std/nominal-type.ts: the named idiom
export type NominalType<T, B extends symbol> = T & { readonly [K in B]: true }

// core/std/identifier.ts: the brand stays private to the producer
declare const idBrand: unique symbol
export type Id = NominalType<string, typeof idBrand>
export const id = (): Id => …
export const isId = (value: unknown): value is Id => …
```

## Reach

Measured 2026-10-27 in a scratch copy, running `check:types`. Making `Id` and `When` nominal gave
62 errors, 50 of them fixed timestamps in tests; with `When` on hold, making `Id` nominal gives 8.
No error falls in `domain/` or `back/`: the domain types carry `Id` through `Instance`,
`Instantiable`, and the associations, so they become nominal with no edit, and genesis purity is
untouched.

| Area               | Sites | What surfaces                                              |
| ------------------ | ----- | ---------------------------------------------------------- |
| `source/front/`    | 3     | Pickers pass a select's `string` as an `Id`; `''` as an Id |
| `source/ux/shell/` | 2     | `''` and a literal as Ids in dashboard state               |
| `source/tests/`    | 2     | Deliberately invalid ids in rejection tests                |
| `source/core/cli/` | 1     | `preferences.ts` holds its record id as `string`           |
| `source/domain/`   | 0     |                                                            |
| `source/back/`     | 0     | Boundary casts (`as Id`) already in place                  |

Boundary casts already exist where stored rows enter the type system: the Supabase and IndexedDB
clients, the Supabase auth client, edge auth, user orchestration, and one test.

## Design moments

Every moment leaves `domain/` unbroken: the nominal types are taken because the domain needs no
edit, and a resolution that would force one fails.

1. **The empty Id. Settled.** _Deferred by Amendment 1._ `''` stands for "no Id" in dashboard state,
   the asset form, and a test. There is no empty `Id`. `AssociationOptional` means the domain allows
   no reference; a form that has not chosen a required reference yet never borrows it. The workbench
   decomposes an abstraction into its constituent fields, so form state has a lifecycle of its own:
   "not chosen" lives there.
   - **Asset form:** the type signal holds `Id | undefined`, narrowed at submit, within `front/`;
     `core/` and the workbench are untouched.
   - **Dashboard state:** recoded so its id is never a placeholder; `DASHBOARD_ID` comes from
     `id(literal)` (moment 4).
   - **The rejection test:** follows moment 4.
2. **Select values. Settled.** _Deferred by Amendment 1._ `ux/ui` selects emit `string` and stay
   generic, as a catalog must. The Id pickers in `front/` (`UserPicker`, `AssetTypePicker`) build
   their options from stored records, so each resolves the selected value back to its own record
   (`users.find(user => user.id === value)?.id`): no cast and no format check, the least clever of
   the three. `AssetTypePicker`'s value becomes `Id | undefined` (moment 1).
3. **Boundary entry. Settled.** Stored rows enter by cast at the named boundaries: the CRUD
   clients, the auth clients, and user orchestration. A data seam is where untyped data becomes
   typed, and crossing one bypasses the type system by nature, as `Dictionary` reads do; a cast
   there is the seam, not a breach. Storage's `uuid` columns are the guarantee, and the
   validator-bound clients guard what enters, so re-checking every read would defend against the
   repository's own database. The premise does not hold for `When`: `timestamptz` guarantees a
   valid instant, not one spelling.
4. **Literals. Settled.** _Superseded by Amendment 2._ Fixtures already build ids with `id()`. Each
   producer gains an optional argument and stays the one producer, additive and backward compatible:
   - `id(literal?: string): Id` returns a new UUID v7 without one, and with one checks it and fails
     fast. `DASHBOARD_ID`, the stage seed ids, and stable fixture ids use it. All 37 literal UUIDs
     (4, per Amendment 1) in the TypeScript sources are v7; the nil UUID in `schema.sql`'s auth
     seeds never reaches TypeScript. Rejection tests cast their deliberately invalid values
     (`'invalid' as Id`), which states what they prove.
   - `when(at?: Date | string): When` returns now without one. A `Date` becomes `toISOString()`, the
     form the system writes; a string is checked with `isWhen` and returned unchanged, and anything
     else fails fast. It is not parsed or canonicalized, so it produces only what the system
     writes and leaves values read from storage as stored (2026-10-11). Capture times and picked
     dates use it.
   - **Tests use `when(at)` for every timestamp the system would write** (55 literals), to keep the
     API closed. The five store-form literals (`…32.719719+00:00`) in the list-query and
     list-clients tests stay raw strings: they stand for values read back from Postgres and prove
     the cursor and filters carry them unchanged, so they are data-seam values, which `when` does
     not produce.
5. **Where casts may appear. Settled: a guard.** _Deferred by Amendment 1._ `as Id` fails outside a
   closed set of files: the producer (`identifier.ts`), the named data seams
   (`make-supabase-client.ts`, `make-indexeddb-client.ts`, `auth-supabase-client.ts`,
   `make-supabase-edge-auth.ts`, `user-orchestra.ts`), and `source/tests/`. The rule joins
   `guard-core-std-types.ts`, which already enforces `@core/std` vocabulary; a new data seam joins
   the allowlist by a decision, not by the guard's absence. Treating every cast as strict scrutiny
   was weighed and set aside: it would slow milestones handed whole to the ACE.
6. **Ids by owner. An observation, not taken up.** `AssociationOne<User>` resolves to `Id`; its
   phantom `T` is read by people and genesis, not the compiler, so an asset's id passes where a
   user's is declared. It surfaced during design research and blocks nothing here or in document
   storage, so this brief does not decide it.

## Records

`core/` is locked; the CA opens `core/std` for this production, and `ux/shell` and `front/` for
the sites above. CONVENTIONS §10.2 says nominal type where it says branded type, and names
`NominalType`, and states the cast rule; CONVENTIONS is locked and the CA opens it. The guard rule
lands in `guard-core-std-types.ts`, and `architecture-devops.md` §11.1 describes it; that document
is locked and the CA opens it. `domain/` is not opened: the measured reach needs no domain edit.

## Amendment 1 (2026-10-27): rescoped after ACE's review

ACE's review found the design coherent and raised five points, each verified against the code: the
asset draft is read at open and at every dirty check, before a type is chosen; `Preferences`
declares its row an `Instance` while keying it by store name; pickers must resolve against every
record in their options, stored references included; verification was unspecified; and the UUID
inventory counted `schema.sql`, not TypeScript. In review the CA and AI Architect found the brief
was not a prerequisite for document storage, which needs no nominal `Id`. The brief is rescoped to
what is useful now; making `Id` nominal is deferred.

**The production:**

1. **`NominalType<T, B>`** in `core/std/nominal-type.ts`, exported through `std.ts`; `Query<T>`
   adopts it (design points 1, 2, 4). Additive.
2. **`id(literal?)` and `when(at?)`** as moment 4 settles them. _Superseded by Amendment 2._
   Additive and backward compatible.
3. **Literals move onto the producers:** _Superseded by Amendment 2: onto the checkers._
   `DASHBOARD_ID` and the stage-session ids through `id('…')`; test timestamps through `when('…')`,
   with the five store-form literals raw.
4. **`Preferences` keeps string keys:** _Superseded by Amendment 2._ `PreferencesStore = { id:
   string; state: StringDictionary }`. A preferences row is keyed by name, not identified, so it is
   not an `Instance`; stored keys do not change.
5. **Verification:** runtime tests for both producers, including the fail-fast paths.

**Corrected:** the TypeScript sources hold 4 literal UUIDs, all v7 (`DASHBOARD_ID`, two
stage-session ids, one in `db-genesis-verify.ts`); the 37 counted earlier were `schema.sql` seeds.

**Deferred:** making `Id` nominal (design point 3), with moments 1, 2, and 5, which apply only once
it is. ACE's asset draft and picker findings belong to them: the form owns `AssetFormDraft` with
`type: Id | undefined`, which the workbench baseline and dirty checks read, and the asset provider
narrows before scope projection; each picker resolves against the list its options came from. The
deferred items are settled when the brief closes (EFFORT §4).

**Records:** `core/std` and `core/cli/preferences.ts` are opened for this production, with
`ux/shell` and `source/tests/` for the literal sites. CONVENTIONS §10.2 names `NominalType`; it is
opened for that. `architecture-devops.md` §11.1 is not touched: the cast guard is deferred.

## Amendment 2 (2026-10-27): checkers, not overloads

The CA's review of the production found the overloads changed the most primitive files in
`core/std`. A generator that also checks imports the validation layer, which put a cycle in
`core/std` (`validators.ts` imports `isId` and `isWhen` back); it forced a decision on which
literals are acceptable (`id` retained uppercase, which never equals a stored lowercase id); and
`when` failed two ways (`ValidatorError` for strings, `RangeError` for an invalid `Date`). Each
came from giving a primitive a second verb. Checking moves to the validators, beside `toTrimmed`
and `toEmail`, and the primitives keep one job each.

1. **`id()` and `when()` are generators only:** `identifier.ts` and `datetime.ts` revert to their
   committed versions, which restores the `dprint-ignore` on the UUID template.
2. **`toId` and `toWhen` in `validators.ts`.** `toId(value: string): Id` checks with `isId` and
   returns the lowercase form, as `toEmail` lowercases, so a literal always equals the stored id.
   `toWhen(value: Date | string): When` serializes a valid `Date` with `toISOString()` and returns
   a string `isWhen` accepts unchanged. Every other input fails through `notValid`, so both fail
   one way. `validators.ts` already imports `isId` and `isWhen`, so `core/std` stays acyclic.
   `toWhen` parses nothing: it is not the canonicalizing `toWhen` withdrawn on 2026-10-11.
3. **Literals go through the checkers:** `DASHBOARD_ID` and the stage-session ids through
   `toId('…')`; the 54 test timestamps through `toWhen('…')`, the five store-form literals raw. The
   producer tests become checker tests.
4. **Fixed ids come from `id()`.** UUID v7s from other generators are not interchangeable with the
   repository's, which is why seed ids are generated by its scripts. A fixed id is generated once
   with `id()` and then written into the code through `toId`.
5. **`Preferences` separates the store's name from its row's identity:** `Preferences(storeName,
   id: Id)` with no default, and the row `Instance & { state: StringDictionary }` again.
   `app-state.ts` names `APP_STATE_STORE` and `APP_STATE_ID = toId('…')`, as the dashboard names
   `DASHBOARD_STORE` and `DASHBOARD_ID`. Each device's app state resets once; there are no
   deployments, and `app-state.ts` is the only consumer.
6. **`make-query.ts` declares its brand directly above `Query<T>`,** with a comment, so the symbol
   is defined where it is first read.
7. **CONVENTIONS reverts to its committed version.** The AI Architect writes the nominal type rule
   after the production, as the CA authorizes: a §8.4 Nominal types with an example, a §8.1
   vocabulary row, and §10.2 kept to file placement.

## Closure

- **Making `Id` nominal** (design point 3), with moments 1, 2, and 5 and ACE's asset draft and
  picker findings: joins parking lot P-12, held for `core`'s own repository.
- **`When` as `Temporal.Instant`:** already in P-12.
- **`toId` once `Id` is nominal:** P-12 notes that it takes the guard-first form, which the
  current form, valid only while `Id` is `string`, is not.

## Design history

- **2026-10-27, from `Branded` to `NominalType`.** The first sketch was a string-labelled
  `Branded<'DocumentPath'>`. A label any file can write lets any file forge an object brand, so it
  became `Branded<B extends symbol>`, keyed by the producer's private symbol. The CA then named it
  `NominalType<T, B>`: named for what it is rather than how it is built, with the base type inside.
- **2026-10-27, `When` on hold.** The brief first made `When` nominal too, with `when(at?)`
  canonicalizing fixed timestamps. That reopened the 2026-10-11 decision
  (`effort/completed/2026-10-11-canonical-when-brief.md`): `toISOString()` writes `…sssZ`, and
  Postgres serializes `timestamptz` as `…+00:00` with trimmed fractional digits, so every
  timestamp read back fails `isWhen`, and a nominal `When` is honest only if every seam
  canonicalizes, the machinery withdrawn then. `Temporal.Instant` is the likely destination; it
  waits on stable Safari and Supabase's hosted runtime, and matters once offline comparison
  arrives. The CA takes it up when `core` moves to a repository of its own. `when(at?)` stays, to
  keep the API closed: bounded to a `Date` or a checked string, never parsed.
