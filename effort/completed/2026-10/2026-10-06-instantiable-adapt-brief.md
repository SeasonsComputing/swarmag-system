# Instantiable Adapter Metadata — Brief

**Closed 2026-10-08: shipped, reviewed, and independently verified.** Recorded 2026-10-06 from a
CA + AI Architect session, during verification of the tags → facets production
(`effort/completed/2026-10-06-tags-classification-brief.md`). Chosen 2026-10-08 and reviewed by the
AI Coding Engine the same day; the amendment at the end resolves that review. Produced by the AI
Coding Engine; the CA corrected one import (`make-adapter.ts` imported `instance.ts` through its
own namespace's alias, against the 2026-10-04 import rule). Verified by the AI Architect against the
diff and check output: 17 `InstantiableAdapt` spreads, one `InstantiableOnlyAdapt` spread, no
lifecycle mapping left inline, and `NoteAdapter.createdAt` explicit.

## What triggered it

Every Instantiable adapter restates the same four lifecycle mappings:

```ts
id: ['id'],
createdAt: ['created_at'],
updatedAt: ['updated_at'],
deletedAt: ['deleted_at'],
```

_[Corrected by the amendment "ACE review resolved", Decision 1.]_ `domain-archetypes.md` §3.2
already forbids this at the abstraction layer: extend `Instantiable` via
intersection and never redeclare `id`, `createdAt`, `updatedAt`, or `deletedAt` inline. The
adapters break the same rule. The CA proposed shared lifecycle metadata spread into each adapter,
so the adapter layer follows the abstraction layer's rule.

## Decisions

1. **Shared lifecycle metadata in `core/std/make-adapter.ts`,** exported through `@core/stdx`:

   ```ts
   /** Adapter metadata for the InstantiableOnly lifecycle columns. */
   export const InstantiableOnlyAdapt: Adapt<InstantiableOnly> = {
     id: ['id'],
     createdAt: ['created_at']
   }

   /** Adapter metadata for the Instantiable lifecycle columns. */
   export const InstantiableAdapt: Adapt<Instantiable> = {
     ...InstantiableOnlyAdapt,
     updatedAt: ['updated_at'],
     deletedAt: ['deleted_at']
   }
   ```

   The full form composes the partial one, as `Instantiable` composes `InstantiableOnly`.
2. **The name says what it is.** Every `XAdapter` is a real `Adapter<T>` (`toDomain`,
   `fromDomain`, per-field adapters); this is metadata, an `Adapt<Instantiable>`, so it is named
   after the type it inhabits, `InstantiableAdapt`, not `InstantiableAdapter`. An object constant
   is PascalCase, CONVENTIONS §4.2's const-as-class (`HttpCodes`); SCREAMING_SNAKE is for values
   and the const-enum tuple idiom (§8.2).
3. **The type annotation is required.** Untyped, `['id']` infers as `string[]` and does not spread
   into `Adapt<T>`'s `[string, Adapter?]` tuple.
4. **Every lifecycle adapter, and only those.** Each Instantiable adapter spreads
   `InstantiableAdapt`; each InstantiableOnly adapter (`JobWorkLogEntry`) spreads
   `InstantiableOnlyAdapt`. Applying it to some adapters would be an idiom genesis does not know,
   in some generated files (the D6 incident). A composition's own `createdAt` (`Note`) is a domain
   attribute, not lifecycle, and stays as it is.

## Production scope

Operating mode: **Foundation** (`core/` and every domain topic).

1. **Documentation.** _[Revised by the amendment "ACE review resolved", Decision 2.]_
   `domain-archetypes.md` §6 adapter examples spread the metadata; the genesis
   prompt defers to that document and needs no change.
2. **Core.** `InstantiableOnlyAdapt` and `InstantiableAdapt` in `make-adapter.ts`, with the
   header's PUBLIC block.
3. **Domain, by hand.** Every Instantiable and InstantiableOnly adapter across the eight adapter
   files; hand edits must equal what domain genesis would produce from the updated archetypes.
4. **Tests.** _[Revised by the amendment "ACE review resolved", Decision 3.]_ The existing
   adapter round-trip tests must pass unchanged; no behaviour changes.

**Out of scope:** any other adapter metadata; any change to `makeAdapter` itself; CONVENTIONS
§8.6's `QuestionAdapter` example, deferred to `effort/pending/2026-10-03-core-reconciliation-brief.md`,
which already edits CONVENTIONS, so this production touches no governance file.

## Sequencing

After the tags → facets production closes. It touches `FacetAdapter`, which that production adds.

## Amendment — 2026-10-08 — ACE review resolved

The AI Coding Engine reviewed the brief against the source on 2026-10-08. It confirmed the
implementation scope (17 Instantiable adapters and one InstantiableOnly adapter across eight
files), that `@core/stdx` already re-exports `make-adapter.ts` so no barrel changes, and that the
annotated constants fit `Adapt<T>`. It recommended keeping the names, the composition, the
Foundation classification, and the exclusions.

### Decisions

1. **The rationale extends a pattern; it does not enforce a rule.** `domain-archetypes.md` §3.2
   governs abstraction declarations; nothing currently forbids explicit lifecycle mappings in an
   adapter. This production extends the abstraction layer's lifecycle reuse to adapter metadata,
   and the new §6 rule (Decision 2) is what makes it binding.
2. **§6 gains a rule and examples.** §6's only adapter examples (`AttachmentAdapter`,
   `NoteAdapter`, §6.4) carry no lifecycle fields, so there was nothing to update. §6 states the
   rule: an Instantiable adapter spreads `InstantiableAdapt`, an InstantiableOnly adapter spreads
   `InstantiableOnlyAdapt`, and no adapter restates lifecycle mappings. It adds one example of each
   form and states that a composition's own `createdAt` (`Note`) is a domain attribute, mapped
   explicitly. Genesis reproduces the hand edits from this rule.
3. **Verification states its coverage.** No suite round-trips every lifecycle adapter. The checks
   are: `make-adapter-test.ts` (the maker), `make-scope-test.ts`, the Facet round-trip in
   `facet-api-test.ts`, and `fixtures-test.ts` (fixture integrity), unchanged and passing;
   `deno task check` (types, lint, guards) and `fmt:check`; and an audit, reported in the
   production report, that every lifecycle mapping in the eight adapter files is replaced by a
   spread and that `NoteAdapter` keeps its `createdAt` mapping. Tests stay unchanged: the change is
   mechanical and type-checked against `Adapt<T>`, and that limit is accepted explicitly.

## Design history

- **Name.** The CA first proposed `InstantiableAdapter`; the AI Architect rejected the suffix (it is
  not an `Adapter<T>`) and, citing CONVENTIONS §4.2's "Global immutable constants" row, proposed
  `INSTANTIABLE_ADAPT`. On 2026-10-08 the CA questioned SCREAMING_SNAKE for an object. §4.2's
  const-as-class row names a pure data object (`HttpCodes`) in PascalCase, every exported object
  constant in the code is PascalCase, and SCREAMING_SNAKE carries the const-enum idiom. The names
  became `InstantiableAdapt` and `InstantiableOnlyAdapt`. The general rule went to
  `effort/pending/2026-10-03-core-reconciliation-brief.md`.
- **CONVENTIONS §8.6.** The example's update was first in scope; on 2026-10-08 it was deferred to
  the reconciliation brief to keep governance files out of this production.

_End of Brief_
