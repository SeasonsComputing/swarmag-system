# Document Storage — Brief

**Active, draft.** Recorded 2026-10-23 from a CA + AI Architect session, while settling the Asset
and Chemical Managers brief, and extended 2026-10-24. M-4 assigned Attachments to M-5; the roadmap
lists Document storage among M-5's features. Chosen from the roadmap 2026-10-24. Split 2026-10-29:
this is the `core/` brief, the platform and what it needs to run; swarmAg's use of it is the
`front/` brief, `effort/active/2026-10-29-attachments-brief.md`, which depends on this one. Awaits
CA review and the production gate. Field mapping, the main consumer of surveys and photos, is
`effort/pending/2026-10-24-field-mapping-brief.md`.

## What triggered it

The system holds images and documents: chemical labels and SDSs, asset manuals and part diagrams,
purchase and service records, job photos, and signed forms. M-4 assigned the Attachments capability
to this milestone. Nothing stores them today: `Attachment` carries a `url`, and nothing defines what
a stored document's URL names or who may write it.

## Scope

This brief is the platform: general-purpose document storage, a minimal API over replaceable
providers, that knows nothing of swarmAg. Its code is `core/db`, a Seasons Computing library, as
`core/db/supabase.ts` is. It also owns what the platform needs to run, as the database has its own
needs beside `core/db/supabase.ts`: storage configuration and storage policies. Those live in
`devops/`, Supabase's configuration, and `back/`, not in `core/`.

swarmAg's use of the platform (its namespaces and buckets, stored references in domain fields,
capture and upload, and the access rules its consumers need) is the attachments brief.

## The platform

The points are the target. Staging says what M-5 builds and which consumer brings each later
piece.

1. **A fixed hierarchy.** `namespace ─* bucket ─* document`: three levels, each holding only the
   next. Life-cycles nest: a namespace is settled and long-lived, a bucket is kept as long as its
   consumer needs it, and a document's life is shorter than its bucket's. A document cannot exist
   without its bucket, nor a bucket without its namespace.
2. **Identity and names.** Every node has an id and a name. The id is identity: a UUID, permanent,
   never read by people. The kernel mints it, unless the caller supplies one, since identity may
   exist before storage; a create with a supplied id that already exists is the same object. The
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
   `id:{id}`, so a name never begins with `id:`. An address names a node at its depth: a
   namespace, a bucket, or a document. Grammar validation needs only the address and runs in the
   kernel; storage validation, whether it resolves, needs the store. The kernel resolves an address
   one segment at a time, by id or by name within the parent; a name that matches more than one
   node is ambiguous and does not resolve. Providers never see addresses. Stored references use the
   id form; names are for people and the CLI.
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

## Code

Three files in `core/db`, the storage backends, beside `supabase.ts` and `indexeddb.ts`. Not
`core/std`, which ships to single-purpose edge functions and embedded devices and stays minimal;
not `core/cli`, which holds application clients. Each file is imported on its own, so a consumer
that needs only `Supabase.client()` never loads the document store.

| File                         | Holds                                                         |
| ---------------------------- | ------------------------------------------------------------- |
| `document-store.ts`          | The kernel: id minting, validation, resolution, a provider    |
| `document-store-contract.ts` | `NodeMetadata`, the node contracts, and the address grammar   |
| `document-store-supabase.ts` | The Supabase provider, over `Supabase.client()`               |

The CLI's location is open (design moment 6).

## Staging

The repository's rule for the backend holds for storage: what can be a direct operation under RLS
is not an edge function (`architecture-back.md` §3). Supabase Storage enforces RLS on
`storage.objects` on the server, so policies give M-5 its server-side check, and the client
reaches the provider through the kernel, as the CRUD clients reach theirs.

**M-5 builds:**

- The kernel, the contract, and the address grammar (platform points 1–4, 6–9), with the default
  placement only (point 5). The caller-supplied id is in M-5: the attachments brief's inbox mints
  ids before storage.
- The Supabase provider, serving the front and back profiles.
- The CLI (point 10).
- Storage configuration, storage policies, and reset (DevOps 1–3, 7).

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
provider only valid input.

```ts
/** Every node's metadata; count is what the node directly holds: buckets, documents, or bytes. */
type NodeMetadata = { id: Id; name: string; createdAt: When; count: number }

type DocumentLink = { url: string; expiresAt: When }

/** A name, or an id; string form: {name} | id:{id}. */
type AddressSegment = string | { id: Id }

/** One to three segments: a namespace, a bucket, or a document. */
type DocumentAddress = readonly AddressSegment[]

/** The address grammar: needs no store, shared by every profile. */
const DocumentAddress = {
  build(
    namespace: AddressSegment,
    bucket?: AddressSegment,
    document?: AddressSegment
  ): DocumentAddress
  parse(address: string): DocumentAddress
  format(address: DocumentAddress): string
  validate(address: string): boolean
}

/** Common to every node: identity, naming, lookup within a parent, removal. */
interface StoreNodeContract<ParentId = void> {
  get(id: Id): Promise<NodeMetadata>
  find(parentId: ParentId, name: string): Promise<readonly NodeMetadata[]> // resolve walks it
  list(parentId: ParentId): Promise<readonly NodeMetadata[]>
  update(id: Id, name: string): Promise<NodeMetadata> // rename only
  delete(id: Id): Promise<DeleteResult> // containers: empty only
}

interface NamespaceContract extends StoreNodeContract {
  create(name: string, placement?: string, id?: Id): Promise<NodeMetadata>
}

interface BucketContract extends StoreNodeContract<Id> {
  create(namespaceId: Id, name: string, id?: Id): Promise<NodeMetadata>
}

interface DocumentContract extends StoreNodeContract<Id> {
  create(bucketId: Id, body: Blob, name?: string, id?: Id): Promise<NodeMetadata>
  read(id: Id): Promise<Blob>
  link(id: Id): Promise<DocumentLink>
}

/** The kernel: the named hierarchy, and address resolution across it. */
interface ApiDocStoreContract {
  namespace: NamespaceContract
  bucket: BucketContract
  document: DocumentContract
  resolve(address: string | DocumentAddress): Promise<NodeMetadata>
}
```

A document's name defaults to its file's name. `get` is metadata; `read` is bytes; `link` is a
URL for the browser. `validate` checks a whole address; the name check it applies to each segment
is private to the grammar, and the kernel applies it on every `create` and `update`. `build` and
`parse` produce the same value, so the kernel walks one form whether an address came from code or
from a person.

The CLI is `doc-store {noun} {verb}`:

| Noun      | Verb    | Arguments                            | Returns         |
| --------- | ------- | ------------------------------------ | --------------- |
| namespace | create  | `--name [--placement] [--id]`        | NodeMetadata    |
| namespace | get     | `--namespace-id`                     | NodeMetadata    |
| namespace | list    |                                      | NodeMetadata[]  |
| namespace | update  | `--namespace-id --name`              | NodeMetadata    |
| namespace | delete  | `--namespace-id`                     | DeleteResult    |
| bucket    | create  | `--namespace-id --name [--id]`       | NodeMetadata    |
| bucket    | get     | `--bucket-id`                        | NodeMetadata    |
| bucket    | list    | `--namespace-id`                     | NodeMetadata[]  |
| bucket    | update  | `--bucket-id --name`                 | NodeMetadata    |
| bucket    | delete  | `--bucket-id`                        | DeleteResult    |
| document  | create  | `--bucket-id --file [--name] [--id]` | NodeMetadata    |
| document  | get     | `--document-id`                      | NodeMetadata    |
| document  | list    | `--bucket-id`                        | NodeMetadata[]  |
| document  | read    | `--document-id [--out]`              | the bytes       |
| document  | link    | `--document-id`                      | DocumentLink    |
| document  | update  | `--document-id --name`               | NodeMetadata    |
| document  | delete  | `--document-id`                      | DeleteResult    |
| —         | resolve | `{address}`                          | NodeMetadata    |

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

## DevOps

Storage is the first platform service since Auth that the repository must own, and it is a
feature set of its own. Auth's configuration sets the pattern (`architecture-devops.md` §13): the
repository is authoritative, not the dashboard; `config.toml` owns local behavior, a per-target
contract owns hosted behavior, and a task applies it and reads back every value. Nothing of this
exists for storage: `config.toml`'s `[storage]` block is the scaffold default (50 MiB, no buckets),
and the architecture documents name storage only in passing.

1. **Storage configuration.** Physical buckets, file size limit, MIME restrictions, and the S3
   protocol switch: local in `config.toml`, hosted in a per-target contract, applied by a task and
   verified by reading back. How the default placement maps namespaces onto Supabase's physical
   buckets is the provider's (design moment 6).
2. **Storage policies.** SQL on `storage.objects`, a schema Supabase manages as it does `auth`. M-5
   starts from a baseline, signed-in users only; the rules swarmAg's namespaces need are specified
   by the attachments brief and written here. Open: whether `schema.sql` owns them, as genesis owns
   the `auth.users` seeds.
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

1. **The model, the address, and the API. Settled 2026-10-29.** Platform points 1–10, the code's
   placement, and the API sketch.
2. **Lease duration. Withdrawn:** documents are immutable (point 7).
3. **Consumers. Moved** to the attachments brief.
4. **The catalog's M-5 entries. Moved** to the attachments brief.
5. **Access.** The mechanism, storage policies, is here (DevOps 2); the rules are the attachments
   brief's.
6. **Supabase specifics.** Signed and resumable uploads; how namespaces map onto physical buckets;
   policy ownership; and where the CLI lives.
7. **Batch import.** A flight is thousands of files: a batch `create`, or a manifest the service
   accepts whole. Deferred: arrives with surveys.
8. **Raw retention.** Raw archived cold and products hot is the leaning; the decision is the CA's.
   Deferred: arrives with surveys.

## Records

The platform is `core` material: its architecture earns a section in `architecture-core.md` and
its rules a section in `CONVENTIONS.md`. Storage policies earn a section in `architecture-back.md`
beside Row Level Security (§4.3), and storage configuration a section in `architecture-devops.md`,
as Auth has (§13). The four documents are locked; the CA opens them for this brief's production,
recorded here, as he does `domain/`.

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
