# Upload — Brief

**Active, draft for dispatch review; refreshed 2026-11-11.** Foundation mode: shared upload
composition and concrete Supabase provider binding. The design below is the implementation target.
Production requires CA-approved scope; physical data relocation and deployment require separate
operational authorization.

## Purpose and boundaries

`Uploads` implements durable capture, placement, access, and delivery between two injected
docstores. Each instance has one inbox and one server. The same implementation serves attachments
and Field Binder without knowing either feature's catalog, metadata, or references.

Attachments owns recognition, note references, and its catalog. Field Binder Manager owns binder
organization and inventory references. Applications own scheduling and commands. Docstores provide
the common namespace → bucket → document contract; concrete providers own physical storage.

## Instance composition

```ts
const AttachmentsUploads = new Uploads(AttachmentsInbox, AttachmentsServer)
const FieldBinderUploads = new Uploads(FieldBinderInbox, FieldBinderServer)
```

The inboxes are different IndexedDB databases. The servers are different bound remote docstores.
Each instance drains its entire non-Staging inbox to its own server. No destination router, feature
switch, catalog filter, or shared physical inbox is part of Uploads.

The API composition exports `api.AttachmentsUploads` for attachment delivery. Field Binder's
composition exports `api.FieldBinderUploads` under its own feature scope. Each feature owns its
upload instance. Code names do not rename physical databases or change logical addresses.

## Upload contract

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

1. **Stage captures durably.** Preserve the supplied File's name, bytes, and content type. The
   private Staging namespace and fixed bucket use the existing staging UUIDs. They can have the
   same logical identities in different inboxes: the instance binding supplies the storage context.
2. **Place copies.** The caller supplies a store-produced destination bucket identity. Preserve
   the document UUID; retain the staged source for interrupted reference-write recovery. Repeated
   placement into the same destination returns the existing immutable document.
3. **The consumer owns Save.** Placement makes a document drainable; it is not a transaction with
   reference writes. Uploads does not inspect notes, inventory entries, or record commitment.
4. **Discard removes staging only.** Reject placed identities. A consumer discards only selections
   it owns and can safely remove. Preserve existing attachment behavior: retain staging after a
   record-write attempt, and clean up a late stage completion after an unsaved editor closes.
5. **Drain preserves logical addresses.** Snapshot every non-Staging namespace/bucket/document in
   this inbox. Create corresponding nodes on this server, then remove placed inbox copies only
   after delivery succeeds. Retain staging. Attempt every snapshot document; aggregate failures
   after the pass. On success, count remaining from a fresh snapshot. Concurrent/repeated delivery
   remains idempotent, including races with inbox deletion.
6. **Access follows actual operations.** Link/get try the inbox and fall back to this instance's
   server only on a placed-document 404. Missing staging and other failures propagate.
7. **Scheduling is external.** Uploads has no timers, task reports, app imports, or feature names.
   Admin's attachment loop retains its session check, Web Lock, settling schedule, and backoff.

References are relative to the selected docstore. The owning feature supplies that context through
composition. Do not add cross-feature reference validation or feature-branded document identities.

## Concrete docstore binding

The kernel remains `new DocumentStore(provider, { linkLifetime })`. The provider instance is bound
at construction; root is not a fourth address segment or an argument on document operations.
`ApiDocumentStoreContract`, `DocumentProviderContract`, logical lineage, and the reference grammar
retain their signatures. TypeScript's shared structural contract is intentional; composition
selects the appropriate instances.

IndexedDB binds through `IndexedDbDocumentProvider(dbKey)`, with a distinct configured database
for each inbox and local mirror. Supabase binds through:

```ts
new SupabaseDocumentProvider(client, root)
```

`client` remains a lazy caller-session accessor; `root` is the provisioned native Supabase Storage
bucket id. Names shown below are illustrative configuration values, not literal feature names in
the provider:

```text
Storage bucket: attachments-root
  {namespaceId}/.namespace
  {namespaceId}/{bucketId}/.bucket
  {namespaceId}/{bucketId}/{documentId}

Storage bucket: field-binder-root
  {namespaceId}/.namespace
  {namespaceId}/{bucketId}/.bucket
  {namespaceId}/{bucketId}/{documentId}
```

Markers retain logical container names and creation metadata. Document metadata retains the human
filename; names do not determine identity or physical paths. Namespace listing stays within the
bound root, rather than listing project-wide native buckets. Logical namespace creation writes a
marker; native bucket creation is provisioning. Every operation, including find/resolve, rename,
empty-container deletion, read, and signed links, uses the same root mapping. Parent existence,
exact-level counts, ambiguous-name rejection, pagination, immutable create, and precise errors
remain part of the provider's behavior. Root configuration is validated before storage operations.

Physical roots do not need separate Supabase projects or independent auth sessions. Storage
policies enforce access to each root; a root binding is not a replacement for authorization.
S3 implementation is outside this effort; its physical mapping belongs to its concrete provider.

## Attachment integration

`Attachments(uploads, inbox)` receives the attachment pair's Uploads instance and inbox. Its six
topics, picker filters, namespace catalog, Attachment shape, and screen-facing signatures remain
stable except that delivery is called through `api.AttachmentsUploads.drain()`.

- Recognize by extension and enforce allowed kinds before capture. Construct the supplied File
  with the recognized content type, preserving name and bytes; normalization belongs to Attachments.
- Preserve uploadedAt timing, metadata, id-form documentAddress, topic destinations, and unchanged
  treatment of already-placed references. Topics classify through Uploads.isStaged, create their
  catalog containers, place through Uploads, and rewrite note references.
- Discard/link/size translate Attachment references and delegate. Screens and makeAttachmentSave
  retain the existing attempted-write and retry behavior.
- Existing local attachment database configuration and contents stay intact. A clearer API
  property name does not require renaming the existing database configuration key or its value.

## Production units and scope

Dispatch these units separately. Unit A is executable against the existing provider and does not
depend on Unit B. Unit B supplies the explicit remote binding required by the binder pair.
All implementation paths are under `source/`.

| Unit                    | Files                                                                                                                         | Work                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| A: lifecycle extraction | New `front/api/uploads.ts`; modify `attachments.ts`, `api.ts`, `front/app-admin/document-drain.ts`                            | Extract the class and compose the attachment instance                                |
| A: tests                | New `tests/cases/uploads-test.ts`; modify `attachments-test.ts`, `document-drain-test.ts`                                     | Split mechanical and attachment integration coverage; prove two independent pairs    |
| B: Supabase binding     | `core/cli/supabase-docstore-provider.ts`                                                                                      | Bind to root and map the logical hierarchy beneath it                                |
| B: configuration        | `front/api/api.ts`, `front/config/ux-config.ts`, `front/config/app-{admin,ops,customer}-{dev,stage,prod}.env.example`         | Bind the attachment remote root through `ATTACHMENTS_SERVER_ROOT` and its VITE alias |
| B: provisioning         | `devops/scripts/app-deploy-storage-config.ts`, `storage-reset.ts`, `back/storage/storage-policies.sql`                        | Provision the attachment root and express grants against physical bucket/root paths  |
| B: verification         | `tests/cases/supabase-docstore-provider-test.ts`, `document-store-stage-test.ts`, and affected configuration/session fixtures | Exercise root mapping, grants, hierarchy, and configuration                          |

For Unit B, the concrete config and test-fixture file inventory is enumerated by ACE before its
production scope is approved. Existing environment bindings also require the new configured value;
edit no secret values or deployment targets by implication. Binder roots/keys are Field Binder's
scope, not attachment extraction work.

**Existing remote contents require an explicit transition decision.** Unit B changes physical
layout from namespace-as-native-bucket to root-as-native-bucket. Preserve all logical identities
and stored references. Inventory deployed data before selecting relocation versus authorized reset;
prepare a bounded transition plan for CA approval. Do not silently relocate, delete, reset, deploy,
or introduce dual-layout fallback. This is an operational gate for Unit B, not a reason to block A.

Architecture leads each unit: core §10.2–10.4; front §7.2.4 and §9.5.1; back storage mapping and
policies; devops provisioning/configuration; CONVENTIONS §10.8 for the concrete provider binding
where required. Present holistic, present-tense patches before editing those records. Any governance
amendment and locked-core crossing receive explicit authorization before implementation.

Out of scope: Field Binder behavior, task visibility, screen changes, new upload UX, domain changes,
new kernel operations, S3, and execution of data transitions. Escalate any required scope expansion.

## Acceptance

Unit A preserves durable reopen, normalized types, metadata, placement/retry, staging retention,
late-selection cleanup, final-reference failure recovery, drain interruption/concurrency, arrivals
during a pass, and exact fallback behavior. A two-pair test stages and drains independently, proving
that each inbox feeds only its injected server without routing logic.

Unit B tests two roots over one client, namespace listing and resolution, marker metadata, counts,
rename and empty deletion, immutable copies, pagination, session-authorized reads/writes, and links.
The same logical lineage can exist independently in each bound root. Existing logical references
survive the approved physical transition.

Run `deno task check`, `deno task fmt:check`, `deno task test` excluding `users-api-test.ts` and
`session-coordinator-test.ts`, and STYLE_AUDIT. State exclusions explicitly. Live storage tests and
CA Admin attachment checks are distinct from offline test success and require their environments.

## Records

- **2026-11-11, shared lifecycle confirmed by the CA.** Durable note attachment and durable binder
  upload differ in destination and reference ownership, not capture and delivery. The earlier
  suggestion to leave Attachments fused until binder design was complete was rejected.
- **2026-11-11, extraction review.** Replaced move/blanket-rollback wording with the existing
  copy-and-retain and attempted-write rules. Preserved content-type normalization, partial drain
  failure, identity ownership, and application scheduling. Expanded documentation/test scope to
  match the actual extraction.

- **2026-11-11 — Instance composition settled by the CA.** One reusable Uploads class binds one
  inbox/server pair per instance: attachmentsInbox/attachmentsServer and
  fieldBinderInbox/fieldBinderServer. The universal upload singleton and shared physical inbox
  interpretation are withdrawn. Existing local binding names/values need no migration.
- **2026-11-11 — Root mapping approved in discussion.** A concrete provider owns its root binding;
  Supabase root is a provisioned Storage bucket containing namespace/bucket markers and documents.
  Namespace is no longer the native-bucket boundary in this target mapping. The shared hierarchy,
  kernel signatures, and root-relative identities stay uniform. S3 is deferred.
- **2026-11-11 — Dispatch separation.** The extraction proceeds independently of the concrete
  provider change. Provider/provisioning scope and an authorized physical data transition accompany
  root binding; they are not hidden inside the mechanical extraction.
