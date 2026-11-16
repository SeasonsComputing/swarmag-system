# Tags → Facets — Brief

**Closed 2026-10-08: shipped, reviewed, and independently verified.** Chosen 2026-10-06 as
roadmap §4's tags step and written the same day from a CA + AI Architect exploration session.
Reviewed by the AI Coding Engine on 2026-10-06; the amendment at the end resolves that review and
marks the items it changes. Produced by the AI Coding Engine and verified by the AI Architect
against the diff and check output; stage genesis and the edge deploy preceded the CA's walkthrough,
which passed. Shipped in `56a2b99`. Seeding questions it raised are carried by
`effort/pending/2026-10-06-facets-workflow-seeding-brief.md`.

## What triggered it

Roadmap §4's first step was the tags decision: are tags freeform (`Note.tags` is `string[]`) or
drawn from a controlled set, and where does `TagsField` live? Exploring it showed the question was
wrong. The reasoning behind tags was never written down: the domain was designed in December 2025
– February 2026 in AI chats outside this repository, before the effort discipline existed, and
only the CA's memory held it.

## What the repository held

Tags in the domain, all `CompositionMany<string>`, with no vocabulary, seed data, or const-enum
behind them; validators checked only that each tag is a non-empty string:

| Abstraction | Attribute                |
| ----------- | ------------------------ |
| `Note`      | `tags`                   |
| `Workflow`  | `tags`                   |
| `Service`   | `tagsWorkflowCandidates` |

Git history begins 2025-12-09; in every commit since, tags appear only on those three. The CA
recalls tags on every abstraction that has notes, consolidated onto `Note` for simplicity; if so,
that happened before the repository's history. No fixture carries a Service or Workflow.

## Decisions

1. **Two ways to classify.** System-chosen classification is fixed by design: a separate attribute
   (`JobAssessment.risks`), a const-enum (`ServiceCategory`, `Chemical.usage`), or a fixed field
   (`Note.visibility`). Classification driven by users and data is created without code or schema
   changes.
2. **User-driven classification is curated.** Curators create values; everyone else applies them.
   Uncurated tags drift until code carries a massive union to represent one notion (the CA's
   experience with web tags and data-mined tags).
3. **No free-form tag system until a concrete consumer exists.** Real applications use tags where
   users own the categories of a large, mixed, growing collection they search. In swarmAg only
   Notes fit, and only in the future. `Note.tags` is removed. Its reason is kept for
   re-introduction: notes hold unstructured operational knowledge, and tags would carry the output
   of analysing them (the CA's experience at Umbria with user-generated content, and custom runs
   for banks, credit-card companies, and survey firms), as a derived attribute
   (`architecture-core.md` §5.2.6). It returns as one optional key when a feature needs it.
4. **Workflow is the general operations construct.** It templates any structured activity: drone
   jobs, mesquite removal, asset maintenance, inventory. Services are one of several contexts that
   must find candidate Workflows among hundreds, so the binding must leave Workflows neutral about
   their consumers. A junction per consuming context would not.
5. **Facets, not flat tags.** One abstraction may need different classifications for different
   bindings: a Workflow matched against Services and against Assets. Following the feed model
   (Atom's `<category term scheme label>`, RSS 2.0's `<category domain>`), a value belongs to a
   scheme, and matching compares values within one scheme.
6. **A curated catalog plus references.**

   | Part      | Shape                                                                                    |
   | --------- | ---------------------------------------------------------------------------------------- |
   | Catalog   | `Facet = Instantiable & { scheme, code, label, description?, active }`, a `facets` table |
   | Reference | `facets: CompositionMany<string>` of `scheme:code`, on Service and Workflow              |
   | Index     | scheme → codes, built from the whole catalog in the app                                  |

   - **`code`** is the key the system stores and never changes, paired with the `label` people
     read and curators edit (country codes, ICD codes, FHIR `{ system, code, display }`).
   - **`:`** is the reserved separator. `/` would collide with path-like hierarchy in codes;
     `service:aerial/spray` is unambiguous.
   - **Integrity without a foreign key.** _[Clarified by the amendment "ACE review resolved", Decision 1: a curation obligation,
     not a database guarantee.]_ A reference is a natural key, so a code never changes
     once used, and `UNIQUE (scheme, code)` prevents reuse with another meaning. Membership is
     enforced where references are created (a picker fed from the index); domain validators are
     infrastructure-agnostic and check only the reference's format.
   - **Retiring is `active: false`,** as `AssetType.active` does. Soft delete would hide the row:
     CONVENTIONS §10.10 has every `SELECT` policy filter soft-deleted rows, and a retired facet
     must still resolve the label of existing references. Soft delete is reserved for a facet
     created by mistake and never referenced.
   - **No label on references:** the label lives once, in the catalog.
7. **`Facet` lives in Common.** Common groups abstractions used across topics and owned by none of
   them, whatever their archetype; classification is cross-cutting. `domain-model.md` §3.6 had
   drifted from that definition and is restored.
8. **Read access is a Query State module** _[Revised by the amendment "ACE review resolved", Decisions 2–4: no derived index;
   `failed()` added.]_ (`architecture-front.md` §8.4). The catalog is server
   data, which §9.6.1 assigns to TanStack Query. `useFacets(): FacetsState` hides the query behind
   `ready`, `schemes`, `codes`, `label`, `labelRef`, `labelRefs` (an array of `scheme:code`
   references to their labels, in order), and `refresh`. The `QueryClient` lives in the
   component tree (`bootstrap.tsx`), so the state is a hook, not a module singleton. It is built
   now, ahead of its first consumer: its design is fixed by the catalog's shape, and its logic is a
   pure, unit-tested index builder beneath a thin hook.
9. **Removing an attribute from a composition is a schema change,** even though no DDL changes:
   stored data stops conforming to the model. Stage is brought back into line by RDBMS genesis.

## Production scope

Operating mode: **Foundation** (domain attributes, a shared common abstraction, a new table).

1. **Documentation.** **Done 2026-10-06.** `domain-data-dictionary.md`: §4.4 `Note` without `tags`; §4.5 `Facet` with `active` and the reference and retirement rules; §8.2 `Service` and §10.11 `Workflow` with `facets`. `domain-model.md` §3.6 restored. `domain-archetypes.md` §6.4 `NoteAdapter` example. `architecture-front.md` §8.4 Query State Pattern, §9.6 table row, §11.6, and `front/app/stores/` in the §2 and §10.1.3 trees.

2. **Domain, by hand.** `common.ts`: `Note` loses `tags`; `Facet` added. `common-adapter.ts`: `NoteAdapter` loses `tags`; `FacetAdapter` added. `common-validator.ts`: `isNote` loses its `tags` check; `validateFacetCreate`/`validateFacetUpdate` (non-empty `scheme`, `code`, `label`; no `:` in `scheme` or `code`; boolean `active`); an exported `isFacetRef` guard (exactly one `:`, non-empty on both sides). New `common-protocol.ts`: `FacetCreate`, `FacetUpdate`. `service.ts`, `workflow.ts`, their adapters, and validators: `facets` replaces `tagsWorkflowCandidates`/`tags`, validated with `isFacetRef`. `schema.sql`: a `facets` table (drop order, `UNIQUE (scheme, code)`, RLS and indexes on the pattern of the other catalog tables); `services.facets` and `workflows.facets` replace the two tag columns (JSONB, array CHECK); the seeded Service row. Hand edits must equal what domain genesis would produce from the data dictionary.

3. **Front.** _[Revised by the amendment "ACE review resolved", Decisions 3 and 4: no index builder; the loader reads the first
   page.]_ `api.Facets`: `makeCrudSupabaseClient<Facet>` in `api.ts`. `front/app/stores/facets-state.ts`: `useFacets` per §8.4, suite-wide, over a pure index builder and a loader that reads every page (the list contract is paged; a first-page load would silently truncate the catalog). `customer-state.ts` (`newCustomerNote`, `cloneNote`) and `user-state.ts` (`userDraft`) note literals.

4. **Tests.** `customer-api-test.ts`, `make-scope-test.ts` note literals. `Facet` adapter round-trip. Validators: `:` rejected in `scheme`/`code`; `isFacetRef` accepts `service:aerial/spray` and rejects `service`, `:x`, `x:`, `a:b:c`. Index builder: grouping by scheme, `codes()` returns only active codes, `label()` resolves inactive codes, `labelRefs()` preserves order. _[Removed by the amendment "ACE review resolved", Decision 3.]_

5. **RDBMS genesis.** The CA runs `db-reset --target stage`.

6. **Edge.** `deno task edge-sync`, then deploy, before the app: the deployed `isNote` requires `tags`, so saving a User with notes fails until it is replaced.

7. **App.** Ship.

**Out of scope:** facet values (schemes and codes), a Facet Manager, facet pickers in any form,
facets on Assets or Chemicals, seeding, and restricting catalog writes to curators (every catalog
table today allows authenticated writes; restricting them is one change across all of them).

## Checks

- `deno task check`, `deno task fmt:check`, and the guards.
- `deno task test`, with `users-api-test.ts`'s bootstrap failure reported as known.
- `STYLE_AUDIT` per `AGENTS.md` §2.2.

## Verification

- The AI Architect re-derives the report against the diff and the check output (EFFORT §6).
- The CA's walkthrough in Admin after genesis and the edge deploy: User and Customer notes save
  and reload; Customer Manager and Onboarding unchanged. Facets have no surface yet; their coverage
  is the tests above.

## Escalation boundaries

Stop and report if a hand edit cannot match what domain genesis would produce, a change reaches
`core/` or a contract, or the edge deploy cannot precede the app.

## Design history

How the decisions were reached, kept because each turn changed the design:

- **Freeform or controlled?** became **vocabulary scope**, then **curation**, once tags were seen
  as classification driven by users and data.
- **Note tags** looked purposeless until the CA recalled their analysis purpose; they were then
  deferred, not kept, because no consumer exists.
- **Service–Workflow binding:** the AI Architect first recommended a junction on the pattern of
  `ServiceRequiredAssetType`. Workflow's role as the general operations construct reversed that:
  a junction per consuming context does not scale, and binding should not depend on the consumer.
- **Flat tags → facets:** the CA's feed-model point (categories with schemes versus free-form tags)
  exposed that one abstraction needs several classifications.
- **Shape:** `{ scheme, term }` as a composition violated normal form; a scheme-keyed map would have
  been the domain's first dictionary-typed attribute; the CA's catalog-plus-reference model fixed
  both. `term` became `code`.
- **Placement:** the AI Architect argued `Facet` needed its own topic, citing protocols, API keys,
  and lifecycle. The CA rejected those as implementation properties: Common is defined by semantic
  ownership, and once held the Instantiable `Question`. `domain-model.md` §3.6's original wording
  (`777238a`) confirmed it.
- **Retirement:** first soft delete, then `active`, when CONVENTIONS §10.10 showed soft-deleted
  rows are unreadable through RLS.
- _[Revised by the amendment "ACE review resolved", Decision 3.]_ **The Query State module** was nearly deferred for lack of a consumer; built now because its
  design is fixed and its logic testable without one.

## Amendment — 2026-10-06 — ACE review resolved

The AI Coding Engine reviewed the brief statically and found the design sound, retaining the
catalog-plus-reference model, Common placement, `active` retirement, the Query State hook, and the
release order. It raised four points. The AI Architect proposed resolutions; the CA rejected
those that were design specific to facets ("hyper-localized feature design tends to be revisited")
and decided the rest. The test applied: would the next Query State module, or the next catalog
table, do the same thing?

### Decisions

1. **Key stability is a curation obligation, stated as one.** `UNIQUE (scheme, code)` prevents
   duplicate pairs only; it does not stop a row's `scheme` or `code` from changing, or a referenced
   row from being soft-deleted. Once referenced, `scheme` and `code` never change, and soft delete
   is only for a facet created by mistake and never referenced. Nothing can edit facets yet; the
   Facet Manager will enforce it by making `scheme` and `code` create-only in its update scope.
   `facets` takes the standard catalog RLS, like `services`. Rejected: a key-immutability trigger
   (the schema's first) and omitting the `DELETE` policy, which would make `facets` the one table
   with special rules, guarding against an editor that does not exist yet. Changing a code's
   meaning cannot be enforced either way.
2. **Lookups return the reference when unresolved.** `label()`, `labelRef()`, and `labelRefs()`
   return the `scheme:code` reference itself while the catalog loads or when a reference is
   unknown, showing real data rather than inventing a label. `schemes()` includes schemes whose
   facets are all inactive; `codes()` offers only active ones.
3. **No derived index.** The catalog is small, so `FacetsState`'s methods work directly on the
   loaded `Facet[]`: `codes()` is a filter, `label()` a find. With nothing derived, no companion
   module or index tests are needed, and §8.4 needs no rewording. Query code is verified with its
   first consumer, as the managers' `createQuery` usage is. Rejected: a companion `facet-index.ts`
   imported by the hook and its tests.
4. **Paging is fixed once, for every list.** Loading a whole collection is the defect in the
   backlog entry "Managers load only the first page of their Collection", and its fix belongs
   there. The catalog is empty in this production (facet values are §6), so a first-page load is
   correct now. That backlog entry is a prerequisite for §6, before any facet values exist.
   Rejected: a facets-specific loader that reads every page, and its tests.
5. **`failed()` joins the Query State contract.** `ready()` alone makes a failed load
   indistinguishable from one still loading. Every Query State module exposes both
   (`architecture-front.md` §8.4); facets is the only one today.
6. **`/` carries no meaning yet.** A code may contain `/`, with no hierarchy or prefix-matching
   semantics until roadmap §6 decides otherwise.

### Production scope changes

- **Step 1, documentation (done 2026-10-06):** `architecture-front.md` §8.4 adds `failed()` and
  shows lookups over the loaded list; `domain-data-dictionary.md` §4.5 states key stability as a
  curation obligation; the backlog entry on paging records the §6 prerequisite.
- **Step 3, front:** `useFacets` over the loaded list, with no index builder; the loader reads the
  first page.
- **Step 4, tests:** the index-builder tests are removed; the adapter and validator tests stand.

_End of Brief_
