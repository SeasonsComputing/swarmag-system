# Instantiable Adapter Metadata — Brief

**Backlog, not dispatched.** Recorded 2026-10-06 from a CA + AI Architect session, during
verification of the tags → facets production (`effort/completed/2026-10-06-tags-classification-brief.md`).

## What triggered it

Every Instantiable adapter restates the same four lifecycle mappings:

```ts
id: ['id'],
createdAt: ['created_at'],
updatedAt: ['updated_at'],
deletedAt: ['deleted_at'],
```

`domain-archetypes.md` §3.2 already forbids this at the abstraction layer: extend `Instantiable` via
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

Operating mode: **Foundation** (`core/`, every domain topic, governance documentation).

1. **Documentation.** `domain-archetypes.md` §6 adapter examples spread the metadata; the genesis
   prompt defers to that document and needs no change. CONVENTIONS §8.6's `QuestionAdapter`
   example likewise (governance file: committed with the governance-gate bypass).
2. **Core.** `InstantiableOnlyAdapt` and `InstantiableAdapt` in `make-adapter.ts`, with the
   header's PUBLIC block.
3. **Domain, by hand.** Every Instantiable and InstantiableOnly adapter across the eight adapter
   files; hand edits must equal what domain genesis would produce from the updated archetypes.
4. **Tests.** The existing adapter round-trip tests must pass unchanged; no behaviour changes.

**Out of scope:** any other adapter metadata, and any change to `makeAdapter` itself.

## Sequencing

After the tags → facets production closes. It touches `FacetAdapter`, which that production adds.

## Design history

- **Name.** The CA first proposed `InstantiableAdapter`; the AI Architect rejected the suffix (it is
  not an `Adapter<T>`) and, citing CONVENTIONS §4.2's "Global immutable constants" row, proposed
  `INSTANTIABLE_ADAPT`. On 2026-10-08 the CA questioned SCREAMING_SNAKE for an object. §4.2's
  const-as-class row names a pure data object (`HttpCodes`) in PascalCase, every exported object
  constant in the code is PascalCase, and SCREAMING_SNAKE carries the const-enum idiom. The names
  became `InstantiableAdapt` and `InstantiableOnlyAdapt`. The general rule went to
  `effort/pending/2026-10-03-core-reconciliation-brief.md`.

_End of Brief_
