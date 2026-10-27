# Asset Type, Asset, and Chemical Managers — Brief

**Active, dispatched 2026-10-27.** Recorded 2026-10-21 from a CA + AI Architect session, after a
qualitative assessment of the workbench for M-5 Mechanical Productions. The three managers are
M-5's features: stock CRUD copied from the reference implementations, so the forms follow the
domain types and the recipe; `project-user-stories.md` §3–4 are not needed for them. Chosen from
the roadmap 2026-10-21.

## What triggered it

M-5's enablers made the workbench copy-ready: discard protection and editor feedback now belong to
the host, so a copied manager inherits them without code of its own. What is not yet copy-ready is
the recipe: a handful of choices the reference implementations make differently, or make
implicitly, which a copier would otherwise settle by feel. Each copy then entrenches whichever it
picked.

## What the repository holds

- **The domain is ready.** `domain/abstractions/asset.ts` and `chemical.ts`, with their adapters,
  validators, protocols, and `asset_types`, `assets`, and `chemicals` tables in `schema.sql`.
- **The API wiring is not.** `front/api/api.ts` carries `Assets` and `Chemicals` as commented
  stubs, without validators, and has no `AssetTypes` entry; `front/api/scopes.ts` declares no scope
  for any of the three.
- **Two references,** in `front/app-admin/`:
  - `customers/`: table CRUD through `makeCrudSupabaseClient` and `makeAdaptedScope`, updated with
    `api.Customers.update(scope.adapter, scope.toUpdate(…))`.
  - `users/`: edge-mediated through `makeAuthUsers` and `makeScope`, updated with
    `api.Users.update(scope.toUpdate(…))`.

## The recipe

1. **Copy Customers, not Users.** Assets and Chemicals are table CRUD: `makeCrudSupabaseClient`
   with the topic's validators in `api.ts`, and `makeAdaptedScope` in `scopes.ts`.
2. **Every setter for a structured field copies its value** (`copyDraft`), as `notes`, `roles`, and
   `sites` do; scalar setters do not. The rule is in the `workbench-draft.ts` header: a draft never
   shares structure with its source. Both topics' `notes` need it.
3. **Status badges are an exhaustive `Record<Status, …>`,** as Customer's are, not an inline
   ternary: `AssetStatus` has four values, and the type catches a missing one.
4. **Steps are declared inline in the manager** unless another host composes the same steps, as
   Onboarding does Customer's. All three managers are expected to be single-step.
5. **The delete confirmation states a soft delete,** in Customer's form ("removes the … from active
   records"), not User's "This cannot be undone."
6. **Text crosses three directions,** and the Customer form is the model: control state holds raw
   text, and one projection (`customerDraft`) transforms it on the way out.

   | Direction                      | Text                                                                                                   | Numbers              |
   | ------------------------------ | ------------------------------------------------------------------------------------------------------ | -------------------- |
   | In, record to control          | `value ?? ''`                                                                                          | `UiText.from(value)` |
   | While typing, control to state | raw text, untouched                                                                                    | `UiText.number(v)`   |
   | Out, projection or save        | required `toTrimmed(v)`; optional `UiText.optional(toTrimmed(v))`; email `UiText.optional(toEmail(v))` | already parsed       |

   A nested editor that writes domain values as it types (Sites) applies the "out" column when it
   saves, as `customerSiteDraft` does.
7. **The collection's load error is supplied, not rendered:** `listError: () => query.error`.
   `AbstractionManager` presents it.

## Design moments

The recipe does not cover these; each is a design conversation before its manager is produced.

1. **`Asset.type` is an `AssociationOne<AssetType>`.** Settled 2026-10-23: asset types are a
   catalog extended as facets are, and the admin app manages it with a third manager, Asset Types,
   copied from Customers and produced first. Delete and `active` keep their own meanings: delete is
   CRUD's delete, and `active` is a field on the form. The Asset Manager's type picker reads the
   list through `useAssetTypes`, which follows `useFacets`, and offers only active types.
2. **`Chemical.labels` is a `CompositionMany<ChemicalLabel>`** of `{ url, description? }`. Settled
   2026-10-23: a label is a title and a reference to a document already in storage; its editor
   never uploads. The Chemical Manager ships without a labels editor, which waits for document
   storage, as additional-contact assignment waits for portal users.

## Production scope

Operating mode: **Feature**, in `front/` only: `api.ts`, `scopes.ts`, a new
`app/stores/asset-types-state.ts`, and new `app-admin/asset-types/`, `app-admin/assets/`, and
`app-admin/chemicals/` folders, with their routes. A need to change `ux/`, `core/`, or
`domain/` is an escalation: those namespaces are locked.

## Design history

- **2026-10-21, optional-field idiom settled.** The draft left open whether optional text used
  `UiText.optional` or the conditional spread. The trace showed both reach the same validator,
  stored value, and draft comparison, but `UiText.optional` returned untrimmed text, and the Sites
  editor trimmed nothing. The CA set "always trim" and "`toEmail` everywhere"; trimming happens on
  the way out, never while typing. The reference implementations were repaired first (`e2c97fe`).
- **2026-10-21, error-message form dissolved.** The draft left open Customer's inline form or
  User's helper. Both were the one error a manager rendered itself; `AbstractionManager` now owns
  it (`a744ee6`), so neither form remains to copy.
- **2026-10-23, asset types managed.** The draft left open who manages the list of asset types. The
  CA designed `AssetType` to extend as `Facet` does, and settled that the admin app manages it with
  its own manager. Asked whether retiring a type means deleting it or clearing `active`, the CA
  kept CRUD as CRUD: delete means what it means, and so does `active`.
- **2026-10-23, chemical labels wait for storage.** The draft planned a labels editor beside Sites
  and Notes. The CA set a label as a reference to an already-uploaded document, so the editor has
  nothing to reference until document storage lands.

_End of Brief_
