# Attachments — Brief

**Active, draft.** Recorded 2026-10-29 from a CA + AI Architect session, split from the document
storage brief, `effort/completed/2026-10-23-document-storage-brief.md`, which is the `core/` platform
this brief uses and depends on, as it depends on the Supabase provider,
`effort/active/2026-10-30-document-store-supabase-brief.md`, for documents shared across devices.
M-4 assigned Attachments to M-5. This is the `front/` brief: swarmAg's use of the platform. Awaits the design moments, CA review, and the production gate.

## What triggered it

The system holds images and documents, and its records refer to them: notes carry attachments, a
chemical carries its labels and SDS, a user an avatar, and a job's answers carry the crew's photos.
The document storage brief settles how documents are stored. This brief settles how swarmAg's
records refer to stored documents, where those documents live, how they get there from a desk or
the field, and who may see them.

## The domain's document fields

No domain change. Four fields can hold a document, and each may hold an external URL or a stored
document:

| Field               | Lives on                         | Shape                                              |
| ------------------- | -------------------------------- | -------------------------------------------------- |
| `Attachment.url`    | `Note.attachments`, nowhere else | `{ filename, url, contentType, kind, uploadedAt }` |
| `ChemicalLabel.url` | `Chemical.labels`                | `{ url, description? }`                            |
| `Chemical.sdsUrl`   | `Chemical`                       | `string?`                                          |
| `User.avatarUrl`    | `User`                           | `string?`                                          |

- **Notes are the general attachment point.** Notes are on Asset, Customer, CustomerSite,
  Chemical, User, Service, Job, JobPlan, Workflow, Task, Question, and `Answer`. A photo is an
  ordinary answer: a `text` question whose label asks for a photo, answered with a note that
  carries the photo as an attachment.
- **The record holds the consumer's side.** `Attachment` carries `filename`, `contentType`, `kind`,
  and `uploadedAt`; the record's `filename` is the one the system shows. The store's own name is for
  people and the CLI.
- **Sources are mixed.** An SDS is often the manufacturer's URL; a label may be a link to EPA's
  label system or a stored scan; an avatar may come from an identity provider.

## Stored references

1. **A `url` stays a URL.** A stored document's reference is its id-form address under the `docs:`
   scheme: `docs:id:{namespace}/id:{bucket}/id:{document}`. A consumer resolves a `url` by scheme:
   `docs:` to the document store, `https:` to the web. External and stored values live in the same
   field.
2. **The id form, always.** A stored reference never uses names, so a rename never breaks it.
3. **Links are minted, never stored.** A view asks the store for a link to a `docs:` reference when
   it displays it, under the viewer's session.

## The catalog

1. **Namespaces are subjects.** A namespace is named by subject (`assets`, `chemicals`, `jobs`),
   not topic: topic is container-aligned.
2. **A bucket per record.** A record's documents live in a bucket named by the record's id, so a
   record reaches its bucket by address with nothing to store: `DocumentAddresses.build('jobs',
   job.id)`. The bucket is created once, at a deliberate moment, with the record or its
   assignment, never lazily on a first upload, so no two buckets carry one record's name.
3. **Compositions without an id** (a `Note`, a `CustomerSite`) keep their documents in the owning
   record's bucket.
4. **A bucket is the unit of access and lifecycle.** What can be read, by whom, and how long it is
   kept are decided per bucket. A customer's bucket holds everything about that customer: the
   customer portal sees it, and it goes when the customer goes. A shared library (an asset type's
   manuals and part diagrams) is the bucket of the record it is about.
5. **Meaning lives in the domain.** What kind of document something is, and what it is for, belong
   to the field that refers to it, not to the store.
6. **M-5's entries:** chemicals, assets, and asset types (design moment 1). Later milestones add
   theirs.

## Capture and upload

1. **One inbox.** Every new file, from the camera, a picker, a drop, or a paste, enters a local
   inbox in the browser. The inbox mints the document's id on entry, so its `docs:` reference exists
   at once and the record can be saved immediately; the bytes follow. The inbox holds only what has
   not been stored, and clears each item once it is.
2. **Two drain procedures.** The inbox knows nothing of apps; each app decides when it drains:
   - **Ops: the job upload.** Photos travel with the job and drain in the job upload, a deliberate
     act back at base that qualifies the connection first.
   - **Admin: a background loop** in the page, draining as items arrive while the app is open. What
     is left waits in the inbox for the next session. No Service Worker.
3. **Capture is native.** Ops takes a photo through a file input with `capture`, which opens the
   phone's own camera; Admin drops onto the list itself, where the eye already is. There is no
   upload button: adding a document is one act, and storing it is the system's.
4. **The device does no processing.** Crews use their own phones (bring-your-own, with a financed
   phone for anyone below the supported minimum, the app installed, and minimal security as a
   condition of employment). Photos are not scaled on the device; the job upload moves them on
   wi-fi by default, since the data plan is the worker's; a smaller rendition, if a view ever needs
   one, is the provider's.
5. **No thumbnails.** Documents list by icon, name, and size; images display scaled by the browser.

## Saving a record with attachments

A record's editor saves through `makeAggregateSave`. The record is saved with its `docs:`
references already set, since the inbox minted them; the inbox stores the bytes. A replacement is
add, repoint, remove: the new document enters the inbox, the record is repointed on save, and the
inbox removes the replaced document once its replacement is stored. Job upload is the same with
the job and its bucket already in place: the photos drain, and the work log entries are written.

## Access

Storage policies are the Supabase provider brief's mechanism (its DevOps 2); this brief specifies
the rules swarmAg's namespaces need, and they are written there.

- Per bucket, which roles read or write it.
- A customer reaches documents only through the portal, signed in, and only shared documents in
  their own bucket. A customer email carries no document links: it links to the portal, and its
  pictures are embedded, read by the sender on the server.

## Document types

The store handles formats; meaning belongs to the domain field that refers to a document. A signed
regulatory form is a role, not a format: it may be a signed PDF or a photo of the signed paper, and
the field that refers to it says which form it is. Every document is immutable, which keeps a
signature's promise that its bytes never change.

- **Documents (PDF):** `Chemical.labels`, `sdsUrl`, asset manuals, signed regulatory forms. Small;
  a new revision is a new document.
- **Images.** Photo evidence, asset photos, photos of signed forms, `User.avatarUrl`. A workflow
  question asks for a photo; the crew takes it. iOS Safari strips GPS from web captures, so the app
  reads the position at the shutter; where the position, accuracy, heading, and capture time are
  kept arrives with field mapping, as document properties.
- **Survey maps.** Every job is backed by an aerial multispectral map of its region. The DJI P4
  Multispectral writes six images per capture point (RGB plus blue, green, red, red edge, and
  near-infrared), with GPS and irradiance in XMP: thousands of files and several gigabytes per
  flight. Processing yields per-band reflectance and index maps (NDVI, NDRE) as GeoTIFFs, stored as
  Cloud-Optimized GeoTIFFs (COGs). Field mapping's.
- **Video, deferred.** Walkthroughs before, during, and after a job. An iPad records HEVC at very
  roughly 60–100 MB a minute at 1080p, past the free plan's 50 MB file cap; uploads from the field
  must be resumable; playback is by range request, and other browsers than Safari play HEVC
  unevenly, so the customer portal may need a transcode. It joins the large-file tier with maps.

Known future packages, field mapping's: **Survey** (one flight's map COGs, its manifest, and a
GeoJSON snapshot of the job's zones), **Work** (one execution's GPS-tagged photos in the order
taken), and **Raw** (a flight's raw captures with a checksum manifest, for the archive).

## Design moments

1. **The catalog's M-5 entries:** chemicals (labels, the SDS, signed regulatory forms), assets
   (purchase orders, service records), and asset types (manuals, part diagrams). For each: the
   namespace, which records get a bucket and when it is created, any named library buckets, and
   where the catalog lives.
2. **Access rules,** per namespace and bucket, as written into the storage policies.
3. **The editors.** The Chemical labels editor and `sdsUrl`'s storage integration, deferred by the
   managers brief, and attachments on notes: how a note shows, adds, and removes attachments.
4. **The inbox.** It is the document store's IndexedDB provider: a local namespace with a bucket
   per destination, and a drain copies each document to the remote store under its id. Open: how
   an item names its destination, and how a view shows an item not yet stored.
   Its production runs the IndexedDB provider's browser check, deferred to this first consumer
   by the document storage brief's closure.

## Records

The catalog and access rules are swarmAg's: they are recorded apart from the platform's sections
in the architecture documents; where is settled with design moment 1. The production is Feature
mode in `front/`, over the platform the document storage brief establishes.

## Design history

- **2026-10-29, a `url` stays a URL.** The draft proposed replacing `url` fields with a document
  path type. A `url` names a potentially remote resource, and every document field may hold either
  an external URL or a stored document, so a stored reference became a URL of its own scheme,
  `docs:`, and the domain did not change.
- **2026-10-29, buckets per record by name.** A record's bucket is named by the record's id, so the
  record needs no field to reach it; names need not be unique in the platform, so the bucket is
  created once at a deliberate moment rather than on first use.
- **2026-10-29, one inbox.** Field capture first rode in the job upload alone and office upload went
  direct. Staging every file locally, as if offline, made one implementation with two drain
  procedures, kept saves from waiting on bytes, and made retry the normal path. It brought the
  caller-supplied id into M-5.
- **2026-10-29, nothing on the device.** Crews bring their own phones, so the device scales nothing
  and spends nothing of the worker's: no device-side resizing, no thumbnails, and uploads on wi-fi
  by default.
