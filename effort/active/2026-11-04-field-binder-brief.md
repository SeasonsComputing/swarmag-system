# Field Binder — Brief

**Active, draft for dispatch review; refreshed 2026-11-11.** Roadmap M-6 delivers the Admin
management and reader acceptance; application-specific rollout remains separately scoped.
Foundation mode: feature composition, configuration, storage policy, and preparation lifecycle.
The target design is below; outstanding CA decisions are isolated in Dispatch decisions.

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

Binding keys in shared `ux-config.ts`, with VITE aliases and values in each app's env bindings:

| Key                          | Binding                                                      |
| ---------------------------- | ------------------------------------------------------------ |
| `FIELD_BINDER_INBOX_DB_NAME` | Binder upload inbox database, distinct from attachment inbox |
| `FIELD_BINDER_DB_NAME`       | Local reader mirror database, distinct from both inboxes     |
| `FIELD_BINDER_SERVER_ROOT`   | Provisioned native Supabase Storage bucket for binder source |

The nine app/target env examples, actual environment-value provisioning, and architecture-front
§9.5.1 are explicit configuration scope. Configuration completeness is not evidence of an
implemented reader route in an app. Do not change secrets while adding these non-secret values.

## Source organization and references

Within FieldBinderServer, a fixed logical namespace and collection bucket hold files and the
inventory. FieldBinderInbox uses the same destination lineage for placed uploads; FieldBinderStore
preserves source logical identities during sync. These identities are catalog constants belonging
to this feature, not additions to Attachments' catalog. Store-produced identities and id-form
references remain uniform across providers.

The inventory is JSON named `inventory.json`:

```ts
export type FieldBinderEntry = Instance & {
  description: string
  url?: string
  documentAddress: string
  createdAt: When
  updatedAt: When
}
export type FieldBinderInventory = {
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
Remove confirms and removes the inventory reference. Accepted file formats and stored content types
are explicit feature policy, independent of attachment kinds; reuse recognition only where the
accepted formats actually agree.

Proposed initial presentation: stock Manager, one Detail step with Choose File, Description, and
UrlField. Row actions include source Open and confirmed Remove. Description is required, initially
suggested from filename without overwriting user-entered text. File is required on Add, optional
on edit. Standard pending locks, validation, dirty checks, and editor Close behavior apply.

Choose File uses FieldBinderUploads.stage immediately. The editor owns its staged selections,
including completions after Close. Placement retains staging. Cancel before a write attempt can
discard that editor's selections; once a write may reference them, retain them for recovery.
Files remain durable independently of unsaved editor text; durable draft restoration is not promised.

### Publication and Save

Upload delivery, inventory publication, and local preparation are distinct operations. Manager
Save does not modify the local reader or silently sync it. The proposed publication policy is:

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

This publication policy is a recommendation pending CA approval, not a condition imposed by Uploads.

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
4. Create a local `status.json` document holding the prepared inventory's id-form address, the
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

Proposed initial reader presentation is Lister, with description, source host or Uploaded, and copy
time. Its provider and local entries are independent of presentation; an icon view requires no
storage redesign. Viewer filtering belongs to application UI, not domain Facet. Initial list/icon
choice and filtering delivery/deferment are explicit dispatch decisions, not hidden Lister changes.

## Helm and access

A backpack button opens a command popover. Admin supplies Manager, Binder, Sync, and a status line.
Reader-only registrations supply Binder, Sync, and status. Route items navigate; Sync calls the app's
bound preparation command. Shared UI never imports binder APIs.

Management is available in Admin. Exact role grants are a CA security decision: propose source
read for authorized binder readers and source mutation only for authorized Admin managers. Resolve
the actual role predicates before policy implementation; app identity/menu visibility is not a
security principal. Availability of a local binding in all apps does not grant every remote role
unconditional source access.

## Production scope

All implementation paths are under `source/`.

| Area              | Files                                                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| API               | New `front/api/field-binder.ts`, `field-binder-inventory.ts`; modify `front/api/api.ts`                                                   |
| Reader            | New `front/app/field-binder.tsx`; colocated `field-binder.css` for approved app-local composition                                         |
| Manager           | New `front/app-admin/field-binder/field-binder-manager.tsx`, `field-binder-step-detail.tsx`, `field-binder-state.ts`                      |
| Admin composition | `front/app-admin/app.tsx`, `dashboard-admin.json`, and attachment drain integration only where binder pair scheduling is explicitly bound |
| Configuration     | `front/config/ux-config.ts`, the nine app/target `.env.example` files, and non-secret environment bindings                                |
| Provisioning      | `devops/scripts/app-deploy-storage-config.ts`, `storage-reset.ts`, `back/storage/storage-policies.sql`: binder native root and grants     |
| Tests             | New `tests/cases/field-binder-test.ts`, `field-binder-inventory-test.ts`; configuration and storage-policy integration coverage           |

Confirm architecture-core §10.2–10.4, architecture-front §7.2.4/§9.5.1 and app registration records,
architecture-back policies, and devops root/config records before code. Existing in-progress
architecture edits need reconciliation with this design; they are not approval of a shared server
root. Production scope names actual environment/fixture files before approval. No code scope implies
permission to reset data or deploy policies.

Out of scope: attachment catalog/semantics, additional provider/kernel changes beyond the Upload
prerequisite, locked UX extensions, source fetching, automatic chemical import, Ops/Portal route
rollout, icon/filter implementation without dispatch approval, durable editor drafts, and remote
reclamation. Record deferred work in the backlog before closing the effort.

## Dispatch decisions and acceptance

CA settles: initial Manager/Lister presentation, viewer filtering delivery/deferment, inventory
membership/publication/retention policy, concurrent-writer limitation, exact remote grants, and app
rollout. The root-bound pairs and local-only reader/preparation boundary are settled.

Tests cover pair isolation, durable capture and Close races, metadata-only edit, replacement,
removal, partial delivery, publication timeout/retry, concurrent-baseline change, duplicate inventory
names, invalid versions/addresses, empty/missing inventories, and interrupted preparation/commit/
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
