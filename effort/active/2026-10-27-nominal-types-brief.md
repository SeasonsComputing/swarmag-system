# Nominal Types — Brief

**Active, draft.** Recorded 2026-10-27 from a CA + AI Architect session, while reviewing the
document storage brief (`effort/active/2026-10-23-document-storage-brief.md`), whose
`DocumentPath` is a nominal string built on `Id`. Chosen the same day, ahead of the storage
production: making `Id` nominal first means `DocumentPath` is built on a nominal `Id` rather than
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
3. **`Id` is nominal.** `id()` returns `Id`, and `isId` narrows to it. At runtime it stays a
   plain string: JSON, the database, and URLs do not change. `When` stays `string`.
4. **`Query<T>` adopts `NominalType`**, so the repository has one spelling of the idiom.
5. **`DocumentPath`** is the first type born nominal (document storage brief).
6. **Two entry points per type.** Each nominal type has a producer, for a new or a fixed value, and
   a guard; any other value crosses a data seam (moment 3).

   | Type   | Producer               | Guard           |
   | ------ | ---------------------- | --------------- |
   | `Id`   | `id()` / `id(literal)` | `isId(value)`   |
   | `When` | `when()` / `when(at)`  | `isWhen(value)` |

   `When` keeps the pair while it stays `string`, so the API is closed for both.

7. **Producer first, then the type.** The overload is additive and backward compatible, so the
   production runs in two steps. First `id()` gains its argument and the literal ids move onto it
   while `Id` is still `string`; every step type-checks. Then `Id` becomes nominal, which leaves
   only the sites the moments decide. The first step stands on its own if the second stops.

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

1. **The empty Id. Settled.** `''` stands for "no Id" in dashboard state, the asset form, and a
   test. There is no empty `Id`. `AssociationOptional` means the domain allows no reference; a form
   that has not chosen a required reference yet never borrows it. The workbench decomposes an
   abstraction into its constituent fields, so form state has a lifecycle of its own: "not chosen"
   lives there.
   - **Asset form:** the type signal holds `Id | undefined`, narrowed at submit, within `front/`;
     `core/` and the workbench are untouched.
   - **Dashboard state:** recoded so its id is never a placeholder; `DASHBOARD_ID` comes from
     `id(literal)` (moment 4).
   - **The rejection test:** follows moment 4.
2. **Select values. Settled.** `ux/ui` selects emit `string` and stay generic, as a catalog must.
   The Id pickers in `front/` (`UserPicker`, `AssetTypePicker`) build their options from stored
   records, so each resolves the selected value back to its own record
   (`users.find(user => user.id === value)?.id`): no cast and no format check, the least clever of
   the three. `AssetTypePicker`'s value becomes `Id | undefined` (moment 1).
3. **Boundary entry. Settled.** Stored rows enter by cast at the named boundaries: the CRUD
   clients, the auth clients, and user orchestration. A data seam is where untyped data becomes
   typed, and crossing one bypasses the type system by nature, as `Dictionary` reads do; a cast
   there is the seam, not a breach. Storage's `uuid` columns are the guarantee, and the
   validator-bound clients guard what enters, so re-checking every read would defend against the
   repository's own database. The premise does not hold for `When`: `timestamptz` guarantees a
   valid instant, not one spelling.
4. **Literals. Settled.** Fixtures already build ids with `id()`. Each producer gains an optional
   argument and stays the one producer, additive and backward compatible:
   - `id(literal?: string): Id` returns a new UUID v7 without one, and with one checks it and fails
     fast. `DASHBOARD_ID`, the stage seed ids, and stable fixture ids use it. All 37 literal UUIDs in
     the TypeScript sources are v7; the nil UUID in `schema.sql`'s auth seeds never reaches
     TypeScript. Rejection tests cast their deliberately invalid values (`'invalid' as Id`), which
     states what they prove.
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
5. **Where casts may appear. Settled: a guard.** `as Id` fails outside a closed set of files: the
   producer (`identifier.ts`), the named data seams
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
