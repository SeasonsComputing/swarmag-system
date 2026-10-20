# `core/` Reconciliation — Brief

**Active.** Chosen 2026-10-20 to ride along with roadmap §5 beside file header conformance:
both write CONVENTIONS in the same window. Recorded 2026-10-03: on that day the Chief Architect and AI Architect asked where a new
rule about update scopes should live. That question showed that `source/core/`,
`documentation/architecture/architecture-core.md`, and `CONVENTIONS.md` have never been
reconciled against each other. Backlog entry: "`core/`, `architecture-core.md`, and
`CONVENTIONS.md` have never been reconciled" (`normal`). Recast 2026-10-20 as the doc effort below.

## Decisions (CA, 2026-10-20)

1. **CONVENTIONS is the programming guide:** style, best practice, and full `core/` coverage, in
   one document.
2. **The `core/` file headers are the reference.** CONVENTIONS points to a module by its `@core/`
   alias and never repeats its symbol list.
3. **`architecture-core.md` is cut back to the system:** how swarmAg composes `core/`, and every
   guarantee, including those `core/` implements. Its `core/` construction detail moves to
   CONVENTIONS, which points up for the guarantees it relies on. Each statement stays at its rank
   in the authority chain.
4. **The backlog entry "`architecture-core.md` is base context and has never been measured for
   scan cost" joins this effort.**

## Objective

Give `core/` one coherent account across its three artifacts, with each concern stated once.

- **`source/core/`** is what exists. It is a derived artifact: where it conflicts with the
  documents, the code is wrong (`architecture-core.md` §1.2; **amended 2026-10-19:** now §1.1).
- **`architecture-core.md`** owns the system: how swarmAg composes `core/` (the `api` namespace as
  boundary, RLS, edge functions, offline), its invariants, and dependency direction.
- **`CONVENTIONS.md`** is the guide to building with `core/` in any repository: when and how to use
  each capability, pointing to its module for what it provides. It travels with `core/` as a
  Seasons asset.

Done means every `core/` namespace in the survey below has guidance in CONVENTIONS.

## Placements: `architecture-core.md` §5, §6, §10.1.11 (reviewed by the CA, 2026-10-20)

| Content                                                                   | Placement                                                                                       |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| §5 intro, 5.1: the `api` namespace as boundary                            | stays                                                                                           |
| 5.2.1 contract shapes; `makeQuery`, `listAll`, `listPageLimit` usage      | CONVENTIONS, makers and contracts                                                               |
| 5.2.1 filter, search, order, and cursor semantics                         | `core/std` headers (`make-query.ts`, `api-contracts.ts`); §5.2.1 keeps swarmAg's declared reads |
| 5.2.2, 5.2.3 business-rule contract and typing                            | CONVENTIONS, makers and contracts                                                               |
| 5.2.4 `ApiError` and its handling                                         | CONVENTIONS, error handling; "all client makers throw `ApiError`" stays                         |
| 5.2.5 contract properties; 5.2.6 boundary checks and declared write scope | stays                                                                                           |
| 5.2.6 `makeScope` usage                                                   | CONVENTIONS, makers and contracts                                                               |
| 5.2.6 the three scope rules                                               | split: meaning stays, rule to CONVENTIONS                                                       |
| 5.3, 5.3.1 maker catalog and pattern                                      | CONVENTIONS, makers and contracts; wrappers to services                                         |
| 5.4–5.6 application rules, RLS, edge functions                            | stays                                                                                           |
| 5.7.1, 5.7.2, 5.7.4, 5.7.6 RPC use, security model, location              | stays                                                                                           |
| 5.7.3, 5.7.5 RPC naming and parameters                                    | CONVENTIONS, remote persistence                                                                 |
| 6.1–6.4, 6.6 configuration pattern, providers, examples                   | CONVENTIONS, runtime configuration, merged into §11                                             |
| 6.3.2 UX backend binding; 6.5 environment files                           | stays                                                                                           |
| 10.1.11 closed `core/std` imports                                         | CONVENTIONS §3 Imports                                                                          |

Query and cursor semantics belong to `core/`, which every repository using it relies on: kept in
`architecture-core.md` they would stay in swarmAg, and in CONVENTIONS a behavioral contract would
sit in a guide. The headers are the reference (Decision 2); `wrap-http-handler.ts` is the precedent
for semantics in a level 3 header. Code ranks lowest, so the semantics move down the chain,
accepted for a library whose code is its specification. The closed-imports rule governs
`core/std` internals, travels with `core/`, and is guard-enforced.

## What a first survey found (2026-10-03)

| `core/` namespace | Contents                                                                      | CONVENTIONS coverage                                                      |
| ----------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `cfg/`            | `Config`, runtime providers                                                   | §11, thorough                                                             |
| `std/`            | Primitives, relations, compositions                                           | §8.1 type table                                                           |
| `std/`            | `makeAdapter`                                                                 | §10.3                                                                     |
| `std/`            | Protocols: `CreateFromInstantiable`, `UpdateFromInstantiable`, `ScopedUpdate` | None                                                                      |
| `std/`            | Validators: `expect*`, `ExpectResult`, `notValid`                             | Only inside the §9.4 example                                              |
| `std/`            | Helpers such as `demandOne`                                                   | None                                                                      |
| `api/`            | Contract decomposition, `ApiError`, `checkApiError`, pagination helpers       | None. §15 says to throw `Error`; the API layer's convention is `ApiError` |
| `cli/`            | Client makers                                                                 | §10.1: one generic paragraph                                              |
| `svc/`            | Service wrappers: `wrapBusRuleHttpHandler`, shims                             | None                                                                      |
| `db/`             | Supabase and IndexedDB singletons                                             | None; `architecture-core.md` covers "apps never import these"             |

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

- How to resolve the §15 conflict between "throw `Error`" and `ApiError`.
- Which new conventions are guard-enforceable, as candidates for the backlog entry "No guard
  enforces conformity to established conventions".

## Approach

1. Inventory `core/`'s exports by namespace, from the code.
2. Map each export to where `architecture-core.md` and CONVENTIONS describe it, if anywhere.
3. Classify each mapping as meaning, rule, or reference, and propose a placement.
4. Decide the placements.
5. Draft the document changes.

## Constraints

- **Documentation only,** apart from comment-only header edits in `core/` that carry `core/`
  semantics (Placements). A divergence found in `core/` is a strict-scrutiny matter: report it
  and escalate, never fix it in passing.

- **From the scan-cost backlog entry (Decision 4).** `architecture-core.md` is base context for
  every topic, and the largest part of it. Classify its content (what constrains, what maps, what
  is reference) before cutting, and review that analysis before restructuring: a wrong cut is felt
  in every session at once. A compact companion document is not an option; the precedent,
  `ux-components-guide-lite.md`, was retired 2026-10-19 because it did not improve AI work.

## Out of scope

- Changes to `core/` code.
- `domain/`.
- The design of the layer-6 form-scope abstraction (only its outcome feeds this brief).

## Checks

`deno task fmt:check` and `deno task check` after each document change. Every pointer between the
two documents must resolve, and every statement must match the code as it stands.

## Amendment — 2026-10-04 — Inputs from the Users form-scope effort

Recorded by the AI Architect when `effort/completed/2026-10-03-users-form-scope-brief.md` closed.
Two inputs for the inventory:

- **A new `core/` export.** `core/std/make-scope.ts` (`makeScope`, `makeAdaptedScope`, `Scope`,
  `AdaptedScope`, `ScopeDraft`, `DraftOf`) is exported through `@core/stdx` (`e4a4cf1`). Whether
  CONVENTIONS names `makeScope` beside `makeAdapter` (§10.3) was deferred to this brief.
- **An unwritten import rule, now uniform in the code.** No module imports its own namespace
  through a barrel or an alias: a `core/std` file imports siblings directly, never `@core/std` or
  `@core/stdx`, and a `core/{namespace}` file imports siblings relatively (`./…`). The CA
  confirmed the rule on 2026-10-04, and the last exceptions (`make-scope.ts`,
  `wrap-http-handler.ts`, `make-supabase-edge-auth.ts`) were fixed. CONVENTIONS §3 bans relative
  imports only across top-level namespaces; it does not yet state this rule.

## Amendment — 2026-10-08 — Constant naming rule

Added at the CA's direction during the 2026-10-08 review of
`effort/completed/2026-10-06-instantiable-adapt-brief.md`. The rule is general, not specific to
`core/`; the CA placed it here as the CONVENTIONS reconciliation task, which narrows the
out-of-scope line above for this one rule.

- **Objects are PascalCase; values are SCREAMING_SNAKE.** CONVENTIONS §4.2 has two rows for
  constants: "const-as-class" (PascalCase, example `HttpCodes`) and "Global immutable constants"
  (SCREAMING_SNAKE, examples `LOG_LEVELS`, `HTTP_METHODS`). It does not state what separates them.
  The CA ruled 2026-10-08: SCREAMING_SNAKE is for scalar values and collections of values,
  including const-enum tuples (§9.2, `CUSTOMER_STATUSES`); every object constant is PascalCase,
  whether pure data (`HttpCodes`) or behavior (`Routes`, `AppState`), exported or module-private.
  The const-enum idiom is the reason: a SCREAMING_SNAKE name reads as a tuple with a derived type.
- **Applied in the code the same day.** The five module-private SCREAMING_SNAKE objects were
  renamed: `TargetKeywords` (`list-supabase-targets.ts`), `Replacements` (`guard-bare-html.ts`),
  `NamespaceDirs` and `AllowedDeps` (`guard-architecture.ts`), `CustomerStatusBadges`
  (`customer-manager.tsx`). No SCREAMING_SNAKE object constant remains.
- **For the reconciliation:** state the distinction in §4.2 (a governance file: committed with the
  governance-gate bypass), and consider whether a guard can enforce it.
- **Also for the reconciliation: CONVENTIONS §10.3.** Its `QuestionAdapter` example restates the
  lifecycle mappings. It should spread `InstantiableAdapt`, as `domain-archetypes.md` §6 now does
  (`effort/completed/2026-10-06-instantiable-adapt-brief.md`, shipped 2026-10-08); deferred here
  from that brief.
- **Evidence for the import rule's guard.** In the same production, `make-adapter.ts` imported
  `instance.ts` through its own namespace's alias; the CA caught it in review. The 2026-10-04
  import rule (amendment above) is still written nowhere a producer would read it, and no guard
  enforces it.

## Amendment — 2026-10-11 — When a contract gets its own file

Added at the CA's direction during the 2026-10-11 list-query design
(`effort/completed/2026-10-11-list-query-brief.md`). The rule is followed throughout `core/std` and
`core/cli`, and stated nowhere.

- **A contract gets its own file when more than one implementation makes it substitutable; a maker
  whose types only it produces keeps them in its own file.** `api-contracts.ts` stands apart
  because several makers in `core/cli` implement the CRUD contract and `front` consumes it.
  `make-adapter.ts` and `make-scope.ts` keep their types beside their makers: nothing substitutes
  for them, so a separate contract file would add a hop with no benefit.
- **A branded type must share its producer's file.** `make-query.ts` keeps `Query<T>` beside
  `build`: the brand's `unique symbol` stays unexported, so only `build` can construct a value.
- **For the reconciliation:** state the rule in CONVENTIONS §10.2 Contracts, a governance file.

## Amendment — 2026-10-13 — Soft-delete read rule

Added at the CA's direction during the AI Coding Engine review of
`effort/completed/2026-10-13-soft-deleted-references-brief.md`.

- **CONVENTIONS §14.2.10 conflicts with that brief's decision 2.** Its third bullet reads "RLS
  `SELECT` policies must filter soft-deleted rows". Under the brief, a reference resolves its
  soft-deleted target: deleted rows stay readable by id, RLS governs who may read, and lists
  exclude deleted rows as an API contract (its amendment 4).
- **A targeted gate override** for that bullet, at the CA's discretion, lets the brief's
  production proceed before this reconciliation (its amendment 1).
- **For the reconciliation:** §14.2.10 states that RLS `SELECT` policies do not filter soft-deleted
  rows and that lists do; "Active rows are `deleted_at IS NULL`" stands. A governance file:
  committed with the governance-gate bypass.

## Amendment — 2026-10-18 — Makers as a first-class mechanism

Added at the CA's direction. Makers are a considered, substantive, generative feature of the
architecture, yet they lack prominence and an explicit definition, and CONVENTIONS reads as if it
forbids them.

- **The census.** 18 exported makers across `core/std` (`makeAdapter`, `makeScopedUpdate`,
  `makeScope`, `makeAdaptedScope`, `makeQuery`, `makeCorsHeaders`), `core/cli` (the CRUD and
  business-rule clients, `makeSupabaseListRequest`), `core/svc` (`makeSupabaseEdgeAuth`),
  `front/api` (`makeAuthUsers`), and `ux/shell` with `front/app/shell` (`makeAnonymousShell`,
  `makeDashboardShell`, generic then swarmAg-bound). Service wrappers (`wrap*`) mirror makers at
  the inbound boundary.
- **Where they are defined.** `architecture-core.md` §5.3 covers only client makers, as "factory
  functions that produce clients conforming to contracts". CONVENTIONS §10.1 is three sentences;
  one reads "They do not create instances of an object they create code."
- **The apparent conflict.** CONVENTIONS §7.6 bans "meta-programming"; §10.1 says makers "create
  code". `source/` uses no `Proxy`, `Reflect`, `eval`, or `new Function`.
- **For the reconciliation:**
  - `architecture-core.md` gives makers their own section as a fundamental mechanism: a maker
    takes a declarative, typed specification and returns an implementation conforming to a stated
    contract, with no hidden behavior. It covers the tiers and wrappers as the inbound mirror;
    §5.3 points to it.
  - CONVENTIONS §7.6 is restated as the rule it is, **No magic**, with its corollary **Explicit
    and obvious**, and without exceptions or carve-outs. Makers conform because they are explicit
    and obvious: the specification is visible at the call site, and the contract is stated in an
    interface.
  - CONVENTIONS §10.1 is rewritten clearly, and carries the 2026-10-11 contract-file rule (above).
  - README §2.4.1 names makers.
  - Both CONVENTIONS edits are to a governance file: committed with the governance-gate bypass.

## Amendment — 2026-10-19 — Deferred encapsulation, the second contract-file case

Added at the CA's direction during the CA+AA review of the account manager brief's production
scope (`effort/completed/2026-10-08-account-manager-brief.md`), when the session user contract was
placed in `ux/shell/runtime/session-contracts.ts` beside `SessionCoordinatorContract`.

- **The 2026-10-11 rule covers one case: substitutability.** A contract gets its own file when
  more than one implementation makes it substitutable, as the `makeCrud*` clients implement
  `api-contracts.ts`.
- **The second case: deferred encapsulation.** A toolkit declares, as a contract, what the
  application must supply, and each application supplies exactly one implementation. Nothing is
  swapped at runtime; the contract exists so the dependency runs one way (open-closed applied to
  dependency direction: `ux/` never imports `front/`). `SessionCoordinatorContract` and the session
  user contract are the cases: every application supplies one session coordinator and one user
  provider. Such contracts share a file named by their subject, here the session; a contract the
  toolkit implements itself stays with its implementation (`SessionStateContract` in
  `session-state.ts`).
- **For the reconciliation:** CONVENTIONS §10.2 states both cases beside the 2026-10-11 rule. A
  governance file: committed with the governance-gate bypass.

## Amendment — 2026-10-19 — Backlog entry text folded in

The backlog entry "`core/`, `architecture-core.md`, and `CONVENTIONS.md` have never been reconciled" carried its own description, now replaced there by a link to this
brief. Its text, kept here so nothing is lost:

> CONVENTIONS covers `core/`'s vocabulary (types, configuration, adapters) but hardly any of
> the patterns built on it: protocols, validation, CRUD contracts, `ApiError`, client makers,
> and service wrappers. Some of that lives in `architecture-core.md` §5. Nothing establishes
> which document owns what. Several decided rules are documented nowhere durable, among them
> the 08-30 rule that every form must declare its update scope and the 10-03 rule that a
> scope's unit is the attribute.
>
> Design record: `effort/active/2026-10-03-core-reconciliation-brief.md`.
>
> Picking this up: together with, or sequenced against, the scan-cost entry above, since both
> restructure `architecture-core.md`.

## Amendment — 2026-10-05 — Type-import form (recorded 2026-10-19)

Decided by the CA on 2026-10-05; the code base conforms.

- An import where every name is a type uses `import type`.
- An import that mixes values and more than one type name is split into a value import and an
  `import type` from the same module.
- An import that mixes values and exactly one type name may keep it inline.

**For the reconciliation:** CONVENTIONS §3 states the rule. A governance file: committed with the
governance-gate bypass.

## Design history

- **From reconciliation to guide (2026-10-20).** The brief first divided `core/` into meaning
  (`architecture-core.md`), checkable rules (CONVENTIONS), and reference belonging to neither,
  with CONVENTIONS content not about `core/` out of scope. The CA recast it: CONVENTIONS becomes
  the whole programming guide with full `core/` coverage, the file headers are the reference, and
  `architecture-core.md` keeps only the system. A separate reference document was considered and
  rejected: it would duplicate the headers and add to every session's base context.

_End of Brief_
