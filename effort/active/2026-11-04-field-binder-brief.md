# Field Binder — Brief

**Active, Foundation completion steps 1–2 authorized; refreshed 2026-11-11.** Roadmap M-6 delivers the Admin
management and reader acceptance; application-specific rollout remains separately scoped.
Foundation mode: feature composition, configuration, storage policy, and preparation lifecycle.
The target design below incorporates the CA decisions recorded during dispatch review.
The CA requested subagent review, review of its findings by ACE, and presentation to the CA.
ACE incorrectly dispatched implementation. The partial working-tree changes were not an accepted production. The CA subsequently authorized
completion and correction (steps 1–2); full verification and independent acceptance remain separate.

## Purpose

The Field Binder is a local, view-only collection of documents needed for onsite work: SDSs,
labels, manuals, and other operational documents. It opens without signal. A record's invoices,
warranties, and purchase paperwork remain attachments on that record's notes.

Admin's Field Binder Manager manages the remote source. The reader and Manager are separate
screens with separate routes and providers. There is no editable-reader flag. List and icon are
presentations of the local collection; Lister does not define the feature's meaning.

## Storage and enabling layers

```text
AttachmentsInbox ── AttachmentsUploads ── AttachmentsServer

FieldBinderInbox ── FieldBinderUploads ── FieldBinderServer
                                                │
                                      application-triggered sync
                                                ▼
                                         FieldBinderStore
                                                │
                                          local reader
```

These are five independently bound docstores, not five object stores inside one database.
Each local inbox and mirror has its own IndexedDB database. Each remote instance has its own
provisioned native Supabase bucket root; its provider maps namespace → bucket → document beneath
that root. Both remote roots can share a Supabase project/client. The attachment catalog does not
organize binder documents.

`Uploads` is the common implementation, instantiated once per upload pair. Every chosen file
enters its pair's inbox durably; a pair's drain delivers to its own server. Binder sync is a
separate source-to-local-copy operation. Ops reads only the local Binder; it does not open source
files remotely. The local store is writable by preparation and read-only to the reader.

Dependencies: `effort/completed/2026-11-11-upload-brief.md` Unit A supplies Uploads; Unit B supplies
root-bound remote docstores. `effort/active/2026-11-10-background-tasks-brief.md` supplies Helm menus
and work visibility. Binder production depends on both Upload units. No binder-specific behavior
belongs in the kernel, concrete provider, Uploads class, Helm widget, or task store.

## Application composition and registration

Shared API composition exposes the independently bound stores and binder services:

- `api.FieldBinderInbox`, `api.FieldBinderServer`, and `api.FieldBinderStore` are docstores.
- `api.FieldBinderUploads` is the binder pair's Uploads instance.
- `api.FieldBinder` supplies local entries, local links, status, and explicit preparation/sync.
- `api.FieldBinderSource` supplies remote inventory reads and Manager mutations.

Every app has access to its own local Binder binding, including Customer Portal. App roots decide
which routes and commands they register. Shared store availability does not itself register a
reader screen, grant remote access, or require an editable mode. Admin registers `/field-binder`
and `/field-binder-manager`; Ops and Portal route/command rollout is outside this production.

Binding keys live in shared `ux-config.ts` with VITE aliases. App environment bindings supply
local database names; the selected target storage contract supplies the remote root:

| Key                          | Binding                                                      |
| ---------------------------- | ------------------------------------------------------------ |
| `FIELD_BINDER_INBOX_DB_NAME` | Binder upload inbox database, distinct from attachment inbox |
| `FIELD_BINDER_DB_NAME`       | Local reader mirror database, distinct from both inboxes     |
| `FIELD_BINDER_SERVER_ROOT`   | Provisioned native Supabase Storage bucket for binder source |

The nine app/target env examples, actual environment-value provisioning, and architecture-front
§9.5.1 are explicit configuration scope. Configuration completeness is not evidence of an
implemented reader route in an app. Do not change secrets while adding these non-secret values.
Local and stage use a private `fieldBinder` root named `swarmag-field-binder`, with a per-file limit
of 52,428,800 bytes (50 MiB). Development and production storage targets are not provisioned here.

## Source organization and references

Within FieldBinderServer, a fixed logical namespace and collection bucket hold files and the
inventory. FieldBinderInbox uses the same destination lineage for placed uploads; FieldBinderStore
preserves source logical identities during sync. These identities are catalog constants belonging
to this feature, not additions to Attachments' catalog. Store-produced identities and id-form
references remain uniform across providers.

The inventory is JSON named `.inventory.json`. Generated local status is `.status.json`. A leading
`.` is reserved for Binder-generated metadata; chosen files with that prefix are rejected with
clear validation copy. Ordinary uploaded names such as `inventory.json` and `status.json` remain
valid. The existing single logical collection bucket is retained; separate Documents/Metadata
buckets and the earlier `$` prefix alternative are not selected.

The inventory shape is:

```ts
export type FieldBinderEntry = Instance & {
  description: string
  url?: string
  documentAddress: string
  createdAt: When
  updatedAt: When
}
export type FieldBinderInventories = {
  schemaVersion: 1
  entries: readonly FieldBinderEntry[]
}
```

`documentAddress` is a complete id-form docstore address, parsed through DocumentAddresses.
Entry id survives file replacement. Description is inventory metadata, never a document rename;
filename remains the uploaded file's name. URL is optional HTTP/HTTPS source metadata.

The inventory document's logical identity identifies a publication. There is no independent
mutable version counter. Validate schema, addresses, unique entry ids, descriptions, timestamps,
and URLs at the API boundary; missing, malformed, and unknown-version inventories are distinct.
Published references define membership. Pending uploads and superseded source files never appear
as current entries merely because they are present in the source root.

Names are not unique in the docstore. Resolve inventory candidates explicitly by metadata creation
time and document UUID as tie-breaker; capture the selected inventory bytes before copying files.
Do not rely on listing order or use ambiguous name resolution. The local reader selects its inventory
through the local status document described below, not by
comparing source timestamps with timestamps manufactured during local copying.

## Field Binder Manager

Admin manages the source: Add stages a chosen file, edits description and optional source URL,
then saves an inventory entry. Edit changes metadata or replaces the file under the same entry id.
Remove confirms and removes the inventory reference. Existing AttachmentFormats supplies accepted
file formats, extension recognition, declared stored content types, picker tokens, and provisioning
content types. Binder consumes that established policy without a duplicate format wrapper or a
new document-only restriction. Binder alone rejects chosen names with its reserved leading dot.

Initial presentation: stock Manager, one Detail step with Choose File, Description, and
UrlField. Row actions include source Open and confirmed Remove. Description is required, initially
suggested from filename without overwriting user-entered text. File is required on Add, optional
on edit. Standard pending locks, validation, dirty checks, and editor Close behavior apply.

Choose File uses FieldBinderUploads.stage immediately. The editor owns its staged selections,
including completions after Close. Placement retains staging. Cancel before a write attempt can
discard that editor's selections; once a write may reference them, retain them for recovery.
Files remain durable independently of unsaved editor text; durable draft restoration is not promised.

### Publication and Save

Upload delivery, inventory publication, and local preparation are distinct operations. Manager
Save does not modify the local reader or silently sync it. Binder consumes its own existing
Uploads instance; no upload abstraction, new transaction engine, or conflict-resolution subsystem
is introduced. Save follows this publication sequence:

1. Place staged files in FieldBinderInbox through the binder Uploads instance. Retain entry ids
   and staged references for retries; never create a second entry merely because delivery retries.
2. Deliver and verify required files on FieldBinderServer. A partial aggregate drain failure can
   coexist with this entry's successful delivery; verify the required documents rather than
   equating an unrelated failure with this file's absence.
3. Compare the current source inventory with the edit baseline and reject a known stale edit.
4. Create a complete new inventory on FieldBinderServer. This generated JSON metadata is not a
   chosen-file upload. Save succeeds after confirmed publication. Remove older inventories after
   creation; cleanup failure does not undo publication or authorize deletion of the new inventory.
5. Keep superseded files available to preparations that already captured an older inventory.
   Remote reclamation has its own policy and is outside this production.

Save requires signal and delivery. Closing the browser mid-Save can leave durable unreferenced
bytes without a published entry; its unsaved description is not a durable draft. An uncertain
inventory creation can produce a false stale-baseline conflict on retry. This first-version policy
accepts reload/reconciliation rather than reserved publication UUID and transaction-recovery
machinery. Duplicate valid inventory publications are tolerated and resolved by the explicit
candidate ordering rule. No atomic compare-and-swap or multi-writer transaction is implied.

Inventory publication belongs to Binder. Upload staging, placement, delivery, discard, and retry
mechanics are supplied by the already-extracted Uploads class.

## Local reader and preparation

The reader uses only FieldBinderStore. Activate mints a local link and opens the local document.
A source URL never substitutes for a missing local file. No local inventory means Not downloaded;
a complete published empty inventory is a valid empty Binder.

Preparation is a feature boundary like preparing a job clone: the reader sees a complete local
collection or its previous complete collection, never a partly copied replacement.

1. Capture and validate a source inventory and its publication identity.
2. Obtain every referenced document, preserving logical identities, filenames, types, and bytes.
   Retain the previous local inventory and its referenced files during preparation.
3. Verify completeness, then copy the captured inventory into the local store at its source
   logical identity. If any file is unavailable, preparation fails and the previous Binder remains
   available. Failed first preparation remains Not downloaded even if some bytes have arrived.
4. Create a local `.status.json` document holding the prepared inventory's id-form address, the
   source publication identity, and successful-sync time. This immutable status creation is the
   local reader's commit point. Status is local metadata, excluded from upload and source sync.
   Resolve status candidates by local creation time with UUID tie-breaker. The latest valid
   status selects one inventory; validate that inventory and every referenced file on reload.
   Before any status exists, the reader remains Not downloaded. A failed write retains the prior
   status; an uncertain successful write is discoverable through ordinary candidate selection.
5. Clean superseded status documents first, then inventories not referenced by any retained
   status, then files not referenced by any retained inventory. Never delete recovery metadata
   before the new status is confirmed. Retry incomplete cleanup safely; extra bytes do not make
   a complete snapshot incomplete.
6. Recheck the source publication. A change during copying means the local Binder is a complete
   older snapshot with an update available; do not chase an unbounded stream of source changes.

Serialize preparation per origin with a Web Lock and suppress duplicate invocation. Use existing
provider operations; no multi-operation transaction or kernel snapshot API is assumed. The
status document is the authoritative local snapshot selector. Exercise interrupted commit/reload
in tests before claiming acceptance. A matching source identity alone does not prove
that all its referenced local bytes exist.

Applications decide when preparation runs. Admin offers explicit Sync in Helm. Ops startup/retry
policy belongs to its app scope. Offline status can say Available offline and show last verification;
it cannot assert that the source remains unchanged without contacting it. Report Not downloaded,
Syncing, Verified current at a stated time, Update available, and Last sync failed as appropriate.

Initial reader presentation is Lister, with description, source host or Uploaded, and copy
time. Its provider and local entries are independent of presentation; an icon view requires no
storage redesign. Icon presentation is outside this production. Archetypal search/filter stays
with P-13 and introduces no Binder dispatch decision.

## Helm and access

A backpack button opens a command popover. Admin supplies Manager, Binder, Sync, and a status line.
Reader-only registrations supply Binder, Sync, and status. Route items navigate; Sync calls the app's
bound preparation command. Shared UI never imports binder APIs.

Management is available in Admin. Storage policies grant source read to active, undeleted users
holding administrator, sales, or operations; source mutation requires administrator. Customer-only
users receive no source access. Grants follow role membership: a sales user also holding
administrator can manage through that authority. Root and namespace grants cover required markers
as well as files. Local store availability does not grant remote access.

The broader app-entry/capability model belongs to
[Access Model](../pending/2026-10-10-access-model-brief.md), not this feature. Binder adds no
feature-local role framework or route guards. Admin registers Manager and reader; Ops/Portal
route and command rollout remains separate.

## Production scope

Implementation paths below are relative to `source/` unless stated otherwise. Documentation
leads code: update this brief and the applicable Binder sections in architecture-core/front/back/
devops. Architecture records describe the design in present tense; dispatch and verification
history remain here.

| Area                                   | Files                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API                                    | New `front/api/field-binder.ts`, `field-binder-source.ts`, `field-binder-inventory.ts`; modify `front/api/api.ts`                                                                                                                                                                                                                                               |
| Reader                                 | New `front/app/shell/field-binder.tsx`, `field-binder.css`                                                                                                                                                                                                                                                                                                      |
| Manager                                | New `front/app-admin/field-binder/field-binder-manager.tsx`, `field-binder-step-detail.tsx`, `field-binder-state.ts`                                                                                                                                                                                                                                            |
| Admin composition                      | `front/app-admin/app.tsx`, `dashboard-admin.json`; reader/Manager routes and Backpack Manager/Binder/Sync/status bindings                                                                                                                                                                                                                                       |
| Configuration                          | `front/config/ux-config.ts`; all nine `app-{admin,ops,customer}-{dev,stage,prod}.env.example` files; existing `app-{admin,ops,customer}-stage.env` files, non-secret Binder database entries only                                                                                                                                                               |
| Target contracts (repository-relative) | `supabase/storage/local.jsonc`, `supabase/storage/stage.jsonc`                                                                                                                                                                                                                                                                                                  |
| Build/provisioning code                | `devops/scripts/storage-contract.ts`, `app-deploy-storage-config.ts`, `app-admin-package.sh`, `app-ops-package.sh`, `app-customer-package.sh`, `app-local.sh`, `back/storage/storage-policies.sql`                                                                                                                                                              |
| New tests                              | `tests/cases/field-binder-test.ts`, `field-binder-inventory-test.ts`, `field-binder-state-test.ts`, `field-binder-browser-test.ts`                                                                                                                                                                                                                              |
| Existing tests                         | `tests/cases/storage-contract-test.ts`, `storage-package-config-test.ts`, `storage-policy-config-test.ts`; `tests/config/test-config.ts`; configuration fixtures in `asset-api-test.ts`, `chemical-api-test.ts`, `customer-api-test.ts`, `service-api-test.ts`, `document-drain-test.ts`, `stage-session-test.ts`, `test-config-test.ts`, `attachments-test.ts` |

The generic reset/genesis code already consumes target contracts; no new reset mechanism is
introduced. Attachment DocumentDrain remains unchanged except for its test's API configuration
fixture. No new Binder loop is added to it. No deletions are planned. Extra files, kernel/provider
or locked UX changes, new persistence machinery, broader access-model changes, or unselected
physical target values require escalation before production.

The CA explicitly authorized implementation and correction steps 1–2 within this boundary after
clarifying the earlier review-only delegation. Full verification and independent review (step 3)
remain separate. Routine test and DevOps decisions within architecture and conventions belong to
ACE; the CA reviews architectural departures and operational impact at a high level. Actual
provisioning, policy application, reset, deployment, and live grants testing require an explicit
target directive. No such action has been performed.

Out of scope: attachment catalog/semantics, additional provider/kernel changes beyond the Upload
prerequisite, locked UX extensions, source fetching, automatic chemical import, Ops/Portal route
rollout, icon presentation, durable editor drafts, and remote
reclamation. Record deferred work in the backlog before closing the effort.

## Dispatch decisions and acceptance

Presentation, upload mechanism, existing document formats, source grants, local/stage target
values, and Admin-only route rollout are settled. Inventory references define membership; the
existing create-then-clean sequence supplies publication with no CAS or transaction-recovery
framework. Source-file reclamation remains outside scope. Local status creation selects only a
complete prepared snapshot.

Tests cover pair isolation, durable capture and Close races, metadata-only edit, replacement,
removal, partial delivery, publication timeout/retry, concurrent-baseline change, duplicate inventory
names, reserved dot-prefix rejection with ordinary inventory.json/status.json uploads allowed,
invalid versions/addresses, empty/missing inventories, and interrupted preparation/commit/
cleanup/reload. Test that a source inventory with missing files cannot expose an incomplete Binder.
CA verifies independent Manager/reader routes, actual uploads and explicit sync, then opens the
local Binder with network disabled. A successful Manager save is not evidence of local preparation.

Run `deno task check`, `deno task fmt:check`, `deno task test` excluding `users-api-test.ts` and
`session-coordinator-test.ts`, and STYLE_AUDIT. Live grants/provisioning tests require their separate
environment and authorization. Consumer verification checks Lister on screen when it is selected.

## Records

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
- **2026-11-04, need, not obligation.** Assets have documents of different lifecycles: a manual the
  crew works from, and records of the purchase. Obligation admitted the SDS and the label but left
  the manual to the browser's cache. The binder became any document day-to-day onsite operations
  require; an entry's URL became optional, for the manual that came in the box; and the binder
  became a first-class feature with its own Admin workbench.
- **2026-11-04, a brief of its own.** The document storage policy brief, recorded 2026-10-31, held
  the whole policy; its attachments, upload, and server parts were folded into M-6's briefs, and it
  was re-scoped to the Field Binder.
- **2026-11-10, presence, not a table.** The `FieldBinder` table and the binder's version were
  withdrawn: presence in the namespace is membership, and the set of document ids is the version.
  What presence cannot hold, each entry's description and source, is a JSON inventory in the
  binder; markdown was considered, but JSON parses for free and the app renders it for people. An
  entry gained its own id, stable across refreshes, so a refresh is an update. Admin mirrors the
  binder too, for its onsite assessors and to prove the sync before Ops.
- **2026-11-10, the workbench.** "Add from chemicals" was first a collection action, adding every
  chemical document not already in the binder. It was withdrawn: the binder's documents arrive one
  at a time, and the only bulk is the sync.
- **2026-11-11, upload, not fetch.** The server fetch, the binder's last open question, was
  withdrawn: a source's site rarely lets a browser read its bytes, and an edge function to read
  them is an open fetch to guard. A person's browser reaches every source, so a URL is copied by
  Open, the viewer's download, and Choose File, and the binder has one way in, the same as every
  document. The fetch's failure state went with it. A fetch can return later as another way to
  stage a file, without changing the binder.
- **2026-11-11, one Field Binder.** With upload the only way in, an entry no longer needed a Detail
  of its own: the `Manager` workbench and its Source toggle (URL, Upload, Chemical) were withdrawn,
  and the viewer, a `Lister`, became the Field Binder, editable where an app makes it so.
- **2026-11-11, straight to the server.** Taking the binder through `Attachments`' staging and
  drain, and then an Uploads enabler split from `Attachments`, was considered and withdrawn: the
  binder is not attachments, and managing it needs signal, so it writes to `DocumentServer`
  directly.

- **2026-11-11, reader and Manager separated by the CA.** The local Field Binder is view-only;
  Admin manages the remote source. The editable-Lister premise and its extension question are
  withdrawn. List and icon are presentations of the reader, not definitions of the feature.
- **2026-11-11, durable upload shared.** Direct-server-only file handling is withdrawn. The Upload
  brief extracts the proven lifecycle; attachment references and inventory references are its
  consumers. Application-specific sync remains separate from upload.
- **2026-11-11, publication recommendation for dispatch review.** Inventory references define a
  published snapshot, replacing mere directory presence as membership. Proposed retention and
  concurrency limits are explicit CA decisions, not silently assumed guarantees.

- **2026-11-11 — Independent upload pairs settled.** Field Binder Source is its own remote
  docstore binding, not a namespace inside the attachment DocumentServer. Both features use the
  same Uploads class over separate inbox/server pairs. The local reader mirror is a fifth store.
- **2026-11-11 — Concrete root settled.** Supabase's provider binds a native Storage bucket root
  and implements logical namespaces, buckets, and documents beneath it. Physical mapping belongs
  to the provider; roots do not enter the logical reference grammar. S3 is outside current scope.
- **2026-11-11 — Preparation boundary settled.** The CA identified complete Binder preparation,
  analogous to job cloning, as the feature boundary preventing partial-reader exposure. This is
  not a distributed transaction requirement imposed on Uploads. Reader writes occur only through
  preparation/sync, not through an editable viewer mode.
- **2026-11-11 — All-app local availability settled.** Each app has a local Binder binding.
  App-root registration controls screens/commands; exact remote grants and app rollout remain
  separate decisions. The earlier assumption that Customer cannot even compose a binder is removed.
- **2026-11-11 — Review recommendations retained for decision.** Entry references use id-form
  addresses and Instance identity. Simpler create-then-clean inventory publication is proposed;
  membership, concurrency, retained-file cleanup, viewer filtering, and role grants require explicit
  dispatch decisions. The detailed uncertain-publication recovery recommendation is not mandatory.

- **2026-11-11 — Archetypal search and filtering remain separate.** The CA removed viewer filtering
  from Binder's dispatch decisions and feature scope. General Collection/Index search and filtering
  are already tracked in [P-13](../project/project-parking-lot.md#p-13--how-should-the-collection-and-index-archetypes-support-large-datasets).
  Binder does not introduce a separate implementation or another delivery/deferment decision.

- **2026-11-11 — Dispatch review settled by the CA.** The established Manager/Detail and Lister
  presentations were confirmed rather than redesigned. Search/filter remains in P-13. Uploads was
  already extracted for independent consumers; Binder consumes its own instance. The CA rejected
  added upload/concurrency machinery and a proposed PDF-only restriction. The existing document
  policy applies. Active staff may read source; administrator authority is required for mutations,
  with the broader Access Model effort remaining separate. The CA selected private local/stage root
  `swarmag-field-binder`, 50 MiB per file. Source scope includes existing packaging/target-contract
  consumers and exact API fixture updates. The CA directed preparing dispatch, delegating production
  to another agent, and independently reviewing its output. Root owns governing-document alignment
  and review; the implementation agent owns the scoped source/configuration/test production.

- **2026-11-11 — Dispatch fixture inventory completed.** The implementation dependency review
  found that attachments-test.ts imports the shared API indirectly through the existing attachment
  save delegate. Its configuration fixture also receives the three Binder keys. uploads-test.ts
  was checked and has no such dependency, so it remains unchanged. This is API-bootstrap configuration compatibility; attachment and Uploads behavior is
  unchanged. Independent review also requires all packaging scripts to validate target-owned roots
  after loading app environment values, preventing an environment file from overwriting a checked
  root. App-local already follows that ordering.

- **2026-11-11 — Reader placement directed by the CA.** The shared Field Binder reader and
  colocated CSS live in `front/app/shell/field-binder.tsx` and `field-binder.css`. The Admin Manager
  remains in `front/app-admin/field-binder/`. This supersedes the earlier app-root reader path.

- **2026-11-11 — Review delegation and production boundary corrected by the CA.** The requested
  workflow was subagent review, ACE review of that review, then presentation to the CA. ACE instead
  assigned implementation and introduced incomplete UI/service dependencies. Earlier claims in
  this brief that the delegation directive authorized source production were ACE's incorrect
  interpretation and are superseded by this record. All source production was stopped. Existing
  uncommitted changes remain intact for review; no rollback, commit, hosted provisioning, policy
  application, or deployment was performed. Completing the partial work requires an explicit
  production directive after the consolidated review and bounded scope are presented.

- **2026-11-11 — Configuration and test/DevOps review decisions.** The CA accepted the three
  Binder keys and aliases in ux-config.ts as consistent with Config. Core Config and providers
  were not changed. Review found that all three packaging scripts previously loaded app env values
  after validating storage roots; the implementation agent moved env loading before root checks.
  A second agent independently inspected the correction, checked shell syntax, and ran focused
  configuration tests. Eight shell cases also exercised inherited/env-file root conflicts. ACE's
  review accepts that correction. An unrelated change to the attachment test-root fallback string
  is unnecessary and is to be removed within a future authorized completion. The CA directed that
  routine test/DevOps implementation and verification remain ACE's responsibility under architecture
  and conventions, with CA involvement at the architectural/operational level.

- **2026-11-11 — Timestamp ordering review resolved.** The existing When validator accepts both
  seconds-only and millisecond timestamps. Lexicographic comparison could misorder equivalent
  or adjacent instants. The implementation agent changed entry timestamp ordering and publication
  candidate comparison to parsed numeric times, retaining UUID tie-breaking. The focused test
  includes mixed precision and passed. This is a local correctness correction, not a new timestamp
  contract or an architectural decision for the CA.

- **2026-11-11 — Reserved metadata names approved by the CA.** Review identified a collision
  between uploaded inventory.json/status.json documents and generated metadata selected by name.
  The CA selected a reserved prefix in the existing collection bucket rather than adding logical
  buckets. A `$` prefix was considered, then replaced by the approved leading `.` convention:
  `.inventory.json` and `.status.json`. All chosen filenames beginning with `.` are reserved and
  rejected with clear copy. Other filenames retain their uploaded names and existing document
  formats. This resolves the design issue; prefix enforcement, generated names, and regression
  coverage are not yet implemented. Approval of this decision did not resume source production.

## Consolidated review and proposed completion — 2026-11-11

The second agent performed a read-only follow-up and ACE reviewed its report against the files.
This is review of a partial working tree, not production acceptance or permission to resume code.

| Finding                              | Reviewed disposition                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Packaging env-file override          | Corrected in all three package scripts; independently inspected and shell-tested. Retain the correction.                                                                 |
| Mixed-precision timestamps           | Numeric comparison plus UUID tie-breaker is implemented and regression-tested. Retain it.                                                                                |
| ux-config Binder registration        | The CA accepts the three required keys and aliases under the existing Config pattern. Core Config/providers remain unchanged.                                            |
| Metadata filename collision          | Design resolved by the approved reserved dot prefix in one bucket. Enforcement and generated names remain unimplemented.                                                 |
| Attachment test fallback drift       | Restore the established offline-attachments default in tests/config/test-config.ts; keep only necessary Binder fixture additions.                                        |
| Source URL pending lock              | Source URL remains editable while Save is busy. Correct interaction locking locally in field-binder-step-detail.tsx; no shared UrlField or UX contract change is needed. |
| Missing feature services/composition | Complete only the already-named source/local services, API wiring, Admin registration, policies, and acceptance tests.                                                   |

Independent and ACE verification: focused inventory/storage-contract/package tests pass (five
passed, one opt-in shell test ignored). The implementation agent previously ran eight shell conflict
cases successfully. ACE reran full source type checking: it fails with exactly three errors,
covering the absent field-binder-source.ts module and missing api.FieldBinderSource/api.FieldBinder.
The incomplete source/local services, routes, grants, and real offline preparation are not claimed
as verified by those focused tests.

Proposed Foundation completion stays inside the existing file inventory above:

1. Finish field-binder-source.ts and field-binder.ts over the existing injected stores and Uploads.
   Add catalog constants and feature-lineage checks in the existing inventory module. Use
   .inventory.json/.status.json, reject chosen leading-dot names, preserve ordinary filenames,
   keep publication cleanup from deleting newer candidates, and verify bytes before local commit.
2. Compose the Binder stores/Uploads/services in api.ts and connect the existing Manager/state/
   Step/reader. Fix pending interaction locally. Keep the reader in front/app/shell/.
3. Register Admin reader/Manager routes and Backpack Manager/Binder/Sync/status through existing
   Helm bindings and operation-owned task reporting. Leave attachment scheduling and Ops/Portal
   routes unchanged.
4. Add the agreed Binder storage grants to the existing policy template. Keep target roots,
   configuration, packaging, and pure format policy within the architecture. Remove the unrelated
   test default change. No hosted operation is included.
5. Complete the already-named inventory, store lifecycle, editor-state, browser, and storage-policy
   tests. Run required checks/formatting/permitted suite and STYLE_AUDIT. Independently review the
   finished artifact before presenting it as a complete production.

No additional files, core/provider or locked UX changes, broad access-model work, or new transaction
framework appear necessary. Actual provisioning, policy application, resets, deployment, and live
role verification remain outside this completion scope. Current work is not ready for acceptance;
source production was paused at that review checkpoint, before the explicit steps 1–2 directive below.

- **2026-11-11 — Foundation completion steps 1–2 explicitly authorized.** After the read-only
  review, the CA directed "Proceed with 1 & 2": finish Binder source/local preparation, API wiring,
  Manager/reader/Backpack and agreed storage grants; correct reserved filenames, pending locks,
  duplicate format policy and unrelated attachment test-default drift. ACE performs production
  directly. This authorizes the already-named implementation paths and removal of the unaccepted
  field-binder-formats.ts wrapper. It does not dispatch the separate full verification/independent
  review stage, hosted operations, or changes to Attachments/Uploads/Config internals/locked UX.
  Necessary compilation, formatting, guard and lint checks keep the implemented source coherent;
  remaining acceptance is reported explicitly rather than inferred from those checks.

## Production record — 2026-11-11 — Authorized steps 1–2

**Foundation implementation/correction performed directly by ACE. Step 3 remains unperformed.**
The explicit CA directive was "Proceed with 1 & 2". No implementation subagent was restarted.
This record supersedes earlier paused-state descriptions for the named source completion only;
it does not claim completed independent review, full verification, or CA acceptance.

### Delivered behavior

- api.ts composes independent FieldBinderInbox/Server/Uploads/Store and source/local services.
  `api.FieldBinder.sync()` performs explicit preparation; `api.FieldBinderSource` owns source
  inventory operations. Attachments and the existing Uploads class are unchanged.
- The source service consumes AttachmentFormats directly and Uploads for capture/place/drain/
  discard. The unaccepted Binder format wrapper and its document-only restriction are removed.
  Chosen leading-dot filenames are rejected; ordinary inventory.json/status.json remain valid.
- Feature catalog constants own one logical namespace/collection and .inventory.json/.status.json.
  Inventory references are checked against that lineage. Source Save verifies its required file
  independently of unrelated aggregate drain failures, publishes the inventory, and keeps source
  files retained. Cleanup warnings remain observable without undoing confirmed publication.
- The local service captures one publication, copies and verifies files, creates local status as
  the commit point, and performs reference-aware cleanup under an origin Web Lock. Load/open use
  only local bytes. Failed preparation retains the previous complete Binder; opening that Binder
  does not erase a prior Sync failure. Duplicate in-instance Sync calls share the pending pass.
- Admin registers separate Manager/reader routes and Backpack Manager/Binder/Sync/status using
  existing Helm bindings. Sync owns its progress/failure report. The reader stays in app/shell.
  The Detail form is inert during Save, including the Source URL. A missing source inventory is
  an empty Manager query result, not an undefined TanStack query result.
- Binder grants are in the existing policy template: active administrator/sales/operations read;
  active administrator mutation. Marker grants follow the fixed feature namespace. These policies
  have not been applied to a server. Attachment policies retain their existing grants.
- The established attachment test fallback is restored; required Binder fixture keys remain.
  Config internals and providers, locked UX, attachment scheduling, and Ops/Portal routes are
  unchanged. Native roots and local database configuration follow the existing architecture.

### Artifact inventory

This inventory is the resulting uncommitted Binder diff against HEAD, including the earlier partial
work now retained/corrected. Created:

- `source/front/api/field-binder-inventory.ts`
- `source/front/api/field-binder-source.ts`
- `source/front/api/field-binder.ts`
- `source/front/app-admin/field-binder/field-binder-manager.tsx`
- `source/front/app-admin/field-binder/field-binder-state.ts`
- `source/front/app-admin/field-binder/field-binder-step-detail.tsx`
- `source/front/app/shell/field-binder.css`
- `source/front/app/shell/field-binder.tsx`
- `source/tests/cases/field-binder-inventory-test.ts`

Modified:

- `documentation/architecture/architecture-back.md`
- `documentation/architecture/architecture-core.md`
- `documentation/architecture/architecture-devops.md`
- `documentation/architecture/architecture-front.md`
- `effort/active/2026-11-04-field-binder-brief.md`
- `source/back/storage/storage-policies.sql`
- `source/devops/scripts/app-admin-package.sh`
- `source/devops/scripts/app-customer-package.sh`
- `source/devops/scripts/app-deploy-storage-config.ts`
- `source/devops/scripts/app-local.sh`
- `source/devops/scripts/app-ops-package.sh`
- `source/devops/scripts/storage-contract.ts`
- `source/front/api/api.ts`
- `source/front/app-admin/app.tsx`
- `source/front/app-admin/dashboard-admin.json`
- `source/front/config/app-admin-dev.env.example`
- `source/front/config/app-admin-prod.env.example`
- `source/front/config/app-admin-stage.env.example`
- `source/front/config/app-customer-dev.env.example`
- `source/front/config/app-customer-prod.env.example`
- `source/front/config/app-customer-stage.env.example`
- `source/front/config/app-ops-dev.env.example`
- `source/front/config/app-ops-prod.env.example`
- `source/front/config/app-ops-stage.env.example`
- `source/front/config/ux-config.ts`
- `source/tests/cases/asset-api-test.ts`
- `source/tests/cases/attachments-test.ts`
- `source/tests/cases/chemical-api-test.ts`
- `source/tests/cases/customer-api-test.ts`
- `source/tests/cases/document-drain-test.ts`
- `source/tests/cases/service-api-test.ts`
- `source/tests/cases/stage-session-test.ts`
- `source/tests/cases/storage-contract-test.ts`
- `source/tests/cases/storage-package-config-test.ts`
- `source/tests/cases/storage-policy-config-test.ts`
- `source/tests/cases/test-config-test.ts`
- `source/tests/config/test-config.ts`
- `supabase/storage/local.jsonc`
- `supabase/storage/stage.jsonc`

The three ignored app-{admin,ops,customer}-stage.env files retain the non-secret Binder database
entries from the earlier partial work. No secret values were changed or recorded. Removed:
`source/front/api/field-binder-formats.ts`, an untracked wrapper introduced during that partial
work; it was never part of HEAD. No tracked file was deleted.

### Checks and limits

- `deno task check`: PASS — source guards, complete source type checking, and lint (340 files).
  The three previously missing module/API errors are resolved.
- `deno task fmt:check`: PASS, with the final brief record also formatted/checked separately.
- Focused inventory/storage-contract/package/policy tests: PASS — five passed, zero failed,
  one opt-in shell execution test ignored. The stale missing-Binder policy assertion is corrected
  and the attachment namespace expectations remain covered. The obsolete duplicate format-policy
  test was removed along with that rejected wrapper.
- Basic isolated smoke over the real services, DocumentStore, Uploads and fake IndexedDB: PASS.
  It exercises capture, declared content types including JPEG, reserved-name rejection, ordinary
  inventory.json upload, source publication, explicit local Sync/Open, failed-sync preservation
  and retry, removal without implicit local change, and a valid prepared empty collection. It is
  a basic implementation check with a stubbed Web Lock, not cross-tab/browser acceptance. Its
  initial harness omitted browser storage APIs; the harness was corrected without altering Config
  or providers. The temporary smoke file is outside project assets.
- `git diff --check`: PASS.
- `STYLE_AUDIT: PASS` — current TypeScript/TSX/CSS/SQL changes audited for module headers/public
  members, import direction, naming, validation, private state, existing control composition,
  design tokens, and formatting; scoped shell/config changes retain their established patterns.

No known compilation, lint, guard, focused-test, or basic-smoke failures remain. The full permitted
unit suite, exhaustive interrupted-write/concurrency/editor lifecycle coverage, actual browser
interaction/offline verification, and independent review of this completed implementation belong
to step 3 and have not been performed for this artifact. users-api-test.ts and
session-coordinator-test.ts remain excluded when that suite is dispatched. No live role/grant test,
provisioning, policy application, reset, deployment, commit, or general access-model work was done.
CA acceptance and effort closure remain outstanding; this is not a production-complete claim.
