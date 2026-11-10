# Field Binder — Brief

**Active, design input; chosen 2026-11-10 from roadmap M-6.** Recorded 2026-11-04 from a CA + AI Architect session, re-scoped from the
document storage policy brief of 2026-10-31, whose attachments, upload, and server parts were folded
into roadmap M-6's briefs (`effort/completed/2026-10-29-attachments-brief.md`,
`effort/completed/2026-10-30-document-upload-brief.md`,
`effort/active/2026-10-30-document-store-supabase-brief.md`). What remained is the Field Binder: a
first-class feature, its Admin workbench the last of M-6's features, after the Supabase provider,
and its Ops side M-9's.

## What triggered it

Every truck carries an SDS binder by law, and a crew works from more than the law requires: a
sprayer's manual, a drone's. Onsite there is often no signal. The documents a crew needs must be on
the device before it leaves, and the system must know which ones they are.

## The Field Binder

Any document required by day-to-day onsite operations. The name is the same in every layer: the
`FieldBinder` table, its namespace on `DocumentServer`, the `FieldBinder` store in Ops, and the
Field Binder feature in Admin and Ops.

- **Need decides what goes in it.** OSHA's Hazard Communication standard requires an SDS to be
  readily accessible to workers during their shift, and a pesticide's label is the law it is
  applied by: obligation is the strongest case of need, not the test. A machine's usage manual goes
  in because the crew works from it.
- **Records stay attachments.** A seller's order, an invoice, a warranty: an asset's or a
  chemical's records are attachments on its notes (the attachments brief), never in the binder.
- **Everything else leans on the browser's HTTP cache:** reference pages, avatars. It is best
  effort, and costs nothing to build.

## Entries

The binder is a list of entries and one version for the whole set.

```ts
/** A document day-to-day onsite operations require. */
export type FieldBinderEntry = {
  url?: string // the remote source, when there is one
  description?: string
  documentAddress?: string // the copy in the FieldBinder's namespace, once added
}
```

- **A source is optional.** An SDS or a label has a URL; a manual is often the PDF that came in the
  box, with no URL at all. Neither `Asset` nor `AssetType` has a manual field, so manuals are added
  by hand.
- **Chemicals feed it by an explicit workflow,** "Add from chemicals", which copies each chemical's
  `sdsUrl` and label URLs into the list, skipping any already there. Chemicals do not change: their
  URL fields stay the source the UI links to.
- **Three operations change it:** add, remove, and refresh a document, and each bumps the version.
  Add and refresh are one act with two sources of bytes: the server fetches the entry's URL, or an
  Admin uploads a file, when a source refuses or there is no URL. Either way the copy lands in the
  FieldBinder's namespace on `DocumentServer`. Uploading into a URL field was rejected (it would
  make the field URL-or-document); uploading into the binder is the same act as fetching.
- **Freshness is deliberate.** An Admin refreshes an entry when its source publishes a revision; the
  binder records no source versions of its own.

## Admin: the workbench

A workbench of its own, the Field Binder. It lists the binder's entries with their copies,
failures, and actions: Add from chemicals, add by hand (a URL or an upload), refresh, and remove.
The Chemical Manager is unchanged. A failed fetch shows here, before a crew finds the gap.

## Ops: the mirror

- **Ops mirrors it.** Preparing online, an Ops device compares its version with the binder's; when
  behind, it mirrors the namespace into its `FieldBinder` store, copying the ids it lacks and
  dropping those removed. Documents are immutable, so a revision is a new document and there is
  nothing to reconcile. A device can say which version it carries.
- **Offline, the app finds a copy through the binder:** the entry for a chemical's `sdsUrl` holds
  the address of its copy.
- **A crew opens the binder** and reads a document, offline.

## Scenarios

| # | Scenario                                | Answer                                                          |
| - | --------------------------------------- | --------------------------------------------------------------- |
| 1 | A chemical's label and SDS              | URLs; added from chemicals, copied by fetch or upload           |
| 2 | A crew needs an SDS with no signal      | opened from the Field Binder in Ops                             |
| 3 | A sprayer's manual that came in the box | added by hand, uploaded, with no URL                            |
| 4 | A drone's manual published online       | added by hand from its URL, fetched                             |
| 5 | A source blocks the fetch               | upload the file into the entry; the workbench shows the failure |
| 6 | A source publishes a revision           | refresh the entry, which bumps the version                      |
| 7 | An asset's seller's order               | not the binder's: an attachment on the asset's notes            |

## Open

1. The server fetch: where it runs and how it reports a failure to the workbench.
2. The binder's shape: one record with its entries and version, or entries with the version beside
   them.

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
