# Document Storage — Brief

**Pending, draft.** Recorded 2026-10-23 from a CA + AI Architect session, while settling the Asset
and Chemical Managers brief. M-4 assigned Attachments to M-5; the roadmap lists Document storage
among M-5's features. Awaits the open questions, CA review, and selection from the roadmap.

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

## Design moments

1. **The path's form.** Whether the document segment is the id, a name, or both, and its URL scheme.
2. **Lease duration** and who may break a lease.
3. **`Attachment` and `ChemicalLabel`.** How the existing `url` fields become logical paths, and
   whether either type changes.
4. **Namespaces and buckets.** The initial set, and whether they are a fixed catalog.
5. **Access rules.** Which roles may read or write which namespaces.
6. **Supabase specifics.** Signed upload and download URLs, storage policies, and Cron setup.

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
