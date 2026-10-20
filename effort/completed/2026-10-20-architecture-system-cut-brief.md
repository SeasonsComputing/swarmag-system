# Architecture Documents Cut to the System — Brief

**Closed 2026-10-20.** `architecture-back.md`, `architecture-devops.md`, and
`architecture-front.md` are cut to the system. Recorded 2026-10-20 by the CA and AI Architect, after
`effort/completed/2026-10-03-core-reconciliation-brief.md` cut `architecture-core.md` the same
way. Rides along with roadmap §5. The UX documents follow under their own brief.

## Decisions (CA, 2026-10-20)

1. **Scope:** `architecture-back.md` in full; in `architecture-devops.md`, what CONVENTIONS §17 now
   restates; in `architecture-front.md`, the `core/`-related sections. Its `ux/` toolkit material
   (the reactive store and query state patterns, component boundaries) belongs to the UX effort.
2. **Each document keeps the swarmAg system and every guarantee.** Portable construction material
   moves to CONVENTIONS, which points up for the guarantees it relies on; each statement stays at
   its rank in the authority chain.
3. **When in doubt, leave it.** Cut only what is restated elsewhere or plainly visible in the
   code, and check any restored statement is still true.
4. **One document at a time:** classify it whole, the CA reviews the classification, then cut and
   update references, before the next is opened.

## Scale (rough scan, 2026-10-20)

| Document                 | Lines |               Candidate to move |
| ------------------------ | ----: | ------------------------------: |
| `architecture-back.md`   |   503 |                        ~150–200 |
| `architecture-devops.md` | 1,017 |                             ~30 |
| `architecture-front.md`  | 1,230 | ~100 now; ~400 to the UX effort |

## Placements: `architecture-back.md` (reviewed by the CA, 2026-10-20)

| Section                     | Placement                                                                                |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| 3.2 edge function patterns  | the "use when" choice to CONVENTIONS §12; samples cut; pointer stays                     |
| 4.2 migration rules         | per-change naming and deltas-only to CONVENTIONS §14.3.1; pointer stays                  |
| 5.3 config usage sample     | cut; CONVENTIONS §11 covers it                                                           |
| 8.3 input validation sample | cut; it threw a generic `Error` for validation and named a validator that does not exist |
| 6.2 migration tests         | stays: a forward declaration, awaiting the first migration                               |
| everything else             | stays: the system, its guarantees, and its security posture                              |

Fixed in passing: the §3.4 shim sample now shows `wrapSupabaseShim`, as the real shims do; stale
references to `architecture-core.md` §6 (configuration) and CONVENTIONS §11 (testing) now point to
CONVENTIONS §11 and §16. 503 lines to 415.

## Placements: `architecture-devops.md` (reviewed by the CA, 2026-10-20)

| Section                    | Placement                                                           |
| -------------------------- | ------------------------------------------------------------------- |
| 11.3 guard output contract | cut to a pointer; CONVENTIONS §17.1 states it                       |
| everything else            | stays: swarmAg operations, the guard inventory, and its local setup |

## Placements: `architecture-front.md`, `core/`-related sections (reviewed by the CA, 2026-10-20)

| Section                                                      | Placement                                                                                                              |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 7.4 `makeScope` mechanics (inference, defaults, projections) | `@core/std/make-scope.ts` header SEMANTICS, as the query semantics went to `make-query.ts`; one pointer sentence stays |
| 9.5.1 object-store naming                                    | CONVENTIONS §13; a forward declaration, since no IndexedDB client is wired yet                                         |
| 9.5.2, 9.6 app preferences, state management, drafts         | stay for the UX effort                                                                                                 |
| everything else                                              | stays: the composed `api`, its inventory, the boundaries, and configuration order                                      |

## Order

`architecture-back.md`, then `architecture-devops.md`, then `architecture-front.md`.

## Closure (2026-10-20)

Production by the CA and AI Architect: `architecture-back.md` (`7b26514`) and its CONVENTIONS
rules (`df50cc6`); `architecture-devops.md` and `architecture-front.md` (`dc4efda`), the
`make-scope.ts` header semantics (`18798ed`), and the CONVENTIONS §13 store-naming rule (`95c0264`).

- **Deferred to the backlog:** `architecture-front.md`'s `ux/` toolkit material (§8.3, §8.4, §9.5.2,
  §9.6, §10.1) goes with the existing entry "`architecture-front.md` mixes the portable `ux/`
  toolkit with swarmAg's `front/`", which already plans its `ux` architecture document.

## Checks

`deno task fmt:check` and `deno task check` after each cut; every reference to a moved or renumbered
section resolves.

_End of Brief_
