# Asset and Chemical Managers — Brief

**Active, draft.** Recorded 2026-10-21 from a CA + AI Architect session, after a qualitative
assessment of the workbench for M-5 Mechanical Productions. The two managers are M-5's features:
stock CRUD copied from the reference implementations. Chosen from the roadmap 2026-10-21. Awaits
the design moments, CA review, and the production gate.

## What triggered it

M-5's enablers made the workbench copy-ready: discard protection and editor feedback now belong to
the host, so a copied manager inherits them without code of its own. What is not yet copy-ready is
the recipe: a handful of choices the reference implementations make differently, or make
implicitly, which a copier would otherwise settle by feel. Each copy then entrenches whichever it
picked.

## What the repository holds

- **The domain is ready.** `domain/abstractions/asset.ts` and `chemical.ts`, with their adapters,
  validators, protocols, and `assets` and `chemicals` tables in `schema.sql`.
- **The API wiring is not.** `front/api/api.ts` carries `Assets` and `Chemicals` as commented
  stubs, without validators; `front/api/scopes.ts` declares no scope for either.
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
   shares structure with its source. `Chemical.labels` and both topics' `notes` need it.
3. **Status badges are an exhaustive `Record<Status, …>`,** as Customer's are, not an inline
   ternary: `AssetStatus` has four values, and the type catches a missing one.
4. **Steps are declared inline in the manager** unless another host composes the same steps, as
   Onboarding does Customer's. Both managers are expected to be single-step.
5. **The delete confirmation states a soft delete,** in Customer's form ("removes the … from active
   records"), not User's "This cannot be undone."
6. **Text crosses three directions,** and the Customer form is the model: control state holds raw
   text, and one projection (`customerDraft`) transforms it on the way out.

   | Direction                      | Text                                                                                                   | Numbers              |
   | ------------------------------ | ------------------------------------------------------------------------------------------------------ | -------------------- |
   | In, record to control          | `value ?? ''`                                                                                          | `UiText.from(value)` |
   | While typing, control to state | raw text, untouched                                                                                    | `UiText.number(v)`   |
   | Out, projection or save        | required `toTrimmed(v)`; optional `UiText.optional(toTrimmed(v))`; email `UiText.optional(toEmail(v))` | already parsed       |

   A nested editor that writes domain values as it types (Sites, and `Chemical.labels`) applies
   the "out" column when it saves, as `customerSiteDraft` does.
7. **The collection's load error is supplied, not rendered:** `listError: () => query.error`.
   `AbstractionManager` presents it.

## Design moments

The recipe does not cover these; each is a design conversation before its manager is produced.

1. **`Asset.type` is an `AssociationOne<AssetType>`:** a picker over a reference list, as
   `UserPicker` is over Users. No `AssetType` API topic, provider, or picker exists, and nothing
   yet manages the list of types.
2. **`Chemical.labels` is a `CompositionMany<ChemicalLabel>`** of `{ url, description? }`: a nested
   editor, as Sites and Notes are.

## Production scope

Operating mode: **Feature**, in `front/` only: `api.ts`, `scopes.ts`, and new `app-admin/assets/`
and `app-admin/chemicals/` folders, with their routes. A need to change `ux/`, `core/`, or
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

_End of Brief_
