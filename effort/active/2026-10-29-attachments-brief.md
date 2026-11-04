# Attachments — Brief

**Active, draft.** Recorded 2026-10-29 from a CA + AI Architect session, split from the document
storage brief, `effort/completed/2026-10-23-document-storage-brief.md`, the `core/` platform this
brief uses. M-4 assigned Attachments to M-5. This is the `front/` brief: how swarmAg's records
attach documents. Split again 2026-10-30: attaching and uploading are different work, and upload,
moving documents from the inbox to a shared store and who may see them there, is
`effort/active/2026-10-30-document-upload-brief.md`. Revised 2026-11-04 with the document storage
policy of 2026-10-31 and the catalog, design moment 1, settled; the Field Binder, the policy's other
half, is `effort/pending/2026-11-04-field-binder-brief.md`. Awaits the remaining design moments, CA
review, and the production gate. It is first of four features of roadmap M-6, Document Storage:
the Admin side; field capture is the Ops application's (M-9).

## What triggered it

The system holds images and documents, and its records refer to them: notes carry attachments, and
a job's answers carry the crew's photos. The document storage brief settles how documents are
stored. This brief settles how swarmAg's records refer to stored documents, where those documents
live, and how a desk or the field adds them. Getting them to a shared store, and who may see them
there, is the upload brief.

## Two kinds of thing

Four domain fields seemed to hold documents: `Attachment.url`, `ChemicalLabel.url`,
`Chemical.sdsUrl`, and `User.avatarUrl`. They are two kinds of thing: one attachment field and three
URL fields.

|          | Attachment                                               | URL                                          |
| -------- | -------------------------------------------------------- | -------------------------------------------- |
| Is       | a document swarmAg's users uploaded, owned by the system | an `https://` address of something elsewhere |
| Lives    | in the document store                                    | wherever it points                           |
| Held as  | its address in the document store                        | the URL                                      |
| Shown by | a link the app mints                                     | the URL app control                          |
| Used on  | notes, and task answers                                  | `sdsUrl`, `ChemicalLabel.url`, `avatarUrl`   |

- **What separates them is where the thing lives.** The three URL fields point outside the
  system; an attachment points into the document store.
- **Attachments are uploads only.** A link is never an attachment; it belongs in a URL field. An
  `upload | url` const-enum on `Attachment` was considered and dropped: with uploads only, there is
  nothing to discriminate.
- **URL fields are URL-format text,** `type='url'` at minimum in the UI. Today all four fields are
  validated only as non-empty strings, and `core/std` has no URL check. The SDS input renders as
  plain text, a UX defect.
- **A document the field must have offline** (an SDS, a label, a manual) is the Field Binder's: a
  copy of a URL, or an upload, kept on every Ops device. Its brief is apart.

## No hosting

The system has no web server: Netlify serves static bundles, Supabase serves data. Nothing a user
uploads can be hotlinked, and the browser app is the only thing that provisions access to it,
however long a minted link lives.

- **An upload is never a URL.** A `/docs/…` route on our origin would need a service worker or a
  server; neither hosts content, both are still the app or a broker minting access.
- **Link minting is essential.** The app shows its own documents by minting a short-lived link from
  the document's identity, the kernel's `link`, under the viewer's session. Links are never stored.
- **Sharing outside the app is a separate capability.** An inspector, an insurer, a customer
  without a portal login, or another tool needs access minted without our app: a server-side
  share link or an export. Attachments do not solve it.

## The domain change

`Attachment.url` becomes `Attachment.documentAddress`: the id-form document address,
`id:{namespace}/id:{bucket}/id:{document}`. It names the document store's own type,
`DocumentAddress`; `address` alone could be mistaken for a postal address or a URL. The id form,
always: a rename never breaks it. Its validator checks an id-form document address instead of a
non-empty string. The other fields stay.

```ts
/** A document swarmAg uploaded and owns. */
export type Attachment = {
  filename: string
  documentAddress: string // id-form document address
  contentType: string
  kind: AttachmentKind
  uploadedAt: When
}
```

It goes through genesis: the abstraction, its validator and adapter, and `notes.attachments`. The
record holds the consumer's side: its `filename` is the one the system shows; the store's own name
is for people and the CLI.

## The URL app control

One control for every URL field: edits with `type='url'` and the browser's format check, shows the
URL as a link by name or host, and opens it at its address. It starts in `front/app/shell/`, beside
`notes-editor` and `user-picker`, used first by the SDS field and the labels editor, and moves to
`ux/ui` once proven.

## The stores

Every need is the document store composed for one purpose, its lifecycle set by its owner:

| Store            | Binding   | Lifecycle                               |
| ---------------- | --------- | --------------------------------------- |
| `DocumentInbox`  | IndexedDB | until uploaded; in Ops, the job clone's |
| `FieldBinder`    | IndexedDB | by its contents (the Field Binder)      |
| `DocumentServer` | Supabase  | shared and permanent                    |

| App             | DocumentServer                 | DocumentInbox    | FieldBinder |
| --------------- | ------------------------------ | ---------------- | ----------- |
| Admin           | shows, receives uploads        | the Admin inbox  |             |
| Ops             | shows, receives the job upload | the job inbox    | ✓           |
| Customer Portal | shows shared documents         | the portal inbox |             |

What each app may do through `DocumentServer` is the access rules', enforced by the Supabase
policies. The apps are separate bundles on separate origins, so the same store name in each does
not collide.

- **Every app has an inbox.** Every upload goes to it; each app drains it its own way (the upload
  brief). The simplicity of one rule for every app outweighs the cost of an inbox an app may never
  fill.

- **Different lifecycles, different stores.** The inbox empties as it uploads; the Field Binder
  follows its version. Namespaces of one store were considered and set aside for that reason.
- **The job inbox.** Each job clone comes with its inbox: three active jobs, three inboxes. Physical
  IndexedDB stores register at module evaluation, so a job's inbox is a namespace or a bucket in
  one `DocumentInbox` store, created with the clone and deleted when it is released. Which of the
  two is the Ops application's design (M-9).

## Attachments

Attachments is an abstraction of its own, implemented over the document store contract: the rules
and bindings by which swarmAg's records attach documents are encapsulated in code, not idioms. It
is a singleton behind a contract in `front/api`, as `AppState` is, listed in `api` beside it.

- **The catalog is private.** Its placements are module constants with fixed ids, as `AppState`
  keeps its row's id: nothing outside `Attachments` knows them.
- **Fixed namespace ids.** Every store, on every device, has the same namespace ids, so a document
  has one address in the inbox and on the server, and an address is computable from the catalog
  and its owner's id, with no lookup and no state.
- **A bucket per owner, its id the owner's.** A record's bucket id is the record's id; a shared
  bucket has a fixed id. Names are labels at every level, for people and the CLI.
- **Find or create.** The owner's bucket is created on first attach; with supplied ids, creating an
  existing one returns it, so attaching never checks first.
- **A topic is a member,** each with its own typed `attach`: the owner is a `Customer` for
  Customers, a `Job` for Jobs, and none for a company-wide topic, whose bucket is shared. `link`, `remove`, and `upload` are the
  container's: an attachment carries its full address, so they need no topic.

```ts
/** Fixed placements; private, as AppState's id is. */
const CUSTOMERS = { id: toId('019a…'), name: 'Customers' }
const LIBRARY = { id: toId('019a…'), name: 'Library' }
const WORKFLOWS = { id: toId('019a…'), name: 'Workflows' } // a shared bucket
// …

/** Attachments singleton */
export const Attachments: AttachmentsContract = {
  Customers: { attach: (customer: Customer, file: File) => … }, // bucket = customer.id
  Jobs: { attach: (job: Job, file: File) => … },
  Assets: { attach: (file: File) => … }, // company-wide: a shared bucket, no owner
  // …
  link: (attachment) => …,
  remove: (attachment) => …,
  upload: () => …
}

await Attachments.Customers.attach(customer, file) // → Attachment, into the inbox
await Attachments.link(attachment)
```

**The catalog.** Every type that carries notes has a topic. Compositions without an id (a `Note`,
a `CustomerSite`, an `Answer`) keep their documents in the owning record's bucket.

A namespace is the unit of placement and policy: on the server, a Supabase bucket with its own
access rules. Namespaces divide by policy, so company-wide documents, maintained in Admin and read
by everyone, share one namespace, `Library`, a shared bucket per topic; a topic's records need no
bucket of their own, as no one of them has its own access or lifecycle.

| Topic     | Namespace | Bucket             | Notes on                                                                                       |
| --------- | --------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| Customers | Customers | the customer's id  | Customer, CustomerSite                                                                         |
| Jobs      | Jobs      | the job's id       | JobAssessment (`notes`, `risks`), JobPlan, JobPlanAssignment, the job's Workflow, Task, Answer |
| Workflows | Library   | `Workflows`, fixed | Workflow                                                                                       |
| Tasks     | Library   | `Tasks`, fixed     | Task                                                                                           |
| Services  | Library   | `Services`, fixed  | Service                                                                                        |
| Users     | Users     | the user's id      | User                                                                                           |
| Assets    | Library   | `Assets`, fixed    | Asset                                                                                          |
| Chemicals | Library   | `Chemicals`, fixed | Chemical                                                                                       |

AssetType, Job, and Question carry no notes. An asset's or a chemical's attachments are its
records (a seller's order, an invoice, a warranty, service records); its usage manual, SDS, and
labels are the Field Binder's.

## Capture

1. **The app's inbox.** Every new file, from the camera, a picker, a drop, or a paste, enters the
   app's `DocumentInbox`. The inbox mints the document's id on entry, at its final address, so the record
   holds its `documentAddress` at once and can be saved immediately; the bytes follow. The inbox
   holds only what has not been uploaded, and clears each item once it is (the upload brief).
2. **No second step.** Choosing a file attaches it; storing it is the system's. Admin adds files on
   the Attachments tab (Surfaces). Ops takes photos through a file input with `capture`, which
   opens the phone's own camera; that is the Ops application's, with its job runner (roadmap M-9),
   into the job's inbox.
3. **The device does no processing.** Crews use their own phones (bring-your-own, with a financed
   phone for anyone below the supported minimum, the app installed, and minimal security as a
   condition of employment). Photos are not scaled on the device; a smaller rendition, if a view
   ever needs one, is the provider's.
4. **No thumbnails.** Documents list by icon, name, and size; images display scaled by the browser.

## Surfaces

- **NotesEditor.** Notes are its subject; attachments are secondary. Two tabs, Note and Attachments
  with their count, chosen over a stacked panel by frequency of use: most notes are text.
- **The Attachments tab.** Files only: Add files opens the picker, with multiple selection;
  dropping onto the tab does the same; choosing attaches, with no second step. A row shows an icon,
  its name, and its size; activating it opens the document (an image inline, a PDF in a new tab);
  (-) removes it after confirmation. A row not yet uploaded shows the same and opens from the inbox.
- **The job runner.** In a task like "take a photo", the attachment is the answer, primary: the
  answer control captures. It is the job runner's custom UX (M-9), over the same `Attachment`, the
  same inbox, and the same store. The domain needs a question that requires an attachment: the
  field mapping brief's edit 4 (`requires: 'note' | 'attachment'`), or a photo question type.
- **The avatar** stays a URL, shown by the URL control and the browser's cache, with the user's
  initials when the image is unavailable.

## Saving a record with attachments

A record's editor saves through `makeAggregateSave`. The record is saved with its
`documentAddress` values already set, since the inbox minted them; the inbox holds the bytes until
upload. A replacement is add, repoint, remove: the new document enters the inbox, the record is
repointed on save, and the replaced document is removed once its replacement is uploaded.

## Document types

The store handles formats; meaning belongs to the domain field that refers to a document. A signed
regulatory form is a role, not a format: it may be a signed PDF or a photo of the signed paper, and
the field that refers to it says which form it is. Every document is immutable, which keeps a
signature's promise that its bytes never change.

- **Documents (PDF):** purchase orders, invoices, warranties, service records, signed regulatory
  forms. Small; a new revision is a new document.
- **Images.** Photo evidence, asset photos, photos of signed forms. A workflow question asks for a
  photo; the crew takes it. iOS Safari strips GPS from web captures, so the app reads the position
  at the shutter; where the position, accuracy, heading, and capture time are kept arrives with
  field mapping, as document properties.
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

## Scenarios

| # | Scenario                                           | Answer                                                                                           |
| - | -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1 | A crew photographs the tank rinse as a task answer | captured into the job's inbox, drained by the job upload; the answer holds its `documentAddress` |
| 2 | Admin adds a nozzle photo to an asset note         | `Attachments.Assets`, `DocumentInbox`, the Admin loop, `DocumentServer`                          |
| 3 | A customer sees job photos in the portal           | the portal mints links from `DocumentServer`                                                     |
| 4 | A signed record is photographed onto a job note    | as 1 or 2                                                                                        |
| 5 | An asset's seller's order                          | an attachment on the asset's notes                                                               |
| 6 | An inspector asks for a job's records              | sharing outside the app, a separate capability                                                   |
| 7 | An asset's usage manual, a chemical's label or SDS | the Field Binder                                                                                 |
| 8 | A user's photo                                     | a URL; the browser's cache, then initials                                                        |

## Platform prerequisites

Two additive changes to `core/cli`, each backward-compatible, produced apart from this brief's
`front/` work. `core/` is locked: each is a CA decision.

1. **Supplied ids for namespaces and buckets.** `namespace.create` and `bucket.create` take an
   optional id, as `document.create` does, checked as a UUID v7. Creating with an id that already
   exists returns the existing node, as a document's create does; the IndexedDB provider's "a
   container already there is a conflict" becomes idempotent for all three levels.
2. **The IndexedDB maker's name.** Every storage container is named, so a document store is too.
   The specification gains a required `name`, from which it derives its object stores; today's
   fixed names would make every IndexedDB document store on a device the same physical store. The
   provider takes its two store names in its constructor; the idb schema's literal names type them
   at the two access points. A `name` check is not added: like `linkLifetime`, it is a composition
   constant.

```ts
export type DocumentStoreIndexedDbSpecification = { name: string; linkLifetime: number }

DocumentInbox: makeDocumentStoreIndexedDbClient({ name: 'DocumentInbox', linkLifetime }),
// → DocumentInboxNodes, DocumentInboxContent
```

## Design moments

1. **The catalog. Settled 2026-11-04:** `Attachments`, its private placements, and its topics.
2. **Access rules. Moved** to the upload brief.
3. **The editors.** Attachments on notes, the NotesEditor's two tabs (Surfaces); the URL app
   control, with the Chemical labels editor and the SDS field, deferred by the managers brief.
4. **The inbox.** `DocumentInbox` holds each document at its final address, so upload copies it
   under the same address and no item names its destination; a row not yet uploaded opens from the
   inbox (Surfaces). Its production runs the IndexedDB provider's browser check, deferred to this
   first consumer by the document storage brief's closure.

## Open

1. Whether an attachment's name is editable.
2. Whether `kind` is inferred, chosen, or both; only `map` cannot be inferred.
3. Whether the notes list shows a note's attachment count.
4. A domain `Url` type and its validator, as `Id` and `When` have.

## Records

The catalog is code, `Attachments` in `front/api`; it is not recorded apart in the architecture
documents. The production is Feature mode in `front/`, over the platform the document storage brief
established, and Foundation for the domain change and the platform prerequisites.

Attachment needs no shared store to build or test. Until the Supabase provider ships,
`DocumentServer` is a second IndexedDB store, composed beside the inbox; the Supabase maker replaces
it in `api`, and no code or address changes:

```ts
export const api = {
  …
  DocumentInbox: makeDocumentStoreIndexedDbClient({ name: 'DocumentInbox', linkLifetime }),
  DocumentServer: makeDocumentStoreIndexedDbClient({ name: 'DocumentServer', linkLifetime })
}
```

## Design history

- **2026-10-29, a `url` stays a URL.** The draft proposed replacing `url` fields with a document
  path type. A `url` names a potentially remote resource, and every document field may hold either
  an external URL or a stored document, so a stored reference became a URL of its own scheme,
  `docs:`, and the domain did not change. Withdrawn 2026-10-31.
- **2026-10-29, buckets per record by name.** A record's bucket is named by the record's id, so the
  record needs no field to reach it. The draft fixed one moment for creating every record's
  bucket; on 2026-10-30 that became each catalog entry's to say, as the platform's abilities are
  used per entry in the solution space. Superseded 2026-11-04.
- **2026-10-29, one inbox.** Field capture first rode in the job upload alone and office upload went
  direct. Staging every file locally, as if offline, made one implementation with two drain
  procedures, kept saves from waiting on bytes, and made retry the normal path. It brought the
  caller-supplied id into M-5.
- **2026-10-29, nothing on the device.** Crews bring their own phones, so the device scales nothing
  and spends nothing of the worker's: no device-side resizing, no thumbnails, and uploads on wi-fi
  by default.
- **2026-10-30, attachment and upload.** Attaching (capture, the inbox, the reference on the
  record) and uploading (draining the inbox to a shared store, and who may see documents there)
  are different work. Upload became its own brief, and attachment builds and tests against a
  second IndexedDB store until the Supabase provider ships.
- **2026-10-31, two kinds of thing.** The four document fields conflated what lives in the store
  with what lives elsewhere. Attachments became uploads only, held by `documentAddress`; the other
  three fields stay URLs, with a URL app control. The `docs:` scheme was withdrawn. "No upload
  button" had recorded a question as a decision; the rule is no second step. "A photo is a `text`
  answer with a note" buried the answer in a note's secondary tab; the job runner's answer surface
  replaced it. Recorded in the document storage policy brief, folded here and into the Field Binder
  brief 2026-11-04.
- **2026-11-04, supplied ids.** The catalog first named a record's bucket by the record's id under a
  kernel-minted bucket id: a name doing an id's job, and an address that needed a lookup. A bucket
  took the owner's id instead, and a namespace a fixed id, so an address is computable offline and
  is the same in the inbox and on the server; with kernel-minted namespace ids, each store would
  mint its own and upload could not keep an address.
- **2026-11-04, Attachments.** The catalog was first sketched as exported declarations in
  `front/api`, beside `queries` and `scopes`, read by a maker per topic. A maker earned nothing (the
  declarations were data, and only creating a document needs a placement), and exported
  declarations made the fixed ids public. `Attachments` became one singleton behind a contract, as
  `AppState` is, its placements private and its topics members.
- **2026-11-04, an inbox per app, and the Library.** Every app has an inbox, the Customer Portal
  included, for one rule over the cost of an empty inbox. Assets and chemicals first had a bucket
  per record, in namespaces of their own; their documents are company-wide, so they joined
  Services, Workflows, and Tasks in one namespace, `Library`, with a shared bucket per topic, and
  `Templates` was folded into it. `Manuals` was considered and rejected: manuals are the Field
  Binder's.
