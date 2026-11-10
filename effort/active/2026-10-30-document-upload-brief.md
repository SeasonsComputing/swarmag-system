# Document Upload — Brief

**Active, dispatched; amended 2026-11-10 after AI Coding Engine review.** The second of four features of roadmap
M-6, Document Storage: Admin's drain, which moves placed documents from the inbox to
`DocumentServer` at the same address. Feature mode: its changes are within `front/` and their
tests; a need outside `front/` is an escalation. It builds and tests against the IndexedDB
`DocumentServer`; the Supabase provider brief,
`effort/active/2026-10-30-document-store-supabase-brief.md`, makes the server shared and owns who
may read and write it.

## What triggered it

Attaching (`effort/completed/2026-11-09-attachments-brief.md`) places a document in its owner's
bucket in the device's inbox when its record saves. Nothing moves it on: until it drains, a
document opens only on the device it was attached on.

## What the repository holds

- **The contract** (`@core/std/docstore-contract.ts`): `list` at each level, `read`, `create`
  with supplied ids, and `delete`. Creating at an existing lineage returns the node already there.
- **`Attachments`** (`front/api/attachments.ts`): the private catalog, `Staging`'s id among it,
  and `link`, which looks in the inbox first, then the server.
- **`front/app-admin/app.tsx`**: Admin's root, which starts no document work today.

## Decisions

1. _[Extended by the amendment "After AI Coding Engine review", items 1 and 2.]_
   **`Attachments.drain()` is one pass.** It lists the inbox's namespaces, skips `Staging`, and
   for each document in an owner's bucket creates it on `DocumentServer` with the same namespace,
   bucket, and document ids and names, reads its bytes from the inbox, then deletes it from the
   inbox. It returns `{ drained, remaining }`.
2. **A cut-off pass needs no recovery.** A document copied but not yet deleted is copied again on
   the next pass, which returns the node already there, then deleted. A document another tab has
   already drained counts as drained.
3. _[Revised by the amendment "After production review", item 2.]_ **Admin's loop lives in
   `front/app-admin/app.tsx`.** The inbox knows nothing of apps (architecture-core §10.3), so the
   app starts its own loop.
4. **One tab drains at a time,** under a Web Lock the loop takes with `ifAvailable`: a tab that
   finds another draining skips the pass.

   ```ts
   await navigator.locks.request('document-drain', { ifAvailable: true }, async lock => {
     if (lock) await api.Attachments.drain()
   })
   ```

5. **Pacing.** A pass when Admin opens, then one every minute while it is open. A pass that fails
   waits 2 minutes, then 4, up to 15, and returns to every minute after a clean pass. Nothing is
   remembered per document: a failed one is still in the inbox at the next pass.
6. **Empty containers stay.** A drained bucket and its namespace remain in the inbox; placement
   creates them again with the same ids.
7. **No visibility in this brief.** The drain is silent; showing it is the background tasks brief's
   (`effort/pending/2026-11-10-background-tasks-brief.md`), which reads `drain()`'s result.

## Production scope

| Where                                     | Change                                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `front/api/attachments.ts`                | `drain()`; `link` and `size` fall back to the server (amendment item 1)            |
| `front/app-admin/app.tsx`                 | _[Revised by "After production review", item 2.]_ Starts `DocumentDrain`           |
| `front/app-admin/document-drain.ts` (new) | `DocumentDrain`: pacing, the Web Lock, `drain()` (amendment item 2)                |
| `source/tests/`                           | Drain: copy, delete, `Staging` untouched, a repeated pass, a document already gone |

**Unchanged:** everything outside `front/` and its tests; Ops' and the Customer Portal's drains.

**Not in this brief:**

- **Ops' drain:** the job upload, beside the log upload, at base and on wi-fi by default
  (roadmap M-9).
- **The Customer Portal's drain** (roadmap M-10).
- **Access:** the Supabase provider brief.
- **A document that can never upload,** and why: the Supabase provider brief, which owns the size
  limit.
- **Pending documents in the store contract:** parking lot P-14; the drain does not need them.

## Checks

`deno task check`, `deno task fmt:check`, `deno task test` (the two environment-dependent files
excluded); `STYLE_AUDIT`. The CA verifies in Admin: an attachment placed on Save leaves the inbox
for the server within a minute and still opens; two tabs open drain once.

## Amendment — 2026-11-10 — After AI Coding Engine review

1. **Opening during a drain.** `link` and `size` chose a store, then read from it, so a drain
   deleting the inbox copy in between made the read fail. Each now tries the inbox and, on a 404,
   the server: one attempt per store, not a check then a read. A document in `Staging` never falls
   back, since it is never on the server.
2. **A failing document does not stop the pass.** The pass attempts every document; a document
   that fails stays in the inbox, with its source intact, while the rest drain. If any failed, the
   pass fails at its end, so the loop backs off (decision 5). `{ drained, remaining }` is
   unchanged.

## Amendment — 2026-11-10 — After production review

1. **The loop backs off on drain failures only.** It caught every error, so a missing Web Locks
   API or a bug would have backed off forever, unseen (CONVENTIONS §15). It catches the drain's
   expected failures, `AggregateError` and `ApiError`, and lets any other error surface.
2. **The loop is a container, started by the root.** Admin's root is declaration (CONVENTIONS
   §16.1); the loop's state and schedule do not belong in it. `DocumentDrain`, in
   `front/app-admin/document-drain.ts`, holds them and exposes `start()`; `app.tsx` calls it once
   bootstrap resolves.
3. **One fallback, one place.** `link` and `size` repeated the inbox-then-server fallback; a private
   `#either(node, operation)` in `Attachments` holds it once. `#pending()`'s inline return type is
   named, `PendingDocument`.

## Design history

- **2026-10-30, split from attachments.** Draining and access moved here from the attachments
  brief, where they had been carried with capture.
- **2026-11-04, the same address.** The destination became `DocumentServer`, one of the stores
  each app composes (the attachments brief), and a drain keeps each document's address, which the
  catalog's supplied ids make possible.
- **2026-11-09, staging is not drained.** Attaching stages a chosen file in `Staging` and places it
  in its owner's bucket when the record saves (`effort/completed/2026-11-09-attachments-brief.md`).
  A drain takes buckets only, so a bucket on the server holds only documents a saved record refers
  to.
- **2026-11-10, access moves to the Supabase provider brief,** which writes the storage policies;
  this brief builds against the IndexedDB stand-in, where no access rules exist.
- **2026-11-10, the loop settled:** `drain()` in `Attachments`, the loop in Admin's root, one tab
  under a Web Lock (the single-drain lock left open on 11-08), a timer in place of per-document
  retries, and visibility moved to the background tasks brief.
