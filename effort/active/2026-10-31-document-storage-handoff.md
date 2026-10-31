# Document Storage — Handoff

**Active.** Written 2026-10-31 at the close of a CA + AI Architect session, for the session that
resumes roadmap M-6, Document Storage, on or after Monday 2026-11-02. It follows
`effort/active/2026-10-30-document-storage-handoff.md`, which remains the record of where the effort
stood the day before. Decisions live in the briefs it names.

## Where it stands

- **The agenda is the roadmap, M-6:** the kernel and IndexedDB provider shipped; three features
  remain, in order, each building and testing on IndexedDB until the last makes the store shared.
  1. Attachments: `effort/active/2026-10-29-attachments-brief.md`.
  2. Upload, the Admin loop: `effort/active/2026-10-30-document-upload-brief.md`.
  3. The Supabase provider: `effort/active/2026-10-30-document-store-supabase-brief.md`.
- **Field capture and the job upload** are the Ops application's, roadmap M-9.
- **The design of 2026-10-30 and 10-31** is in one pending brief,
  `effort/pending/2026-10-31-document-storage-policy-brief.md`. Its positions are working
  positions, coherent but not yet decided:
  - Attachments are uploads only, held by `Attachment.documentAddress` (replacing `url`); URLs are
    external, `https://`, shown by a new URL app control.
  - No hosting: the app mints links to show its own documents; sharing outside the app is a
    separate capability.
  - The stores each app composes: `DocumentInbox`, `FieldBinder`, `DocumentServer`. In Ops, each
    job clone comes with its inbox.
  - The IndexedDB maker gains a required `name`, so several stores can share a device.
  - The Field Binder: a versioned table of remote URLs (SDS, labels, other required documents) fed
    from chemicals by an explicit action, copied to `DocumentServer` by fetch or upload, and
    mirrored to every Ops device.
- **Repository state:** clean and pushed at `110dcc5`.

## Since the last handoff

- M-5 closed; M-6 Document Storage created; later milestones renumbered M-7 to M-11, with live
  references updated.
- Upload split from attachments and made active; architecture documents restored to present-tense
  design.
- The policy brief recorded, including the Field Binder.
- Backlog: B-37 removed (never resurfaced); B-39 added (the user stories no longer reflect the
  product).

## Next

1. **Fold the policy brief into the briefs it affects,** before any design moment builds on the
   attachments brief's known errors:
   - attachments: its three corrections (no "no upload button" rule; the photo answer moves to the
     job runner; one attachment field and three URL fields), `documentAddress`, the surfaces;
   - upload and the Supabase provider: the stores and `DocumentServer`;
   - the roadmap: the maker's `name` as an M-6 enabler; the job inbox and the Field Binder's Ops
     side in M-9; the Field Binder's Admin side and its server fetch, placed after the Supabase
     provider.
2. **Attachments design moment 1:** the catalog's M-6 entries.
3. **The maker's `name`,** a small additive `core/cli` production; the code sketch is in the policy
   brief.

## Open decisions

- **EFFORT §7** still says milestone IDs are "never reused or renumbered"; the roadmap now holds
  that a closed milestone's ID is permanent and an open one is a position. EFFORT is the CA's to
  amend.
- **The policy brief's open list:** the server fetch, the Field Binder's shape, attachment renaming,
  `kind`, the notes list's attachment count, a domain `Url` type, a `name` on the Supabase maker,
  and the job inbox as a namespace or a bucket.

## Noticed, not acted on

- The SDS input in the Chemical editor renders as plain text; it needs `type='url'`, which the URL
  app control will provide.
- All URL fields are validated only as non-empty strings; `core/std` has no URL check.
- Status language remains in `architecture-back.md` and `architecture-front.md`.
