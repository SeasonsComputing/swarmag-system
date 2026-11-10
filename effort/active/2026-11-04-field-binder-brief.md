# Field Binder — Brief

**Active, design input; chosen 2026-11-10 from roadmap M-6.** Recorded 2026-11-04 from a CA + AI
Architect session, re-scoped from the document storage policy brief of 2026-10-31, whose
attachments, upload, and server parts were folded into roadmap M-6's briefs
(`effort/completed/2026-10-29-attachments-brief.md`,
`effort/completed/2026-10-30-document-upload-brief.md`,
`effort/completed/2026-10-30-document-store-supabase-brief.md`). What remained is the Field Binder: a
first-class feature, its Admin workbench the last of M-6's features, and its Ops side M-9's. It
depends on the Manager and Lister enablers (`effort/completed/2026-11-10-manager-brief.md`,
`effort/active/2026-11-10-lister-brief.md`).

## What triggered it

Every truck carries an SDS binder by law, and a crew works from more than the law requires: a
sprayer's manual, a drone's. Onsite there is often no signal. The documents a crew needs must be on
the device before it leaves, and the system must know which ones they are. An assessor onsite with
an Admin tablet needs them too.

## The Field Binder

Any document required by day-to-day onsite operations. The name is the same in every layer: its
namespace on `DocumentServer`, the `FieldBinder` store on a device, and the Field Binder feature in
Admin and Ops.

- **Need decides what goes in it.** OSHA's Hazard Communication standard requires an SDS to be
  readily accessible to workers during their shift, and a pesticide's label is the law it is
  applied by: obligation is the strongest case of need, not the test. A machine's usage manual goes
  in because the crew works from it.
- **Records stay attachments.** A seller's order, an invoice, a warranty: an asset's or a
  chemical's records are attachments on its notes (the attachments brief), never in the binder.
- **Everything else leans on the browser's HTTP cache:** reference pages, avatars. It is best
  effort, and costs nothing to build.

## Presence and the inventory

1. **Membership is presence.** A document is in the binder because it is in the `FieldBinder`
   namespace, with one exception: the inventory itself (item 3), which sync copies like any other
   document but which no one sees as an entry. No table records the binder.
2. **The set of document ids is the version.** Documents are immutable, so a device is current when
   it holds exactly the server's ids; there is no counter to bump or compare.
3. **The inventory is a JSON document in the binder,** holding what presence cannot: each entry's
   description and source.

   ```ts
   /** One document in the Field Binder, stable across its refreshes. */
   export type FieldBinderEntry = {
     id: Id
     description: string
     url?: string // the remote source, when there is one
     documentId: Id // the current copy in the FieldBinder namespace
     createdAt: When
     updatedAt: When
   }
   ```

   An entry keeps its id through every refresh; a refresh changes its `documentId` and
   `updatedAt`. Each change writes a new inventory document and removes the old one, as documents
   are immutable (CONVENTIONS §10.8); a device finds the current one by its name. Only the Field
   Binder workbench writes it. Two Admins editing at once is no different from any other record in
   the system. The inventory is hidden: the workbench's Collection and Ops' binder screen list its
   entries, never the inventory document.
4. **A source is optional.** An SDS or a label has a URL; a manual is often the PDF that came in the
   box, with no URL at all.

## Sync

`api.syncFieldBinder()` brings a device in step: it lists the server's ids, copies those the
device lacks into its `FieldBinder` store, and drops those the server no longer has. Offline, the
app finds a document through the inventory: the entry whose `url` is a chemical's `sdsUrl` holds
its copy.

- **Admin** syncs from the Field Binder's Helm menu, so an assessor's tablet carries the binder
  onsite, and the whole loop is proven before Ops is built.
- **Ops** syncs in the background on load; a crew has no choice. That is M-9's.

## Viewing

The Field Binder's viewer is a `Lister` over the device's own inventory: each entry's description
and source, and the sync status. Activating an entry opens its local copy through a link minted
from the device's `FieldBinder` store, so it works without signal. It lives in the shared
`front/app`, as it reads `api`: Admin opens it from the Helm, and it is Ops' binder screen in M-9.

## Admin

- **The Helm:** a `backpack` icon opens a menu: **Field Binder** (the viewer), **Manage Field
  Binder** (the workbench), **Sync this device**, and a status line ("Current · 24 documents"). It
  is built as one generic Helm action with a menu, which the background tasks brief
  (`effort/pending/2026-11-10-background-tasks-brief.md`) reuses.
- **The workbench is a `Manager`** over `FieldBinderEntry`, Collection-Detail above its threshold and
  Index-Detail below, in the stock look:
  - **The Collection:** each entry's description, its source (a URL's host, or "Uploaded"), and
    whether its copy is current or failed.
  - **All action takes place in the Detail.** New opens it empty; an entry opens it filled. Its
    header is the sequence header with the title and **Save**.
  - **Remove** is the manager's confirmed delete.
- **The Detail's form** opens with a **Source** toggle group, **URL**, **Upload**, or **Chemical**,
  because the source decides the rest of the form.
  - **URL:** a URL to fetch, and a description.
  - **Upload:** **Choose File** reveals the picker, as attachments do; the chosen file shows its
    name and size. The description defaults from the filename.
  - **Chemical:** a chemical, then one of its documents not already in the binder, its SDS or a
    label. Picking one fills a read-only URL and a description from the chemical and the document,
    so it is a URL entry no one had to type. Chemicals do not change; their URL fields stay the
    source the UI links to.
  - **The description is required,** and every source suggests one.
  - **An entry's Detail** adds when its copy was made, and **Refresh** and **Open**. An entry whose
    fetch failed takes an uploaded file in its place (scenario 5).
- **A failed fetch shows here,** before a crew finds the gap.

## Scenarios

| # | Scenario                                | Answer                                                          |
| - | --------------------------------------- | --------------------------------------------------------------- |
| 1 | A chemical's label and SDS              | URLs; added from the chemical, copied by fetch or upload        |
| 2 | A crew needs an SDS with no signal      | opened from the Field Binder's viewer in Ops                    |
| 3 | A sprayer's manual that came in the box | added by hand, uploaded, with no URL                            |
| 4 | A drone's manual published online       | added by hand from its URL, fetched                             |
| 5 | A source blocks the fetch               | upload the file into the entry; the workbench shows the failure |
| 6 | A source publishes a revision           | refresh the entry; its id stays, its copy changes               |
| 7 | An asset's seller's order               | not the binder's: an attachment on the asset's notes            |
| 8 | An assessor onsite with no signal       | opened from the Field Binder's viewer on the Admin tablet       |

## Open

1. **The server fetch.** Its progress and failures are a background task's, shown with the others
   (the CA, 2026-11-10). Where the fetch itself runs is open: a source's site rarely allows a
   browser to read its bytes.
2. **An entry's Asset.** The form is settled but for one question: whether an entry names the Asset
   it serves, as a manual serves a sprayer.
3. **The `FieldBinder` namespace's provisioning:** it sits beside the attachments' namespaces on
   `DocumentServer`, and the storage configuration provisions it.
4. **A chemical's links offline:** whether a chemical's SDS or label link opens the local copy
   when there is no signal, the URL control falling back to the binder.

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
  entry gained its own id, stable across refreshes, so the Field Binder's workbench is a `Manager`
  and a refresh is an update. Admin mirrors the binder too, for its onsite assessors and to prove
  the sync before Ops; the binder's open question 2, its shape, is answered by the inventory.
- **2026-11-10, the workbench.** "Add from chemicals" was first a collection action, adding every
  chemical document not already in the binder. It was withdrawn: the binder's documents arrive one
  at a time, and the only bulk is the sync. A chemical became one of the Detail's three sources.
