# Document Storage — Brief

**Active, draft.** Recorded 2026-10-23 from a CA + AI Architect session, while settling the Asset
and Chemical Managers brief, and extended 2026-10-24. M-4 assigned Attachments to M-5; the roadmap
lists Document storage among M-5's features. Chosen from the roadmap 2026-10-24. Split 2026-10-29:
this is the `core/` brief, the platform and what it needs to run; swarmAg's use of it is the
`front/` brief, `effort/active/2026-10-29-attachments-brief.md`, which depends on this one. Awaits
CA review and the production gate. Split again 2026-10-30: this brief is the kernel and its first
provider, IndexedDB, which needs nothing provisioned; the Supabase provider and what it needs to run
are `effort/active/2026-10-30-document-store-supabase-brief.md`. Field mapping, the main consumer
of surveys and photos, is `effort/pending/2026-10-24-field-mapping-brief.md`.

## What triggered it

The system holds images and documents: chemical labels and SDSs, asset manuals and part diagrams,
purchase and service records, job photos, and signed forms. M-4 assigned the Attachments capability
to this milestone. Nothing stores them today: `Attachment` carries a `url`, and nothing defines what
a stored document's URL names or who may write it.

## Scope

This brief is the platform: general-purpose document storage, a minimal API over replaceable
providers, that knows nothing of swarmAg. Its code is `core/`, a Seasons Computing library: the
contract and the address grammar in `core/std`, exported from `@core/stdx`, as the CRUD contracts
are; the kernel and the IndexedDB provider in `core/cli`, over the `core/db` IndexedDB wrapper.
Nothing is provisioned, and nothing is in `back/` or `devops/`.

The Supabase provider, with its storage configuration, policies, one function, reset, and the CLI,
is the Supabase provider brief. swarmAg's use of the platform (its namespaces and buckets, stored
references in domain fields, capture and upload, and the access rules its consumers need) is the
attachments brief, which depends on both.

## The platform

The points are the target. Staging says what M-5 builds and which consumer brings each later
piece.

1. **A fixed hierarchy.** `namespace ─* bucket ─* document`: three levels, each holding only the
   next. Life-cycles nest: a namespace is settled and long-lived, a bucket is kept as long as its
   consumer needs it, and a document's life is shorter than its bucket's. A document cannot exist
   without its bucket, nor a bucket without its namespace.
2. **Identity and names.** Every node has an id and a name. Its id is a UUID, permanent, never read
   by people; the kernel mints it. A document's may instead be supplied by the caller, since a
   document's identity may exist before its bytes are stored. Nothing moves, so a node's lineage is
   fixed when it is created, and its identity is that lineage: its namespace's id, its bucket's, and
   its own. Each level's identity is a nominal type, exact to its level, and only the store produces
   one: a consumer gets an identity from the store or from a stored reference, and never builds one.
   A create with a supplied id is idempotent: the same lineage returns the existing document. The
   name is for people and is the only thing that changes; a rename keeps identity. Names need not be
   unique among siblings.
3. **Metadata is the model.** Every node has the same metadata: `{ id, name, createdAt, count }`,
   where the count is what the node directly holds: a namespace's buckets, a bucket's documents, a
   document's bytes. Listing a container's children is a separate operation. A document's content
   type belongs to its bytes: it arrives with them, is served with them, and is recorded by the
   consumer's own field, as `Attachment.contentType`. How a provider keeps metadata and lays out
   storage (tables, sidecars, object metadata, key shapes) is the provider's, and invisible through
   the API.
4. **The address.** `{namespace}/{bucket}/{document}`, one to three segments, each a name or
   `id:{id}`, so a name never begins with `id:`. An address names a node at its depth: a namespace,
   a bucket, or a document. Grammar validation needs only the address and runs in the kernel;
   storage validation, whether it resolves, needs the store. The kernel resolves an address one
   segment at a time, by id or by name within the parent; a name that matches more than one node is
   ambiguous and does not resolve. An `id:` segment resolves only to a node in the parent the
   address names. Each level's contract resolves addresses at its own depth, so the caller states
   the level it expects, and an address at another depth does not resolve. Resolution yields the
   node's identity, ids only; providers receive identities and never see addresses. Stored
   references use the id form, and an id-form reference becomes an identity by the grammar alone,
   with no lookup; names are for people and the CLI, and only names need resolving.
5. **Placement.** A namespace is where the system takes advantage of what its provider offers:
   site, storage class, caching, edge. Placement is chosen when the namespace is created, through
   a placement provider that loads its configuration, and never changes. It is not metadata, and
   no consumer sees it. Omitted, the default placement applies.
6. **One kernel, three profiles.** One contract serves every consumer: the front profile
   (browsers), the back profile (scripts, edge functions, services), and a broker if one is ever
   needed, which implements the same contract over a provider. The kernel's feature set is the
   minimum every consumer needs; a provider is as capable as it is, and a capability is exposed
   only when its cost is worth paying, as `ui` exposes Kobalte and `shell` exposes TanStack.
7. **Documents are immutable.** A document is added or removed; only its name changes. A
   replacement is add, repoint, remove: the only shared state is the reference on the owning
   record, an ordinary domain update.
8. **Only empty containers are deleted.** Nothing is removed as a side effect: removing a bucket
   means removing its documents first.
9. **Read and link.** `read` returns a document's bytes to code, for processing. `link` returns a
   short-lived URL the browser fetches itself, for display. A link's lifetime is a short fixed
   default, supplied when the kernel is constructed; the kernel computes each link's expiry when it
   is issued, and the provider implements the link. A link is not tied to the session that asked for
   it: one that outlives a sign-out by its remaining minutes is the accepted trade, as with signed
   URLs generally. A link is never stored; it is minted from the id when needed.
10. **The CLI is the API.** `document-store {noun} {verb}` maps one to one onto the contract. It
    names nodes by address, with names or ids, and resolves each before calling the contract, so
    its `get` serves both `get` and `resolve`.

## Code

A document store is an application client: a maker per binding, composed into `api` as the CRUD
clients are, so it is a client family of its own beside Crud, Junction, and BusRule, laid out as
they are. Its contract is in `core/std`, beside `api-contracts.ts`, imported through `@core/stdx`,
which keeps it out of `@core/std` and out of any bundle that does not use it; `core/std` is
closed, so the contract imports only its siblings. Its makers are in `core/cli`, each in a file of
its own rather than doubling its binding's client file. `core/db` keeps the storage backends the
clients use (`indexeddb.ts`, `supabase.ts`). _Amended 2026-10-30; see the design history._

| File                                         | Holds                                                      |
| -------------------------------------------- | ---------------------------------------------------------- |
| `core/std/docstore-contract.ts`              | The node and provider contracts and the nominal identities |
| `core/std/docstore-document-addresses.ts`    | `DocumentAddresses`: build, parse, format, validate, id    |
| `core/cli/make-docstore-client.ts`           | The kernel, internal: ids, validation, resolution          |
| `core/cli/make-indexeddb-docstore-client.ts` | The IndexedDB provider and its maker                       |

`make-supabase-docstore-client.ts` arrives with the Supabase provider brief.

## The IndexedDB provider

The first provider: in the browser, with nothing to provision. It proves the contract, and it is
the attachments brief's inbox.

1. **Two object stores, keyed by lineage.** A node's identity is its lineage, so both stores key by
   it, as an array key: `[namespace]`, `[namespace, bucket]`, or `[namespace, bucket, document]`.
   Nodes, `{ lineage, level, name, createdAt }`, indexed on the parent's lineage and on the parent's
   lineage with `name`, for `list` and `find`. Content, a document's lineage to its `Blob`. A
   document's count is its Blob's size; a container's is its number of children.
2. **One transaction per operation.** A document's create writes its node and its bytes together. A
   container's delete checks for children and removes the node in the same transaction, so
   empty-only delete holds under concurrent writes. Nothing outside IndexedDB is awaited inside a
   transaction: the bytes are stored as the `Blob` given, its content type with it.
3. **Links.** `link` returns a `blob:` URL. It ends when the page unloads, if not before, and the
   provider revokes each link it issues when the link expires.
4. **Durability.** Storage belongs to the browser profile and the origin: it is neither shared
   across devices nor authorized by a server. The provider asks for persistent storage, and a
   refusal is a known condition: Safari clears a site's storage after seven days without use,
   unless the app is installed.
5. **The wrapper.** `IndexedDb` registers object stores but not indexes. It gains index
   declarations, an additive change to `core/db/indexeddb.ts` within this brief's scope, so
   IndexedDB is still opened in one place. _Amended 2026-10-30:_ a store may also declare its key
   path, as lineage keys need; a store that declares neither keeps `keyPath: 'id'`, so existing
   stores, their data, and their callers are unchanged.
6. **Verification.** _Amended 2026-10-30._ The kernel and the grammar are tested in Deno against an
   in-memory provider defined in the test. _Production amendment, CA 2026-10-30:_ the browser check
   of the provider moves to the attachments production, its first consumer; this production
   verifies the wrapper upgrade on an existing database through app-local. No browser test
   harness and no new dependency: the harness is the UI behavior tests brief's,
   `effort/pending/2026-10-21-ui-behavior-tests-brief.md`.

## The second provider

The contract is written for remote providers too, and the Supabase provider is the test it must
pass. What IndexedDB gives and a remote store does not, the contract does not promise:

- `create` promises an outcome, not atomicity: a remote store writes the bytes and the node in
  separate systems.
- Every operation may fail on the network, and its result says so.
- A link has a real expiry, `expiresAt`, fixed when it is issued.

## Staging

**M-5 builds, in this brief:**

- The kernel, the contract, and the address grammar (platform points 1–4, 6–9), with the default
  placement only (point 5). The caller-supplied document id is in M-5: the attachments brief's
  inbox mints ids before storage.
- The IndexedDB provider, serving the front profile.

**M-5 builds, in the Supabase provider brief:** the Supabase provider, serving the front and back
profiles; the CLI (point 10), since the back profile runs in Deno, which has no IndexedDB; and the
provider's configuration, policies, and reset.

**Each later piece arrives with its consumer:**

| Piece                                    | Arrives with                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| The broker                               | An alternative provider: S3 and MinIO need presigned URLs from a server |
| Placement providers                      | The first namespace that needs other than the default placement         |
| A `link` lifetime argument               | A consumer that needs a link other than the session's                   |
| Renditions, a `link` option              | A view that needs smaller images than the originals                     |
| Document properties (bounds, CRS, bands) | Field mapping                                                           |
| Packages                                 | Field mapping                                                           |
| Sweeps                                   | Orphaned documents that cost enough to collect                          |

## API sketch

Names proposed; the shape follows the architecture. A common contract carries what every node
shares, and each level's contract adds only its difference: its `create`, and for documents `read`
and `link`. The kernel mints ids, validates names and addresses, resolves addresses, and hands a
provider only valid input. Providers receive and return plain lineage; the kernel and the grammar
are the only producers of nominal identities, as `makeQuery` is of `Query`.

```ts
declare const namespaceBrand: unique symbol
declare const bucketBrand: unique symbol
declare const documentBrand: unique symbol

/** A node's identity: its lineage of ids, fixed at creation, exact to its level. */
type NamespaceId = NominalType<{ readonly namespace: Id }, typeof namespaceBrand>
type BucketId = NominalType<{ readonly namespace: Id; readonly bucket: Id }, typeof bucketBrand>
type DocumentId = NominalType<
  { readonly namespace: Id; readonly bucket: Id; readonly document: Id },
  typeof documentBrand
>
type NodeId = NamespaceId | BucketId | DocumentId

/** Every node's metadata; count is what the node directly holds: buckets, documents, or bytes. */
type NodeMetadata<I extends NodeId = NodeId> = {
  id: I
  name: string
  createdAt: When
  count: number
}

type DocumentLink = { url: string; expiresAt: When }

/** A name, or an id; string form: {name} | id:{id}. */
type AddressSegment = string | { id: Id }

/** One to three segments: a namespace, a bucket, or a document. */
type DocumentAddress = readonly AddressSegment[]

/** Address operations: need no store, shared by every profile. */
const DocumentAddresses = {
  build(
    namespace: AddressSegment,
    bucket?: AddressSegment,
    document?: AddressSegment
  ): DocumentAddress
  parse(address: string): DocumentAddress
  format(address: DocumentAddress): string
  validate(address: string): boolean
  id(reference: string): DocumentId // an id-form document reference; no lookup
}

/** Common to every node: identity, naming, lookup within a parent, resolution, removal. */
interface StoreNodeContract<Self extends NodeId, Parent = void> {
  get(id: Self): Promise<NodeMetadata<Self>>
  find(parent: Parent, name: string): Promise<readonly NodeMetadata<Self>[]> // resolve walks it
  list(parent: Parent): Promise<readonly NodeMetadata<Self>[]>
  resolve(address: string | DocumentAddress): Promise<NodeMetadata<Self>> // at this level only
  update(id: Self, name: string): Promise<NodeMetadata<Self>> // rename only
  delete(id: Self): Promise<DeleteResult> // containers: empty only
}

interface NamespaceContract extends StoreNodeContract<NamespaceId> {
  create(name: string): Promise<NodeMetadata<NamespaceId>>
}

interface BucketContract extends StoreNodeContract<BucketId, NamespaceId> {
  create(parent: NamespaceId, name: string): Promise<NodeMetadata<BucketId>>
}

interface DocumentContract extends StoreNodeContract<DocumentId, BucketId> {
  create(parent: BucketId, name: string, body: Blob, id?: Id): Promise<NodeMetadata<DocumentId>>
  read(id: DocumentId): Promise<Blob>
  link(id: DocumentId): Promise<DocumentLink>
}

/** The kernel: the named hierarchy. */
interface ApiDocumentStoreContract {
  namespace: NamespaceContract
  bucket: BucketContract
  document: DocumentContract
}

/** A node's lineage, unbranded: what a provider receives and returns. */
type Lineage = { readonly namespace: Id; readonly bucket?: Id; readonly document?: Id }
type LineageMetadata = { lineage: Lineage; name: string; createdAt: When; count: number }

/** Contract for all document store providers; internal to core/cli. Level is lineage depth. */
interface DocumentProviderContract {
  get(node: Lineage): Promise<LineageMetadata>
  find(parent: Lineage | null, name: string): Promise<readonly LineageMetadata[]>
  list(parent: Lineage | null): Promise<readonly LineageMetadata[]>
  create(node: Lineage, name: string, body?: Blob): Promise<LineageMetadata> // id already minted
  update(node: Lineage, name: string): Promise<LineageMetadata>
  delete(node: Lineage): Promise<DeleteResult>
  read(node: Lineage): Promise<Blob>
  link(node: Lineage, expiresAt: When): Promise<string>
}

/** A maker per provider, as the CRUD clients are made per store. */
makeDocumentStoreIndexedDbClient(spec: { linkLifetime: number }): ApiDocumentStoreContract
```

An application composes a document store into its `api` as it composes its clients, choosing the
maker by store:

```ts
export const api = {
  …
  DocumentInbox: makeDocumentStoreIndexedDbClient({ linkLifetime: … })
}
```

The maker builds the kernel over its provider, so an application never sees a provider or the
kernel. A provider is told everything: `create` receives the lineage with its id already minted,
and `link` receives its expiry; it never mints, computes an expiry, or sees an address. Its
lineage is plain, with optional fields, because only the kernel calls it, with input already
validated; the strictness consumers need lives in the nominal identities. `linkLifetime` is in
milliseconds.

Every node is created with a name. `get` is metadata; `read` is bytes; `link` is a URL for the
browser. Each level's identity is a nominal type, so a `DocumentId` is not accepted where a
`BucketId` is expected, and each contract's results carry its own level's identity: a bucket's
`list` returns `BucketId`s ready for `document.list`. A parent's identity is not derived from a
child's; when a consumer needs that, it arrives as an operation. `resolve` serves names: the caller
states the level, and the kernel checks depth and kind there, in one place. A stored reference needs
no resolving: `DocumentAddresses.id` turns an id-form document reference into a `DocumentId` by the
grammar alone, and a document that no longer exists fails at the `read` or `link` that needed it.
`validate` checks a whole address; the name check it applies to each segment is private to the
grammar, and the kernel applies it on every `create` and `update`. `build` and `parse` produce the
same value, so the kernel walks one form whether an address came from code or from a person.

The CLI is `document-store {noun} {verb}`. Every node is named by an address, so a person may use
names: `{address}` is the node acted on, and `{namespace}` or `{bucket}` is the address of the
parent a `create` or `list` acts in.

| Noun      | Verb   | Arguments                       | Returns        |
| --------- | ------ | ------------------------------- | -------------- |
| namespace | create | `--name`                        | NodeMetadata   |
| namespace | get    | `{address}`                     | NodeMetadata   |
| namespace | list   |                                 | NodeMetadata[] |
| namespace | update | `{address} --name`              | NodeMetadata   |
| namespace | delete | `{address}`                     | DeleteResult   |
| bucket    | create | `{namespace} --name`            | NodeMetadata   |
| bucket    | get    | `{address}`                     | NodeMetadata   |
| bucket    | list   | `{namespace}`                   | NodeMetadata[] |
| bucket    | update | `{address} --name`              | NodeMetadata   |
| bucket    | delete | `{address}`                     | DeleteResult   |
| document  | create | `{bucket} --name --file [--id]` | NodeMetadata   |
| document  | get    | `{address}`                     | NodeMetadata   |
| document  | list   | `{bucket}`                      | NodeMetadata[] |
| document  | read   | `{address} [--out]`             | the bytes      |
| document  | link   | `{address}`                     | DocumentLink   |
| document  | update | `{address} --name`              | NodeMetadata   |
| document  | delete | `{address}`                     | DeleteResult   |

## Processing and tiers

Future context for placement and providers; nothing here is built in M-5.

- **Import node.** Open-source tools on a system node import drone data: OpenDroneMap
  (photogrammetry, multispectral included), GDAL (index maps, COG conversion, compression), ExifTool
  (XMP extraction). Large uploads are resumable: TUS on Supabase, multipart on S3.
- **Tiers by provider affinity.** Display-resolution COGs go to Supabase; full-resolution products
  and raw captures stay on a locally hosted archive (MinIO speaks S3, so an S3 provider serves it,
  and AWS Glacier later is configuration). Keeping raw data is the reversible choice; discarding it
  is not. Infrastructure stays at $0: the Supabase free plan holds 1 GB, caps files at 50 MB, and
  pauses idle projects (from memory; verify). Cloudflare R2 (10 GB free, no egress fees) is the
  free option if full resolution must reach the field.
- **Delivery.** All system tablets are iPads, and the assessor is usually the person assigned to
  the job. Maps reach devices by AirDrop or from the import node over the office network, into
  local storage for offline use, through one import action that validates the package. The cloud
  copy is the last resort.

## Design moments

1. **The model, the address, and the API. Settled 2026-10-29.** Platform points 1–10, the code's
   placement, and the API sketch.
2. **Lease duration. Withdrawn:** documents are immutable (point 7).
3. **Consumers. Moved** to the attachments brief.
4. **The catalog's M-5 entries. Moved** to the attachments brief.
5. **Access. Moved** to the Supabase provider brief, which owns the mechanism, storage policies;
   the rules are the attachments brief's.
6. **Supabase specifics. Moved** to the Supabase provider brief, with the CLI's location.
7. **Batch import.** A flight is thousands of files: a batch `create`, or a manifest the service
   accepts whole. Deferred: arrives with surveys.
8. **Raw retention.** Raw archived cold and products hot is the leaning; the decision is the CA's.
   Deferred: arrives with surveys.
9. **The provider interface and the makers. Settled 2026-10-30,** from ACE's scope: one internal
   provider contract in plain lineage, and a maker per provider, composed into `api` as the CRUD
   clients are (API sketch).

## Records

The platform is `core` material: its architecture earns a section in `architecture-core.md` and
its rules a section in `CONVENTIONS.md`. Both documents are locked; the CA opens them for this
brief's production, recorded here, as he does `domain/`. The back and DevOps records are the
Supabase provider brief's.

_Amended 2026-10-30:_ both records shipped ahead of the production, written by the CA and AI
Architect: `architecture-core.md` §10 Document Storage (`4d33d25`), and `CONVENTIONS.md` 1.8,
§10.8 Document store and the §13 key path and indexes (`b065c2c`). The production does not write
them; it reports anything it builds that departs from them.

## Design history

- **2026-10-23, why not one metadata file per bucket.** The CA's prior design kept one JSON per
  bucket, serialized by a single Node process's event loop. Edge functions run as concurrent
  isolates with no shared event loop, so per-bucket writes would lose updates. Sidecars keep
  metadata with documents without needing a serializer; a Postgres lock or a long-running service
  were the alternatives, and both add what the provider-neutral design avoids.
- **2026-10-24, buckets by owner, not by time.** The CA's prior buckets were a timestamp plus an
  id, one per manifest exchange. swarmAg's documents belong to records, so a bucket is its owner's
  UUID v7, which keeps the time ordering in one segment.
- **2026-10-27, the broker is deferred.** The draft put a brokering edge function in front of
  storage from the start. The repository's rule is that what can be a direct operation under RLS is
  not an edge function, and storage policies give M-5 the server-side check. The broker is the seam
  an alternative provider needs, and none is chosen: building it now would build that seam for a
  provider that may never arrive. Sidecars, leases, sweeps, and packages are staged with their
  consumers for the same reason.
- **2026-10-27, leases withdrawn.** The draft leased a document, edited it, and replaced it whole,
  from the CA's prior design, where a data interchange could arrive at any time from a remote
  writer. swarmAg has no remote writer: its documents are written by its own applications acting
  on records. Documents are immutable instead, added or removed, and a replacement is add,
  repoint, remove; the only shared state left is the reference, which the database already
  governs. The lease object, its expiry, and its sweep went with it.
- **2026-10-27, the platform and swarmAg's usage.** The draft mixed general storage design with
  swarmAg's choices in one architecture, and the namespace and bucket debate kept deciding both at
  once. Separated, the platform is small and settled, and swarmAg's usage is a catalog, so later
  milestones carry a well-scoped catalog entry instead of a storage design. In the same
  conversation the namespace became a path, since paths are for people and depth follows meaning;
  the bucket became one segment, a record's id or a name, and the unit of access and lifecycle; and
  the fixed three-level depth gave way to a hierarchy closed by kind. Buckets by owner (2026-10-24)
  remain one bucket kind.
- **2026-10-29, the kernel.** The draft's platform described storage layout: a slash-delimited key
  whose leading segments, any number of them, named the namespace; sidecars; a two-step create and
  commit; and a provider contract of keys and signed transfers. Working from the consumers inward
  and from common practice outward, the platform became a model and a kernel API over it, and layout
  became the provider's. The hierarchy is fixed at three levels; every node has an id and a name,
  and only the name changes; the address takes names or ids per segment; a namespace is where
  placement binds; and `create` takes the bytes, so commit, transfers, and the provider contract
  left the kernel.
- **2026-10-29, resolution at any depth.** With one metadata type for every level, an address
  resolves to whatever node it names, so a record reaches its bucket by address. The kernel walks
  the segments with one lookup each provider supplies, `find`, so providers never parse addresses
  or decide ambiguity. The caller-supplied id, first staged for bulk upload, came into M-5 with the
  attachments brief's inbox.
- **2026-10-29, two briefs.** The brief split by namespace: this one is `core/` and the platform's
  supporting configuration and policies; swarmAg's usage, its catalog and access rules, its stored
  references, and capture and upload, became the attachments brief in `front/`.
- **2026-10-30, the first provider.** ACE's review found the brief blocked on link lifetime,
  provider persistence, policy ownership, and reset, and all four were the Supabase provider's. A
  provider that needs nothing provisioned proves the kernel without them: IndexedDB holds the
  hierarchy as records with parent ids and the bytes as Blobs, in one transaction, and the inbox
  the attachments brief needs is that provider. The Supabase provider and its configuration,
  policies, reset, and CLI became a brief of their own, and the contract keeps the second provider
  as a constraint, so nothing in it leans on what only a local store gives. The caller-supplied id
  was narrowed to documents, with its idempotency and conflict rules.
- **2026-10-30, identity is lineage.** Storage-native Supabase keys an object by its Supabase
  bucket and path, so a provider given a bare id could not find it without a lookup of its own.
  Nothing moves, so a node's lineage is fixed at creation and serves as its identity: one id type
  per level, each extending its parent's. Providers locate any node directly, the cross-bucket
  conflict rule went away, and a level mismatch is a compile error rather than a runtime check.
- **2026-10-30, nominal identities.** ACE's second review found that structural lineage types let
  a `DocumentId` pass where a `BucketId` was expected, that IndexedDB keyed nodes by their own id
  rather than their lineage, and that a link's lifetime tied to the session had no input in
  `core/`. Each level's identity became a `NominalType`, produced only by the kernel and the
  grammar, with each contract's results typed to its level. A single `resolve` could only return
  a union, so `resolve` moved onto each contract, and since stored references are already ids, an
  id-form reference became an identity by the grammar alone: names are for people and need
  resolving, ids are for code and do not. IndexedDB keys by lineage. A link's lifetime became a
  fixed default supplied when the kernel is constructed, not tied to the session.
- **2026-10-30, a maker per provider.** ACE's scope asked how a provider is injected. The first
  sketch followed `Config`: a concrete provider class handed to a kernel maker at the composition
  point. That is the pattern for a process-wide runtime binding, not for a client. A document store
  is made like every client, by a maker per store composed into `api`
  (now `makeDocumentStoreIndexedDbClient`), and the provider contract became internal.

## Production — 2026-10-30

Foundation production implemented; awaiting CA review. This brief remains active.

- **Created:** `source/core/std/docstore-contract.ts` and `docstore-document-addresses.ts`;
  `source/core/cli/make-docstore-client.ts` and `make-indexeddb-docstore-client.ts`;
  `source/tests/cases/document-store-test.ts`. _CA, 2026-10-30:_ produced in `core/db`, then moved
  to `core/std` and `core/cli`, renamed as a client family (`makeDocumentStoreIndexedDbClient`),
  and the family's files abbreviated to `docstore` inside `core/`, before commit.
- **Modified:** `source/core/db/indexeddb.ts` and this brief. No files deleted. The architecture
  and conventions records authored by CA + AA were consumed without alteration.
- **Delivered:** the provider-neutral kernel and grammar, exact-level nominal identities, typed
  resolution, lineage-keyed IndexedDB nodes and Blobs, a concrete provider maker, and additive
  wrapper registration of key paths and indexes. Existing stores keep their original key paths
  and data. Document bytes are immutable; supplied document ids are idempotent per lineage.
- **Deno verification:** ten grammar/kernel/type-contract tests using an in-memory provider and
  the existing Preferences regression test passed (eleven tests total). Repository-wide type
  checking and lint passed. Formatting verification passed. Architecture, environment, and all
  remaining guards passed except the leaf guard below.
- **Initial wrapper verification through app-local:** Admin bound to stage, served locally on port 5174,
  with an isolated browser profile. An existing app database advanced from version 2 to 3 when a
  lineage-keyed probe store and nonunique parent/name indexes were registered. Both original
  stores and their record counts survived; an existing-store sentinel record was unchanged and
  its key path remained `id`. After reload, adding an index to the existing probe store advanced
  version 3 to 4 and preserved both probe records; the new index returned both matching records.
  No application source wiring, committed browser harness, or new dependency was added.
- **Failures fixed within scope:** initial TypeScript errors in transaction-mode generics and
  a nominal-identity test assertion.
- **Remaining check failure:** `deno task check` stops at the leaf guard because
  `source/front/app/.DS_Store` is in a non-leaf directory. This unrelated Finder file was left
  untouched. Remaining checks were run separately; no guard was weakened or bypassed.
- **Not done:** provider browser verification, explicitly assigned to attachments production;
  application/inbox integration, Supabase provider, CLI, backend provisioning, deployments, or
  resets. No change to the settled model or public API was required.
- **STYLE_AUDIT: PASS** — the four core files and the new test file were audited against
  `CONVENTIONS.md`; the full check suite remains blocked by the unrelated Finder file above.

### Strict-scrutiny repair — 2026-10-30

Repair Mode, authorized by CA from the core strict-scrutiny review. Modified the four core files,
`source/tests/cases/document-store-test.ts`, and this report; no files created or deleted in this
repair.

- Removed the wrapper's cached-connection close/reopen block from `registerStore`; registration
  remains a module-evaluation operation. Duplicate declarations still fail through `Config.fail`.
- Moved all three nominal brands, their identity types, and their three plain-construction
  producers into `docstore-contract.ts`. The kernel imports them from the contract; the
  contract imports nothing from the kernel, eliminating the cycle.
- Removed runtime validation of nominal identities and the Blob instance check. Validation stays
  at name/address and caller-supplied document-id boundaries. Tests no longer bypass nominal
  typing to demand runtime identity checks or require frozen identity objects; compile-time
  identity separation remains checked.
- Persistence is requested once without awaiting it. Link expiry is constructed through
  `toWhen`, and Blob URL revocation uses one timeout. _CA, 2026-10-30:_ the link lifetime check
  is removed with its test: the lifetime is a composition constant, not runtime configuration,
  and an invalid one fails at the first `link`; the kernel no longer imports `@core/cfg`.
- Restored standard PURPOSE/PUBLIC headers and documented internal support in PURPOSE.
- Left both version-change `blocking` handlers unchanged for the CA's decision. _CA, 2026-10-30:_
  kept. Without them a second open tab blocks every upgrade until it closes. Left the unrelated
  Finder `.DS_Store` untouched (the CA removed it). No guard or governing document changed.
- **Verification:** all eleven targeted Deno tests passed; repository-wide types and lint
  passed; formatting passed. All guards passed except the leaf guard's existing
  `source/front/app/.DS_Store` failure; guards after it were run separately.
- **Browser evidence:** the app-local upgrade results above precede this repair and included
  late registration, which this repair removes. They are historical results, not a re-run of the
  repaired registration lifecycle. No new browser check was run for this repair; the provider's
  browser check remains assigned to attachments production.
- **STYLE_AUDIT: PASS** — the four repaired core files and the updated test file were audited.
  No in-scope failures remain; the unrelated leaf-guard failure remains reported above.

### Repaired wrapper app-local verification — 2026-10-30

CA requested a browser re-run against the repaired registration lifecycle. **PASS.** This
supersedes the strict-scrutiny report's statement that no repaired-code browser check had run.

- Served stage-bound Admin through `app-stage-local` on port 5174 in isolated headless Chrome.
  Test-only declarations were injected into the served app entry immediately before bootstrap,
  during module evaluation and before the first wrapper connection; no project source was
  modified to exercise registration. Each declaration change took effect on a full reload.
- **Baseline:** the existing `swarmag-app-admin` database was version 2 with two stores. Captured
  their keys, records, and key paths, including a sentinel in the legacy `id`-keyed store.
- **Store upgrade, version 2 → 3:** registered a new lineage-keyed probe store with parent and
  nonunique compound parent/name indexes before connecting. Both existing stores, all captured
  keys and records, and their key paths remained unchanged. Both indexes correctly returned two
  records sharing the same parent and name.
- **Index-only upgrade, version 3 → 4:** on reload, declared an additional name index on the
  existing probe store before connecting. Both probe records survived and were returned by the
  new index. Original application records and key paths remained unchanged.
- **Unchanged declaration on another reload:** database stayed at version 4, retained both probe
  records and the index, and performed no additional upgrade.
- **Browser errors:** zero in the final verification run. An initial HTML-interception approach
  caused Vite client errors; an unmodified-page baseline was clean, and the final check preserved
  normal HTML/Vite initialization by injecting only before the app's bootstrap call.
- No late registration, document-provider browser check, application wiring, new dependency,
  committed test harness, or runtime code change was involved. The temporary app-local server
  was stopped after verification. The provider browser check remains with attachments production.
- **2026-10-30, a client family in `core/cli`.** The store's code was placed in `core/db` because
  `core/cli` holds application clients. Once the store was made like every client, by a maker per
  binding composed into `api`, it was an application client: CONVENTIONS §10.1 named its makers
  `make-{concept}-{role}.ts`, and the store became a client family beside Crud, Junction, and
  BusRule (`ApiDocumentStoreContract`, `makeDocumentStoreIndexedDbClient`). Its files moved to
  `core/cli`, each maker in a file of its own; `core/db` keeps the storage backends. The contract
  went where the CRUD contracts are, `core/std`, exported from `@core/stdx` with the other
  contracts and makers, so it stays out of `@core/std` and out of bundles that do not use it.
- **2026-10-30, `DocumentAddresses`.** The address operations were the type's companion, a const
  named `DocumentAddress` beside the type. Out of the contract file, the pair could not split:
  TypeScript will not export a type and a value of one name from two modules through one barrel.
  Named for what it holds, the plural `DocumentAddresses` stands alone in
  `core/std/docstore-document-addresses.ts`, and the types stay with the contracts.
