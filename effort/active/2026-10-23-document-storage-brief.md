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

## The architecture

1. **A closed hierarchy.** `swarmAg ─* namespace ─* bucket ─* document`. Depth is fixed at three
   levels: arbitrary nesting, and the complexity, storage, and compute it costs, are traded for
   buckets that may hold many documents. Identity and affinity come from the hierarchy, by
   convention and validation, never from the storage provider.
2. **Two identifiers.** A document has an `id()` and a path. The path is a complete accessor on its
   own: it reaches the document with nothing else to resolve.
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
7. **Lease, edit, replace.** Documents are never edited in place. A document is leased, edited, and
   the original replaced whole. One writer per document removes merging, conflict resolution, and
   partial writes, and suits offline Ops devices. Acquiring a lease is a create-if-absent write of
   a lease object (for example `{path}.lease`), which every provider supports: Supabase Storage
   refuses an existing object without `upsert`, and S3 has `If-None-Match`. A lease carries a
   holder and an expiry; an expired lease may be taken at acquire time.
8. **Scheduled sweeps.** Supabase Cron (`pg_cron` invoking an edge function) runs the background
   work as a second entry point of the same service: releasing expired leases, removing orphans
   (bytes without a sidecar, or a sidecar without bytes), and rebuilding stale aggregates.
9. **Namespaces are subjects; buckets are owners.** A namespace is named by subject (`assets`,
   `chemicals`, `jobs`), not topic: topic is container-aligned. A bucket is named by its owner's
   UUID v7, so a namespace lists its buckets in creation order with no timestamp to store. A
   document owned by a composition without an id (a `Note`, a `CustomerSite`) lives in its owning
   record's bucket; its sidecar names the composition.
10. **Packages are typed buckets.** A bucket holding a `manifest.json` (type, version, contents,
    checksums) is a package: self-describing offline, transferable as one file, archived and leased
    as one unit. Depth stays closed. Known packages:
    - **Survey:** one flight under `jobs/{survey id}/`: the map COGs and their sidecars, the
      manifest, and a GeoJSON snapshot of the job's zones. The database holds the canonical zones.
    - **Work:** one execution under `jobs/{job work id}/`: GPS-tagged photos in the order taken.
    - **Raw:** a flight's raw captures, packaged with a checksum manifest for the archive.

## Document types

- **Reference material:** `Chemical.labels`, `sdsUrl`, `User.avatarUrl`, asset manuals. Small,
  published elsewhere, rarely changed.
- **Survey maps.** Every job is backed by an aerial multispectral map of its region. The DJI P4
  Multispectral writes six images per capture point (RGB plus blue, green, red, red edge, and
  near-infrared), with GPS and irradiance in XMP: thousands of files and several gigabytes per
  flight. Processing yields per-band reflectance and index maps (NDVI, NDRE) as GeoTIFFs, stored as
  Cloud-Optimized GeoTIFFs (COGs): compressed, with internal overviews, read by range request so a
  viewer fetches only what is on screen.
- **Photo evidence.** A workflow step asks for a photo; the crew takes it. iOS Safari strips GPS
  from web captures, so the app reads the position at the shutter and writes it, with accuracy,
  heading, capture time, crew member, question, and work log entry, to the sidecar. Evidence is
  write-once: no leases.

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
is not the seam the client calls.

```ts
/** Logical accessor: `${namespace}/${bucket}/${id}`; never a physical URL. */
export type DocumentPath = string & { readonly __brand: 'DocumentPath' }

/** Sidecar metadata, the source of truth for one document. */
export type DocumentMetadata = {
  id: Id
  path: DocumentPath
  filename: string
  contentType: string
  size: number
  createdAt: When
  replacedAt?: When
  properties: Dictionary // read on arrival: geo bounds, CRS, position, bands
}

/** Short-lived, provider-signed access to bytes. */
export type DocumentTransfer = { url: string; protocol: 'single' | 'resumable'; expiresAt: When }

/** Exclusive right to replace one document. */
export type DocumentLease = { path: DocumentPath; holder: Id; token: string; expiresAt: When }

/** Client contract, implemented only by the service. */
export interface ApiDocumentContract {
  create(
    namespace: string,
    bucket: Id,
    file: DocumentFile
  ): Promise<{ path: DocumentPath; upload: DocumentTransfer }>
  commit(path: DocumentPath): Promise<DocumentMetadata>
  read(path: DocumentPath): Promise<{ meta: DocumentMetadata; download: DocumentTransfer }>
  list(namespace: string, bucket: Id): Promise<readonly DocumentMetadata[]>
  lease(path: DocumentPath): Promise<DocumentLease>
  replace(lease: DocumentLease, file: DocumentFile): Promise<DocumentTransfer>
  release(lease: DocumentLease): Promise<void>
  delete(path: DocumentPath): Promise<DeleteResult>
}

/** Provider contract: the multi-cloud seam, held only by the service. */
export interface DocumentStoreContract {
  signUpload(key: string, file: DocumentFile): Promise<DocumentTransfer>
  signDownload(key: string): Promise<DocumentTransfer>
  createIfAbsent(key: string, body: string): Promise<boolean> // lease primitive
  readObject(key: string): Promise<string | null>
  writeObject(key: string, body: string): Promise<void>
  listKeys(prefix: string): Promise<readonly string[]>
  remove(key: string): Promise<void>
}
```

Creating is two steps: `create` reserves the path and signs the upload; `commit` runs after the
bytes land, verifies them, reads their properties, and writes the sidecar. A sidecar without bytes
cannot exist, so sweeps remove only uncommitted bytes. `list` is the on-demand aggregate. Type
names spell out `Metadata`; variables and fields may use `meta`.

## Design moments

1. **The path's form.** The document segment is the id, so renames and replacements never move a
   path; the name lives in the sidecar. Open: whether the path carries a scheme (`doc://…`).
2. **Lease duration** and who may break a lease.
3. **`Attachment` and `ChemicalLabel`.** `url` becomes `path: DocumentPath`; whether `Attachment`'s
   `filename` and `contentType` duplicate the sidecar. The Chemical labels editor and `sdsUrl`'s
   storage integration, deferred by the managers brief, land here.
4. **The namespace catalog** and its validation.
5. **Access rules.** Which roles read or write which namespaces; a customer receives signed URLs
   only for shared documents on their own jobs.
6. **Supabase specifics.** Signed and resumable uploads, storage policies, and Cron setup.
7. **Batch import.** A flight is thousands of files: a batch `create`/`commit`, or a manifest the
   service accepts whole.
8. **Raw retention.** Raw archived cold and products hot is the leaning; the decision is the CA's.

## Records

The architecture earns its own section in `architecture-core.md` and its rules a section in
`CONVENTIONS.md`. Both are locked; the CA opens them for this brief's production, recorded here, as
he does `domain/` and `architecture-devops.md` where the production needs them.

## Design history

- **2026-10-23, why not one metadata file per bucket.** The CA's prior design kept one JSON per
  bucket, serialized by a single Node process's event loop. Edge functions run as concurrent
  isolates with no shared event loop, so per-bucket writes would lose updates. Sidecars keep
  metadata with documents without needing a serializer; a Postgres lock or a long-running service
  were the alternatives, and both add what the provider-neutral design avoids.
- **2026-10-24, buckets by owner, not by time.** The CA's prior buckets were a timestamp plus an
  id, one per manifest exchange. swarmAg's documents belong to records, so a bucket is its owner's
  UUID v7, which keeps the time ordering in one segment.
