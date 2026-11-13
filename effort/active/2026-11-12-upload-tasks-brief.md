# Upload Tasks — Brief

**Active, undispatched draft; captured 2026-11-12.** Foundation mode: the upload lifecycle in
locked `core/cli`, its two consumers (attachments and the Field Binder), and their delivery
scheduling. Its two CA decisions are settled (Decisions). Trailing records hold the reasons.

## Purpose and dependencies

A chosen file is transfer work: staging reads it into the inbox, delivery copies it to the server.
Neither holds the UI. A chosen file appears at once as a row, its transfer runs as a background
task with progress, and its result shows on its reference: pending, done, or failed.

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
- Admin's `DocumentDrain` (`front/app-admin/document-drain.ts`) drains the attachment pair only.

## Target design

### Identity before bytes

The consumer mints the document's id with `id()` when the file is chosen and supplies it to
`stage`. The store still produces the `DocumentId`. `place` and the drain already keep the UUID, so
the row, the reference, and the task key exist before any byte moves.

### Uploads: additive options

```ts
export type StageOptions = {
  id?: Id
  progress?: (read: number, total: number) => void
}
export type DrainOptions = {
  progress?: (drained: number, remaining: number) => void
}

async stage(file: File, options?: StageOptions): Promise<NodeMetadata<DocumentId>>
async drain(options?: DrainOptions): Promise<{ drained: number; remaining: number }>
```

- `stage` reads `file.stream()`, reports bytes read against `file.size`, and writes the document
  in one `document.create` with the assembled Blob. Storage is not chunked. An interrupted stage
  writes nothing.
- `drain` reports after each delivered document. Delivery progress is per document, not per byte.
- Existing callers are unchanged. `Uploads` does not import or publish `BackgroundTasks`.

### Transfer tasks

- Choosing a file publishes a staging task keyed by its document id, with
  `progress: { completed, total, unit: 'bytes' }` and `blocksExit: true`. A chosen `File` does not
  survive a reload, so an interrupted stage cannot be recovered.
- On completion the staging task clears. On failure it publishes `failed` with error text.
- Delivery stays with the per-pair drain and its existing task (Decisions, item 2).

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

### Field Binder

- Add takes `multiple` files, labelled "Add files" as attachments' picker is. Each file creates
  one entry with its own row immediately. Description defaults to the filename. The bare status
  text under the picker is removed.
- Save does not wait for staging or delivery. It publishes the entry in the `pending` state
  (Decisions, item 1).
- When an entry's document is delivered and verified on FieldBinderServer, the entry is
  republished as delivered. The existing stale-baseline comparison applies to that publication.
- Preparation includes delivered entries only. A pending entry never reaches a reader.
- A pending entry whose document is absent from this device's inbox and from the server shows as
  failed in the Manager, with Remove.
- The Manager shows entry state as a pill: Pending, Uploaded, or Failed.

## Decisions

Both are decided; the target above reflects them.

1. **Where a pending Binder entry is durable.** Decided: in the published inventory, with an
   entry state, and preparation skips pending entries.
2. **How Admin schedules Binder delivery.** Decided: Admin's `DocumentDrain` runs one loop per
   pair, each with its own lock name and task key, and the Binder's completion runs after each
   binder pass. There is still no universal drain (architecture-core §10.2.2). Binder uploads
   occur only in Admin, where the Manager lives. Delivery scheduling remains each app's
   (architecture-core §10.3): Ops stays offline and delivers at base through its deliberate job
   upload, with no loop.

## Governing documents to amend

Documentation leads code. Each change below is made in the production, not in this brief:

- **architecture-core §10.3:** stage takes a supplied id and reports progress; Save writes final
  references before placement; Admin scheduling covers both pairs (per item 2).
- **architecture-core §10.2.2:** preparation includes delivered entries only (per item 1).
- **Field Binder brief, Publication and Save:** steps 1–2 and "Save requires signal and delivery"
  are superseded.
- **Background Tasks brief, First consumer:** "owns the attachment pair only" is superseded (per
  item 2).

## Production scope

Paths are under `source/`.

| Files                                                                                     | Work                                                        |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `core/cli/docstore-uploads.ts`                                                            | Additive `StageOptions` and `DrainOptions`                  |
| `front/api/attachments.ts`                                                                | Supplied id, progress passthrough, placed address operation |
| `front/app/shell/attachment-list.tsx`, `make-attachment-save.ts`                          | Immediate rows, staging tasks, single record write          |
| `front/api/field-binder-inventory.ts`                                                     | `FieldBinderEntry` state; inventory schema version          |
| `front/api/field-binder-source.ts`                                                        | Publish pending, then delivered                             |
| `front/app-admin/field-binder/field-binder-state.ts`, `-step-detail.tsx`, `-manager.tsx` | Multiple files, immediate rows, state pill                  |
| `front/api/field-binder.ts`                                                               | Preparation includes delivered entries only                 |
| `front/app-admin/document-drain.ts`, `app.tsx`                                            | Per-pair loops (per item 2)                                 |
| `tests/cases/`                                                                            | Uploads options, both consumers, drain per pair             |

Out of scope:

- chunked or resumable storage (survey maps, architecture-core §10.5)
- byte reclamation of unreferenced documents (architecture-core §10.3, a separate
  responsibility)
- Ops and Customer Portal capture
- task persistence across reloads
- changes to the docstore kernel, the providers, or the `BackgroundTasks` contract

Escalate any change to the `BackgroundTasks` contract, the kernel, or a provider.

## Acceptance

- `stage` with a supplied id produces that `DocumentId`. Progress is reported. An aborted read
  leaves no document. Callers that pass no options behave as before.
- `drain` reports per document and returns the same result as before.
- Attachments: the row appears before staging completes. Note Save does not wait for staging.
  The record is written once. A failed or interrupted stage shows as failed on its row.
- Field Binder: several files create several entries. Save returns before delivery. A pending
  entry is never prepared. Delivery republishes the entry as delivered. A lost stage shows failed.
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
  source is reading the File, so progress comes from the read. Chunked storage would change the
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
  a reference to a document that never arrived, presented as failed here, and unreferenced bytes,
  already a separate responsibility in architecture-core §10.3.

_End of Brief_
