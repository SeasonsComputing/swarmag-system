# Document Upload — Brief

**Active, draft.** Recorded 2026-10-30 from a CA + AI Architect session, split from the attachments
brief's design conversation, `effort/completed/2026-10-29-attachments-brief.md`: the second of
four features of roadmap M-6, Document Storage, for Admin. Attaching puts a document in the inbox
and its address on the record; uploading moves it to the destination store, `DocumentServer`.
The drains build and test against an IndexedDB `DocumentServer`; the Supabase provider brief,
`effort/active/2026-10-30-document-store-supabase-brief.md`, makes it shared, and this brief's
access rules land with it.

## What triggered it

The attachments brief carried capture and upload together. They are different work: attachment
puts documents in the inbox; upload moves them to their destination, with judgment about the
connection, and decides who may see them once the destination is shared.

The attachments brief is `effort/active/2026-11-09-attachments-brief.md`.

## Drains

Every app has an inbox (the attachments brief). The inbox knows nothing of apps; each app decides
when it drains. A drain copies each document in a bucket to `DocumentServer` at the same address,
then clears it from the inbox, and never takes `Staging`. The address does not change:
`Attachments` places a document at its final address when its record saves, with fixed namespace
ids and the owner's id as its bucket's (the attachments brief), so a record saved before upload is
already correct after it.

- **Admin: a background loop** over `DocumentInbox` in the page, draining as items arrive while
  the app is open. What is left waits in the inbox for the next session. No Service Worker.
- **Ops: the job upload,** the Ops application's (roadmap M-9), beside its log upload, draining
  the job's inbox. Photos travel with the job and drain back at base, a deliberate act that
  qualifies the connection first, on wi-fi by default, since the data plan is the worker's. The
  work log entries are written with them. It is recorded here because it drains the same inbox.
- **Customer Portal: its own drain,** designed with the portal (roadmap M-10).

## Access

Storage policies are the Supabase provider brief's mechanism (its DevOps 2); this brief specifies
the rules swarmAg's namespaces need, and they are written there.

- Per bucket, which roles read or write it.
- A customer reaches documents only through the portal, signed in, and only the attachments of
  shared notes (`Note.visibility`) in their own bucket. A customer email carries no document links: it links to the portal, and its
  pictures are embedded, read by the sender on the server.

## Design moments

1. **The Admin loop:** how it paces itself and how a failed item retries. The job upload's checks
   are designed with M-9.
2. **Access rules,** per namespace and bucket, as written into the storage policies.
3. **The drain's progress:** whether a pending-document state in the store records it is parking
   lot P-14.

## Design history

- **2026-10-30, split from attachments.** Draining and access moved here from the attachments
  brief, where they had been carried with capture.
- **2026-11-04, the same address.** The destination became `DocumentServer`, one of the stores
  each app composes (the attachments brief), and a drain keeps each document's address, which the
  catalog's supplied ids make possible.
- **2026-11-09, staging is not drained.** Attaching stages a chosen file in `Staging` and places it
  in its owner's bucket when the record saves (`effort/active/2026-11-09-attachments-brief.md`).
  A drain takes buckets only, so a bucket on the server holds only documents a saved record refers
  to.
