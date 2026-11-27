# Facets & Workflow Seeding — Brief

**Active, not dispatched.** Selected 2026-11-15 with M-7, where facets on Workflow ride along with
the Workflow Template Builder (`2026-11-15-workflow-builder-brief.md`); seeding itself is built in
M-8. Recorded 2026-10-06 from a CA + AI Architect exploration session; the model settled in CA +
AI Architect sessions on 2026-11-24 and 2026-11-25. Foundation: it changes the facet catalog's
domain meaning and persistence. Depends on the Registry refactor brief
(`2026-11-24-registry-refactor-brief.md`), including its verbose form.

## The vision (CA, 2026-10-06)

**Seeding.** Initial job assessment begins with selecting Services. The selected Services' facets
filter the Workflow library, and the sales rep chooses Workflows from the filtered set to define
the job.

**Workflow is the general operations construct.** It templates any structured activity, not only
flying drones or removing mesquite: asset maintenance, inventory management, and more. Services
are one of several contexts that find candidate Workflows among hundreds; facets let any context
bind without changing the Workflow side.

## The model

**Facets help choose; ids relate.** The domain's relationships are ids: foreign keys and junctions.
Facets are a usability feature: they narrow a list while a person chooses, and the choice is
stored as an id.

1. **A facet is a Registry path: `namespace/bucket/facet`.** The path explains the facet:
   `services/Application/Aerial`. A facet has no description.
2. **Namespaces are a closed set, declared in code; buckets and facets are curated.** Each
   abstraction that carries facets has its namespace. A namespace is a `RegistryDeclaration`, as
   the document store's are; a bucket exists while a facet is in it.
3. **The catalog is one record: the list of facet paths, in verbose form.** Every segment carries
   its id and its name. The catalog is read and written whole.
4. **The abstraction being filtered stores its facets, as verbose paths.** A Workflow's facets
   describe the Workflow; an AssetType's describe the asset type. Matching compares canonical
   forms; a display prefers the catalog's current name.
5. **The from side never stores facets.** A picker filters by facets while the user chooses and
   stores ids. Context seeds the filter: a job's Services seed its Workflow picker. The stored
   relationship is the job's workflows, never Service → Workflow.
6. **Junctions stay.** `ServiceRequiredAssetType` relates a Service to the asset types it
   requires; its picker filters asset types by facets and stores their ids.

## Target design

```ts
// sketch, domain (genesis): the catalog
type FacetCatalog = Instantiable & {
  facets: CompositionMany<string> // verbose Registry paths
}

// sketch, domain (genesis): an abstraction that is filtered
facets: CompositionMany<string> // verbose Registry paths

// sketch, front/api/facets.ts: the closed set of namespaces, ids fixed in code
const Services: RegistryDeclaration = { id: toId('…'), name: 'Services' }
const Workflows: RegistryDeclaration = { id: toId('…'), name: 'Workflows' }
// … one per abstraction that carries facets (Open 1)
```

- **One catalog, seeded once.** The catalog record is seeded through genesis `seed_data`, with ids
  from the seed-id list; the namespace ids are the declarations'. Seeded Services, and the other
  seeded abstractions that carry facets, hold the same verbose paths, resolved from the seed's
  names in the same pass. An ambiguous or missing path fails the seed.
- **A write against a stale catalog is refused.** Two curators editing at once: the second write
  fails rather than overwrites (Open 5).
- **Renaming** a bucket or facet rewrites its name in the catalog. Records keep their verbose
  paths; their ids still match, and the stale name is only the stored label.
- **Retiring** a facet removes it from the catalog. Pickers stop offering it; a record that carries
  it still displays its stored name and still matches by id.
- **A catalog write is validated:** every path is in verbose form and its namespace is declared.
- `Service`, `Workflow`, `AssetType`, and `Material` carry `facets`. Whether work is in-house or
  onsite is marked by a facet, not modeled.
- **The facet catalog is `front/api/facets.ts`.** Each level implements `RegistryCatalogContract`
  (`2026-11-24-registry-refactor-brief.md`): namespaces over the declarations, buckets and facets
  over the catalog record.
- Read access is `useFacets(): FacetsState`, a Query State module in `front/app/stores/`
  (`architecture-front.md` §8.4), which reads the catalog record through the facet catalog.

## Governing documents to amend

- **`domain-data-dictionary.md` §5.5:** `Facet` gives way to `FacetCatalog`; the `scheme:code`
  rules (the reserved `:`, `(scheme, code)` uniqueness, immutable codes, retirement by `active`)
  give way to the model above.
- **`domain-data-dictionary.md`**, the `Service` and `Workflow` entries: `facets` holds verbose
  Registry paths; `AssetType` and `Material` gain `facets`.
- **`domain-model.md` §3.6:** `Facet` gives way to `FacetCatalog`, referenced by Registry path.
- **`domain-model.md` §2.1:** "Each Service Category has Workflows suitable for performing
  services within that category" becomes the filter-then-choose of the vision.
- **`domain-seed-data.md`:** the initial catalog, in name form.
- **`project-user-stories.md` §2.1, Workflow seeding:** "Preload an assessment workflow based on
  the Service type" becomes: the selected Services' facets filter the Workflow library, and the
  rep chooses.

## What the repository holds

| From                         | Relation                                      | Kind                                                        |
| ---------------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| `Asset.type`                 | `AssociationOne<AssetType>`                   | many-to-one                                                 |
| `ServiceRequiredAssetType`   | junction, `Service` ↔ `AssetType`             | many-to-many: a Service requires kinds of asset             |
| `JobPlanAsset`               | junction, `JobPlan` ↔ `Asset`                 | many-to-many: a plan assigns specific assets                |
| `JobPlanChemical.chemicalId` | `AssociationOne<Chemical>` on an Instantiable | a plan's chemical usage, with amount, unit, and target area |

`Service` and `Workflow` carry `facets` as `scheme:code` strings; the `facets` table is a row per
facet, unique on `(scheme, code)`, read by `api.Facets` and `useFacets`. All change with this
brief.

## Open

1. **Facet values.** The namespaces, and the initial buckets and facets each holds.
2. **Curation.** Who curates the catalog, and through what surface (a Facet Manager)? Every catalog
   table today allows authenticated writes; restricting writes to curators would be one change
   across all of them.
3. **Moving a facet.** A facet's id form is its lineage, so moving it to another bucket changes
   its canonical form, and records that carry the old path no longer match it. Whether a facet
   moves, and what becomes of references when it does.
4. **Service or Service Category?** Facets bind per Service; `domain-model.md` §2.1 binds per
   category. Which holds.
5. **Stale writes.** How the catalog record is versioned so a stale write is refused: its
   `updatedAt`, or a version of its own.

## Design history

- `scheme:code` references with codes unique per scheme were replaced by Registry paths: buckets
  group facets, and ids survive a rename.
- A row per bucket and per facet was weighed against one catalog record; the record won. Verbose
  paths carry ids and names, so a rename needs no sweep, retiring is removal, and seeding is one
  list.
- Descriptions were dropped: the namespace and bucket explain a facet, and a facet's name should
  explain itself.
- Namespaces as a domain const-enum were dropped: no domain field is typed by namespace, and the
  declarations are the closed set, as in the document store.
- Relationship fields on the from side (`{relationship}{Scheme}Facets`) were dropped: the from side
  never stores facets.
- A `ServiceRequiredMaterialKind` junction was not needed: facets on Material filter the material
  picker.

_End of Brief_
