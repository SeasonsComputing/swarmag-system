# Document Storage — Handoff

**Active.** Written 2026-10-30 at the close of a CA + AI Architect session, for the session that
resumes roadmap M-6, Document Storage. It records where the effort stands; the decisions are in
the briefs it names.

## Where it stands

- **Shipped:** the document store kernel and its IndexedDB provider
  (`effort/completed/2026-10-23-document-storage-brief.md`): the contract and `DocumentAddresses` in
  `core/std` through `@core/stdx`, the kernel and `makeDocumentStoreIndexedDbClient` in `core/cli`,
  and key paths and indexes in the `core/db` IndexedDB wrapper. CONVENTIONS 1.8–1.12 and
  architecture-core §10 record it.
- **The agenda** is the roadmap, M-6: attachments, then upload, then the Supabase provider. Each
  builds and tests on IndexedDB until the Supabase provider makes `Documents` shared. Field capture
  and the job upload are M-9, the Ops application.
- **Active briefs:**
  - `effort/active/2026-10-29-attachments-brief.md`: the catalog, the inbox, the editors, and
    Admin capture.
  - `effort/active/2026-10-30-document-upload-brief.md`: the Admin loop; access rules.
  - `effort/active/2026-10-30-document-store-supabase-brief.md`: the shared store.

## Next

1. **Attachments design moment 1:** the catalog's M-6 entries (chemicals, assets, asset types):
   for each, its namespace, which records get a bucket and when its entry creates it, and any
   library buckets.
2. Then attachments moments 3 and 4, the editors and the inbox.

## Open decision

- **EFFORT §7** still says milestone IDs are "never reused or renumbered". The roadmap now holds
  that a closed milestone's ID is permanent and an open one is a position, renumbered with its
  live references. EFFORT is the CA's to amend.

## Noticed, not acted on

- Status language remains in architecture documents written before today: `architecture-back.md`
  ("stage is the only environment today") and `architecture-front.md` ("`customers/` today …
  later"). Architecture documents describe the design in the present tense.
