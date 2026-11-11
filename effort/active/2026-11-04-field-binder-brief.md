# Field Binder — Brief

**Active, draft for CA dispatch review; revised 2026-11-11.** Recorded 2026-11-04; chosen from
roadmap M-6 on 2026-11-10. This revision follows the CA's separation of remote management from the
local Field Binder. It supersedes the draft's editable-Lister and direct-server-upload designs.
Production is not dispatched. Foundation mode: storage policy, shared API, and architecture records.

## Purpose

The Field Binder is the view-only local collection of documents needed for day-to-day onsite
operations: SDSs, labels, manuals, and other working documents. It opens without signal. An
asset's invoice, warranty, or seller's order remains an attachment on that record's notes.

Admin's **Field Binder Manager** manages the remote source collection. The **Field Binder** reads
its local mirror. Admin can offer both; they are separate screens with separate providers and
routes. There is no editable flag on the local reader.

The mechanism is a remote docstore collection mirrored into a local docstore, with an inventory
JSON document carrying its descriptions, sources, and publication identity. The applications own
when sync runs. The document-store kernel remains ignorant of binders, inventories, and sync.

## Dependencies and order

1. `effort/active/2026-11-11-upload-brief.md`: the shared durable upload lifecycle.
2. `effort/active/2026-11-10-background-tasks-brief.md`: Helm command menus and task visibility.
3. This feature: remote management, local reader, and explicit Admin sync. Ops integration remains
   M-9; Customer Portal integration is not proposed.

The existing `Manager`, `Lister`, and docstores are reused without changing `ux/` for this feature.
Any required extension is an escalation, not implicit permission to cross the locked namespace.

## Settled direction

- A chosen file is captured durably through `Uploads`; Attachments is not the binder's API.
- Upload supplies staging, placement, delivery, and access. The Manager supplies the destination
  and inventory reference; Attachments supplies its own catalog and note reference.
- Files enter by Choose File. An optional source URL uses `UrlField`: Open, download in the
  browser, then choose the downloaded file. There is no server fetch or automatic chemical import.
- The local Binder is available to every authorized reader of the collection; management is an
  Admin responsibility. Hiding a command is not authorization; storage policies enforce access.
- Inventory and status are ordinary JSON in the docstore, not a database table or a new core API.

## Recommendations requiring CA approval at dispatch

1. Use the stock `Manager` for remote management, and the stock `Lister` for the initial local
   reader. An icon presentation can be added later without changing the inventory or sync API;
   this production does not add a view switch or modify Lister.
2. Treat creation of a complete new remote inventory as publication. Uploads finishing alone do
   not change binder membership. A failed publication leaves the prior inventory authoritative.
3. For this first version, remote inventory edits are whole-snapshot, last-publication-wins.
   Detect a changed baseline before publishing and require reload, but acknowledge that the
   docstore has no atomic compare-and-swap: simultaneous writers can still overwrite each other's
   changes. This limitation requires explicit CA acceptance; otherwise concurrency is a design
   blocker requiring a separately scoped publication authority.
4. Keep superseded remote inventories and files initially. Immediate deletion can break a sync
   already reading the previous publication. Automated reclamation is deferred; it must become a
   backlog item before this effort closes, rather than being silently omitted.

## Remote source and inventory

A provisioned `FieldBinder` namespace on `DocumentServer` holds one fixed collection bucket.
The same namespace and bucket identities are used in `DocumentInbox` and the local `FieldBinder`
store. Catalog ids are allocated explicitly after the existing catalog; provisioning reads the
binder's read-only namespace declaration as it reads Attachments' declaration.

The inventory is named `inventory.json`, has a schema version, and contains ordered entries:

```ts
export type FieldBinderEntry = {
  id: Id
  description: string
  url?: string
  documentId: Id
  createdAt: When
  updatedAt: When
}

export type FieldBinderInventory = {
  schemaVersion: 1
  entries: readonly FieldBinderEntry[]
}
```

The enclosing inventory document's identity is the publication identity. Its store metadata supplies
publication time; no independent mutable version counter is needed. Entry identity survives file
replacement. A replacement gets a new document id; uploaded document bytes remain immutable.

The bucket supplies the namespace and bucket lineage; consumers obtain document identities through
the store/reference grammar, never by casting constructed objects into nominal types.

**Membership is the published inventory's references.** Mere presence cannot define membership
once uploads can be pending and old copies retained. Extra documents are not binder entries and
never appear in the reader. This deliberately supersedes the earlier presence/set-of-all-ids rule.
A local copy is complete when it holds the chosen inventory and every document it references.

Multiple `inventory.json` documents may exist. Read candidates through the docstore's `find`,
then select the newest by store `createdAt`, breaking ties by the document UUID. Do not assume
names are unique or that listing order is publication order. Use this rule on both stores.
Validate inventory structure, schema version, entry identities, URL schemes, and unique entry ids
at the API boundary. Unknown versions and corrupt inventories are errors, not empty binders.

## Field Binder Manager

Admin route: `/field-binder-manager`. A stock `Manager` over remote inventory entries; New opens
one Detail containing Choose File, Description, and optional URL. The Collection shows description,
source host or Uploaded, and updated time; row activation edits. A separate item action opens the
remote document through Uploads' inbox/server access while delivery is pending.

- Choose File stages immediately and durably. File is required for New; optional on edit.
- Description is required, initially suggested from the selected filename. Suggestion must not
  overwrite a description the user has already supplied.
- URL is optional HTTP/HTTPS, edited by the existing complete `UrlField` row.
- Save without a new file changes metadata only. Save with a new file preserves the entry id and
  creation time, replaces its document reference, and updates its modification time.
- Remove asks for confirmation and publishes an inventory omitting that entry. It does not delete
  the bytes still referenced by older publications.
- Existing workbench pending locks, validation, dirty checks, and Close behavior apply.

### Save and publication

1. Retain the editor's staged file and chosen entry id across retries. Establish the target bucket
   in the inbox and place the file through Uploads. Placement copies; it retains the staged source.
2. Request delivery through `Uploads.drain()`. The existing Admin loop also drains independently;
   concurrent delivery must remain idempotent. This feature does not add a second timer loop.
3. Verify on `DocumentServer` that every file referenced by the proposed inventory exists. An
   unrelated drain failure does not prove this file failed: after an expected aggregate drain
   failure, inspect the required server documents. Other errors retain their original meaning.
4. Re-read the current remote inventory and compare its identity with the editor's baseline. A
   change requires reload and reconciliation; never silently publish a stale snapshot knowingly.
5. Create the new immutable inventory directly on the server. Its JSON is generated metadata;
   chosen file bytes still follow durable upload. Creation is the publication point. Return Save
   success only after publication is confirmed. Reuse a reserved inventory document UUID on retry
   of the same publication attempt and verify the stored contents before treating it as success.
   Resolve an uncertain prior creation first, before comparing the baseline again: the new current
   inventory may be this editor's own already-successful publication. A verified prior success
   must not be misreported as a conflicting external edit.

Before a save attempt, Cancel discards only that editor's staged selections, including selections
whose staging finishes after Close. After a publication attempt may have succeeded, retain staging
and candidate identity for recovery; never delete a possibly referenced source. Do not promise
transactional rollback across docstore operations. Save failure must retain enough state for retry
within the editor; durable draft restoration after reload is not part of this production.

Upload completion, publication, and local synchronization are three distinct events. Saving in the
Manager does not modify the local reader's inventory or silently sync the device.

## Local Field Binder

Shared reader route: `/field-binder`. Its provider reads only the local store and presents the
inventory entries through `Lister`. Activate mints a local link and opens that document. It does
not fall back to the remote source when a local file is missing; report an incomplete local copy.
Description, source host or Uploaded, and document copy time are sufficient for the initial list.
Source URLs are metadata, not a substitute for the local document.

No local inventory means **Not downloaded**, not an empty synchronized binder. A published empty
inventory is a valid empty binder. Reading existing local documents does not require a remote
status request to succeed.

The reader's data provider is independent of its visual projection. An icon view remains possible;
there is no claim that all future Binder presentations must use Lister.

## Sync and status

The shared API exposes an explicit sync operation; it does not schedule itself. Admin invokes it
from the Helm menu. Ops' future startup/retry policy is selected by Ops in M-9.

1. Resolve and validate a remote inventory snapshot and retain its publication identity.
2. Copy its missing referenced documents into the local store, preserving their identities,
   names, types, and bytes. Retain the previous local inventory and its documents while copying.
3. After every referenced local document is verified, copy the chosen inventory into the local
   store at the same identity. This commits the new local reader snapshot.
4. Remove superseded local inventory documents first, then unreferenced local file copies. A
   failed cleanup must not remove anything referenced by an inventory still retained locally.
   Retry cleanup later; extra local bytes do not make a complete snapshot incomplete.
5. Recheck the remote publication. If it changed during copying, this device has a complete older
   snapshot; report an update available. Do not loop indefinitely chasing remote changes.

A failed or interrupted sync keeps the last complete local snapshot readable. A first sync that
fails remains Not downloaded, even if some files have arrived. Serialize sync within the origin
using a Web Lock, and disable a duplicate menu invocation while it is running. Readers resolve one
inventory snapshot per read; they do not recompute membership from a changing directory listing.

Write device status as a separate local JSON document with last successful sync time and the
publication last verified against the server. It is device metadata, never synced back to the
server or treated as a binder entry. Its persistence uses immutable replacement and the same
explicit latest-document rule; exclude it from mirror cleanup.

Status distinguishes Not downloaded, Available offline, Checking/Syncing, Verified current at a
stated time, Update available, and Last sync failed. Offline cannot prove that the remote remains
unchanged. Counts come from the selected inventory; progress counts files copied in this sync,
not unrelated pending uploads. A status-write failure does not invalidate verified local bytes.

## Helm entry and composition

A backpack icon opens a command popover. Admin binds **Manager**, **Binder**, **Sync**, and a
non-action status line. A reader-only application binds **Binder**, **Sync**, and status. Every
registered reader can open its local Binder regardless of whether management is offered.

The Background Tasks brief supplies the generic menu fitting and application-bound handlers.
This feature supplies its menu data, routes, sync handler, and status. No binder imports enter
HelmWidget or the generic task store. Do not implement reader-only Ops wiring in this production.

## Production scope

All paths below are under `source/` unless otherwise stated; final dispatch confirms proposed names.

| Area          | Expected files and changes                                                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared API    | New `front/api/field-binder.ts` and, if needed for separation, `field-binder-inventory.ts`; compose local store and binder services in `front/api/api.ts` |
| Reader        | New `front/app/field-binder.tsx`; existing Lister, no editable mode                                                                                       |
| Manager       | New `front/app-admin/field-binder/field-binder-manager.tsx`, `field-binder-step-detail.tsx`, and local draft state module                                 |
| Local styling | Colocated reader/Manager CSS only where existing composition requires it; hooks remain `data-app`                                                         |
| Admin wiring  | `front/app-admin/app.tsx`, `dashboard-admin.json`: two routes and backpack menu bindings                                                                  |
| Provisioning  | `devops/scripts/app-deploy-storage-config.ts`, `storage-reset.ts`, and `back/storage/storage-policies.sql`: binder namespace and Admin access             |
| Verification  | New `tests/cases/field-binder-test.ts`, inventory/sync tests if split, and focused storage-policy coverage                                                |

Out of scope: `core/`, `domain/`, attachment catalogs, shared workbench changes, automatic source
fetching, Ops/Portal integration, icon-view implementation, durable editor drafts, remote garbage
collection, and concurrency control beyond the explicitly accepted first-version policy.

Before code: authorize updates to architecture-core §10.2 Stores and §10.4 Catalog, architecture-front
for separate routes/composition and local-store lifecycle, and architecture-back storage policy
records. The records must describe the new policy before code implements it. No production deploy,
storage reset, or stage-data mutation follows merely from approving a code scope.

## Acceptance and checks

- New/edit/replace/remove publish only complete remote inventories; failed upload, uncertain
  publication, repeat Save, and concurrent-baseline change have explicit test cases.
- Stage, Close before staging finishes, Cancel, and retry preserve the upload lifecycle.
- Offline reader uses only local bytes. Failed first sync and failed replacement sync differ.
- Interrupted copy retains the old snapshot; interrupted cleanup cannot invalidate it. Empty,
  missing, corrupt, duplicate-name inventories, metadata-only publication, and remote change
  during sync are covered. Pending/unreferenced files never appear as entries.
- Admin: Manager and Binder open independently from Helm; Save does not masquerade as Sync.
  CA verifies upload, metadata edit, replacement, confirmed removal, explicit sync, and offline open.
- `deno task check`, `deno task fmt:check`, `deno task test` excluding
  `users-api-test.ts` and `session-coordinator-test.ts`; `STYLE_AUDIT`. Stage policy checks require
  their own environment and authorization. Do not report excluded or ignored checks as passed.

## Dispatch decisions

CA approval is needed for the four recommendations above, including the limited concurrent-writer
policy and retained remote history. Consumer acceptance verifies Lister on screen; code checks alone
do not close this effort. Resolve remote reclamation into the backlog before closure.

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
