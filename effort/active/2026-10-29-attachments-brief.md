# Attachments — Brief

**Active, dispatched; amended 2026-11-08 after AI Coding Engine review and re-review.** Recorded
2026-10-29 from a CA + AI Architect session, split from the document storage brief,
`effort/completed/2026-10-23-document-storage-brief.md`, the `core/` platform this brief uses. M-4
assigned Attachments to M-5. This is the `front/` brief: how swarmAg's records attach documents.
Split again 2026-10-30: attaching and uploading are different work, and upload, moving documents
from the inbox to a shared store and who may see them there, is
`effort/active/2026-10-30-document-upload-brief.md`. Revised 2026-11-04 with the document storage
policy of 2026-10-31 and the catalog, design moment 1, settled; the Field Binder, the policy's
other half, is `effort/pending/2026-11-04-field-binder-brief.md`. Its design moments are settled;
it awaits the production gate. It is first of four features of roadmap M-6, Document Storage: the
Admin side; field capture is the Ops application's (M-9).

## What triggered it

The system holds images and documents, and its records refer to them: notes carry attachments, and
a job's answers carry the crew's photos. The document storage brief settles how documents are
stored. This brief settles how swarmAg's records refer to stored documents, where those documents
live, and how a desk or the field adds them. Getting them to a shared store, and who may see them
there, is the upload brief.

## Two kinds of thing

Four domain fields refer to documents: `Attachment.url`, `ChemicalLabel.url`, `Chemical.sdsUrl`, and `User.avatarUrl`. They are two kinds of thing: one attachment field and three URL fields.

|          | Attachment                                               | URL                                          |
| -------- | -------------------------------------------------------- | -------------------------------------------- |
| Is       | a document swarmAg's users uploaded, owned by the system | an `https://` address of something elsewhere |
| Lives    | in the document store                                    | wherever it points                           |
| Held as  | its address in the document store                        | the URL                                      |
| Shown by | a link the app mints                                     | the URL app control                          |
| Used on  | notes, and task answers                                  | `sdsUrl`, `ChemicalLabel.url`                |

- **What separates them is where the thing lives.** The three URL fields point outside the
  system; an attachment points into the document store.
- **Attachments are uploads only.** A link is never an attachment; it belongs in a URL field. An
  `upload | url` const-enum on `Attachment` was considered and dropped: with uploads only, there is
  nothing to discriminate.
- **URL fields are URL-format text,** `type='url'` at minimum in the UI. Today all four fields are
  validated only as non-empty strings, and stay so: the domain has no URL type, as it has `Id` and
  `When`, so its validators cannot know which attributes are URLs (parking lot P-12). The URL app
  control checks the format at the UX seam with `isUrl` (Platform prerequisites, 4). The SDS input
  renders as plain text, a UX defect.
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

One control for every URL field, `UrlField`. It starts in `front/app/shell/`, beside
`notes-editor` and `user-picker`, used first by the SDS field and the labels editor, and moves to
`ux/ui` once proven.

- **It edits.** A `UiInput` with `type='url'`; the editor's rule checks the format with `expectUrl`
  and its field's schemes, at the same moments as every other field.
- **It opens the link in a secondary window.** A link icon beside the input, enabled when the value
  passes `isUrl` with the field's schemes, opens the URL in a browser window of its own
  (`window.open` with window features, `noopener,noreferrer`), so the app's window keeps its place
  however deep the drill-down. A popover anchored at the field, holding the full URL, its host, and
  Open, is the intended design; it is parked until the action buttons' current issues are
  resolved.
- **Elsewhere a URL shows by name or host:** a list row shows a label's description, or its host.

```tsx
// front/app/shell/url-field.tsx
export type UrlFieldProps = {
  name: string
  value: string
  schemes: readonly UrlScheme[]
  onInput: (value: string) => void
  onBlur?: () => void
  error?: boolean
}

// chemical-step-detail.tsx
const SDS_SCHEMES = ['https', 'http'] as const

const validation = useAbstractionFormValidation(() => formRef, {
  sdsUrl: () => expectUrl(UiText.optional(state.sdsUrl()), 'SDS URL', SDS_SCHEMES, true),
  // …
})

<UiField for='sdsUrl' label='SDS URL'>
  <UrlField
    name='sdsUrl'
    value={state.sdsUrl()}
    schemes={SDS_SCHEMES}
    onInput={value => {
      state.setSdsUrl(value)
      validation.inputField('sdsUrl')
    }}
    onBlur={() => validation.blurField('sdsUrl')}
    error={validation.isInvalid('sdsUrl')}
  />
</UiField>
```

**The labels editor.** `Chemical.labels`, a list of `{ url, description? }`, follows the Sites
pattern: a `CollectionPanel` beside the chemical's details, a row showing the description or the
host, and a label's drill-down a `UrlField` and its description.

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

_[Revised by the amendment "After AI Coding Engine re-review", item 3.]_

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

1. _[Revised by the amendment "After AI Coding Engine review", item 1.]_ **The app's inbox.** Every
   new file, from the camera, a picker, a drop, or a paste, enters the app's `DocumentInbox`. The
   inbox mints the document's id on entry, at its final address, so the record holds its
   `documentAddress` at once and can be saved immediately; the bytes follow. The inbox holds only
   what has not been uploaded, and clears each item once it is (the upload brief).
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
  with their count, chosen over a stacked panel by frequency of use: most notes are text. In the
  notes list, a note with attachments shows a paperclip on its row, with no count, so the note
  holding a document is found without opening each one.
- **The host binds the topic.** The NotesEditor takes an `attach` callback, bound by its host to
  the record's topic, so the editor knows nothing of the catalog and the type checker sees each
  binding. It puts the returned `Attachment` on the note, and uses the container's `link` and
  `remove`, since an attachment carries its full address.

  ```tsx
  // NotesEditorProps
  attach: (file: File) => Promise<Attachment>

  // customer-step-detail.tsx: the bucket is the customer's
  <NotesEditor
    notes={state.notes}
    onChange={state.setNotes}
    drill={drill}
    attach={file => Attachments.Customers.attach(customer, file)}
  />

  // asset-step-detail.tsx: a shared bucket needs no owner
  <NotesEditor … attach={file => Attachments.Assets.attach(file)} />
  ```

- **The host constrains the kinds.** An optional `attachmentKinds` limits what a NotesEditor
  accepts; absent, every kind is accepted. A field that holds a signed form declares
  `['document']`.

  ```tsx
  // NotesEditorProps
  attachmentKinds?: readonly AttachmentKind[] // absent: every kind

  <NotesEditor … attach={…} attachmentKinds={['photo']} />
  ```
- **The Attachments tab.** Files only: Add files opens the picker, with multiple selection;
  dropping onto the tab does the same; choosing attaches, with no second step. A row shows an icon,
  its name, and its size; its name is editable; activating it opens the document (an image inline,
  a PDF in a new tab); (-) removes it after confirmation. A row not yet uploaded shows the same and
  opens from the inbox.
- **The job runner.** In a task like "take a photo", the attachment is the answer, primary: the
  answer control captures. It is the job runner's custom UX (M-9), over the same `Attachment`, the
  same inbox, and the same store. The domain needs a question that requires an attachment: the
  field mapping brief's edit 4 (`requires: 'note' | 'attachment'`), or a photo question type.
- **No avatar.** swarmAg is not an avatar kind of app: `User.avatarUrl` leaves the domain the next
  time the schema changes (backlog B-41), and users show by their initials.

## Accepted files

_[Clarified by the amendment "After AI Coding Engine review", item 3.]_

What a file is decides its `kind`, from a closed table: a file in no kind is refused, with a
message, never dropped silently. The table is swarmAg's attachment policy, owned by `Attachments`
beside the catalog; the domain keeps `AttachmentKind`.

```ts
// front/api, owned by Attachments
const ATTACHMENT_CONTENT_TYPES: Record<AttachmentKind, readonly string[]> = {
  photo: ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'],
  video: [], // deferred (Document types)
  map: ['image/tiff'],
  document: ['application/pdf', 'text/plain', 'text/markdown', 'application/json']
}

Attachments.kindOf(file) // → AttachmentKind | undefined; undefined is refused
Attachments.accept(kinds) // → the file input's accept string, the union of their types
```

- **Video is deferred,** so its list is empty and no video is accepted; the kind stays in the
  domain for when it returns.
- **Every kind is inferred,** `map` included: `image/tiff` is a map's alone, so a GeoTIFF is never
  taken for a photo. Choosing a file needs no second step.
- **The bytes are checked, not only `file.type`,** which the browser guesses from the extension
  and sometimes leaves empty (HEIC on Windows). A binary format matches its signature: PDF `%PDF-`,
  JPEG `FF D8 FF`, PNG `89 50 4E 47`, TIFF `II*\0` or `MM\0*`, and HEIC an `ftyp` box. A text
  format, which has none, matches its extension (`.txt`, `.md`, `.json`) and decodes as UTF-8 with
  no NUL byte. Reading a file's first bytes is a check, not processing.
- **The picker and the drop agree.** `accept` narrows the picker to the host's kinds; a drop or a
  paste passes `kindOf` and the host's kinds.
- **Text opens as plain text.** A minted link for a text document is `text/plain`, so nothing is
  rendered: Markdown is not turned into HTML. Code that needs the content `read`s it.
- **Formats that run in a browser are never accepted:** SVG, HTML, and XML. Adding a format is a
  deliberate line in the table.
- **The server enforces the same table:** each Supabase bucket's allowed MIME types (the Supabase
  provider brief's storage configuration).

## Saving a record with attachments

_[Revised by the amendment "After AI Coding Engine review", item 1.]_

A record's editor saves through `makeAggregateSave`. The record is saved with its
`documentAddress` values already set, since the inbox minted them; the inbox holds the bytes until
upload. A replacement is add, repoint, remove: the new document enters the inbox, the record is
repointed on save, and the replaced document is removed once its replacement is uploaded.

## Document types

The store handles formats; meaning belongs to the domain field that refers to a document. A signed
regulatory form is a PDF: a paper form is scanned to one, which the phones' own document scanners
do, straightened and legible. Every document is immutable, which keeps a signature's promise that
its bytes never change.

- **Documents:** PDF for purchase orders, invoices, warranties, service records, and signed
  regulatory forms; plain text, Markdown, and JSON. Small; a new revision is a new document.
- **Images.** Photo evidence and asset photos. A workflow question asks for a
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
| 4 | A signed record is added to a job note             | scanned to PDF on the phone, then as 2                                                           |
| 5 | An asset's seller's order                          | an attachment on the asset's notes                                                               |
| 6 | An inspector asks for a job's records              | sharing outside the app, a separate capability                                                   |
| 7 | An asset's usage manual, a chemical's label or SDS | the Field Binder                                                                                 |

## Platform prerequisites

_[Extended by the amendment "After AI Coding Engine review", item 2.]_

Changes to the document store, the IndexedDB wrapper, and the validators, produced apart from this
brief's `front/` work: the contract and the validators in `core/std`, the kernel and the IndexedDB
provider in `core/cli`, and the wrapper in `core/db`. CONVENTIONS (§10.8, §13) and the architecture documents (architecture-front
§9.5.1, architecture-back §4.7, architecture-devops §4) describe the result; architecture-core §10
describes swarmAg's use of it. Nothing outside `core/`
consumes the store yet; only its tests change with it.

1. **A store is composed, not made.** The kernel is a class, `DocumentStore`, implementing
   `ApiDocumentStoreContract` and constructed over a provider. A provider is a class per binding
   implementing `DocumentProviderContract`, CONVENTIONS §8.3's runtime-specific implementation of a
   contract, and the contract is no longer internal. The files are named for what they hold:

   | File                                      | Holds                                  |
   | ----------------------------------------- | -------------------------------------- |
   | `core/cli/docstore-client.ts`             | `DocumentStore`, the kernel            |
   | `core/cli/indexeddb-docstore-provider.ts` | `IndexedDbDocumentProvider`            |
   | `core/cli/supabase-docstore-provider.ts`  | `SupabaseDocumentProvider` (its brief) |

   ```ts
   export class DocumentStore implements ApiDocumentStoreContract {
     constructor(provider: DocumentProviderContract, settings: { linkLifetime: number })
   }

   export class IndexedDbDocumentProvider implements DocumentProviderContract {
     constructor(dbKey: string) // registers Nodes and Content in the database Config names
   }
   ```

   The kernel is tested on its own over an in-memory provider: the grammar, minted and supplied ids,
   and create at an existing lineage. Each provider's tests cover what it adds.
2. **Supplied ids at every level.** `namespace.create` and `bucket.create` take an optional id, as
   `document.create` does, checked as a UUID v7:

   ```ts
   create(name: string, id?: Id): Promise<NodeMetadata<NamespaceId>>
   create(parent: NamespaceId, name: string, id?: Id): Promise<NodeMetadata<BucketId>>
   ```

   - **Identity is lineage.** A node is unique by its parent and its id; the same id under two
     parents is two nodes.
   - **Names are labels.** A name is checked for format by the address grammar, and nothing else:
     names repeat, and `find` returns every match.
   - **Creating at an existing lineage returns the existing node,** unchanged, at every level: a
     differing name is ignored, not compared, and renaming is `update`'s. The IndexedDB provider's
     "a container already there is a conflict" goes. Without an id, create mints a fresh one.
3. **A database per document store.** A browser origin has many IndexedDB databases, a database
   many object stores, an object store many records. Each IndexedDB document store is a database of
   its own, independent of the app's data: its own version, so an index added to either never
   upgrades the other, and its own lifecycle, cleared by deleting the database. Inside it the object
   stores keep fixed names, `Nodes` and `Content`, and the idb schema's literal names type them.
   - **The wrapper takes a database's config key.** `registerStore` and `connection` gain an
     optional config key, defaulting to `LOCAL_DB_NAME`, so every current caller is unchanged; the
     database's name is `Config.get(dbKey)`.
   - **The provider takes the key.** A deployment names its databases in configuration, and tests
     isolate themselves by the value. Each entry point declares the key, so a missing one fails at
     `Config.init`.

   ```ts
   // core/db/indexeddb.ts
   static registerStore(storeName: string, specification: IndexedDbStore = {}, dbKey = 'LOCAL_DB_NAME')
   static connection(dbKey = 'LOCAL_DB_NAME'): Promise<IDBPDatabase>
   ```

   | Key                       | Platform key                   | Database                  |
   | ------------------------- | ------------------------------ | ------------------------- |
   | `DOCUMENT_INBOX_DB_NAME`  | `VITE_DOCUMENT_INBOX_DB_NAME`  | `swarmag-docstore-inbox`  |
   | `DOCUMENT_SERVER_DB_NAME` | `VITE_DOCUMENT_SERVER_DB_NAME` | `swarmag-docstore-server` |

   Every app has an inbox, and each app is its own origin, so the names are the same in every app.
   The server key lives only until the Supabase provider ships.
4. **A URL check.** `core/std/validators.ts` gains `isUrl` beside `isEmail`, and `expectUrl` beside
   `expectEmail`, parameterized by the schemes they accept, as `isConstEnum` is by its values.
   `isUrl` accepts a string the `URL` constructor parses with one of the given schemes. The schemes
   have no default, so a caller always names them and `javascript:` is never accepted by omission.
   The URL app control uses them; the domain's validators do not change (Two kinds of thing).

   ```ts
   // core/std/validators.ts
   export type UrlScheme = 'http' | 'https' | 'mailto' | 'tel' | 'ftp' | 'data' | 'blob'

   /** Check whether value parses as a URL with one of the given schemes. */
   export const isUrl = (value: unknown, schemes: readonly UrlScheme[]): value is string => …

   /** Validate a required or optional URL value. */
   export const expectUrl = (
     value: unknown,
     field: string,
     schemes: readonly UrlScheme[],
     optional = false
   ): ExpectResult => …
   ```

   ```ts
   isUrl(value, ['https', 'http'])
   expectUrl(value, 'sdsUrl', ['https', 'http'], true)
   ```

Tests: the kernel over an in-memory provider; create with a supplied id at each level; a second
create at the same lineage returns the first node; two document stores, under two keys, do not see
each other's nodes; `isUrl` accepts a URL with a given scheme and rejects other schemes, relative
paths, and non-strings.

## Design moments

1. **The catalog. Settled 2026-11-04:** `Attachments`, its private placements, and its topics.
2. **Access rules. Moved** to the upload brief.
3. **The editors. Settled 2026-11-06 and 2026-11-07:** attachments on notes, the NotesEditor's two
   tabs, and an `attach` callback the host binds (Surfaces); `UrlField`, its link in a secondary
   window, and the Chemical labels editor (The URL app control). The avatar is dropped (Surfaces).
4. **The inbox. Settled 2026-11-07:** `DocumentInbox` holds each document at its final address,
   so upload copies it under the same address and no item names its destination; a row not yet
   uploaded opens from the inbox (Surfaces). Its production runs the IndexedDB provider's browser
   check, deferred to this first consumer by the document storage brief's closure.

## Records

The catalog is code, `Attachments` in `front/api`; it is not recorded apart in the architecture
documents. The production is Feature mode in `front/`, over the platform the document storage brief
established, and Foundation for the domain change and the platform prerequisites.

Attachment needs no shared store to build or test. Until the Supabase provider ships,
`DocumentServer` is a second IndexedDB store, composed beside the inbox; the Supabase provider replaces
it in `api`, and no code or address changes:

```ts
export const api = {
  …
  DocumentInbox: new DocumentStore(new IndexedDbDocumentProvider('DOCUMENT_INBOX_DB_NAME'), {
    linkLifetime
  }),
  DocumentServer: new DocumentStore(new IndexedDbDocumentProvider('DOCUMENT_SERVER_DB_NAME'), {
    linkLifetime
  })
  // once the Supabase provider ships:
  // DocumentServer: new DocumentStore(new SupabaseDocumentProvider(), { linkLifetime })
}
```

## Amendments — 2026-11-08 — After AI Coding Engine review

1. **Attaching is a transaction** (findings 1 and 2: removal had no commit boundary, and abandoned
   additions no lifecycle). An editing session is a transaction over the record and its documents.
   - **The workspace:** the draft holds its edited fields and its documents. A chosen file is
     staged in the inbox at once, durably, at its final address; the inbox is the draft's
     document store.
   - **Commit:** Save. The record write, through `makeAggregateSave`, is the single commit point;
     once the record refers to its documents, they are committed.
   - **Rollback:** Cancel discards the draft, and its staged documents with it.
   - **Isolation:** the drain takes only committed documents; nothing uncommitted leaves the
     device.
   - **Removal** is a draft edit. A dropped or replaced document is deleted after the commit, in
     `complete`.
   - _[Revised by the amendment "After AI Coding Engine re-review", items 1 and 2.]_ **Recovery is
     presumed abort:** a page closed mid-edit leaves staged documents with no committed record, and
     they are cleared when the app next starts.
   - **No two-phase commit:** the bytes are durable before the commit point, and the drain
     finishes after it, retrying safely because ids are idempotent.

   Reached in three turns: held in memory until Save (rejected: it defeats the inbox's durable
   capture); staged at once with cleanup on cancel (better, still unbounded); the inbox as part of
   the draft, which is classical transaction bounds.
2. **A new record carries its id from New** (finding 3). Staged documents sit at their final
   address, which includes the owner's bucket, so the owner's identity exists from New: the
   application mints every id, and identity exists before storage. A fifth platform prerequisite,
   additive: a new draft mints its id at New, and every create path accepts the id the draft
   holds, minting one only when none is given. `instantiable` already lets a supplied id win;
   the create protocol's type grows to admit it. Nothing that creates today changes.
3. **File recognition** (finding 4). The Accepted files sketch is illustrative: the recognition
   contract (synchronous or not, what it returns) and how a detected type becomes
   `Attachment.contentType` and the stored type are settled in the production scope.
4. **`uploadedAt`** (finding 5) is when the person attached the document: set when the file is
   chosen, once, and never updated; distinct from the store's own timestamps. It is a fact on the
   record, so a drain never writes it back, and a rename does not touch it. The field keeps its
   name.

## Amendments — 2026-11-08 — After AI Coding Engine re-review

1. **Recovery keeps a save log** (ACE's finding: a record write that succeeds on the server while
   the page closes before it learns so leaves a committed record whose documents look abandoned).
   `Attachments` keeps a durable ledger on the device, one entry per staged document: its address,
   its owner, its editing session, and its state.
   - **_staged_** when the file is chosen; **_saving_**, written before the record write;
     **_committed_** once the record write succeeds.
   - Each step is ordered so that a crash at any point leaves a state recovery can classify; no
     step depends on two writes landing together.
   - **Recovery:** _staged_ from a dead session is abandoned, and its document and entry are
     deleted. _saving_ from a dead session is in doubt, and is **presumed committed**: the drain
     takes it. Should the record write in fact have failed, the document reaches the server
     unreferenced, an orphan that costs bytes and that the platform's deferred sweep collects.
   - **Cancel** removes only _staged_ entries; nothing on the server is ever rolled back.

   ACE proposed resolving an in-doubt save by reading the owning record. Presuming commit was
   chosen instead: its worst case is an orphan rather than a deleted document a saved record refers
   to, and recovery stays local, with no read, no topic knowledge, and no offline wait.
2. **Recovery touches only abandoned sessions.** An editing session holds a browser lock (Web
   Locks) named for itself for its lifetime; the browser releases it when the tab closes or
   crashes. Recovery classifies only entries whose session's lock is gone, so a live edit in
   another tab is never cleared. ACE verifies lock behavior for suspended tabs on the target
   devices.
3. **The editing session is the transaction.** Attaching moves from the `Attachments` container to
   a session begun with the record's editor; `link` and `upload` stay on the container. The ledger
   is private to `Attachments`.

   ```ts
   /** One editing session: a transaction over a record and its documents. */
   export interface AttachmentSession {
     Customers: { attach(customer: Customer, file: File): Promise<Attachment> } // staged
     Assets: { attach(file: File): Promise<Attachment> } // shared bucket, no owner
     // …a member per topic
     remove(attachment: Attachment): void // a draft edit; deleted after commit
     commit<T>(write: () => Promise<T>): Promise<T> // saving → the write → committed
     cancel(): Promise<void> // rollback: staged documents go
   }

   export interface AttachmentsContract {
     begin(): AttachmentSession // takes the session's lock
     link(attachment: Attachment): Promise<DocumentLink> // inbox first, then the server
     recover(): Promise<void> // at start: classify dead sessions' entries
     upload(): Promise<void> // the drain: committed documents only
   }
   ```

   ```tsx
   const edit = Attachments.begin()
   <NotesEditor … attach={file => edit.Customers.attach(customer, file)} />
   await edit.commit(() => provider.save(draft)) // the record write, through makeAggregateSave
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
- **2026-11-05, a database per document store.** The maker first took a `name` and derived two
  object stores in the app's database from it, `{name}Nodes` and `{name}Content`. A document store
  became a database of its own instead, named by a config key the maker takes, with fixed object
  store names: independent versions and lifecycles, and no derived names to type.
- **2026-11-06, a store composed, not made.** The 10-30 design made a document store like every
  client, by a maker per binding. A maker creates code from a declarative specification and never
  an instance (CONVENTIONS §10.1), and the IndexedDB maker constructed a provider and handed it to
  the kernel: a factory. Reviewing the code before anything consumed it, the kernel became a class
  constructed over a provider class per binding, as architecture-core §10 already described it: "a
  kernel in `core/cli` over replaceable providers". The kernel became testable on its own.
- **2026-11-06, the host binds the topic.** The NotesEditor is shared by every editor with notes,
  and `Attachments` has a typed `attach` per topic. Passing the topic and owner as props was set
  aside: a shell control would know the catalog `Attachments` keeps private. The host binds an
  `attach` callback instead.
- **2026-11-06, an editable name.** An attachment's name is for people first, so it is editable: it
  is `Attachment.filename`, on the record, saved with the note; the document's address and bytes do
  not change.
- **2026-11-06, kinds inferred from a closed table.** `kind` was intended (the notes editor brief)
  to let a host constrain what is uploaded, as `attachmentKinds`. Inference first mapped everything
  not an image or a video to `document`, an open default; each kind became a closed list of content
  types instead, checked by signature, with every other file refused. XML was considered for
  documents and dropped: JSON replaces it, and a browser runs a script in rendered XML.
- **2026-11-06, a signed form is a PDF.** A signed regulatory form had been a role, a signed PDF or
  a photo of the signed paper. A paper form is now scanned to a PDF, so a field for one declares
  `['document']`, and the photo is legible.
- **2026-11-07, a paperclip in the notes list.** A count on the notes list's rows was considered: a
  note typically carries one attachment, a handful at most, and the open note's tab label already
  counts them. The row shows a paperclip alone.
- **2026-11-07, the link in a secondary window.** An open button that opened a new tab was set
  aside: a tab opened three levels into a drill-down pulls the user out of the app. A popover
  anchored at the field was chosen, with hover (touch has none, and it fights the input) and an
  embedded preview (many sources refuse framing; PDFs in frames render poorly on iOS) set aside.
  The popover was then parked while the action buttons have issues, and the link opens in a
  secondary browser window, the shortest path.
- **2026-11-07, no avatar.** The avatar had stayed a URL, shown with the user's initials when the
  image was unavailable. Asked where an avatar appears, nothing needed one: swarmAg is not an avatar
  kind of app. `User.avatarUrl` is backlogged for removal with the next schema change.
