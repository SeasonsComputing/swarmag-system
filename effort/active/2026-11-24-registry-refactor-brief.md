# Registry Refactor — Brief

**Active, not dispatched.** Drafted 2026-11-24 from a CA + AI Architect session on facets.
Foundation, in `core/std`, `core/cli`, and `front/`. Extracts the Registry from the document store,
makes the store's level contract the catalog contract, replaces the address facade with the
Registry, and declares the fixed levels the application places documents under. The facets brief (`2026-10-06-facets-workflow-seeding-brief.md`)
builds the facet catalog on the same Registry and contract.

## The question

The document store addresses a namespace, a bucket, and a document. The facet catalog addresses a
namespace, a bucket, and a facet. How does one grammar, with its names, paths, and stored forms,
serve both without two implementations?

## The model

**The Registry is an identifier: the grammar of a three-level path, `namespace/bucket/entry`.** It
is to a three-level node what `Id` is to a record. It defines what a valid path is and how one is
written and read. It knows no store and persists nothing. A document and a facet are entries.

**A catalog is a curated set that others refer to and find by an identifier.** A catalog found by
Registry path implements the catalog contract: the document store, and the facet catalog. Each
keeps its own identities, persistence, creation, and metadata.

1. **A name is non-empty, contains no `/`, and does not begin with `id:`.** A whitespace-only name
   is rejected; a name keeps its spelling and is never normalized. A name is atomic: the three
   levels are the only hierarchy.
2. **Names need not be unique within a parent; ids are.** A path that matches more than one node
   does not resolve. Nothing picks one.
3. **A path is one to three segments, each a name, `id:{id}`, or both, `id:{id}:{name}`.** Its
   depth gives the level. The forms mix level by level. A segment that carries both is
   unambiguous: an id has a fixed length and no `:`, so the first `:` after it begins the name.
4. **The id form is the full lineage: namespace, bucket, entry.** A store locates a node from it
   without a lookup, so a reference is computed offline before the node exists.
5. **The id form is canonical; a path is a valid reference.** Whoever stores a reference chooses
   its form. A name path reads well and breaks on a rename; an id survives one; a verbose path
   does both (7). Matching compares canonical forms: a path is resolved before it is compared.
6. **A level fixed in code is declared: an id and a name.** Every device and the server compute the
   same path from it offline, provisioning and storage policy read it, and creating the node at
   its id returns the node already there. A declaration stands in as a path segment. A namespace
   with fixed buckets declares them as its own members.
7. **A path has three forms: name, id, and verbose.** The name form reads well; the id form is
   canonical; the verbose form carries both at every level, so a stored path survives a rename and
   reads raw. In a verbose path the ids rule: its names are labels as of writing, and a display
   prefers the catalog's current name.

## Target design

### The Registry

`core/std/registry-grammar.ts`, exported from `stdx.ts`:

```ts
type RegistryNameSegment = string
type RegistryIdSegment = { readonly id: Id }
type RegistryVerboseSegment = { readonly id: Id; readonly name: string }
type RegistrySegment = RegistryNameSegment | RegistryIdSegment | RegistryVerboseSegment
type RegistryPath = readonly RegistrySegment[] // namespace/bucket/entry
type RegistryLineage = { readonly namespace: Id; readonly bucket?: Id; readonly entry?: Id }

/** A verbose segment fixed in code; Buckets names the fixed buckets a namespace declares. */
type RegistryDeclaration<Buckets extends string = never> =
  & RegistryVerboseSegment
  & { readonly [B in Buckets]: RegistryDeclaration }

const Registry = {/* build, parse, format, verbose, canonical, validate, lineage */}
```

```ts
'services/Application/Aerial' // name form
'id:0193…/id:0194…/id:0195…' // id form, canonical
'id:0193…:services/id:0194…:Application/id:0195…:Aerial' // verbose form
```

`Registry.format` writes a path as given; `Registry.verbose` writes every segment that has both;
`Registry.canonical` writes ids only, for matching. `Registry.lineage` turns a path whose segments
all carry ids into lineage with no lookup. A declaration is a segment:
`Registry.verbose([Library, Library.Chemicals, documentId])`.

### The catalog contract

`core/std/registry-catalog-contract.ts`, exported from `stdx.ts`. The document store's
`StoreNodeContract`, made generic: its operations are a catalog's, not the store's.

```ts
interface RegistryCatalogContract<Self, Metadata extends { id: Self; name: string }, Parent = void> {
  get(id: Self): Promise<Metadata>
  find(parent: Parent, name: string): Promise<readonly Metadata[]>
  list(parent: Parent): Promise<readonly Metadata[]>
  resolve(path: string | RegistryPath): Promise<Metadata>
  update(id: Self, name: string): Promise<Metadata>
  delete(id: Self): Promise<DeleteResult>
}
```

`create` stays each catalog's own, per level.

### The document store

- `NamespaceContract`, `BucketContract`, and `DocumentContract` extend `RegistryCatalogContract`
  with the store's identities and `NodeMetadata`; `StoreNodeContract` is gone.
- `DocumentAddress` is `RegistryPath`; `AddressSegment` gives way to `RegistrySegment`.
- `Lineage` gives way to `RegistryLineage`: `document` becomes `entry`, in code only. Stored bytes,
  object keys, and stored references are unchanged.
- `toDocumentId(reference)`, beside the `DocumentId` brand, is the nominal producer (CONVENTIONS
  §8.4): a stored reference whose three segments carry ids becomes a `DocumentId` with no lookup,
  built on `Registry.lineage`.
- `DocumentAddresses` and `docstore-document-addresses.ts` are removed. Its `build`, `parse`,
  `format`, and `validate` are `Registry`'s; its `id` is `toDocumentId`.
- The identities, `NodeMetadata`, `DocumentLink`, `ApiDocumentStoreContract`, and
  `DocumentProviderContract` are the store's own and unchanged apart from the lineage type.

### Placement

The fixed levels the application places documents under are declarations. Their ids are unchanged.

```ts
// front/api/attachments.ts
const Customers: RegistryDeclaration = { id: toId('…0003'), name: 'Customers' }
const Users: RegistryDeclaration = { id: toId('…0004'), name: 'Users' }
const Jobs: RegistryDeclaration = { id: toId('…0005'), name: 'Jobs' }
const Library: RegistryDeclaration<'Chemicals' | 'Assets' | 'Services'> = {
  id: toId('…0006'),
  name: 'Library',
  Chemicals: { id: toId('…0007'), name: 'Chemicals' },
  Assets: { id: toId('…0008'), name: 'Assets' },
  Services: { id: toId('…0009'), name: 'Services' }
}

// front/api/field-binder-inventory.ts
const FieldBinder: RegistryDeclaration<'Collection'> = {
  id: toId('…0020'),
  name: 'Field Binder',
  Collection: { id: toId('…0021'), name: 'Collection' }
}
```

- The `// CATALOG` section of `attachments.ts` becomes PLACEMENT. Provisioning lists the
  namespaces: `Attachments.namespaces` is `[Customers, Users, Jobs, Library]`.
- The Field Binder's `catalog` becomes `placement`: the `FieldBinder` declaration beside its
  reserved filenames. `FieldBinderMetadata.catalog` becomes `FieldBinderMetadata.placement`.
- "The inbox catalog" stays: the inbox is a catalog.

## Migration

The store's contracts keep their surface; the address facade goes. One Foundation production
extracts the Registry and the catalog contract, rebuilds the document store on them, declares the
placements, and moves every `DocumentAddresses` call to `Registry` or `toDocumentId`. There is no
second name for any operation.

## Governing documents to amend

- **`CONVENTIONS.md` §10.8:**
  - An address follows the Registry grammar (`registry-grammar.ts`), whose rules are the model
    above; a level fixed in code is a `RegistryDeclaration` (6).
  - The level contracts extend `RegistryCatalogContract` (`registry-catalog-contract.ts`).
  - "A stored reference is an address in id form. Never store a name address" becomes: the id form
    is canonical; a path is a valid reference, and matching compares canonical forms (5).
  - "`DocumentAddresses.id` turns a stored reference into a `DocumentId`" becomes `toDocumentId`.
  - "a name is a label, checked only for its format, and need not be unique" and "An ambiguous name
    does not resolve" stand (2).
- **`architecture-core.md` §10.4:** "The Catalog" becomes "Placement"; "the attachment catalog",
  "placement catalog", "catalog destinations", and "catalog bucket" become placement. The format
  catalog stays.
- **`architecture-front.md` §7:** `api.Attachments`' "catalog placement" becomes "placement".
- **`architecture-devops.md` §14:** "the feature catalog's fixed identities" become the feature's
  placement.
- **File headers:** `docstore-contract.ts` names the Registry's types and the catalog contract;
  `attachments.ts`, `field-binder-inventory.ts`, and `app-deploy-storage-config.ts` say placement.

## Production scope

Mode: Foundation.

- Create `source/core/std/registry-grammar.ts` and
  `source/core/std/registry-catalog-contract.ts`, exported from `stdx.ts`.
- Rebuild `docstore-contract.ts` on them, with `toDocumentId`; delete
  `docstore-document-addresses.ts` and its `stdx.ts` export.
- Update the kernel (`core/cli/docstore-client.ts`), `docstore-uploads.ts`, and the IndexedDB and
  Supabase providers.
- Move every `DocumentAddresses` call to `Registry` or `toDocumentId`: `front/api/attachments.ts`,
  `field-binder-inventory.ts`, `front/app/shell/notes/make-attachment-save.ts`, and the
  document store, attachments, and Field Binder inventory tests.
- Declare the placements in `front/api/attachments.ts` and `front/api/field-binder-inventory.ts`;
  update `field-binder.ts`, `field-binder-source.ts`, and their tests to `placement`.
- Add Registry tests for the model's rules (1–7).

Out of scope: the facet catalog and the facets brief; `schema.sql`; attachment and Field Binder
behavior.

## Acceptance

- The document store, attachments, Field Binder, and storage policy tests pass, changed only for
  `placement`, `Registry`, and `toDocumentId`.
- No `DocumentAddresses` reference remains.
- `Registry` enforces the name rule, mixed paths, the three forms and their round trips, id-form
  lineage, and declarations as segments, tested.
- Check, fmt, and guards are green; `STYLE_AUDIT: PASS`.

## Design history

- An address of ids only, with names as metadata, was weighed; a single-id form is impractical with
  how addresses are used.
- A URL-safe name for every segment was dropped: a file name is a valid name.
- Generic persistence contracts and metadata in the Registry were weighed and dropped: only the
  grammar is an identifier; persistence and metadata are each catalog's.
- A flat container of placement declarations was weighed and dropped: a namespace that owns fixed
  buckets declares them as its members, so the lineage is in the name (`Library.Chemicals`).
- One segment type with an optional name (`{ id; name? }`) was dropped for a type per form: the
  segment types are the model's three forms, and a declaration is a verbose segment.
- `DocumentAddresses` as a facade over `Registry` was dropped: its operations would be aliases, and
  its `id` is the nominal producer `toDocumentId`.
- The contract is `RegistryCatalogContract`, not `CatalogContract`: catalog also names flat curated
  sets (asset types, the icon catalog), which this contract does not serve.

_End of Brief_
