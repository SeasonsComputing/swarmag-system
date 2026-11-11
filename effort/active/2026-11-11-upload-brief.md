# Upload — Brief

**Active, draft for CA dispatch review; recorded and revised 2026-11-11.** An enabler of roadmap
M-6. The CA confirmed the separation of durable upload from attachment meaning. Foundation mode:
shared `front/api` responsibility changes. Production is not dispatched; no locked namespace change
is proposed.

## Purpose

Attaching a document to a note and uploading one for the Field Binder Manager share the same
mechanics: durable capture, placement, access, retry, and delivery to a remote docstore. Their
references and destinations differ. Reuse the proven lifecycle without making a binder call an
attachment API and without reimplementing that lifecycle in a second feature.

`Uploads` owns the mechanics now inside `Attachments`. Attachments keeps file recognition,
attachment metadata, catalog destinations, and note-reference rewriting. The Field Binder Manager
owns its destination and inventory publication. Uploads knows neither notes nor inventories.

## Contract

```ts
export class Uploads {
  constructor(inbox: ApiDocumentStoreContract, server: ApiDocumentStoreContract)
  stage(file: File): Promise<NodeMetadata<DocumentId>>
  isStaged(document: DocumentId): boolean
  discard(staged: readonly DocumentId[]): Promise<void>
  place(staged: DocumentId, into: BucketId): Promise<NodeMetadata<DocumentId>>
  drain(): Promise<{ drained: number; remaining: number }>
  link(document: DocumentId): Promise<DocumentLink>
  get(document: DocumentId): Promise<NodeMetadata<DocumentId>>
}
```

The name is **Uploads**. It names the shared act and is not a new store or an attachment kind.
Place takes the destination's store-produced bucket identity. Consumers create their own catalog
containers through the docstore. Names remain human metadata: staging retains the filename and
the drain retains namespace, bucket, and document names. Uploads does not resolve destinations by
name or construct nominal identities; the store and reference grammar produce them.

## Lifecycle and preservation requirements

1. **Stage durably on selection.** Move the fixed Staging namespace and bucket catalog into
   Uploads without changing their UUIDs. Capture the selected file before returning metadata.
   Stage preserves the supplied File's name, bytes, and content type.
2. **Place by copying, not moving.** Copy staged bytes into the caller's inbox bucket, preserving
   the document UUID and using the store-returned destination identity. Retain the staged source:
   a record saved before reference reconciliation may still refer to it. Repeated placement of
   the same staged file into the same destination returns the existing immutable document.
3. **Consumer Save owns commitment.** Placement makes a document drainable; it is not an atomic
   transaction with a record or inventory write. The consumer owns ordering and retries. The
   drain carries only placed documents, never Staging, and cannot decide whether a reference has
   been published. Binder inventory publication follows delivery, as its brief specifies.
4. **Discard is a capability, not a blanket Cancel policy.** It accepts only Staging identities
   and rejects placed identities. The editor discards only its selections before any record-write
   attempt. Once a write may reference staging, retain it. Preserve late-selection cleanup after
   editor Close. No sweep or draft-restoration mechanism is added here.
5. **Drain preserves addresses.** Snapshot every non-Staging inbox namespace and bucket, copy to
   the same server identities, and clear the inbox copy only after server creation succeeds.
   Attempt all snapshot documents; retain the existing AggregateError behavior after a partial
   failure. On success, remaining is a fresh snapshot count, including arrivals during the pass.
6. **Access follows actual operations.** Link/get try the inbox, falling back to the server only
   on a 404 for a placed document. A Staging 404 and all other errors propagate. Preserve races
   with drains: do not replace operation-and-fallback with a stale existence probe.
7. **Scheduling stays outside Uploads.** Admin's DocumentDrain retains its Web Lock, session
   guard, retry/backoff, and one-pass-at-a-time scheduling. Ops and Portal schedule their own
   delivery when integrated. Uploads adds no timers, task registry, or application dependencies.

## Attachments remains compatible

Construct `Attachments(uploads, inbox)` and compose one Uploads instance over the existing inbox
and server in `api.ts`. Export it as `api.Uploads`; construct `api.Attachments` using that instance.

- Recognize by extension and enforce allowed kinds before staging. Keep the normalized content
  type in the actual stored bytes, not merely the Attachment metadata. With stage(File), pass a
  File carrying the recognized type while preserving its name and bytes. Do not trust an empty
  or misleading browser-supplied type as a replacement for current behavior.
- Keep filename, kind, contentType, and uploadedAt behavior; return the same id-form string
  `documentAddress`. Keep creation-time semantics for uploadedAt as currently implemented.
- Topics still create catalog buckets and rewrite note references. Already placed attachments
  remain unchanged. `Uploads.isStaged(document)` is a pure classification against its private
  Staging namespace, needed by AttachmentTopic before deciding whether placement is necessary.
  It exposes no mutable catalog and avoids duplicating that UUID in Attachments.
- `discard`, `link`, and `size` translate Attachment references and delegate. `accept`, the six
  topics, and the read-only provisioned namespaces retain their meaning and signatures.
- Only `drain` leaves Attachments. Update DocumentDrain and its direct tests to use Uploads.
  Screens, `makeAttachmentSave`, and topic consumers do not change.

## Production scope

All implementation paths below are under `source/`.

| File                                 | Change                                                              |
| ------------------------------------ | ------------------------------------------------------------------- |
| `front/api/uploads.ts`               | New shared lifecycle, extracted from Attachments                    |
| `front/api/attachments.ts`           | Delegate mechanics; retain catalog, recognition, and references     |
| `front/api/api.ts`                   | Compose/export Uploads and inject it into Attachments               |
| `front/app-admin/document-drain.ts`  | Call api.Uploads.drain; scheduling behavior unchanged               |
| `tests/cases/uploads-test.ts`        | New tests for the extracted mechanics, split from existing coverage |
| `tests/cases/attachments-test.ts`    | Preserve recognition, reference, editor/retry integration coverage  |
| `tests/cases/document-drain-test.ts` | Bind the loop test to Uploads                                       |

Before code, authorize architecture-core §10.3 Inbox and Its Drains and §10.4 Catalog updates:
Uploads owns shared staging/delivery; Attachments owns attachment destinations and meaning.
Those records lead implementation and must not retain the claim that only Attachments drains.

Out of scope: every document address/UUID, storage provisioning/policies, `core/`, `domain/`,
`ux/`, screens, new upload UX, sync, binder inventory publication, and task visibility. Background
Tasks builds on this extraction; Field Binder then consumes it.

## Verification

Preserve the existing behavior, including durable reopen, normalized types, idempotent placement,
staged source retention, Cancel before/after write attempt, late-stage cleanup, final-reference
write failure, interrupted/repeated drain, concurrent drains, arrivals during a pass, and precise
404 fallback. Cover Uploads with a non-attachment destination to prove catalog independence.

Run `deno task check`, `deno task fmt:check`, and `deno task test` excluding
`users-api-test.ts` and `session-coordinator-test.ts`; report exclusions; perform `STYLE_AUDIT`.
CA verifies attaching in Admin: Choose File, open staged, Save, open placed, Cancel, and eventual
delivery. This extraction must not change any existing manager behavior.

## Dispatch decisions and boundaries

The extraction and name follow the settled intent. Dispatch confirms the contract above, including
the explicit staging classifier required to preserve AttachmentTopic behavior. Do not expose a
redundant staging catalog to each consumer. Escalate any need to alter
attachment semantics, addresses, persistence, core contracts, or editor behavior.

## Design history

- **2026-11-11, shared lifecycle confirmed by the CA.** Durable note attachment and durable binder
  upload differ in destination and reference ownership, not capture and delivery. The earlier
  suggestion to leave Attachments fused until binder design was complete was rejected.
- **2026-11-11, extraction review.** Replaced move/blanket-rollback wording with the existing
  copy-and-retain and attempted-write rules. Preserved content-type normalization, partial drain
  failure, identity ownership, and application scheduling. Expanded documentation/test scope to
  match the actual extraction.
