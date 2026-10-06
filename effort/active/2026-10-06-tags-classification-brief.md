# Tags & Classification — Brief

**Active.** Chosen 2026-10-06 as roadmap §4's tags step. Recorded the same day from a CA + AI
Architect exploration session. Three amendments at the end decide the effort: the second
supersedes the first's facet shape and production scope, and the third reopens Settled 6. They
hand the seeding questions to `effort/pending/2026-10-06-facets-workflow-seeding-brief.md`. Read
the amendments before the original text.
The documentation half of the production is done: `domain-data-dictionary.md`,
`domain-archetypes.md`, `domain-model.md`, and `architecture-front.md` already describe the
decided model.

## What triggered it

Roadmap §4's first step was the tags decision: are tags freeform (`Note.tags` is `string[]`) or
drawn from a controlled set, and where does `TagsField` live? Exploring that question showed it
was the wrong question. The reasoning behind tags was never written down. The domain was designed
in December 2025 – February 2026 in AI chats outside this repository, before the effort
discipline existed, and only the CA's memory held it. This brief records what that exploration
recovered.

## The vision (CA, 2026-10-06)

Tags are a **classification idiom**, used for filtering and search. They are a foundational
construct that job workflow seeding uses:

- A Workflow carries classifications such as `aerial-service` and `aerial-job-prep`; the drone
  Service carries the same ones.
- Initial job assessment begins with selecting Services. The Services' classifications filter the
  list of Workflows.
- The sales rep chooses Workflows from that filtered set to define the job.

## What the repository holds

**Tags in the domain**, all `CompositionMany<string>`, with no vocabulary, seed data, or
const-enum behind them; validators check only that each tag is a non-empty string:

| Abstraction | Attribute                |
| ----------- | ------------------------ |
| `Note`      | `tags`                   |
| `Workflow`  | `tags`                   |
| `Service`   | `tagsWorkflowCandidates` |

**History.** Git history begins 2025-12-09. In every commit since, tags appear only on those
three: `Note` from the first commit (`777238a`, as `tags?: string[]`), `Workflow` by `c08c49d`
(2026-02-22), and `Service.tagsWorkflowCandidates` from `d0bfd97` (2026-02-25). The CA recalls
tags on every abstraction that has notes, consolidated onto `Note` for simplicity; if so, that
happened before the repository's history.

**`domain-model.md`** has no prose about tags, classification, filtering, or seeding. §2.1 says
"Each Service Category has Workflows suitable for performing services within that category",
which places the Service–Workflow link at the category level.

**User story §2.1.3** describes seeding as automatic: "Preload an assessment workflow based on the
Service type (default workflow per category/SKU)." The vision has the rep choose from a filtered
set instead.

**Abstractions holding Notes** (`CompositionMany<Note>`): `User`, `Customer`, `CustomerSite`,
`Service`, `Asset`, `Chemical`, `Workflow`, `Task`, `Answer`, `JobAssessment` (`notes` and
`risks`), `JobPlan`, `JobPlanAssignment`.

**Every association to or from Assets and Chemicals:**

| From                         | Relation                                      | Kind                                                        |
| ---------------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| `Asset.type`                 | `AssociationOne<AssetType>`                   | many-to-one                                                 |
| `ServiceRequiredAssetType`   | junction, `Service` ↔ `AssetType`             | many-to-many: a Service requires kinds of asset             |
| `JobPlanAsset`               | junction, `JobPlan` ↔ `Asset`                 | many-to-many: a plan assigns specific assets                |
| `JobPlanChemical.chemicalId` | `AssociationOne<Chemical>` on an Instantiable | a plan's chemical usage, with amount, unit, and target area |

Nothing links Chemicals to Services. Assets reach a job structurally (Service → AssetType → Asset
→ JobPlan); Chemicals are chosen per Job Plan.

## Settled in exploration

1. **Two ways to classify.** System-chosen classification is fixed by design: a separate
   attribute (`JobAssessment.risks`), a const-enum (`ServiceCategory`, `Chemical.usage`), or a
   fixed field (`Note.visibility`). Tags are classification driven by users and by data, created
   without code or schema changes.
2. **Freeform versus controlled was the wrong pairing.** The question is the vocabulary's
   **scope**: one shared vocabulary, or one per context.
3. **User-applied tags are curated.** Curators create tags; everyone else applies them from the
   list. Uncurated tags drift until code carries a massive union to represent one notion (the
   CA's experience with web tags and data-mined tags).
4. **`Note.tags` exists for analysis.** _[Superseded by the amendment "Tags become facets", Decision 1: `Note.tags` is removed; this reasoning is kept for its re-introduction.]_ Unstructured notes are a deep well of operational
   knowledge, and mining them finds insight nobody designed a field for (the CA's experience at
   Umbria: user-generated content, and custom runs for banks, credit-card companies, and survey
   firms). That makes `Note.tags` the place analysis output would go: a **derived attribute**
   (`architecture-core.md` §5.2.6), written by analysis and edited by no form. The pipeline
   normalizes its vocabulary, so the curation concern does not apply.
5. **The Notes Editor never shows tags.** They stay out of its scope, which removes roadmap §4's
   tags step: the Notes Editor can be briefed without a tags decision.
6. **Assets and Chemicals are not tag-oriented for seeding.** _[Reopened by the amendment "Settled 6 reopened": open in `effort/pending/2026-10-06-facets-workflow-seeding-brief.md`, Open 5.]_ Their paths to a job stay
   structural.

## Open

1. **Service-to-Workflow seeding as a first-class abstraction.** _[Reversed by the amendment "Tags become facets", Decision 2: Workflows need a consumer-neutral binding, now facets.]_ The AI Architect recommends a
   junction, on the pattern of `ServiceRequiredAssetType`, over matching tags: it states the link
   explicitly, the foreign key checks it, and a misspelled tag can no longer fail silently. It
   gives up the indirection of tagging a new Workflow once for every matching Service, which is
   cheap at swarmAg's scale. If adopted, `Workflow.tags` and `Service.tagsWorkflowCandidates`
   retire.
2. **Service or Service Category?** _[Moved to `effort/pending/2026-10-06-facets-workflow-seeding-brief.md`, Open 4.]_ Does a Workflow belong to a Service, or to a Service Category
   as `domain-model.md` §2.1 says? This decides what the junction relates.
3. **Note analysis output.** _[Deferred with free-form tags: the amendment "Tags become facets", Decision 1.]_ Is the analysis meant to write classifications back onto each Note
   (keep `Note.tags`, derived), or to produce findings elsewhere (reports, insights, an analytics
   store), leaving `Note.tags` with nothing to hold?
4. **Curated tags for catalogs.** _[Moved to `effort/pending/2026-10-06-facets-workflow-seeding-brief.md`, Open 5, as facets for Assets and Chemicals.]_ The CA thinks Assets and Chemicals probably should carry tags,
   for filtering and searching their own catalogs (chemicals by target crop or pest, assets by
   capability). If so: curated, and stored how? Two shapes were discussed:
   - **Curated keys** in `string[]`, grouped into a master list by catalog. No junctions or joins,
     matching the backend's early choice to avoid normalization costs; a key never changes once
     used, and a merge rewrites stored keys.
   - **Ids** through junctions to an Instantiable `Tag`. Renames are free and references cannot
     dangle; each tagged abstraction needs a junction.
5. **Chemical selection at planning.** _[Moved to `effort/pending/2026-10-06-facets-workflow-seeding-brief.md`, Open 6.]_ With no Chemical–Service link, a planner chooses from the
   whole chemical list. Intended, or does chemical selection need a filter of its own?
6. **User story §2.1.3** _[Moved to `effort/pending/2026-10-06-facets-workflow-seeding-brief.md`, Open 7.]_ needs rewriting to match the vision once the seeding mechanism is
   decided.

## Consequences outside this brief

- **Roadmap §4 Notes Editor:** its tags step falls away (Settled 5), so the next step is the
  Notes Editor brief.
- **Roadmap §1 / Onboarding:** Initial Job Assessment depends on roadmap §6, so the Onboarding
  Wizard cannot finish before §6.

Neither roadmap change is made by this brief.

## Amendment — 2026-10-06 — Tags become facets

The exploration continued past the original text and reversed parts of it. Recorded by the AI
Architect; every decision below is the CA's.

### Decisions

1. **No free-form tag system until a concrete consumer exists.** Real applications use tags where
   users own the categories of a large, mixed, growing collection they search. In swarmAg only
   Notes fit that pattern, and only in the future. `Note.tags` is **removed**. Its reason is kept
   here for re-introduction: notes hold unstructured operational knowledge, and tags would carry
   the output of analysing them, as a derived attribute. It returns as one optional key when a
   feature needs it.
2. **Workflow is the general operations construct.** It templates any structured activity: drone
   jobs, mesquite removal, asset maintenance, inventory. Services are one of several contexts that
   must find their candidate Workflows among hundreds. That is why a binding mechanism, not a
   junction per context, is needed (reversing Open 1's junction recommendation), and why the
   binding must leave Workflows neutral about their consumers, so that how asset maintenance
   chooses a Workflow can be decided later.
3. **Flat tags are replaced by facets.** One abstraction may need different classifications for
   different bindings: a Workflow matched against Services and against Assets. Following the feed
   model (Atom's `<category term scheme label>`; RSS 2.0's `<category domain>`), a classification
   belongs to a scheme, and matching compares terms within one scheme. This is the CA's earlier
   "curated master list grouped by catalog": the catalog is the scheme.
4. **The shape:**

   ```ts
   /** Curated classification of an abstraction along one facet: a term within a scheme. */
   export type Facet = { scheme: string; term: string }
   ```

   - It lives in `common.ts` (`domain-data-dictionary.md` §4.5), shared by any topic.
   - `Service` and `Workflow` each carry `facets: CompositionMany<Facet>`, replacing
     `tagsWorkflowCandidates` and `tags`.
   - No `label` on the instance: the label belongs to the curated vocabulary entry for
     `(scheme, term)`; copying it onto every instance lets the copies drift.
   - **Naming:** `facets` and `Facet`, from faceted classification. Rejected: `labels`
     (`Chemical.labels`), `kinds`/`types` (existing discriminators, `Asset.type`), `categories`
     (`Service.category`), `tags` (the deferred free-form construct), `terms`, `codes`,
     `classes`, and `classifications` (too long).
5. **The shape is decided now; the values are not.** Which schemes exist, which terms each holds,
   who curates them, and whether terms form a hierarchy (path-like terms fit the same shape) are
   §6 questions.
6. **Removing an attribute from a composition is a schema change,** even though no DDL changes:
   stored data stops conforming to the model. Stage is brought back into line by RDBMS genesis,
   not a data update.

### Production scope

Operating mode: **Foundation** (domain attributes, shared common abstraction).

| Step               | Work                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Documentation   | **Done 2026-10-06.** `domain-data-dictionary.md`: `Note` loses `tags` and "and taxonomy"; `Facet` added (§4.5, topic table); `Service` and `Workflow` carry `facets`. `domain-archetypes.md` §6.4: `NoteAdapter` example loses `tags`. `domain-model.md` §3.6: `Facet` row. `architecture-front.md` §11.6: the `/service` row says "facets".                                                                                                                                                                                                                                                                                   |
| 2. Domain, by hand | `common.ts`: `Note` loses `tags`; `Facet` added. `common-adapter.ts`: `NoteAdapter` loses `tags`; `FacetAdapter` added. `common-validator.ts`: `isNote` loses its `tags` check; `isFacet` guard added (domain-archetypes §5.5). `service.ts`/`workflow.ts` and their adapters and validators: `facets` replaces `tagsWorkflowCandidates`/`tags`. `schema.sql`: `services.facets` and `workflows.facets` replace the two tag columns (JSONB, array CHECK), and the seeded Service row. Hand edits must equal what domain genesis would produce from the data dictionary; domain genesis is reserved for archetype-level change. |
| 3. Front and tests | `customer-state.ts` (`newCustomerNote`, `cloneNote`), `user-state.ts` (`userDraft`), `customer-api-test.ts`, `make-scope-test.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 4. RDBMS genesis   | The CA runs `db-reset --target stage`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 5. Edge            | `deno task edge-sync`, then deploy. The deployed `isNote` requires `tags`, so the edge goes before the app or saving a User with notes fails.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 6. App             | Ship.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

Out of scope: facet values, a curated vocabulary abstraction, any facets UI, facets on Assets or
Chemicals, and seeding itself.

### Handed to §6

Open 1 (junction recommendation) is reversed by Decision 2. Open 2 (Service or Service Category),
Open 4 (curated catalog tags, now facets for Assets and Chemicals), Open 5 (chemical selection),
and Open 6 (user story §2.1.3) move to
`effort/pending/2026-10-06-facets-workflow-seeding-brief.md`. Open 3 (where note-analysis output
lives) is deferred with free-form tags (Decision 1).

## Amendment — 2026-10-06 — Facets become a curated catalog

Reviewing the first amendment's documentation, the CA reworked the facet shape. Recorded by the
AI Architect; every decision is the CA's. This supersedes Decision 4 and the production scope of
the previous amendment; Decisions 1–3, 5, and 6 stand.

### Decisions

1. **The `{ scheme, term }` composition is replaced.** As a composition it violates normal form:
   every entry repeats its scheme and the JSON key names. The CA's first alternative, a map of
   scheme to sorted terms, was sound but would have been the domain's first dictionary-typed
   attribute.
2. **Catalog plus reference.** The curated catalog is a table; consumers hold references; the
   app holds the index:

   | Part      | Shape                                                                   |
   | --------- | ----------------------------------------------------------------------- |
   | Catalog   | `Facet = Instantiable & { scheme, code, label, description? }`          |
   | Reference | `facets: CompositionMany<string>` of `scheme:code`, on Service/Workflow |
   | Index     | scheme → codes, built from the whole catalog in the app                 |

   This answers the seeding brief's open question on where the curated vocabulary lives, and keeps
   labels in one place.
3. **`code`, not `term`.** The value is a key: what the system stores and never changes, paired
   with the `label` people read and curators edit (country codes, ICD codes, FHIR
   `{ system, code, display }`). Atom's `term` is the same key, but only Atom readers know it.
4. **`:` is the reserved separator.** `/` would collide with path-like hierarchy in codes
   (`aerial/spray`); `service:aerial/spray` is unambiguous. Neither `scheme` nor `code` may
   contain `:`.
5. **Integrity without a foreign key.** A reference is a natural key, so a code never changes
   once used. Retiring is soft delete, and the retired row still resolves labels.
   `UNIQUE (scheme, code)` spans live and retired rows, so a code is never reused with another
   meaning. Membership is enforced where references are created (a picker fed from the index);
   domain validators are infrastructure-agnostic and cannot check it.
6. **`Facet` stays in Common.** Common groups abstractions used across topics and owned by none of
   them, whatever their archetype. Classification is cross-cutting. The AI Architect first argued
   for a topic of its own using protocols, API keys, and lifecycle; the CA rejected those as
   implementation properties, not the namespace's dimension (Common once held Instantiables with
   protocols, Job and Workflow hold several lifecycle abstractions, and `api` is keyed by
   abstraction, not topic). `domain-model.md` §3.6 had drifted the same way: the CA's original
   text (`777238a`, 2025-12-09) was "Common abstractions shared within the model", listing the
   Instantiable `Question`; value-object and lifecycle wording was added by 2026-02-12 and turned
   into rules on 2026-06-19 (`a19b544`). §3.6 is restored to the semantic definition.
7. **Read access is a Query State module.** The catalog is server data, which `architecture-front.md`
   §9.6.1 assigns to TanStack Query. `useFacets(): FacetsState` hides the query behind intent
   methods (`ready`, `schemes`, `codes`, `label`, `labelRef`, `refresh`). The `QueryClient` lives
   in the component tree (`bootstrap.tsx`), so the state is a hook, not a module singleton. The
   pattern is now `architecture-front.md` §8.4 Query State Pattern. The catalog load includes
   retired rows for labels; `codes()` returns only live ones.

### Production scope (supersedes the previous amendment's)

Operating mode: **Foundation**.

| Step               | Work                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Documentation   | **Done 2026-10-06.** `domain-data-dictionary.md` §4.5 `Facet` (Instantiable, reference rules), §8.2 `Service` and §10.11 `Workflow` (`facets` state attribute), `Note` without `tags`. `domain-model.md` §3.6 restored. `domain-archetypes.md` §6.4. `architecture-front.md` §8.4 Query State Pattern, §9.6 table row, §11.6.                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2. Domain, by hand | `common.ts`: `Note` loses `tags`; `Facet` added. `common-adapter.ts`: `NoteAdapter` loses `tags`; `FacetAdapter` added. `common-validator.ts`: `isNote` loses its `tags` check; `Facet` create/update validators reject `:` in `scheme` and `code`. A new `common-protocol.ts` carries `FacetCreate`/`FacetUpdate`. `service.ts`/`workflow.ts` and their adapters and validators: `facets` (non-empty strings, each `scheme:code`) replaces `tagsWorkflowCandidates`/`tags`. `schema.sql`: a `facets` table with `UNIQUE (scheme, code)` and RLS; `services.facets` and `workflows.facets` replace the two tag columns; the seeded Service row. Hand edits must equal what domain genesis would produce from the data dictionary. |
| 3. Front           | `api.Facets` CRUD client in `api.ts`. `useFacets` Query State module in `app-admin/`, with a catalog load that reads every page and includes retired rows. `customer-state.ts` and `user-state.ts` note literals.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 4. Tests           | `customer-api-test.ts`, `make-scope-test.ts` note literals; adapter round-trip and validator tests for `Facet`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 5. RDBMS genesis   | The CA runs `db-reset --target stage`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 6. Edge            | `deno task edge-sync`, then deploy, before the app (the deployed `isNote` requires `tags`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 7. App             | Ship.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

Out of scope: facet values (schemes and codes), a Facet Manager curation surface, facet pickers
in any form, facets on Assets or Chemicals, and seeding itself.

## Amendment — 2026-10-06 — Settled 6 reopened

The original "Settled 6: Assets and Chemicals are not tag-oriented for seeding" is superseded.
With Workflow as the general operations construct (first amendment, Decision 2), Assets and
Chemicals are candidate facet consumers, for catalog filtering and for binding maintenance and
inventory Workflows. That question is open in
`effort/pending/2026-10-06-facets-workflow-seeding-brief.md`, Open 5. Their current structural
paths to a job are unchanged and recorded there.

_End of Brief_
