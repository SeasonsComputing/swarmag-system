# Upload Tasks — Brief

**Active; reviewed by ACE 2026-11-13, nothing blocks; amended once (After ACE review, at the
end). Captured 2026-11-12.** Foundation mode: the upload lifecycle, its two consumers
(attachments and the Field Binder), and their delivery scheduling. One change to locked `core/`,
approved by the CA (Escalation). Records hold the reasons.

## Escalation: supplied id on `stage` (approved)

The design rests on a document id minted by the client before upload. `Uploads.stage` mints the id
inside the store. This brief makes one change to locked `core/cli`, approved by the CA:

```ts
async stage(file: File, options?: { id?: Id }): Promise<NodeMetadata<DocumentId>>
```

- It passes the id to the kernel's existing `suppliedId`. Omitted, `stage` behaves as before. No
  provider, kernel, or drain change.
- Create is idempotent by id in both providers, which placement and the drain rely on. A retried
  stage returns the complete document it wrote. The consumer mints one id per chosen document and
  never reuses it.

Nothing else in this brief changes `core/`.

## Purpose and dependencies

Every upload is a background task. Staging copies a chosen document into the inbox; delivery copies
it to the server. Neither holds the UI, and Save waits for neither. Two tasks do the work:

- **The upload task**, one per chosen document, stages the document when it is chosen and places
  it into its collection after the consumer's Save succeeds.
- **The drain task**, one per inbox and server pair, delivers placed documents to the server.

Placing is the handoff between them. A placed document cannot be discarded and the drain delivers
it, so placing waits for Save. The task list shows progress and failure; a consumer's row shows
only what its record knows.

Both upload consumers adopt this one pattern:

- **Attachments**, through `api.Attachments` and `makeAttachmentSave`.
- **The Field Binder Manager**, through `FieldBinderSource`.

Dependencies:

- `effort/completed/2026-11-11-upload-brief.md`: `Uploads`, its pairs, and the inbox lifecycle.
- `effort/active/2026-11-10-background-tasks-brief.md`: `BackgroundTasks`, its `progress` and
  `remaining` fields, `blocksExit`, and `DocumentDrain`.
- `effort/active/2026-11-04-field-binder-brief.md`: the Manager, publication, and preparation.

## Current behavior

Verified against the code on 2026-11-12 and 2026-11-13:

- `Uploads.stage(file)` (`core/cli/docstore-uploads.ts:61`) lets the store mint the document id
  and returns it after the whole file is written in one `document.create`. It reports no progress.
- `Uploads.drain()` (`:104`) returns `{ drained, remaining }` after each pass.
- Attachments: `capture` (`front/app/shell/attachment-list.tsx:65`) sets the list and the note's
  Save gate busy, awaits `attach(file)`, and adds the row only after staging completes. Save awaits
  pending stages before its first write (`front/app/shell/make-attachment-save.ts:70`), then writes
  the record, places the staged documents, rewrites the references to the placed addresses, and
  writes the record again (`:84`).
- Field Binder: `choose` (`front/app-admin/field-binder/field-binder-state.ts:105`) awaits staging
  with the picker disabled. Save refuses while staging is pending, then places, calls `drain()`
  inline, verifies the server copy, and publishes the inventory
  (`front/api/field-binder-source.ts:105`).
- Field Binder entries carry `description`, `url`, `documentAddress`, `createdAt`, and `updatedAt`
  (`front/api/field-binder-inventory.ts:81`). Nothing reads the two timestamps. Edit offers Choose
  File to replace the document.
- A device is current when its synced publication's identity matches the source's
  (`front/api/field-binder.ts:256`).
- Admin's `DocumentDrain` (`front/app-admin/document-drain.ts`) drains the attachment pair only.
  Its task already reports `remaining`.

## Target design

### Upload tasks

- The consumer mints the document id with `id()` when the document is chosen. The row, the
  reference, and the task key exist before any byte moves.
- Choosing a document publishes an upload task keyed by its document id, with
  `progress: { completed, total, unit: 'bytes' }` and `blocksExit: true`. A chosen `File` does not
  survive a reload.
- The consumer reads `file.stream()`, reports bytes read against `file.size`, assembles the Blob,
  and stages it as a File with the minted id. Storage is not chunked. An interrupted read stages
  nothing.
- The task is **stage, then place.** It places the staged document into its collection once both
  the stage and the consumer's Save have succeeded. Cancel before Save leaves nothing placed. The
  task holds `blocksExit: true` until placement completes, then clears.
- A stage or placement failure publishes `failed`, naming the document. Dismiss clears it
  (existing).
- Delivery stays with the per-pair drain loop and its task, which reports `remaining` after each
  pass.
- `Uploads` does not import or publish `BackgroundTasks`.
- Progress and failure live in the task list, on the device that runs the task. A row reflects
  only what its record knows.

### Attachments

- The placed address is known when the document is chosen: the record exists (every update), or
  the topic's bucket is fixed (every Library topic). One `Attachments` operation builds it from the
  topic's placement and the minted id (CONVENTIONS §10.8).
- `capture` adds the row at once from the File (name, kind from `AttachmentFormats`, content type,
  chosen-at) and the placed address. It no longer sets the list or the note's Save gate busy.
- Save writes the record once, with placed addresses, and returns. It does not wait for staging,
  and nothing rewrites the record after Save. The upload task places each document after Save; the
  drain delivers it.
- Opening an attachment before its document arrives fails with the store's not-found error.
- Cancel before any write attempt discards the editor's staging, including stages that complete
  after Close (existing rule).
- _[Superseded by the amendment "After ACE review", item 1.]_
  A new record in an owner-bucket topic (Customers, Users, Jobs) keeps the shipped path: create,
  place, reconcile. Its create path is out of scope.
- `Attachments.file(attachment): Promise<File>` reads a document's bytes: it resolves the existing
  link and fetches, naming and typing the File from the attachment.

### Field Binder entry

```ts
export type FieldBinderEntry = Instance & {
  description: string
  documentAddress: string
  upload: FieldBinderUpload
}

export type FieldBinderUpload = {
  source: 'upload' | 'library' | 'url'
  kind: AttachmentKind
  url?: string // source 'url'
  record?: { topic: LibraryTopic; id: Id } // source 'library'
}
```

`LibraryTopic` stands for the Library namespace's topics; production names it.

- **Name** is the document's own name. It lives only on the document and changes by rename. The
  inventory never carries it.
- **Description** is inventory metadata, the title people read.
- **`documentAddress`** is the document's placed address in the Binder collection, built from the
  collection's fixed ids and the minted id.
- **Delivered** means the entry's document is on FieldBinderServer. The inventory stores no
  delivery state. The upload date is the server document's creation time.
- **`upload`** records how the document arrived. `url` is editable until the document is
  delivered; then the container is read-only.
- An entry's document is never replaced. Rename is the only change to a document.
- `createdAt` and `updatedAt` are removed. `schemaVersion` stays 1. There is no conversion or
  compatibility handling; the CA resets stage storage before verification, and an old local
  mirror is replaced at the next Sync or cleared.

### Field Binder Manager

The Detail aside adds and edits one document.

```
┌─ Add document ─────────────────────────── [Cancel] [Save] ┐
│  Source       [ Upload | Library | URL ]                   │
│                                                            │
│  Upload   →   [Choose file]  DJI-drone-XX-YY-.pdf · PDF    │
│  Library  →   [Choose from library]  Roundup PowerMAX · SDS│
│  URL      →   Source URL* [https://…                ] [↗]  │
│               [Choose file]  sds-download.pdf · PDF        │
│                                                            │
│  Name         DJI-drone-XX-YY-.pdf                         │
│  Description* [Drone parts list                         ]  │
└────────────────────────────────────────────────────────────┘
```

- The Source toggle sets `upload.source`. Only the document row changes with it.
- **Upload:** Choose File.
- **Library:** a picker over the Library's attachments, topic → record → document (Index-Detail),
  reached through `api.Chemicals`, `api.Assets`, and `api.Services` and their notes. The chosen
  document is read with `Attachments.file` and staged into FieldBinderUploads. Download progress is
  read from the response body.
- **URL:** Source URL, Open (↗), and Choose File. The person opens the address, saves the file,
  and chooses it. The browser never fetches the source.
- Choosing the document starts its upload task. Kind shows beside the chosen name. Name is
  read-only: the document is staged under the chosen file's name. No status text under the picker.
- Save publishes the entry once and closes the aside. It does not wait for staging or delivery.
  The upload task places the document after Save; the drain delivers it. An entry whose task never
  places its document stays pending until removed.

```
┌─ Document details ─────────────────────── [Cancel] [Save] ┐
│  Upload       URL · PDF · 2026-11-13                       │
│               https://dji.com/…/parts-list.pdf        [↗]  │
│  Name*        [DJI-drone-XX-YY-.pdf                     ]  │
│  Description* [Drone parts list                         ]  │
└────────────────────────────────────────────────────────────┘
```

- Edit shows `upload` as a read-only line: source, kind, and the upload date, or "Pending". While
  pending, Source URL is editable.
- Name is editable once the document is delivered. Changing it renames the document; Save
  republishes the inventory.
- Edit has no document control.

Collection rows:

_[Amended by the amendment "After ACE review", item 3: rows refresh on delivery.]_

- The Manager reads each entry's server document; that read gives the name and delivery.
- Title: the description. Subtitle: the document's name, or "Pending" when the document is not on
  the server. Pill: the source, Uploaded, Library, or URL.
- A pending row is dimmed. A delivered row is plain.
- Remove is available on every row. A pending entry whose task failed stays pending until removed.

### Preparation and currency

- Preparation copies the entries whose documents are on the server. The local reader lists and
  verifies the entries it holds.
- A sync that skipped an entry is not current. It reports an update available, not "Verified
  current", and the next Sync takes what has arrived.
- Ops refreshes by Sync, as always.

## Decisions

All are decided; the target above reflects them.

1. **Delivery is presence on FieldBinderServer.** The inventory stores no delivery state, and the
   drain never republishes it.
2. **Admin schedules delivery per pair.** `DocumentDrain` runs one loop per pair, each with its
   own lock name and task key. There is still no universal drain (architecture-core §10.2.2).
   Delivery scheduling remains each app's (architecture-core §10.3): Ops stays offline and
   delivers at base through its deliberate job upload, with no loop.
3. **A Binder document arrives by Upload, Library, or URL,** chosen with the Source toggle and
   recorded in the entry's `upload` container.
4. **A failed upload shows in the task list only.** The row does not infer failure.
5. **Currency includes delivery.** A sync that skipped an entry is not current.
6. **Save writes the placed address and waits for no transfer.** The upload task places after
   Save; a document not yet arrived is not found.

## Governing documents to amend

Documentation leads code. Each change below is made in the production, not in this brief:

_[Amended by the amendment "After ACE review", item 2: architecture-front is already amended.]_

- **architecture-core §10.2.2:** preparation copies entries whose documents are on the server; a
  sync that skipped one is not current.
- **architecture-core §10.3, The Inbox and Its Drains:** `stage` gains only a supplied id; staging
  progress belongs to the consumer's read; Save writes placed references and the upload task places
  after Save; Admin scheduling covers both pairs.
- **architecture-core §10.4, The Catalog:** "Attachment Save preserves recovery references" is
  superseded for updates and Library topics: Save writes placed addresses once, and the upload task
  places after Save. A new owner-bucket record keeps create, place, reconcile.
- **Field Binder brief, inventory shape:** the entry shape, "Entry id survives file replacement",
  and "filename remains the uploaded file's name" are superseded by the Field Binder entry above.
- **Field Binder brief, Field Binder Manager:** "Add stages a chosen file", "replaces the file
  under the same entry id", and the one-step Choose File presentation are superseded.
- **Field Binder brief, Publication and Save:** steps 1–2 and "Save requires signal and delivery"
  are superseded.
- **Field Binder brief, Records 2026-11-11 "one Field Binder":** the Source toggle's withdrawal is
  reversed; the toggle returns as Upload, Library, URL.
- **Background Tasks brief, First consumer:** "owns the attachment pair only" is superseded.

## Production scope

Order: documentation, then `core/`, then consumers, then tests. Paths are under `source/`.

| Files                                                                                    | Work                                                            |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `core/cli/docstore-uploads.ts`                                                           | Optional `id` on `stage` (Escalation)                           |
| `front/api/attachments.ts`                                                               | Supplied id, staging read with progress, placed address, `file` |
| `front/app/shell/attachment-list.tsx`, `make-attachment-save.ts`                         | Immediate rows; Save writes placed addresses; upload tasks      |
| `front/api/field-binder-inventory.ts`                                                    | Entry shape and `upload` container                              |
| `front/api/field-binder-source.ts`                                                       | Publish once at Save; place after Save; rename republishes      |
| `front/api/field-binder.ts`                                                              | Preparation from server presence; currency                      |
| `front/app-admin/field-binder/field-binder-state.ts`, `-step-detail.tsx`, `-manager.tsx` | Source toggle, one document per Add, rows and pill              |
| `front/app-admin/field-binder/` (one new file)                                           | Library picker                                                  |
| `front/app-admin/document-drain.ts`, `app.tsx`                                           | One loop per pair                                               |
| `tests/cases/`                                                                           | Supplied id, both consumers, drain per pair, preparation        |

Out of scope:

- any `core/` change beyond the supplied id on `stage`, including the create contract and
  progress options
- the docstore kernel, the providers, and the `BackgroundTasks` contract
- `ux/`, `domain/`, and the edge functions
- _[Amended by the amendment "After ACE review", item 1.]_
  the attachment consumers' create path (managers and the Onboarding Wizard)
- chunked or resumable storage (architecture-core §10.5)
- byte reclamation of unreferenced documents (architecture-core §10.3)
- retry of a failed Binder upload; Remove and Add again
- Ops and Customer Portal capture
- task persistence across reloads

Escalate any change outside this scope.

## Acceptance

- `stage` with a supplied id produces that `DocumentId`; staging the same id again returns the
  existing document; callers that pass no options behave as before.
- Staging progress is reported by the consumer's read. An aborted read stages nothing.
- The drain's task reports `remaining` after each pass, per pair.
- Attachments: the row appears before staging completes. Save does not wait for staging and
  writes the record once, with placed addresses. Placement follows Save. Cancel before Save places
  nothing.
- Field Binder: each source adds one entry. Save returns before staging and delivery. A pending
  entry is dimmed, subtitled "Pending", and never prepared. A delivered entry shows its name and
  locks `upload`. Rename changes the document's name and republishes. A failed task appears in the
  task list.
- A sync that skipped an entry reports an update available.
- `blocksExit` is true from choice until placement completes, and clears on placement or failure.
- CA verifies on screen with a slow source (a Drive-backed folder), after resetting stage storage.

Run `deno task check`, `deno task fmt:check`, the permitted unit suite, and STYLE_AUDIT.

## Records

- **One pattern for both uploads.** Staging and delivery are the same kind of work, and a long
  stage from a slow source is the scenario the task manager was built for.
- **The id is supplied.** The application mints ids (domain-model §3.9), and the kernel accepts a
  supplied id (CONVENTIONS §10.8). An id known at choose time lets the row, the reference, and the
  task exist before the bytes.
- **Only `stage` changes in `core/`.** Progress comes from the consumer's read, and the drain's
  existing per-pass result reports `remaining`.
- **Save waits for no transfer.** A slow read is the case this brief exists for, so Save cannot
  wait for staging. Save writes the placed address, which a supplied id makes known before the
  document exists (CONVENTIONS §10.8). The server is the source of truth: a document not yet
  arrived is not found, and one that never arrives was never there.
- **Placing is the handoff.** The upload task's last step puts the document in line for the drain.
  A placed document cannot be discarded, so placement waits for Save, and Cancel before Save leaves
  nothing to deliver. The task owns placement, so nothing else has to.
- **No reconcile after Save.** The draft returned on 2026-11-13 had Save write staged references
  and the task place and rewrite them. A rewrite that lands after Save can overwrite edits made
  since; writing the placed address once removes it.
- **Staging reads progressively but writes once.** The slow part is reading the File. Chunked
  storage would change locked `core/` to gain resume, which a reload defeats because the `File`
  does not survive it. Chunking belongs to the survey-map tier.
- **Name lives only on the document.** Rename is the store's one edit point. A copy anywhere else
  drifts. Kind can be carried because a document is never replaced.
- **Delivery is read, not stored.** Presence on the shared server is true on every device. A stored
  state needs a republish on delivery, which collides with an open editor.
- **Failure lives in the task.** Only the uploading device knows progress or failure; inferring
  failure from an absent document is false on every other device.
- **The Binder always holds copies,** so removing or renaming a record's attachment never breaks
  an entry.
- **Reclamation is out of scope.** An atomic write leaves no partial documents; unreferenced bytes
  are already a separate responsibility in architecture-core §10.3.

## Amendment — 2026-11-13 — After ACE review

ACE's review found nothing blocking and drafted a production scope. It asked the CA to settle three
points with the approval. This amendment records the CA's answers and supersedes the marked items
in Production scope, Governing documents to amend, and Field Binder Manager.

1. **Every upload takes the new path, creates included.** In Customers, Users, and Jobs the
   placed address contains the record's id. On a create, Save creates the record, builds the placed
   addresses from its id and the documents' minted ids, updates the record, and returns. Save
   waits for no transfer, and nothing rewrites the record after Save. `makeAttachmentSave` does
   this; the Managers and the Onboarding Wizard are unchanged. The attachment list has one mode.
2. **Architecture-front is amended.** §7.2.4, Document Storage, and §10.1.2, swarmAg-suite
   foundation, were amended by the CA in `d23d8b4`: every upload is a background task placed after
   Save, `DocumentDrain` runs one loop per pair, and the Binder Manager has the Source toggle and
   rename-only Edit. The documentation step does not repeat them.
3. **Rows refresh on delivery.** The Manager re-reads its rows when the Binder drain's remaining
   count changes. There is no polling. A document uploaded from another device shows here when the
   Manager next loads.

_End of Brief_
