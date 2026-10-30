# Document Upload — Brief

**Active, draft.** Recorded 2026-10-30 from a CA + AI Architect session, split from the attachments
brief, `effort/active/2026-10-29-attachments-brief.md`, and current work with it: the second of
three features of roadmap M-6, Document Storage, for Admin. Attaching puts a document in the inbox
and its reference on the record; uploading moves it to the destination store, `Documents`. The
drains build and test against an IndexedDB `Documents`; the Supabase provider brief,
`effort/active/2026-10-30-document-store-supabase-brief.md`, makes it shared, and this brief's
access rules land with it.

## What triggered it

The attachments brief carried capture and upload together. They are different work: attachment
puts documents in the inbox; upload moves them to their destination, with judgment about the
connection, and decides who may see them once the destination is shared.

## Two drains

The inbox knows nothing of apps; each app decides when it drains. A drain copies each document to
its destination under its id, then clears it from the inbox.

- **Admin: a background loop** in the page, draining as items arrive while the app is open. What
  is left waits in the inbox for the next session. No Service Worker.
- **Ops: the job upload,** the Ops application's (roadmap M-9), beside its log upload. Photos travel
  with the job and drain back at base, a deliberate act that qualifies the connection first, on
  wi-fi by default, since the data plan is the worker's. The work log entries are written with
  them. It is recorded here because it drains the same inbox.

## Access

Storage policies are the Supabase provider brief's mechanism (its DevOps 2); this brief specifies
the rules swarmAg's namespaces need, and they are written there.

- Per bucket, which roles read or write it.
- A customer reaches documents only through the portal, signed in, and only shared documents in
  their own bucket. A customer email carries no document links: it links to the portal, and its
  pictures are embedded, read by the sender on the server.

## Design moments

1. **The Admin loop:** how it paces itself and how a failed item retries. The job upload's checks
   are designed with M-9.
2. **Access rules,** per namespace and bucket, as written into the storage policies.

## Design history

- **2026-10-30, split from attachments.** Draining and access moved here from the attachments
  brief, where they had been carried with capture.
