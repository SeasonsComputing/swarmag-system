# Facets & Workflow Seeding — Brief

**Backlog, not dispatched.** Recorded 2026-10-06 from a CA + AI Architect exploration session as
design input for roadmap §6 (Workflow, Task, Question & Service). It carries the seeding questions
handed off by `effort/active/2026-10-06-tags-classification-brief.md`, which decided the facet
catalog and its references. The CA describes the vision as rough at the edges: details may need rethinking when §6 is
designed in full.

## The vision (CA, 2026-10-06)

**Seeding.** Initial job assessment begins with selecting Services. The selected Services' facets
filter the Workflow library, and the sales rep chooses Workflows from the filtered set to define
the job. For example, a Workflow carries `service:aerial-service` and `service:aerial-job-prep`;
the drone Service carries the same.

**Workflow is the general operations construct.** It templates any structured activity, not only
flying drones or removing mesquite: asset maintenance, inventory management, and more. Services
are one of several contexts that find candidate Workflows among hundreds; facets let any context
bind without changing the Workflow side.

## Decided elsewhere

- The curated catalog is `Facet = Instantiable & { scheme, code, label, description?, active }`,
  a `facets` table in Common (`domain-data-dictionary.md` §4.5). Retiring a facet sets `active`
  to false; its label still resolves.
- `Service` and `Workflow` carry `facets: CompositionMany<string>` of `scheme:code` references
  (§8.2, §10.11). Matching compares references within one scheme.
- Read access is `useFacets(): FacetsState`, a Query State module in `front/app/stores/`
  (`architecture-front.md` §8.4).
- Free-form tags are deferred; `Note.tags` is removed.

## What the repository holds

**Associations to and from Assets and Chemicals:**

| From                         | Relation                                      | Kind                                                        |
| ---------------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| `Asset.type`                 | `AssociationOne<AssetType>`                   | many-to-one                                                 |
| `ServiceRequiredAssetType`   | junction, `Service` ↔ `AssetType`             | many-to-many: a Service requires kinds of asset             |
| `JobPlanAsset`               | junction, `JobPlan` ↔ `Asset`                 | many-to-many: a plan assigns specific assets                |
| `JobPlanChemical.chemicalId` | `AssociationOne<Chemical>` on an Instantiable | a plan's chemical usage, with amount, unit, and target area |

Assets reach a job structurally (Service → AssetType → Asset → JobPlan). Nothing links Chemicals
to Services; they are chosen per Job Plan.

**`domain-model.md` §2.1** says "Each Service Category has Workflows suitable for performing
services within that category", which places the link at category level.

**User story §2.1.3** describes seeding as automatic: "Preload an assessment workflow based on the
Service type (default workflow per category/SKU)."

## Open

1. **Facet values.** The initial schemes, and the codes each holds.
2. **Curation.** Who curates the catalog, and through what surface (a Facet Manager)? Every catalog
   table today allows authenticated writes; restricting writes to curators would be one change
   across all of them.
3. **Hierarchy.** Do codes need a hierarchy? Path-like codes (`aerial/spray`) fit, since `/` is
   allowed in a code and `:` is reserved, and allow prefix matching.
4. **Service or Service Category?** Facets bind per Service; `domain-model.md` §2.1 binds per
   category. Which holds, and does §2.1 need rewriting?
5. **Facets for Assets and Chemicals.** The CA thinks they probably should carry facets, for
   filtering their catalogs and, later, for binding maintenance and inventory Workflows. How does
   asset maintenance choose its Workflow: a structural fact of the AssetType, or a faceted search
   of the library?
6. **Chemical selection at planning.** With no Chemical–Service link, a planner chooses from the
   whole chemical list. Intended, or does it need a filter of its own?
7. **User story §2.1.3** needs rewriting to match the vision: filter, then choose, not preload a
   default.

## Dependency

Initial Job Assessment cannot be built until §6 lands, so the Onboarding Wizard (roadmap §1)
cannot finish before §6.

_End of Brief_
