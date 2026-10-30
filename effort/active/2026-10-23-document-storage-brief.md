# Document Storage — Brief

**Active, draft.** Recorded 2026-10-23 from a CA + AI Architect session, while settling the Asset
and Chemical Managers brief, and extended 2026-10-24. M-4 assigned Attachments to M-5; the roadmap
lists Document storage among M-5's features. Chosen from the roadmap 2026-10-24. Awaits the design
moments, CA review, and the production gate. Field mapping, the main consumer of surveys and photos, is
`effort/pending/2026-10-24-field-mapping-brief.md`.

## What triggered it

The system holds images and documents: chemical labels and SDSs, asset manuals and part diagrams,
purchase and service records, job photos, and signed forms. M-4 assigned the Attachments capability
to this milestone. Nothing stores them today: `Attachment` carries a `url`, and nothing defines what
a stored document's URL names or who may write it.

## Two concepts

Document storage is two things. **The platform** is general-purpose document storage: a closed API
over replaceable providers, kept simple on purpose, that knows nothing of swarmAg. It is `core`
material, like the CRUD clients. **swarmAg's usage** is a policy over the platform: which namespaces
exist, what their buckets are, and who reads and writes them. It is swarmAg's, like `api.ts`
composing the CRUD clients. A later milestone that stores documents uses the settled platform and
adds catalog entries; it does not redesign storage.

## The platform

The points are the target. Staging says what M-5 builds and which consumer brings each later
piece.

1. **A fixed hierarchy.** `namespace ─* bucket ─* document`: three levels, each holding only the
   next. Life-cycles nest: a namespace is settled and long-lived, a bucket is kept as long as its
   consumer needs it, and a document's life is shorter than its bucket's. A document cannot exist
   without its bucket, nor a bucket without its namespace.
2. **Identity and names.** Every node has an id and a name. The id is identity: a UUID the kernel
   mints, permanent, never read by people. The name is for people and is the only thing that
   changes; a rename keeps identity. Names need not be unique among siblings.
3. **Metadata is the model.** Every node has the same metadata: `{ id, name, createdAt, count }`,
   where the count is what the node directly holds: a namespace's buckets, a bucket's documents, a
   document's bytes. Listing a container's children is a separate operation. A document's content
   type belongs to its bytes: it arrives with them, is served with them, and is recorded by the
   consumer's own field, as `Attachment.contentType`. How a provider keeps metadata and lays out
   storage (tables, sidecars, object metadata, key shapes) is the provider's, and invisible through
   the API.
4. **The address.** `{namespace}/{bucket}/{document}`, each segment a name or `id:{id}`, so a name
   never begins with `id:`. Grammar validation needs only the address and runs in the kernel;
   storage validation, whether it resolves, needs the store. A name address that matches more than
   one document is ambiguous and does not resolve. Stored references use the id form; names are
   for people and the CLI.
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
   short-lived URL the browser fetches itself, for display. A link's lifetime is the kernel's
   default, no longer than the session that asked for it, and a link is never stored; it is minted
   from the id when needed.
10. **The CLI is the API.** `doc-store {noun} {verb}` maps one to one onto the contract.

## swarmAg's usage

1. **A catalog.** swarmAg declares its namespaces and, for each, the buckets it holds: a record's
   bucket or a named bucket. How a record reaches its bucket is settled in the domain walk (design
   moment 3).
2. **A bucket is the unit of access and lifecycle.** What can be read, by whom, and how long it is
   kept are decided per bucket. A customer's bucket holds everything about that customer: the
   customer portal sees it, and it goes when the customer goes. A shared library (an asset type's
   manuals and part diagrams) is the bucket of the record it is about.
3. **Namespaces are subjects.** A namespace is named by subject (`assets`, `chemicals`, `jobs`), not
   topic: topic is container-aligned. A document owned by a composition without an id (a `Note`, a
   `CustomerSite`) lives in its owning record's bucket; its metadata names the composition.
4. **Meaning lives in the domain.** What kind of document something is, and what it is for, belong
   to the field that refers to it and to its metadata, not to the store.
5. **M-5's entries:** chemicals, assets, and asset types (design moment 4). Later milestones add
   theirs. Known future packages:
   - **Survey:** one flight: the map COGs and their sidecars, the manifest, and a GeoJSON snapshot
     of the job's zones. The database holds the canonical zones.
   - **Work:** one execution: GPS-tagged photos in the order taken.
   - **Raw:** a flight's raw captures, packaged with a checksum manifest for the archive.

## Staging

The repository's rule for the backend holds for storage: what can be a direct operation under RLS
is not an edge function (`architecture-back.md` §3). Supabase Storage enforces RLS on
`storage.objects` on the server, so policies give M-5 its server-side check, and the client
reaches the provider through a maker, as the CRUD clients do.

**M-5 builds:**

- The kernel contract and the address grammar (platform points 1–4, 6–9), with the default
  placement only (point 5).
- A Supabase maker serving the front and back profiles.
- The CLI (point 10).
- The catalog's M-5 entries (usage 5).
- Storage policies as the server-side check, with buckets and configuration owned by the
  repository (DevOps 1–3, 7).

**Each later piece arrives with its consumer:**

| Piece                                    | Arrives with                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| The broker                               | An alternative provider: S3 and MinIO need presigned URLs from a server |
| Placement providers                      | The first namespace that needs other than the default placement         |
| A caller-supplied id on `create`         | Bulk upload, or ids minted before storage                               |
| A `link` lifetime argument               | A consumer that needs a link other than the session's                   |
| Renditions, a `link` option              | A view that needs smaller images than the originals                     |
| Document properties (bounds, CRS, bands) | Field mapping                                                           |
| Packages                                 | Field mapping                                                           |
| Sweeps                                   | Orphaned documents that cost enough to collect                          |

## Document types

The store handles formats; meaning belongs to the domain field that refers to a document (usage
4). A signed regulatory form is a role, not a format: it may be a signed PDF or a photo of the
signed paper, and the field that refers to it says which form it is. Every document is immutable
(platform point 7), which keeps a signature's promise that its bytes never change.

- **Documents (PDF):** `Chemical.labels`, `sdsUrl`, asset manuals, signed regulatory forms. Small;
  a new revision is a new document.
- **Images.** Photo evidence, asset photos, photos of signed forms, `User.avatarUrl`. A workflow
  step asks for a photo; the crew takes it. iOS Safari strips GPS from web captures, so the app
  reads the position at the shutter and writes it, with accuracy, heading, capture time, crew
  member, question, and work log entry, to the sidecar.
- **Survey maps.** Every job is backed by an aerial multispectral map of its region. The DJI P4
  Multispectral writes six images per capture point (RGB plus blue, green, red, red edge, and
  near-infrared), with GPS and irradiance in XMP: thousands of files and several gigabytes per
  flight. Processing yields per-band reflectance and index maps (NDVI, NDRE) as GeoTIFFs, stored as
  Cloud-Optimized GeoTIFFs (COGs): compressed, with internal overviews, read by range request so a
  viewer fetches only what is on screen.
- **Video, deferred.** Walkthroughs before, during, and after a job. An iPad records HEVC at very
  roughly 60–100 MB a minute at 1080p, past the free plan's 50 MB file cap; uploads from the field
  must be resumable; playback is by range request, and other browsers than Safari play HEVC
  unevenly, so the customer portal may need a transcode. It joins the large-file tier with maps.

## Processing and tiers

- **Import node.** Open-source tools on a system node import drone data: OpenDroneMap (photogrammetry,
  multispectral included), GDAL (index maps, COG conversion, compression), ExifTool (XMP into
  sidecars). Large uploads are resumable: TUS on Supabase, multipart on S3.
- **Tiers by provider affinity.** Display-resolution COGs go to Supabase; full-resolution products
  and raw captures stay on a locally hosted archive (MinIO speaks S3, so `makeS3DocumentStore`
  serves it, and AWS Glacier later is configuration). Keeping raw data is the reversible choice;
  discarding it is not. Infrastructure stays at $0: the Supabase free plan holds 1 GB, caps files at
  50 MB, and pauses idle projects (from memory; verify). Cloudflare R2 (10 GB free, no egress fees)
  is the free option if full resolution must reach the field.
- **Delivery.** All system tablets are iPads, and the assessor is usually the person assigned to
  the job. Maps reach devices by AirDrop or from the import node over the office network, into
  local storage for offline use, through one import action that validates the package. The cloud
  copy is the last resort.

## API sketch

Names proposed; the shape follows the architecture. A common contract carries what every node
shares, and each level's contract adds only its difference: its `create`, and for documents `read`
and `link`. The kernel mints ids, validates names
and addresses, and hands a provider only valid input.

```ts
/** Every node's metadata; count is what the node directly holds: buckets, documents, or bytes. */
type NodeMetadata = { id: Id; name: string; createdAt: When; count: number }

type DocumentLink = { url: string; expiresAt: When }

type AddressSegment = { name: string } | { id: Id } // string form: {name} | id:{id}
type AddressTarget = { namespace: AddressSegment; bucket: AddressSegment; document: AddressSegment }
type DocumentAddress = string | AddressTarget

/** The address grammar: needs no store, shared by every profile. */
const DocumentAddress = {
  parse(address: string): AddressTarget
  format(target: AddressTarget): string
  validate(segment: AddressSegment): boolean
}

/** Common to every node: identity, naming, listing within a parent, removal. */
interface StoreNodeContract<ParentId = void> {
  get(id: Id): Promise<NodeMetadata>
  list(parentId: ParentId): Promise<readonly NodeMetadata[]>
  update(id: Id, name: string): Promise<NodeMetadata> // rename only
  delete(id: Id): Promise<DeleteResult> // containers: empty only
}

interface NamespaceContract extends StoreNodeContract {
  create(name: string, placement?: string): Promise<NodeMetadata>
}

interface BucketContract extends StoreNodeContract<Id> {
  create(namespaceId: Id, name: string): Promise<NodeMetadata>
}

interface DocumentContract extends StoreNodeContract<Id> {
  create(bucketId: Id, body: Blob, name?: string): Promise<NodeMetadata>
  read(id: Id): Promise<Blob>
  link(id: Id): Promise<DocumentLink>
}

/** The kernel: the named hierarchy, and address resolution across it. */
interface ApiDocStoreContract {
  namespace: NamespaceContract
  bucket: BucketContract
  document: DocumentContract
  resolve(address: DocumentAddress): Promise<NodeMetadata>
}
```

A document's name defaults to its file's name. `get` is metadata; `read` is bytes; `link` is a
URL for the browser.

The CLI is `doc-store {noun} {verb}`:

| Noun      | Verb   | Arguments                            | Returns              |
| --------- | ------ | ------------------------------------ | -------------------- |
| namespace | create | `--name [--placement]`               | NodeMetadata         |
| namespace | get    | `--namespace-id`                     | NodeMetadata         |
| namespace | list   |                                      | NodeMetadata[]       |
| namespace | update | `--namespace-id --name`              | NodeMetadata         |
| namespace | delete | `--namespace-id`                     | DeleteResult         |
| bucket    | create | `--namespace-id --name`              | NodeMetadata         |
| bucket    | get    | `--bucket-id`                        | NodeMetadata         |
| bucket    | list   | `--namespace-id`                     | NodeMetadata[]       |
| bucket    | update | `--bucket-id --name`                 | NodeMetadata         |
| bucket    | delete | `--bucket-id`                        | DeleteResult         |
| document  | create | `--bucket-id --file [--name]`        | NodeMetadata         |
| document  | get    | `--document-id`                      | NodeMetadata         |
| document  | list   | `--bucket-id`                        | NodeMetadata[]       |
| document  | read   | `--document-id [--out]`              | the bytes            |
| document  | link   | `--document-id`                      | DocumentLink         |
| document  | update | `--document-id --name`               | NodeMetadata         |
| document  | delete | `--document-id`                      | DeleteResult         |
| —         | resolve | `{address}`                        | NodeMetadata         |

## DevOps

Storage is the first platform service since Auth that the repository must own, and it is a
feature set of its own. Auth's configuration sets the pattern (`architecture-devops.md` §13): the
repository is authoritative, not the dashboard; `config.toml` owns local behavior, a per-target
contract owns hosted behavior, and a task applies it and reads back every value. Nothing of this
exists for storage: `config.toml`'s `[storage]` block is the scaffold default (50 MiB, no buckets),
and the architecture documents name storage only in passing.

1. **Storage configuration.** Physical buckets, file size limit, MIME restrictions, and the S3
   protocol switch: local in `config.toml`, hosted in a per-target contract, applied by a task and
   verified by reading back. Open: one physical bucket for every namespace, or one per top-level
   namespace (design moment 4).
2. **Storage policies.** SQL on `storage.objects`, a schema Supabase manages as it does `auth`.
   Open: whether `schema.sql` owns them, as genesis owns the `auth.users` seeds.
3. **Genesis and reset.** `db-genesis` resets the database and leaves stored objects behind, so a
   stage reset leaves documents whose owners no longer exist. A storage reset and its verification
   join `db-reset`.
   Items 4–6 arrive with the broker; M-5 needs 1–3 and 7.

4. **Cron.** The `pg_cron` and `pg_net` extensions, the job definitions, and the credential the job
   uses to call the sweep entry point, held in Vault. Open: where the job definitions live and how
   each target receives them.
5. **Secrets and runtime configuration.** Secret Registry entries (§5) and edge runtime
   configuration (§4.4): the Cron credential now; the archive's S3 credentials and the provider
   selection later.
6. **Edge deployment.** The broker and the sweep, one service with two entry points, deploy through
   `edge-deploy` and its verification (§8.6). Stage integration tests remove the objects they
   write.
7. **Free-tier usage.** Keeping infrastructure at $0 means watching the 1 GB limit: a task reports
   storage usage per target.
8. **The import node** (ODM, GDAL, ExifTool) is a deployable outside Supabase, and not this brief's:
   it belongs with field mapping or a later brief of its own.

The production is Foundation mode and reads the DevOps context beside Base.

## Design moments

1. **The model, the address, and the API. Settled 2026-10-29.** Platform points 1–10 and the API
   sketch.
2. **Lease duration. Withdrawn:** documents are immutable (point 7).
3. **Consumers.** No domain change is assumed: a `url` names a potentially remote resource. What a
   consumer's field holds for a stored document, and how a record reaches its bucket, are settled
   in the domain walk. The Chemical labels editor and `sdsUrl`'s storage integration, deferred by
   the managers brief, land here.
4. **The catalog's M-5 entries:** chemicals (labels, the SDS, signed regulatory forms), assets
   (purchase orders, service records), and asset types (manuals, part diagrams). For each: the
   namespace, its buckets, and whether a bucket is a record or named; and where the catalog lives.
5. **Access rules,** per bucket: which roles read or write it; a customer receives signed URLs only
   for shared documents in their own bucket.
6. **Supabase specifics.** Signed and resumable uploads; the open DevOps questions (bucket mapping,
   policy ownership) are in DevOps.
7. **Batch import.** A flight is thousands of files: a batch `create`/`commit`, or a manifest the
   service accepts whole. Deferred: arrives with surveys.
8. **Raw retention.** Raw archived cold and products hot is the leaning; the decision is the CA's.
   Deferred: arrives with surveys.

## Records

The platform is `core` material: its architecture earns a section in `architecture-core.md` and
its rules a section in `CONVENTIONS.md`. swarmAg's catalog and access rules are swarmAg's, recorded
apart from the platform's sections; where is settled with design moment 4. Storage policies earn a
section in `architecture-back.md` beside Row Level Security (§4.3), and storage configuration a
section in `architecture-devops.md`, as Auth has (§13). The four documents are locked; the CA
opens them for this brief's production, recorded here, as he does `domain/`.

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
  left the kernel. Field capture travels in the job upload, which chooses its own environment, so
  the kernel needs no offline queue, and photos are not scaled on the device.
