# Document Storage — Brief

**Active, draft.** Recorded 2026-10-23 from a CA + AI Architect session, while settling the Asset
and Chemical Managers brief, and extended 2026-10-24. M-4 assigned Attachments to M-5; the roadmap
lists Document storage among M-5's features. Chosen from the roadmap 2026-10-24. Awaits the design
moments, CA review, and the production gate. Field mapping, the main consumer of surveys and photos, is
`effort/pending/2026-10-24-field-mapping-brief.md`.

## What triggered it

`Chemical.labels` reference documents that must already be stored, and asset documents need the
Attachments capability M-4 assigned to this milestone. Nothing stores documents today: `Attachment`
carries a `url`, and nothing defines what that URL names or who may write it.

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

1. **A closed hierarchy.** `namespace ─* bucket ─* document`, closed by kind: namespaces, buckets,
   and documents are the only kinds of thing, with no arbitrary folders. A namespace is a path, as
   deep as its meaning needs (`assets`, `customers/{customer-id}/sites`). A bucket is one segment
   and holds related documents. A document sits directly in its bucket. A path parses from the
   right: the last two segments are the bucket and the document, and the rest is the namespace.
   Identity and affinity come from the hierarchy, by convention and validation, never from the
   storage provider.
2. **Two identifiers.** A document has an `id()` and a path. The id is for machines: permanent and
   never read by people. The path is for people: an organizational address that reaches the
   document with nothing else to resolve.
3. **The path is logical.** Supabase Storage is today's provider, not the model. Document management
   may move whole to AWS S3, or in-house to OpenCloud, by system affinity. A provider maps the
   logical path onto its own storage, whether or not that storage has buckets. The domain stores
   only paths and ids, never a physical location.
4. **Contract, providers, makers.** A `Documents` contract, one provider per cloud, and a maker that
   selects the provider, as the repository's other contracts are built.
5. **A thin brokering service.** One service, an edge function as user management is. It validates
   the path against the hierarchy, applies access rules, records metadata, and returns a
   short-lived signed URL. Bytes move directly between the client and the provider, never through
   the function. Validation needs a server because client checks can be bypassed; a provider swap
   stays server-side because the client never knows the provider.
6. **Metadata lives with documents.** A sidecar beside each document (for example
   `{path}.meta.json`), not a table and not one file per bucket. Each document owns its metadata,
   so writes never contend. A bucket's view is an aggregate built from sidecars by common parent
   path, only when needed, and disposable. Moving providers is a copy of objects, with no database
   to migrate.
7. **Documents are immutable.** A document is added or removed, never changed, so a path never
   moves and its bytes never differ. A replacement is three steps: add the new document, repoint
   the reference on the owning record, remove the old one. The only shared state is the reference,
   an ordinary domain update, so no merging, conflict resolution, or partial write exists, and an
   offline Ops device only ever adds.
8. **Scheduled sweeps.** Supabase Cron (`pg_cron` invoking an edge function) runs the background
   work as a second entry point of the same service: removing orphans (bytes without a sidecar, a
   sidecar without bytes, or a document no record refers to, left when a replacement stops between
   repointing and removing), and rebuilding stale aggregates.
9. **Packages are typed buckets.** A bucket holding a `manifest.json` (type, version, contents,
   checksums) is a package: self-describing offline, transferable as one file, and archived as one
   unit. Depth stays closed.

## swarmAg's usage

1. **A catalog.** swarmAg declares its namespaces as templates, and validation matches a path
   against them, so paths stay readable and their shapes finite. Each namespace declares its
   buckets: a record's bucket, keyed by a domain id, or a named bucket.
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
`storage.objects` on the server, so policies cover the broker's two reasons in M-5: they check the
path's namespace and owner segments and the caller's role where no client can bypass them, and the
client reaches the provider through a maker, as the CRUD clients do.

**M-5 builds:**

- The closed hierarchy and the logical `DocumentPath` (platform points 1–3), and the catalog's M-5
  entries (usage 5).
- `ApiDocumentContract` and `makeSupabaseDocumentClient`, selected by maker (point 4).
- Storage policies as the server-side check, with buckets and configuration owned by the
  repository (DevOps 1–3, 7).
- Immutable documents (point 7): `create`, `commit`, `read`, `list`, and `delete`; a replacement
  is add, repoint, remove.

**Each later piece arrives with its consumer:**

| Piece                 | Arrives with                                                            |
| --------------------- | ----------------------------------------------------------------------- |
| The broker (point 5)  | An alternative provider: S3 and MinIO need presigned URLs from a server |
| Sidecars (point 6)    | Survey properties (bounds, CRS, bands) beyond the provider's metadata   |
| Cron sweeps (point 8) | The broker's two-step create and commit                                 |
| Packages (point 9)    | Field mapping                                                           |

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

Names proposed; the shape follows the architecture. Two contracts, because the multi-cloud seam
is not the seam the client calls. `DocumentPath` follows `Id`'s pattern, one producer and one
guard, as a `NominalType` (`effort/completed/2026-10-27-nominal-types-brief.md` adds it); nothing here
waits on a nominal `Id`. In M-5 the client contract is
implemented by `makeSupabaseDocumentClient`; the provider contract arrives with the broker.

```ts
/** Logical accessor: `${namespace}/${bucket}/${id}`, the namespace a path; never a physical URL. */
declare const documentPathBrand: unique symbol
export type DocumentPath = NominalType<string, typeof documentPathBrand>

/** The source of truth for one document: provider metadata in M-5, a sidecar later. */
export type DocumentMetadata = {
  id: Id
  path: DocumentPath
  filename: string
  contentType: string
  size: number
  createdAt: When
  properties: Dictionary // read on arrival: geo bounds, CRS, position, bands
}

/** Short-lived, provider-signed access to bytes. */
export type DocumentTransfer = { url: string; protocol: 'single' | 'resumable'; expiresAt: When }

/** Client contract: a client maker in M-5, the service once the broker arrives. */
export interface ApiDocumentContract {
  create(
    namespace: string,
    bucket: string, // a domain id or a name, as the catalog declares
    file: DocumentFile
  ): Promise<{ path: DocumentPath; upload: DocumentTransfer }>
  commit(path: DocumentPath): Promise<DocumentMetadata>
  read(path: DocumentPath): Promise<{ meta: DocumentMetadata; download: DocumentTransfer }>
  list(namespace: string, bucket: string): Promise<readonly DocumentMetadata[]>
  delete(path: DocumentPath): Promise<DeleteResult>
}

/** Provider contract: the multi-cloud seam, held only by the service; arrives with the broker. */
export interface DocumentStoreContract {
  signUpload(key: string, file: DocumentFile): Promise<DocumentTransfer>
  signDownload(key: string): Promise<DocumentTransfer>
  readObject(key: string): Promise<string | null>
  writeObject(key: string, body: string): Promise<void>
  listKeys(prefix: string): Promise<readonly string[]>
  remove(key: string): Promise<void>
}
```

Creating is two steps: `create` reserves the path and signs the upload; `commit` runs after the
bytes land, verifies them, reads their properties, and writes the sidecar. A sidecar without bytes
cannot exist, so sweeps remove only uncommitted bytes. In M-5, `create` signs the upload in the
client under RLS, which Supabase supports, and `commit` reads the stored object's metadata, so the
contract does not change when the broker arrives. `list` is the on-demand aggregate. Type
names spell out `Metadata`; variables and fields may use `meta`.

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

1. **The path's form. Settled.** `{namespace}/{bucket}/{id}`, where the namespace is a path, parsed
   from the right (platform point 1). It is a path in the sense an S3 key is: a flat string whose
   `/` delimits a hierarchy, so a sorted listing reads as the hierarchy, and listing a bucket is a
   prefix listing. Document ids are UUID v7, so a bucket lists in creation order. No scheme: a
   `doc://` prefix is not part of a path, and the nominal type and separate fields already tell a
   path from a URL. No extension: the content type lives in the metadata. The filename lives in the
   metadata too, so a download takes it from there. `documentPath({ namespace, bucket, id })` is
   the producer and `isDocumentPath` the guard, as for `Id`.
2. **Lease duration. Withdrawn:** documents are immutable (point 7).
3. **`Attachment` and `ChemicalLabel`.** `url` becomes `path: DocumentPath`; whether `Attachment`'s
   `filename` and `contentType` duplicate the sidecar. The Chemical labels editor and `sdsUrl`'s
   storage integration, deferred by the managers brief, land here.
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
