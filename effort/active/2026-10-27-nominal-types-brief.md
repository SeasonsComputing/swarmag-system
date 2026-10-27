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
types, in this brief's vocabulary). Only the
types are structural, and `id()` is declared to return `string`, not `Id`.

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
3. **`Id` and `When` are nominal.** `id()` returns `Id`; `when()` returns `When`; `isId` and
   `isWhen` narrow to them. At runtime both stay plain strings: JSON, the database, and URLs do not
   change.
4. **`Query<T>` adopts `NominalType`**, so the repository has one spelling of the idiom.
5. **`DocumentPath`** is the first type born nominal (document storage brief).

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

Measured 2026-10-27 by making `Id` and `When` nominal in a scratch copy and running `check:types`: 62
errors, all TS2322 or TS2345. No error falls in `domain/` or `back/`: the domain types carry `Id`
and `When` through `Instance`, `Instantiable`, and the associations, so they become nominal with
no edit, and genesis purity is untouched.

| Area               | Sites | What surfaces                                              |
| ------------------ | ----- | ---------------------------------------------------------- |
| `source/tests/`    | 56    | Literal ids and timestamps in fixtures and cases           |
| `source/front/`    | 3     | Pickers pass a select's `string` as an `Id`; `''` as an Id |
| `source/ux/shell/` | 2     | `''` as an Id in dashboard state                           |
| `source/core/cli/` | 1     | `preferences.ts` holds its record id as `string`           |
| `source/domain/`   | 0     |                                                            |
| `source/back/`     | 0     | Boundary casts (`as Id`) already in place                  |

Eight boundary casts already exist where stored rows enter the type system: the Supabase and
IndexedDB clients, the Supabase auth client, edge auth, user orchestration, and one test.

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
   - **Dashboard state:** recoded so its id is never a placeholder; the `DASHBOARD_ID` literal
     follows moment 4.
   - **The rejection test:** follows moment 4.
2. **Select values.** `ux/ui` selects emit `string` and stay generic, as a catalog must. The Id
   pickers in `front/` (`UserPicker`, `AssetTypePicker`) become the boundary: narrow with `isId`, or
   cast because the options were built from stored ids.
3. **Boundary entry.** Stored rows enter by cast today. Whether the cast stays (storage is trusted)
   or becomes a guard (fast failure on a malformed row).
4. **Test literals.** Fixtures write literal UUIDs and timestamps. Whether they use the producers,
   or a fixture helper confined to `source/tests/`.
5. **Where casts may appear.** Whether `as Id` and `as When` outside their producers and the named
   boundaries become a guard rule (`guard-core-std-types.ts` already enforces `@core/std`
   vocabulary). A new rule is its own decision.
6. **Ids by owner.** `AssociationOne<User>` resolves to `Id`; its `T` is read by people, not the
   compiler, so an asset's id passes where a user's is declared. `Id<T>` would make a wrong-owner
   reference a compile error, and would reach every domain type. Recorded here; the decision is the
   CA's.

## Records

`core/` is locked; the CA opens `core/std` for this production, and `ux/shell` and `front/` for
the sites above. CONVENTIONS §10.2 says nominal type where it says branded type, and names
`NominalType`; CONVENTIONS is locked and the CA opens it. `domain/` is not opened: the measured reach needs no domain edit.

## Design history

- **2026-10-27, from `Branded` to `NominalType`.** The first sketch was a string-labelled
  `Branded<'DocumentPath'>`. A label any file can write lets any file forge an object brand, so it
  became `Branded<B extends symbol>`, keyed by the producer's private symbol. The CA then named it
  `NominalType<T, B>`: named for what it is rather than how it is built, with the base type inside.
