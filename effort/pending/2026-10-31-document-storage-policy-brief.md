# Document Storage Policy — Brief

**Pending, design input.** Recorded 2026-10-31 from a CA + AI Architect conversation that started
with the domain's document fields and ended with a storage policy for swarmAg. Its positions are
working positions, coherent but not yet decided. It is held whole so the reasoning is not lost, and
may be integrated into one or more of roadmap M-6's briefs (attachments, upload, the Supabase
provider) or the Ops application's (M-9).

## What triggered it

The attachments brief took four domain fields to hold documents: `Attachment.url`,
`ChemicalLabel.url`, `Chemical.sdsUrl`, and `User.avatarUrl`, each holding an external URL or a
`docs:` reference. Examined, that conflated two kinds of thing, and the conversation separated
them, then followed the consequences through hosting, offline access, and the stores each app
composes.

## Two kinds of thing

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
  `upload | url` const-enum on `Attachment` was considered and dropped: with uploads only, there
  is nothing to discriminate.
- **URL fields are URL-format text,** `type='url'` at minimum in the UI. Today all four fields are
  validated only as non-empty strings, and `core/std` has no URL check. The SDS input renders as
  plain text, a UX defect.

## No hosting

The system has no web server: Netlify serves static bundles, Supabase serves data. Nothing a user
uploads can be hotlinked, and the browser app is the only thing that provisions access to it,
however long a minted link lives.

- **An upload is never a URL.** A `/docs/…` route on our origin would need a service worker or a
  server; neither hosts content, both are still the app or a broker minting access.
- **Link minting is essential.** The app shows its own documents by minting a short-lived link from
  the document's identity, the kernel's `link`.
- **Sharing outside the app is a separate capability.** An inspector, an insurer, a customer
  without a portal login, or another tool needs access minted without our app: a server-side
  share link or an export. Attachments do not solve it.

## The domain change

`Attachment.url` becomes `Attachment.documentAddress`: the id-form document address,
`id:{namespace}/id:{bucket}/id:{document}`. It names the document store's own type,
`DocumentAddress`; `address` alone could be mistaken for a postal address or a URL. Its validator
checks an id-form document address instead of a non-empty string. The other fields stay.

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

It goes through genesis: the abstraction, its validator and adapter, and `notes.attachments`.

## The URL app control

One control for every URL field: edits with `type='url'` and the browser's format check, shows the
URL as a link by name or host, and opens it at its address. It starts in `front/app/shell/`,
beside `notes-editor` and `user-picker`, used first by the SDS field and the labels editor, and
moves to `ux/ui` once proven. A domain `Url` type with its own validator, as `Id` and `When` have,
was raised and is open.

## The stores

Every need is the document store composed for one purpose, its lifecycle set by its owner:

| Store            | Binding   | Lifecycle                               |
| ---------------- | --------- | --------------------------------------- |
| `DocumentInbox`  | IndexedDB | until uploaded; in Ops, the job clone's |
| `FieldBinder`    | IndexedDB | by its contents                         |
| `DocumentServer` | Supabase  | shared and permanent                    |

| App             | DocumentServer                 | DocumentInbox   | FieldBinder |
| --------------- | ------------------------------ | --------------- | ----------- |
| Admin           | shows, receives uploads        | the Admin inbox |             |
| Ops             | shows, receives the job upload | the job inbox   | ✓           |
| Customer Portal | shows shared documents         |                 |             |

What each app may do through `DocumentServer` is the access rules', enforced by the Supabase
policies. Admin and Ops are separate bundles on separate origins, so the same store name in both
does not collide.

- **Different lifecycles, different stores.** The inbox empties as it uploads; the Field Binder
  follows its version. Namespaces of one store were considered and set aside for that
  reason.
- **The job inbox.** Each job clone comes with its inbox: three active jobs, three inboxes. Physical
  IndexedDB stores register at module evaluation, so a job's inbox is a namespace or a bucket in
  one `DocumentInbox` store, created with the clone and deleted when it is released. Which of the
  two is the Ops application's design (M-9). Locally a namespace carries no placement or policy, so
  it costs nothing; on the server it is a Supabase bucket with its settings and rules, few and
  settled.

## The maker's name

Every storage container is named (tables, directories, buckets), so a document store is too. The
IndexedDB maker's specification gains a required `name`, from which it derives its object stores;
today's fixed names would make every IndexedDB document store on a device the same physical store.
It is needed regardless: M-6 already composes the inbox and a local stand-in for `DocumentServer`.

```ts
export type DocumentStoreIndexedDbSpecification = { name: string; linkLifetime: number }

DocumentInbox: makeDocumentStoreIndexedDbClient({ name: 'DocumentInbox', linkLifetime }),
// → DocumentInboxNodes, DocumentInboxContent
```

The provider takes its two store names in its constructor; the idb schema's literal names type
them at the two access points. A `name` check is not added: like `linkLifetime`, it is a
composition constant. Whether the Supabase maker takes a `name` is open; on the server there is one
store.

## The Field Binder

Every truck carries an SDS binder by law. The Field Binder is that binder, kept on every Ops
device; the name is the same in every layer: the `FieldBinder` table, its namespace on
`DocumentServer`, the `FieldBinder` store in Ops, and the Field Binder feature in Admin and Ops.

- **Obligation decides what goes in it.** OSHA's Hazard Communication standard requires an SDS to
  be readily accessible to workers during their shift, and a pesticide's label is the law it is
  applied by. What else a crew must have offline (applicator rules, an emergency procedure) goes in
  too.
- **Everything else leans on the browser's HTTP cache:** manuals, avatars, reference pages. It is
  best effort, and costs nothing to build.
- **The table lists remote URLs.** Each entry is a URL, a description, and the address of its copy;
  the binder carries one version for the whole set. Chemicals feed it by an explicit workflow, "Add
  from chemicals", which copies each chemical's `sdsUrl` and label URLs into the list, skipping any
  already there; anything else is added by hand. Chemicals do not change: their URL fields stay the
  source the UI links to.
- **Three operations change it:** add, remove, and refresh a document, and each bumps the version.
  Add and refresh are one act with two sources of bytes: the server fetches the entry's URL, or an
  Admin uploads a file when a source refuses. Either way the copy lands in the FieldBinder's
  namespace on `DocumentServer`. Uploading into a URL field was rejected (it would make the field
  URL-or-document); uploading into the binder is the same act as fetching.
- **Ops mirrors it.** Preparing online, an Ops device compares its version with the binder's; when
  behind, it mirrors the namespace into its `FieldBinder` store, copying the ids it lacks and
  dropping those removed. Documents are immutable, so a revision is a new document and there is
  nothing to reconcile. A device can say which version it carries.
- **Offline, the app finds a copy through the binder:** the entry for a chemical's `sdsUrl` holds
  the address of its copy.
- **Freshness is deliberate.** An Admin refreshes an entry when its source publishes a revision; the
  binder records no source versions of its own.
- **The Admin feature** lists the binder's entries with their copies, failures, and actions: Add
  from chemicals, add by hand, refresh, and remove. The Chemical Manager is unchanged. **The Ops
  feature** lets a crew open the binder and read a document, offline.

```ts
/** A remote document the field must have offline. */
export type FieldBinderEntry = {
  url: string
  description?: string
  documentAddress?: string // the copy in the FieldBinder's namespace, once added
}
```

Whether the binder is one record holding its entries and version, or a table of entries with the
version kept beside them, is open.

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

## Scenarios

| # | Scenario                                           | Answer                                                                                           |
| - | -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 1 | A crew photographs the tank rinse as a task answer | captured into the job's inbox, drained by the job upload; the answer holds its `documentAddress` |
| 2 | Admin adds a nozzle photo to an asset note         | `DocumentInbox`, the Admin loop, `DocumentServer`                                                |
| 3 | A customer sees job photos in the portal           | the portal mints links from `DocumentServer`                                                     |
| 4 | A signed record is photographed onto a job note    | as 1 or 2                                                                                        |
| 5 | An asset type's online manual                      | a URL; offline through the browser's cache                                                       |
| 6 | An inspector asks for a job's records              | sharing outside the app, a separate capability                                                   |
| 7 | A chemical's label and SDS                         | URLs; added to the Field Binder from chemicals, copied by fetch or upload                        |
| 8 | A crew needs an SDS with no signal                 | opened from the Field Binder in Ops                                                              |
| 9 | A user's photo                                     | a URL; the browser's cache, then initials                                                        |

New questions the policy raised, and their answers: a source that blocks the fetch (upload the
file into the binder; the Admin feature shows the failure before a crew finds the gap), and a source
that publishes a revision (refresh the entry, which bumps the version).

## Corrections to the attachments brief

- **"No upload button"** came from a question, "what is the upload surface?", recorded as a
  decision. The rule is no second step after choosing; the surface is above.
- **"A photo is an ordinary answer: a `text` question … answered with a note"** buries the answer
  in a note's secondary tab. The job runner's answer surface replaces it.
- **The four document fields** are one attachment field and three URL fields.

## Open

1. The server fetch: where it runs and how it reports a failure to the Field Binder feature.
2. The Field Binder's shape: one record with its entries and version, or entries with the version
   beside them.
3. Whether an attachment's name is editable.
4. Whether `kind` is inferred, chosen, or both; only `map` cannot be inferred.
5. Whether the notes list shows a note's attachment count.
6. A domain `Url` type and its validator.
7. Whether the Supabase maker takes a `name`.
8. The job inbox as a namespace or a bucket per job clone (M-9).

## Design history

- **2026-10-31, the cache's contents.** First proposed: everything the active jobs' working sets
  reference, plus pinning. Narrowed to obligation (regulatory documents), with everything else on
  the browser's cache.
- **2026-10-31, the copy.** Uploading the PDF into the SDS field was rejected: it made the field
  URL-or-document. A server-side fetch was required instead, and upload returned only as the same
  act as fetch, into the binder's namespace.
- **2026-10-31, the source.** First derived live from chemicals; then a table of remote URLs fed
  from chemicals by an explicit workflow, so the list changes only when someone means it to.
- **2026-10-31, the version.** A version per entry was considered; one version for the whole binder
  makes the sync a single comparison. It bumps on every change rather than on an explicit publish.
- **2026-10-31, the name.** `RemoteDocumentCache` became the Field Binder, the binder crews already
  carry, in every layer.
