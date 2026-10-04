# `core/` Reconciliation — Backlog Brief

**Backlog, not dispatched.** On 2026-10-03 the Chief Architect and AI Architect asked where a new
rule about update scopes should live. That question showed that `source/core/`,
`documentation/architecture/architecture-core.md`, and `CONVENTIONS.md` have never been
reconciled against each other. Backlog entry: "`core/`, `architecture-core.md`, and
`CONVENTIONS.md` have never been reconciled" (`normal`).

## Objective

Give `core/` one coherent account across its three artifacts, with each concern stated once.

- **`source/core/`** is what exists. It is a derived artifact: where it conflicts with the
  documents, the code is wrong (`architecture-core.md` §1.2).
- **`architecture-core.md`** owns meaning: system boundaries, contracts, dependency direction,
  and invariants.
- **`CONVENTIONS.md`** owns construction: checkable rules for building with `core/`. It gates
  production but does not settle design (AGENTS §3.2). It is meant to travel across projects,
  and `core/` is meant to become a portable Seasons library. That makes `core/`'s construction
  patterns exactly the portable material CONVENTIONS exists to carry.

Where a concern needs both meaning and a rule, each document states its own half and points to
the other. Neither restates the other's half.

## What a first survey found (2026-10-03)

| `core/` namespace | Contents                                                                      | CONVENTIONS coverage                                                     |
| ----------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `cfg/`            | `Config`, runtime providers                                                   | §8.5, thorough                                                           |
| `std/`            | Primitives, relations, compositions                                           | §8.1 type table                                                          |
| `std/`            | `makeAdapter`                                                                 | §8.6                                                                     |
| `std/`            | Protocols: `CreateFromInstantiable`, `UpdateFromInstantiable`, `ScopedUpdate` | None                                                                     |
| `std/`            | Validators: `expect*`, `ExpectResult`, `notValid`                             | Only inside the §8.4 example                                             |
| `std/`            | Helpers such as `demandOne`                                                   | None                                                                     |
| `api/`            | Contract decomposition, `ApiError`, `checkApiError`, pagination helpers       | None. §9 says to throw `Error`; the API layer's convention is `ApiError` |
| `cli/`            | Client makers                                                                 | §8.7: one generic paragraph                                              |
| `svc/`            | Service wrappers: `wrapBusRuleHttpHandler`, shims                             | None                                                                     |
| `db/`             | Supabase and IndexedDB singletons                                             | None; `architecture-core.md` covers "apps never import these"            |

The survey checked CONVENTIONS only. `architecture-core.md` §5 covers part of the missing
material (contracts, `ApiError`, makers), so the reconciliation must establish what each document
holds, not assume that a missing CONVENTIONS entry means a missing rule.

## Known inputs, decided elsewhere and documented nowhere durable

- **The 08-30 standing SOP:** every form must declare its update scope. It exists only in
  `effort/completed/2026-08-29-scoped-update-adapter-brief.md`.
- **The scope unit (CA, 2026-10-03):** the unit of a scope is the attribute, and an attribute is
  written atomically, whatever its type or cardinality. An embedded composition is never
  addressed in part.
  - Meaning, for `architecture-core.md`: compositions have no identity (domain-model §3.3.1,
    §3.6).
  - Construction rule, for CONVENTIONS.
- **The CRUD contract decomposition:** the 08-31 provider-fit update contracts and their
  reasons, recorded in `effort/completed/2026-08-29-scoped-update-adapter-brief.md` and
  `effort/completed/2026-10-02-update-scopes-brief.md`.
- **The layer-6 form-scope abstraction,** once it is designed. Exploration began 2026-10-03, and
  its outcome feeds this brief; it is not decided here.

## Open — decided during this effort, not before

- For each `core/` namespace, which concerns are meaning (`architecture-core.md`), which are
  construction rules (CONVENTIONS), and which are reference that belongs to neither.
- Whether material moves out of `architecture-core.md` §5 into CONVENTIONS, or the other way.
- How to resolve the §9 conflict between "throw `Error`" and `ApiError`.
- Which new conventions are guard-enforceable, as candidates for the backlog entry "No guard
  enforces conformity to established conventions".

## Approach

1. Inventory `core/`'s exports by namespace, from the code.
2. Map each export to where `architecture-core.md` and CONVENTIONS describe it, if anywhere.
3. Classify each mapping as meaning, rule, or reference, and propose a placement.
4. Decide the placements.
5. Draft the document changes.

## Constraints

- **Documentation only.** The reconciliation changes no code. A divergence found in `core/` is
  a strict-scrutiny matter: report it and escalate, never fix it in passing.
- **Coordinate with the backlog entry "`architecture-core.md` is base context and has never been
  measured for scan cost" (`high`).** Both restructure the same document, so they should be
  sequenced or done together, and neither should undo the other.

## Out of scope

- Changes to `core/` code.
- `domain/`.
- The design of the layer-6 form-scope abstraction (only its outcome feeds this brief).
- Any CONVENTIONS content not about `core/`.

## Checks

`deno task fmt:check` and `deno task check` after each document change. Every pointer between the
two documents must resolve, and every statement must match the code as it stands.

## Amendment — 2026-10-04 — Inputs from the Users form-scope effort

Recorded by the AI Architect when `effort/completed/2026-10-03-users-form-scope-brief.md` closed.
Two inputs for the inventory:

- **A new `core/` export.** `core/std/make-scope.ts` (`makeScope`, `makeAdaptedScope`, `Scope`,
  `AdaptedScope`, `ScopeDraft`, `DraftOf`) is exported through `@core/stdx` (`e4a4cf1`). Whether
  CONVENTIONS names `makeScope` beside `makeAdapter` (§8.6) was deferred to this brief.
- **An unwritten import rule, now uniform in the code.** No module imports its own namespace
  through a barrel or an alias: a `core/std` file imports siblings directly, never `@core/std` or
  `@core/stdx`, and a `core/{namespace}` file imports siblings relatively (`./…`). The CA
  confirmed the rule on 2026-10-04, and the last exceptions (`make-scope.ts`,
  `wrap-http-handler.ts`, `make-supabase-edge-auth.ts`) were fixed. CONVENTIONS §3 bans relative
  imports only across top-level namespaces; it does not yet state this rule.

_End of Backlog Brief_
