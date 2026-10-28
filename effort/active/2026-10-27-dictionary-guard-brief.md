# Dictionary Guard — Brief

**Active, draft.** Recorded and chosen 2026-10-27 from a CA + AI Architect session, while
reviewing HelmWidget's settings validation after the nominal types brief
(`effort/completed/2026-10-27-nominal-types-brief.md`). Foundation mode: it reaches `core/std`,
`domain/`, the domain genesis, the domain archetypes, and CONVENTIONS.

## What triggered it

`Dictionary` is the one `@core/std` container without a guard: `Id` has `isId` and `When` has
`isWhen`, but nothing recognizes a plain string-keyed object. Every guard over an unknown object
therefore writes its own check, and the domain validators write an incomplete one. The CA's
judgment: the gap would not have been allowed to stand at any point in the project.

The pattern is taught, not chosen:

- **`documentation/domain/domain-archetypes.md` §5.6** opens its canonical guards with
  `if (v === null || typeof v !== 'object') return false`.
- **`effort/genesis/genesis-domain-sdk.md`** forbids "any `isObject` guard in a validator" and
  points to §5.6's named guards, so genesis copies the inline check.
- **CONVENTIONS §8.1** says to narrow unknown objects with a `Dictionary` cast, with no guard to
  narrow through first.

## What the repository holds

- **`domain/validators/`:** the inline check in eight structural guards: `isLocation`,
  `isAttachment`, `isNote` (`common-validator.ts`), `isChemicalLabel` (`chemical-validator.ts`),
  `isContact`, `isCustomerSite` (`customer-validator.ts`), `isSelectOption`, `isAnswer`
  (`workflow-validator.ts`). It admits arrays: an array passes `typeof 'object'` and fails only on
  its fields.
- **The complete check written by hand** (`null`, `object`, not an array):
  `core/std/api-contracts.ts` (the list cursor), `ux/shell/dashboard/dashboard-state.ts`
  (`toDictionary`, throwing `ApiError` 400), and `ux/widgets/helm-widget.tsx` (`toDictionary`).
- **`devops/scripts/smoke-ux.ts`:** a local `isRecord`, which admits arrays, reading Chrome
  DevTools responses.
- **HelmWidget's settings validation** also re-implements `isNonEmptyString` and `isConstEnum`,
  throws generic `Error`s where a validation failure throws `ValidatorError` through `notValid`
  (CONVENTIONS §9.6, §15), and names its checks `to*`, the normalizer family's prefix.

## The design

1. **`isDictionary` in `core/std/adt.ts`,** beside `Dictionary`, as `isId` sits beside `Id`.
   Additive.

   ```ts
   /** Check whether value is a dictionary: a plain or null-prototype object. */
   export const isDictionary = (value: unknown): value is Dictionary => {
     if (value === null || typeof value !== 'object') return false
     const prototype = Object.getPrototypeOf(value)
     return prototype === Object.prototype || prototype === null
   }
   ```

2. **Structural guards open with it.** `if (!isDictionary(v)) return false` replaces the inline
   check, and the guard then validates every field as it does today. `isDictionary` is the first
   line of a structural guard, never the guard: §5.6's rule that guards are full structural
   validators, not shallow object checks, stands.
3. **Genesis learns it from the documents it reads:** §5.6's examples, the genesis prompt's
   `isObject` line, and a CONVENTIONS §8.1 row (`isDictionary` instead of inline `null`, `object`,
   and array checks).
4. **`domain/` is retrofitted by hand and stays regenerable:** a sandbox genesis run confirms the
   taught documents produce the same guards (design moment 2).
5. **The hand-written copies use it:** the list cursor, dashboard state, and HelmWidget.
6. **HelmWidget reads its settings through `@core/std`:** `isNonEmptyString`, `isConstEnum`, and
   `isDictionary`, failing through `notValid` with the guard-first form (CONVENTIONS §8.4), its
   checks renamed under point 7. A local string-array check stays: HelmWidget is its only user.
7. **A function that reads unknown input and fails on it is named `read{Owner}*`,** in HelmWidget
   and dashboard state alike: `readHelmDictionary`, `readHelmString`, `readHelmStringArray`,
   `readHelmLabelMode`, `readHelmActions`, `readHelmAction`, `readHelmThemes`;
   `readDashboardDictionary`, `readDashboardArray`, `readDashboardString`, and the dashboard readers
   (`readDashboardStoreView` and the rest). The owner in the name marks a local reader, which a
   generic `readString` would not, so it is not mistaken for a shared primitive. `to*` names the
   shared conversions and normalizers of `@core/std` and the makers (`toTrimmed`, `toId`, `toDomain`,
   `toCreate`), which may fail through `notValid` (CONVENTIONS §9.6); HelmWidget's `toThemeIcon`, a
   conversion, keeps its name. `toString` also shadows `Object.prototype.toString`.

## Design moments

1. **Semantics. Settled:** true for a dictionary, false otherwise. A dictionary is a plain or
   null-prototype object, so a `Date`, `Map`, `RegExp`, class instance, or array is not one, and
   what the guards receive (JSON, IndexedDB, `structuredClone`) is. A shape check (`typeof` is
   `'object'`, not `null`, not an array) was weighed and set aside: `typeof` reports `'object'` for
   nearly every object, so the name would not be true.
2. **The domain retrofit. Settled: by hand.** The eight guards are edited by hand: domain genesis
   has not run in some time, and a regeneration would carry unrelated drift. Genesis is checked
   instead in a sandbox: run against the updated documents in an isolated copy, its guards compared
   with the hand-edited ones, line for line at the opening check. Only that comparison counts; any
   other difference the sandbox shows is out of scope, neither fixed nor recorded here.
3. **The genesis prompt's `isObject` line. Settled:** it reads "Any `isObject` guard, or any guard
   that is only an object check — use named exported structural guards per `domain-archetypes.md`
   §5.6, each opening with `isDictionary` from `@core/std`." The ban on shallow guards stands, and
   the primitive's place is named. §5.6's examples open with `if (!isDictionary(v)) return false`,
   so both documents teach the same line.
4. **Dashboard state. Settled.** Its seed reader checks with `isDictionary` and keeps throwing
   `ApiError` 400: its handlers test `apiError(error)` to reach `Config.fail`, so `notValid` would
   change what a bad seed does. Whether seed validation uses `ApiError` at all belongs with the
   dashboard's design (parking lot P-5). Its readers are renamed under the rule below.
5. **`smoke-ux.ts`'s `isRecord`. Settled:** the UX smoke test (`architecture-devops.md` §8.4)
   already imports `Dictionary` from `@core/std`, so it uses `isDictionary` in place of `isRecord`.
6. **CONVENTIONS. Settled: 1.3,** written by the AI Architect with the CA's go, as 1.2 was already
   committed. §8.1 gains `isDictionary` and guards narrow through it rather than casting; §4.2 names
   local readers `read{Owner}*`; and §9.6 states the validator families by what they return,
   replacing 1.2's "a normalizer may check", which described where `toId` and `toWhen` landed
   rather than deciding what `to*` means.

## Records

Opened for this production: `core/std/adt.ts` and `api-contracts.ts`; `domain/validators/`;
`ux/shell/dashboard/dashboard-state.ts`; `ux/widgets/helm-widget.tsx`;
`effort/genesis/genesis-domain-sdk.md`; `documentation/domain/domain-archetypes.md` §5.6; and
CONVENTIONS §8.1. `domain/`, `documentation/`, and CONVENTIONS are locked; the CA opens them for
this brief, recorded here.

## Design history

- **2026-10-27, why `@core/std` had no object guard.** The first domain genesis (`d51b0d5`,
  2026-03-13) wrote a local `isObject` into each validator and used it as the whole composition
  guard, so any object passed as a note; it was also mistyped (`value is AssetStatus`). The
  2026-03-22 fix (`88d938c`, `75ff194`) banned `isObject` guards and required named structural
  guards, and the object check survived inline as their first line. The ban was aimed at shallow
  guards; the primitive went out with them.
