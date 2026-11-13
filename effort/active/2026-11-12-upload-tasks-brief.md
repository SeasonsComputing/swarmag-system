# Upload Tasks — Brief

**Active, dispatched 2026-11-13; amended once (After ACE dispatch review, at the end). Captured
2026-11-12; Field Binder design revised 2026-11-13.**
Foundation mode: the upload lifecycle in locked `core/cli`, its two consumers (attachments and the
Field Binder), and their delivery scheduling. Its CA decisions are settled (Decisions). Its one
`core/` change is an escalation and a prerequisite (below). Trailing records hold the reasons.

## Escalation: supplied id (prerequisite)

The whole design rests on a document id minted by the client before upload. `Uploads.stage` mints
the id inside the store, so this brief requires one change to locked `core/cli`, under strict
scrutiny and CA approval before any other production:

```ts
async stage(file: File, options?: { id?: Id }): Promise<NodeMetadata<DocumentId>>
```

- **It corrects `Uploads`.** The application mints ids (domain-model §3.9), and the kernel already
  accepts a supplied id (`suppliedId ?? id()`, CONVENTIONS §10.8). `Uploads` is the one layer that
  withholds it.
- **The need is general.** Any offline-first consumer that shows a document before its bytes land
  needs the identity first: the row, the reference, and the task key.
- **Without it, every consumer remaps.** A temporary key swapped for the real id after staging
  changes a row's identity mid-life and rekeys its task, in every consumer.
- **It is additive.** One optional field. Omitted, `stage` behaves as before. No provider, kernel,
  or drain change.
- _[Superseded by the amendment "After ACE dispatch review", item 1.]_
  **Confirm before production:** the kernel refuses a create whose id exists. If it does not,
  stop and escalate; that is a separate core question.

Nothing else in this brief changes `core/`. Progress is the consumer's (Upload tasks).

## Purpose and dependencies

Every upload is a background task. A chosen document is transfer work: staging reads it into the
inbox, delivery copies it to the server. Neither holds the UI. Choosing a document starts its task;
the form closes on Save; the task reports progress and failure; the consumer's row reflects it.

Both upload consumers adopt this one pattern:

- **Attachments**, through `api.Attachments` and `makeAttachmentSave`.
- **The Field Binder Manager**, through `FieldBinderSource`.

Dependencies:

- `effort/completed/2026-11-11-upload-brief.md`: `Uploads`, its pairs, and the inbox lifecycle.
- `effort/active/2026-11-10-background-tasks-brief.md`: `BackgroundTasks`, its `progress` and
  `remaining` fields, `blocksExit`, and `DocumentDrain`.
- `effort/active/2026-11-04-field-binder-brief.md`: the Manager, publication, and preparation.

## Current behavior

Verified against the code on 2026-11-12:

- `Uploads.stage(file)` (`core/cli/docstore-uploads.ts:61`) lets the store mint the document id
  and returns it after the whole file is written in one `document.create`. It reports no progress.
- `Uploads.drain()` (`:104`) returns `{ drained, remaining }` after the pass. It reports no progress.
- The IndexedDB provider stores one Blob per document in one `add`
  (`core/cli/indexeddb-docstore-provider.ts:119`). The Supabase provider uploads with
  `storage.upload` (`core/cli/supabase-docstore-provider.ts:96`), which has no progress option.
- Attachments: `capture` (`front/app/shell/attachment-list.tsx:65`) sets the list and the note's
  Save gate busy, awaits `attach(file)`, and adds the row only after staging completes. Save then
  writes the record, places the staged documents, rewrites the references to the placed addresses,
  and writes the record again (`front/app/shell/make-attachment-save.ts:84`).
- Field Binder: `choose` (`front/app-admin/field-binder/field-binder-state.ts:105`) awaits staging
  with the picker disabled. Save refuses while staging is pending, then places, calls
  `drain()` inline, verifies the server copy, and publishes the inventory
  (`front/api/field-binder-source.ts:105`).
- Field Binder entries carry `description`, `url`, `documentAddress`, `createdAt`, and `updatedAt`
  (`front/api/field-binder-inventory.ts:81`). Nothing reads the two timestamps. The row title is
  the description; Edit offers Choose File to replace the document.
- Admin's `DocumentDrain` (`front/app-admin/document-drain.ts`) drains the attachment pair only.

## Target design

### Identity before bytes

The consumer mints the document's id with `id()` when the document is chosen and supplies it to
`stage` (Escalation). The store still produces the `DocumentId`. `place` and the drain already
keep the UUID, so the row, the reference, and the task key exist before any byte moves.

### Upload tasks

- Choosing a document publishes a staging task keyed by its document id, with
  `progress: { completed, total, unit: 'bytes' }` and `blocksExit: true`. A chosen `File` does not
  survive a reload, so an interrupted stage cannot be recovered.
- The consumer reads `file.stream()`, reports bytes read against `file.size`, assembles the Blob,
  and stages it as a File with the minted id. `stage` writes it in one `document.create`. Storage
  is not chunked. An interrupted read stages nothing.
- On completion the staging task clears. On failure it publishes `failed` with error text naming
  the document.
- Delivery stays with the per-pair drain and its existing task (Decisions, item 2). The task
  reports `remaining` from each pass's existing `{ drained, remaining }` result.
- `Uploads` does not import or publish `BackgroundTasks`.
- Progress and failure live in the task list, on the device that runs the task. A consumer's row
  reflects only what its record knows.

### Attachments

- `capture` adds the row at once from the File (name, kind from `AttachmentFormats`, content type,
  chosen-at) and the minted id. It no longer sets the list or the note's Save gate busy.
- The row's address is the placed id-form address, built with `DocumentAddresses.build` from the
  topic's placement ids (namespace, bucket or owner id) and the minted document id. `Attachments`
  exposes this as one operation, so consumers never assemble placement segments themselves.
- Save writes the record once, with final references. After a successful write, placement runs
  as part of the transfer, when staging completes. The post-placement reference rewrite and second
  record write are removed.
- Cancel before any write attempt discards the editor's staging, including stages that complete
  after Close (existing rule).
- A row whose document is in neither the inbox nor the server shows as failed, with Remove. It is
  never shown as an error page or a broken link.

### Field Binder entry

```ts
export type FieldBinderEntry = Instance & {
  description: string
  documentAddress: string
  state: 'pending' | 'delivered'
  upload: FieldBinderUpload
}

export type FieldBinderUpload = {
  source: 'upload' | 'library' | 'url'
  kind: AttachmentKind
  uploadedAt?: When                          // set on delivery
  url?: string                               // source 'url'
  record?: { topic: LibraryTopic; id: Id }   // source 'library'
}
```

- _[Amended by the amendment "After ACE dispatch review", item 3.]_
  **Name** is the document's own name. It lives only on the document, starts as the chosen file's
  name, and changes by rename. The inventory never carries it.
- **Description** is inventory metadata, the title people read.
- **`upload`** records how the document arrived. It is editable until the entry is created, except
  `url`, which stays editable while the entry is pending. On delivery the container is read-only.
- An entry's document is never replaced. Rename is the only change to a document.
- `createdAt` and `updatedAt` are removed.
- _[Superseded by the amendment "After ACE dispatch review", item 2.]_
  The inventory's `schemaVersion` becomes 2.

### Field Binder Manager

The Detail aside adds and edits one document. Add no longer takes `multiple`.

_[Amended by the amendment "After ACE dispatch review", item 3: Name is read-only on Add.]_

```
┌─ Add document ─────────────────────────── [Cancel] [Save] ┐
│  Source       [ Upload | Library | URL ]                   │
│                                                            │
│  Upload   →   [Choose file]  DJI-drone-XX-YY-.pdf · PDF    │
│  Library  →   [Choose from library]  Roundup PowerMAX · SDS│
│  URL      →   Source URL* [https://…                ] [↗]  │
│               [Choose file]  sds-download.pdf · PDF        │
│                                                            │
│  Name*        [DJI-drone-XX-YY-.pdf                     ]  │
│  Description* [Drone parts list                         ]  │
└────────────────────────────────────────────────────────────┘
```

- The Source toggle sets `upload.source`. Only the document row changes with it.
- **Upload:** Choose File.
- **Library:** a picker over the Library namespace's attachments, topic → record → document
  (Index-Detail). The chosen document is downloaded from AttachmentsServer and staged into
  FieldBinderUploads as a File. The Binder always holds copies.
- **URL:** Source URL, Open (↗), and Choose File. The person opens the address, saves the file,
  and chooses it. The browser never fetches the source.
- Choosing the document starts its upload task. Kind shows beside the chosen name. The bare status
  text under the picker is removed.
- Save publishes the entry as `pending` and closes the aside. It does not wait for staging or
  delivery (Decisions, item 1).

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
- _[Amended by the amendment "After ACE dispatch review", item 3.]_
  Changing Name renames the document. Save republishes the inventory, so Sync sees a new
  publication.
- Edit has no document control.

Collection rows:

- _[Amended by the amendment "After ACE dispatch review", item 3.]_
  Title: the description. Subtitle: the document's name. Pill: the source, Uploaded, Library, or
  URL.
- A pending row is dimmed. A delivered row is plain. Both states come from the inventory and read
  the same on every device.
- Remove is available on every row. A pending entry whose task failed stays pending until removed.

Publication and preparation:

- When an entry's document is delivered and verified on FieldBinderServer, the entry is
  republished as `delivered` with `upload.uploadedAt`. The existing stale-baseline comparison
  applies to that publication.
- Preparation includes delivered entries only. A pending entry never reaches a reader.

## Decisions

All are decided; the target above reflects them.

1. **Where a pending Binder entry is durable.** Decided: in the published inventory, with an
   entry state, and preparation skips pending entries.
2. **How Admin schedules Binder delivery.** Decided: Admin's `DocumentDrain` runs one loop per
   pair, each with its own lock name and task key, and the Binder's completion runs after each
   binder pass. There is still no universal drain (architecture-core §10.2.2). Binder uploads
   occur only in Admin, where the Manager lives. Delivery scheduling remains each app's
   (architecture-core §10.3): Ops stays offline and delivers at base through its deliberate job
   upload, with no loop.
3. **How a Binder document arrives.** Decided: by Upload, Library, or URL, chosen with the Source
   toggle and recorded in the entry's `upload` container.
4. **How a failed Binder upload shows.** Decided: in the task list only. The row does not infer
   failure.

## Governing documents to amend

Documentation leads code. Each change below is made in the production, not in this brief:

- _[Superseded by the amendment "After ACE dispatch review", item 4.]_
  **architecture-core §10.3:** stage takes a supplied id and reports progress; Save writes final
  references before placement; Admin scheduling covers both pairs (per item 2).
- **architecture-core §10.2.2:** preparation includes delivered entries only (per item 1).
- **Field Binder brief, inventory shape:** the entry shape, "Entry id survives file replacement",
  and "filename remains the uploaded file's name" are superseded by the Field Binder entry above.
- **Field Binder brief, Field Binder Manager:** "Add stages a chosen file", "replaces the file
  under the same entry id", and the one-step Choose File presentation are superseded.
- **Field Binder brief, Publication and Save:** steps 1–2 and "Save requires signal and delivery"
  are superseded.
- **Field Binder brief, Records 2026-11-11 "one Field Binder":** the Source toggle's withdrawal is
  reversed; the toggle returns as Upload, Library, URL.
- **Background Tasks brief, First consumer:** "owns the attachment pair only" is superseded (per
  item 2).

## Production scope

Paths are under `source/`.

| Files                                                                                    | Work                                                                     |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `core/cli/docstore-uploads.ts`                                                           | Optional `id` on `stage` (Escalation; first, on approval)                |
| `front/api/attachments.ts`                                                               | Supplied id, staging read with progress, placed address                  |
| `front/app/shell/attachment-list.tsx`, `make-attachment-save.ts`                         | Immediate rows, staging tasks, single record write                       |
| `front/api/field-binder-inventory.ts`                                                    | Entry shape, `upload` container, schema version 2 _[Superseded, item 2]_ |
| `front/api/field-binder-source.ts`                                                       | Publish pending, then delivered; rename republishes                      |
| `front/app-admin/field-binder/field-binder-state.ts`, `-step-detail.tsx`, `-manager.tsx` | Source toggle, one document per Add, rows and pill                       |
| `front/app-admin/field-binder/` (new file)                                               | Library picker                                                           |
| `front/api/field-binder.ts`                                                              | Preparation includes delivered entries only                              |
| `front/app-admin/document-drain.ts`, `app.tsx`                                           | Per-pair loops (per item 2)                                              |
| `tests/cases/`                                                                           | Supplied id, both consumers, drain per pair                              |

Out of scope:

- chunked or resumable storage (survey maps, architecture-core §10.5)
- byte reclamation of unreferenced documents (architecture-core §10.3, a separate
  responsibility)
- retry of a failed Binder upload; Remove and Add again
- any `core/` change beyond the supplied id, including progress options on `stage` or `drain`
- Ops and Customer Portal capture
- task persistence across reloads
- changes to the docstore kernel, the providers, or the `BackgroundTasks` contract

Escalate any change to `core/`, the `BackgroundTasks` contract, the kernel, or a provider.

## Acceptance

- `stage` with a supplied id produces that `DocumentId`. Callers that pass no options behave as
  before.
- _[Superseded by the amendment "After ACE dispatch review", item 1.]_
  A supplied id that exists is refused.
- Staging progress is reported by the consumer's read. An aborted read stages nothing.
- The drain's task reports `remaining` after each pass.
- Attachments: the row appears before staging completes. Note Save does not wait for staging.
  The record is written once. A failed or interrupted stage shows as failed on its row.
- Field Binder: each source adds one entry. Save returns before delivery. A pending entry is
  dimmed and never prepared. Delivery republishes the entry as delivered and locks `upload`.
  Rename changes the document's name and republishes. A failed task appears in the task list.
- `blocksExit` is true while staging and clears when staging completes or fails.
- CA verifies on screen with a slow source (a Drive-backed folder).

Run `deno task check`, `deno task fmt:check`, the permitted unit suite, and STYLE_AUDIT.

## Records

- **2026-11-12 — Captured from CA–AA discussion.** The CA observed that the Binder's picker shows
  status text attachments does not, and that a Binder Add takes one file. Asked what a five-minute
  stage does, both consumers were found to block. Staging waits inline in each, and Binder Save
  also waits on delivery. The CA's position: staging and delivery are the same kind of work, and
  this is the scenario the task manager was built for. One pattern for both uploads.
- **Why staging reads progressively but writes once.** The slow part of staging from a network
  source is reading the File, so progress comes from the read, which the consumer does before
  `stage`. Chunked storage would change the
  provider, the read path, the drain, and reclamation in locked `core/` to gain resume, which a
  reload defeats anyway, because the `File` handle does not survive it. Chunking belongs to the
  survey-map tier's resumable uploads.
- **Why the id is supplied.** The application mints ids (domain-model §3.9), and the kernel
  accepts a supplied id (CONVENTIONS §10.8). An id known at choose time lets the row, the
  reference, and the task exist before the bytes. Today's `stage` mints the id inside the store,
  so the row could only appear after staging.
- **Why attachments write final references once.** Placement ids are fixed or the owner's, so the
  placed address is known at Save. Writing it directly removes the post-placement rewrite and the
  second record write that would otherwise run in the background against an editable record.
- **Why the Binder publishes pending entries.** A reader on another device has no inbox, so an
  entry must not reach preparation before its document is delivered. Attachments do not need this,
  because access follows the document from the inbox. The upload is the same for both; publication
  is the Binder's additional consumer of delivery.
- **2026-11-12 — Decision 1 settled.** The CA agreed that a pending Binder entry is durable in the
  published inventory. The Admin-local alternative, held in FieldBinderInbox until delivery, was
  not taken.
- **2026-11-12 — Decision 2 settled, scoped to Admin.** The CA noted that Ops is offline. Ops runs
  no drain loop and never uploads Binder files, so the decision concerns Admin's scheduling only.
  The task pattern (an immediate row, staging progress) is independent of scheduling and applies to
  Ops capture when Ops adopts it. The alternative, app-invoked Binder delivery run as a task, was
  not taken.
- **Why reclamation is out of scope.** An atomic write leaves no partial documents. What remains is
  a reference to a document that never arrived, and unreferenced bytes, already a separate
  responsibility in architecture-core §10.3.
- **2026-11-12 — Name, description, origin, copies.** In a Field Binder Manager review the CA
  found the inventory had no name, only a description, and write-only `createdAt` and
  `updatedAt`. Settled: the name is the document's (`DJI-drone-XX-YY-.pdf`), the description is
  the label (`Drone parts list`), and a pill shows the origin, Uploaded, Library, or URL. The
  Library is the attachments namespace of company-wide documents (Assets, Chemicals, …). The Field
  Binder always holds copies, so removing or renaming a record's attachment never breaks an entry.
- **2026-11-13 — Adding and uploading are separate.** Adding is the person's act and ends at Save;
  the upload is a background task. Add therefore keeps the Manager's Detail aside, one document per
  Add, and `multiple` was dropped. The 2026-11-10 record already holds that binder documents
  arrive one at a time.
- **2026-11-13 — The Source toggle returns.** With origin recorded, the toggle withdrawn on
  2026-11-11 is how it is chosen, Chemical widened to Library. Only the server fetch from a URL
  stays withdrawn: the person opens, saves, and uploads.
- **2026-11-13 — The `upload` container.** The CA: entry metadata has an `upload` container of
  read-only attributes about the upload. It holds what is fixed when the document arrives; what
  people edit stays outside it. Kind can be carried because a document is never replaced; name
  cannot, because rename changes it. `uploadedAt` replaces the write-only timestamps. The URL stays
  editable until the upload is true, at delivery.
- **2026-11-13 — Failure in the task, not the row.** Only the uploading device's task knows
  progress or failure; the inventory knows pending or delivered. Inferring failure from an absent
  document marks every pending entry failed on other devices. A dead pending entry is rare, never
  prepared, and removed with Remove. Retry on a failed entry was considered and not taken.
- **2026-11-13 — `core/` held to strict scrutiny.** The first draft listed `StageOptions`
  (`id`, `progress`) and `DrainOptions` as one scope row in locked `core/cli`, with no escalation.
  The CA caught it. Byte progress moved to the consumer's read and per-pass `remaining` replaced
  per-document drain progress, so neither needs `core/`. The supplied id remains: the design rests
  on it, and it corrects an extraction that kept attachments' old store-minted id instead of the
  principle the kernel already follows.

## Amendment — 2026-11-13 — After ACE dispatch review

ACE's dispatch review stopped on the Escalation's refusal gate, then raised two Foundation
decisions and two documentation gaps. The CA settled all four. This amendment supersedes the
marked items in Escalation, Field Binder entry, Field Binder Manager, Governing documents to
amend, Production scope, and Acceptance. It does not authorize production; the supplied-id
escalation still awaits CA approval.

1. **Supplied ids stay idempotent.** Create returns an existing document unchanged in both
   providers, which placement and the drain rely on. A supplied id inherits that: a retried stage
   returns the complete document it wrote. The consumer mints one id per chosen document and never
   reuses it. Staging the same id again returns the existing document. No refusal is added to
   `core/`. A fresh UUID v7 per chosen document collides only through a consumer bug, and guarding
   that case would break the idempotency `core/` relies on.
2. **The inventory shape changes by stage reset.** `schemaVersion` stays 1; the shape changes in
   place. There is no conversion or compatibility handling. The CA resets stage storage before
   verification. A local mirror holding the old shape is rejected as malformed and replaced at the
   next Sync, or cleared. Stage is the only environment and has no users, so no old data survives
   to be told apart from new.
3. **A pending entry has no name.** The name lives only on the document, and a pending entry may
   have no document on this device or any other.
   - Add shows Name read-only: the document is staged under the chosen file's name.
   - A pending row's subtitle is "Pending" on every device.
   - Name is editable once the entry is delivered; changing it renames the document, and Save
     republishes the inventory.

   Nothing copies the name, so nothing drifts.
4. **Documentation amendments.** Under Governing documents to amend:
   - **architecture-core §10.3, The Inbox and Its Drains:** `stage` gains only a supplied id;
     staging progress belongs to the consumer's read; Admin scheduling covers both pairs.
   - **architecture-core §10.4, The Catalog:** attachment Save writes final references once; the
     reference rewrite and reconciliation are removed.

_End of Brief_
