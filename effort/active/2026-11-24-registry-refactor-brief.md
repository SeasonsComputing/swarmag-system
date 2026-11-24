# Registry Refactor — Brief

**Active, not dispatched.** Drafted 2026-11-24 from a CA + AI Architect session on facets.
Foundation, in `core/std` and `core/cli`. Extracts the Registry from the document store and rebuilds
the document store on it. The facets brief (`2026-10-06-facets-workflow-seeding-brief.md`) builds
the facet catalog on the Registry.

## The question

The document store addresses a namespace, a bucket, and a document. The facet catalog addresses a
namespace, a bucket, and a facet. How does one three-level hierarchy, with its names, paths, and
stored forms, serve both without two implementations?

## The model

**The Registry is a three-level hierarchy: `namespace ─* bucket ─* entry`.** It knows no store.
The document store and the facet catalog specialize it; a document and a facet are entries.

1. **A name is non-empty, contains no `/`, and does not begin with `id:`.** A whitespace-only name
   is rejected; a name keeps its spelling and is never normalized. A name is atomic: the three
   levels are the only hierarchy.
2. **Names need not be unique within a parent; ids are.** A path that matches more than one node
   does not resolve. Nothing picks one.
3. **A path is one to three segments, each a name or `id:{id}`.** Its depth gives the level. Names
   and ids mix level by level.
4. **The id form is the full lineage: namespace, bucket, entry.** A store locates a node from it
   without a lookup, so a reference is computed offline before the node exists.
5. **The id form is canonical; a path is a valid reference.** Whoever stores a reference chooses
   its form. A path reads well and breaks on a rename; an id survives one. Matching compares
   canonical forms: a path is resolved before it is compared.
6. **The Registry's metadata is `id`, `name`, and `createdAt`.** A specialization adds fields and
   never redefines one.

## Target design

Everything generic carries the `Registry` prefix. Namespace and bucket keep their names.

### The Registry

`core/std/registry-contract.ts` holds the contracts; `core/std/registry-paths.ts` holds
`RegistryPaths`, the path operations, which need no store.

```ts
// sketch: core/std/registry-contract.ts
type RegistrySegment = string | { readonly id: Id }
type RegistryPath = readonly RegistrySegment[] // namespace/bucket/entry
type RegistryLineage = { readonly namespace: Id; readonly bucket?: Id; readonly entry?: Id }
type RegistryMetadata<I> = { id: I; name: string; createdAt: When }

interface RegistryNamespaceContract<N> {/* get, find, list, resolve, update, delete, create */}
interface RegistryBucketContract<B, N> {/* get, find, list, resolve, update, delete, create */}
interface RegistryEntryContract<E, B> {/* get, find, list, resolve, update, delete */}
interface RegistryProviderContract {/* get, find, list, create, update, delete, over lineage */}

// sketch: core/std/registry-paths.ts
const RegistryPaths = {/* build, parse, format, validate, lineage */}
```

`RegistryPaths.lineage` turns an id-form path into lineage with no lookup. An entry's create is
the specialization's: a document is created with its bytes.

### The document store

`docstore-contract.ts` keeps what is the document store's own and takes the rest from the
Registry:

```ts
type DocumentAddress = RegistryPath
type DocumentStoreMetadata<I> = RegistryMetadata<I> & { count: number } // children or bytes
type DocumentLink = { url: string; expiresAt: When }

interface DocumentContract extends RegistryEntryContract<DocumentId, BucketId> {
  create(parent: BucketId, name: string, body: Blob, id?: Id): Promise<DocumentStoreMetadata<DocumentId>>
  read(id: DocumentId): Promise<Blob>
  link(id: DocumentId): Promise<DocumentLink>
}

interface DocumentProviderContract extends RegistryProviderContract {
  create(node: RegistryLineage, name: string, body?: Blob): Promise<…>
  read(node: RegistryLineage): Promise<Blob>
  link(node: RegistryLineage, expiresAt: When): Promise<string>
}
```

- `DocumentAddresses` keeps its surface (`build`, `parse`, `format`, `validate`, `id`); its body
  becomes a facade over `RegistryPaths`.
- `ApiDocumentStoreContract`, `NamespaceContract`, `BucketContract`, and the identities keep their
  names.
- The node-named generics give way to the Registry's: `StoreNodeContract`, `AddressSegment`,
  `Lineage`, and `LineageMetadata` to their `Registry` counterparts; `NodeMetadata` to
  `DocumentStoreMetadata`.
- `count` and `DocumentLink` are the document store's alone.
- Stored bytes, object keys, and stored references are unchanged. `Lineage.document` becomes
  `RegistryLineage.entry` in code only.

## Migration

The inside changes; the surface stays. One Foundation production extracts the Registry and
rebuilds the document store on it. Attachments, the Field Binder, uploads, and their tests keep
calling `DocumentAddresses` and the store's contracts; where they name `NodeMetadata`, they take
`DocumentStoreMetadata`. There is never a second implementation.

## Governing documents to amend

- **`CONVENTIONS.md` §10.8:**
  - The store is built on the Registry (`registry-contract.ts`), whose rules are the model above.
  - "A stored reference is an address in id form. Never store a name address" becomes: the id form
    is canonical; a path is a valid reference, and matching compares canonical forms (5).
  - "a name is a label, checked only for its format, and need not be unique" and "An ambiguous name
    does not resolve" stand (2).
- **`docstore-contract.ts` header:** the identities, metadata, addresses, and contracts it lists
  follow the target design.

## Production scope

Mode: Foundation.

- Create `source/core/std/registry-contract.ts` and `source/core/std/registry-paths.ts`, exported
  from `stdx.ts`.
- Rebuild `docstore-contract.ts` and `docstore-document-addresses.ts` on them.
- Update the kernel (`core/cli/docstore-client.ts`), the IndexedDB and Supabase providers, and
  `docstore-uploads.ts` to the Registry's types.
- Update the `NodeMetadata` consumers in `front/api/` (`field-binder.ts`, `field-binder-source.ts`,
  `field-binder-inventory.ts`) and their tests.
- Add Registry tests for the model's rules (1–5).

Out of scope: the facet catalog and the facets brief; `schema.sql`; attachment and Field Binder
behavior.

## Acceptance

- The document store, attachments, and Field Binder tests pass unchanged apart from type names.
- `RegistryPaths` enforces the name rule, mixed paths, and id-form lineage, tested.
- Check, fmt, and guards are green; `STYLE_AUDIT: PASS`.

## Open

1. **Identities:** whether each store keeps its own nominal identities, with the Registry's
   contracts parameterized over them (as sketched), or the Registry brands its own.
2. **"Nothing moves":** the document store's principle that a node's identity is its lineage,
   fixed at creation, since nothing moves; and whether a move is the provider's to carry out.
3. **The kernel:** whether the kernel's level operations in `docstore-client.ts` (get, find, list,
   resolve, update, delete) become a Registry kernel the facet catalog also composes, or stay the
   document store's.

## Design history

- An address of ids only, with names as metadata, was weighed; a single-id form is impractical with
  how addresses are used.
- A URL-safe name for every segment was dropped: a file name is a valid name.
- `count` in the Registry's metadata was weighed for generic listings; it measures nothing for a
  facet, so it is the document store's.

_End of Brief_
