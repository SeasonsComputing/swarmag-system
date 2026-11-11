# Upload — Brief

**Active, dispatched for ACE review; refreshed and amended 2026-11-11.** Foundation mode: shared
upload composition and concrete Supabase provider binding. The amendment "After architecture
reconciliation and ACE dispatch review" governs the records, configuration contract, and scope
inventory below. The amendment "Core client placement" revises Unit A's class location and
locked-core boundary. Production requires CA-approved scope; physical data relocation and deployment
require separate operational authorization.

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

_[The Unit A class location is superseded by the amendment "Core client placement":
`source/core/cli/docstore-uploads.ts`, not `source/front/api/uploads.ts`.]_

_[Unit B's file inventory and records prerequisite are revised by the amendment "After architecture
reconciliation and ACE dispatch review", items 1–4. Unit A's independence is retained.]_

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

_[Superseded by the named inventory in amendment item 3.]_ For Unit B, the concrete config and
test-fixture file inventory is enumerated by ACE before its production scope is approved. Existing
environment bindings also require the new configured value; edit no secret values or deployment
targets by implication. Binder roots/keys are Field Binder's
scope, not attachment extraction work.

**Existing remote contents require an explicit transition decision.** Unit B changes physical
layout from namespace-as-native-bucket to root-as-native-bucket. Preserve all logical identities
and stored references. Inventory deployed data before selecting relocation versus authorized reset;
prepare a bounded transition plan for CA approval. Do not silently relocate, delete, reset, deploy,
or introduce dual-layout fallback. This is an operational gate for Unit B, not a reason to block A.

_[The records status is revised by amendment item 1.]_ Architecture leads each unit:
core §10.2–10.4; front §7.2.4 and §9.5.1; back storage mapping and
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

## Amendment — 2026-11-11 — After architecture reconciliation and ACE dispatch review

ACE's review identified two dispatch gaps: governing records still described a shared server and
universal Uploads composition, and Unit B omitted the target contract's path through runtime,
provisioning, and policies. The CA approved holistic architecture corrections, committed in
`3743d3f`. This amendment closes the brief's record/scope omissions and supersedes the marked
records prerequisite and open-ended Unit B inventory. It does not authorize implementation or
operational actions.

### 1. Governing records lead production

Seed and review these current records, by section name as well as number:

| Document                                            | Governing sections                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `documentation/architecture/architecture-core.md`   | §10.2 Stores; §10.3 The Inbox and Its Drains; §10.4 The Catalog                 |
| `documentation/architecture/architecture-front.md`  | §7.2.4 Document Storage; §9.5.1 IndexedDB Database Names                        |
| `documentation/architecture/architecture-back.md`   | §4.7 Document Storage                                                           |
| `documentation/architecture/architecture-devops.md` | §4.2 Placeholder Convention example; §14.1–§14.5 Supabase Storage Configuration |

The records define independent attachment/binder upload pairs, a complete local reader mirror,
Supabase root-as-native-bucket mapping, and one authoritative target configuration contract.
There is no universal api.Uploads or attachment server containing the Binder source.

The implementation conforms to these records. A need to change their design is escalated to the
CA; ACE does not rewrite architecture as an incidental repair. The records' description of the
complete design does not expand Unit A into Unit B or into the Field Binder feature. No additional
architecture patch is a prerequisite merely because Unit B's implementation is absent.

### 2. Unit A remains a bounded extraction

Unit A uses the current attachment storage binding and provider constructor. Compose
`api.AttachmentsInbox`, `api.AttachmentsServer`, and `api.AttachmentsUploads`, then inject the
attachment Uploads instance into Attachments. Update the Admin drain and direct tests. Preserve
`DOCUMENT_INBOX_DB_NAME`, its configured database value, logical UUIDs, and stored references.
The class's two-pair test uses independent test stores, not a dependency on live Supabase roots.

Only the Unit A source/test files in the original scope table change. No new runtime root key,
provider mapping, provisioning contract, policy, packaging task, or binder API is required by A.
The difference between the current concrete binding and the target Unit B mapping is intentional
unit sequencing, not authority to implement both under one extraction scope.

### 3. Unit B configuration and implementation inventory

Architecture-devops §14 is the authority for the contract and consumer behavior. The following
named paths replace the original inventory's unbounded "affected configuration/session fixtures".
Paths are repository-relative.

| Area                          | Files and bounded changes                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Concrete provider             | `source/core/cli/supabase-docstore-provider.ts`: constructor(client, root), root-relative markers/objects, operations and errors                                                                                                                                                                                                                                                |
| Shared target reader          | New `source/devops/scripts/storage-contract.ts`: validate the per-target contract; expose roots/settings to TypeScript consumers and a non-secret packaging entry point                                                                                                                                                                                                         |
| Target contracts              | `supabase/storage/local.jsonc`, `supabase/storage/stage.jsonc`: stores.attachments root and private size settings; no dev/prod contract creation without target selection                                                                                                                                                                                                       |
| Runtime composition           | `source/front/api/api.ts`, `source/front/config/ux-config.ts`: supply ATTACHMENTS_SERVER_ROOT and its VITE alias to the attachment provider                                                                                                                                                                                                                                     |
| Environment examples          | `source/front/config/app-admin-dev.env.example`, `app-admin-stage.env.example`, `app-admin-prod.env.example`, `app-ops-dev.env.example`, `app-ops-stage.env.example`, `app-ops-prod.env.example`, `app-customer-dev.env.example`, `app-customer-stage.env.example`, `app-customer-prod.env.example`: document contract-supplied roots; do not introduce independent root values |
| Packaging                     | `source/devops/scripts/app-admin-package.sh`, `app-ops-package.sh`, `app-customer-package.sh`: consume target roots before required-key validation and build; reject conflicting env values                                                                                                                                                                                     |
| Provisioning                  | `source/devops/scripts/app-deploy-storage-config.ts` and its `.sh` launcher: provision/read back native roots and restrictions using the target reader                                                                                                                                                                                                                          |
| Reset and usage               | `source/devops/scripts/storage-reset.ts`, `storage-usage.ts`, `storage-utils.ts`: target-root enumeration and paginated traversal, retaining confirmation/credential handling                                                                                                                                                                                                   |
| Policy materialization        | `source/devops/scripts/db-genesis.ts`, `source/back/storage/storage-policies.sql`: resolve named attachment root from the selected contract and apply safely quoted, target-materialized policies                                                                                                                                                                               |
| Provider/live tests           | `source/tests/cases/supabase-docstore-provider-test.ts`, `document-store-stage-test.ts`: root constructor, namespace markers, mapping, caller-session behavior, policy assertions                                                                                                                                                                                               |
| Shared test bootstrap         | `source/tests/config/test-config.ts`, `stage-config.ts`: register/provide the attachment root without requiring live storage for API bootstrap                                                                                                                                                                                                                                  |
| Inline configuration fixtures | `source/tests/cases/attachments-test.ts`, `asset-api-test.ts`, `chemical-api-test.ts`, `customer-api-test.ts`, `service-api-test.ts`, `document-drain-test.ts`, `test-config-test.ts`, `stage-session-test.ts`: supply the configured attachment root where API composition needs it; retain each test's existing subject                                                       |
| New configuration coverage    | `source/tests/cases/storage-contract-test.ts`, `storage-policy-config-test.ts`, `storage-package-config-test.ts`: contract validation, quoted policy materialization, packaging root agreement and conflict/missing-input failures                                                                                                                                              |

In the grouped rows, abbreviated filenames are siblings of the first fully qualified file in that
row. Existing stage-session fixtures and user/session test bodies retain their authentication
meaning; bootstrap configuration is not an excuse to alter identity, grants, or seeded data.
If constructor/import analysis discovers another affected file, ACE names it before expanding scope.
No fixture file is implied to be authorized merely by a directory name.

Unit B explicitly touches locked core/, storage authorization/provisioning, DevOps structure, and
cross-application packaging. Its CA production scope must authorize those boundaries. It does not
change the kernel interface, reference grammar, IndexedDB provider, domain, UX controls, binder
feature, or application scheduling. CONVENTIONS remains a production gate; an actual conflict is
escalated rather than assuming authority to amend governance.

### 4. One configuration authority, three consumers

`supabase/storage/{target}.jsonc` has a stores object. Unit B provisions the attachments entry:

```text
stores.attachments.root           native Supabase Storage bucket id
stores.attachments.fileSizeLimit  positive safe integer byte count
stores.attachments.public         false
```

The selected target contract owns the actual root value. Do not copy the architecture's
illustrative root as an unreviewed deployment choice. Root ids are validated; configured roots are
distinct. A required binding without its contract entry fails before hosted mutation or packaging.
The absent dev/prod contracts remain absent unless the CA selects those targets for provisioning.
Testing those target-failure paths does not require creating hosted resources.

1. **Runtime:** the packaging task supplies `VITE_ATTACHMENTS_SERVER_ROOT` from the contract before
   required-key validation. ux-config aliases it to `ATTACHMENTS_SERVER_ROOT`. It is non-secret;
   no **SECRET** resolution, new Supabase project, or new auth session is involved. Env files do
   not own a competing value. Offline fixtures supply explicit test roots; live stage bootstrap
   uses the selected stage contract value. A supplied mismatch is an error, not a fallback.
2. **Provisioning:** the deployment task creates/updates that native bucket and verifies its id,
   privacy, size limit, and MIME settings. Attachments.namespaces remains the logical catalog;
   it does not enumerate native buckets. Allowed attachment content types come from
   AttachmentFormats.contentTypes(), with provider marker types admitted as specified by §14.
3. **Policies:** db-genesis renders the named root input in storage-policies.sql from that same
   validated contract, using SQL-literal quoting. Preserve attachment role/namespace access intent;
   express logical restrictions against object prefixes rather than treating namespace UUIDs as
   native bucket ids. Verify equality between the packaged root, provisioned id, and policy input.

FieldBinder's independent root, format policy, role grants, local database keys, and route rollout
belong to the Field Binder brief. Unit B neither composes that feature nor invents its grants.
Binder examples in the architecture establish the common fitting, not additional Unit B work.

### 5. Code verification and operational authorization are separate

Unit A's records gap is resolved by the architecture baseline above. ACE rechecks the actual records
and code and presents its Unit A production scope if no other blocker is found. This amendment is
not itself that scope's approval. Unit B receives its own scope and locked-core authorization.

Offline contract, provider, configuration, and policy-materialization tests run without deploying
or resetting anything. Live readback, stage acceptance, deployed-data inventory, physical relocation,
reset, and policy deployment retain explicit target/environment authorization requirements. The
original Unit B data-transition gate remains in force and does not block Unit A.

The architecture files describe the design in present tense. Transition planning, authorization,
ACE findings, and verification results belong to this effort's amendment/records and production
report, not migration commentary added to the architecture. The effort remains active until its
productions are reviewed and independently verified under EFFORT; neither an approved brief nor a
successful Unit A test run closes Unit B.

## Amendment — 2026-11-11 — Core client placement

The CA approved placement of the reusable Uploads class in core/cli. The class supplies client
operations over injected docstore contracts and has no swarmAg/domain, feature, configuration,
scheduling, or UI dependency. Application composition and feature policy remain in front/.

1. **Class location.** Create `source/core/cli/docstore-uploads.ts`, exporting `Uploads`. This
   supersedes `source/front/api/uploads.ts` in the original Unit A scope. Import directly through
   `@core/cli/docstore-uploads.ts`; no front re-export, duplicate implementation, or new barrel.
   The docstore kernel and provider contracts are unchanged.
2. **Responsibility.** The existing Uploads contract and lifecycle preservation rules remain in
   force. Staging UUIDs, classification, placement, fallback, and delivery mechanics belong to the
   core class. Attachment recognition, catalog destinations, and reference rewriting remain in
   Attachments. Field Binder publication and preparation remain feature responsibilities.
3. **Architecture leads this location.** Architecture-core §10.3, The Inbox and Its Drains, names
   the core client capability and its boundaries. Architecture-front §7.2.4, Document Storage,
   names the direct core import and application composition. Neither describes a migration or
   delegates the placement decision to ACE. Back and DevOps root/provisioning policy is unchanged.
4. **Revised Unit A scope.** Create the core file and `source/tests/cases/uploads-test.ts`;
   modify `source/front/api/attachments.ts`, `source/front/api/api.ts`,
   `source/front/app-admin/document-drain.ts`, `source/tests/cases/attachments-test.ts`, and
   `source/tests/cases/document-drain-test.ts`. Update runtime and type imports to the core path.
   If the front upload file exists in an in-progress production, relocate its implementation to
   the core file and remove the front file as part of this revision. Do not retain a compatibility
   shim for a newly introduced, unshipped module.
5. **Locked-core boundary.** Unit A now explicitly crosses into core/ for this new client file.
   This supersedes any Unit A out-of-scope statement excluding all core changes and the earlier
   statement that only the original Unit A paths change. The CA has authorized this placement;
   ACE presents the revised production scope before execution. That scope authorizes no existing
   kernel/provider mutation, governance change, or Unit B work. Unit B retains its separate scope
   and operational gates.
6. **Verification.** Existing Unit A checks and failure/race coverage remain required. Add the
   core file to STYLE_AUDIT. The class has no upward imports into front/, domain/, UX, or DevOps;
   architecture guards verify its dependency direction. Offline two-pair tests demonstrate the
   same behavior through the core import. Code already present in a working tree is inspected
   before relocation; its presence alone is not acceptance or scope expansion.

This amendment changes placement, not the shared contract, feature behavior, physical bindings,
logical addresses, staging identities, or application scheduling. Production authorization and
independent verification remain governed by CONSTITUTION and AGENTS.
