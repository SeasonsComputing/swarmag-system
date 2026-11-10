# Background Tasks — Brief

**Pending, captured 2026-11-10** from a CA + AI Architect session, while settling the upload brief
(`effort/active/2026-10-30-document-upload-brief.md`). Not dispatched. Foundation mode: it adds to
`ux/`, locked since 2026-10-21, and that crossing is the CA's to authorize when this brief is
chosen.

## What triggered it

Admin's drain runs in the background and shows nothing. Until a document drains it opens only on
the device it was attached on, so leaving Admin with uploads pending leaves other devices with
references they cannot open. Upload is the first background task; the Field Binder's fetches, Ops'
job upload, and later sync are others. Each needs the same thing: to be seen while it runs, and to
warn before the page closes on it.

## Decisions

1. **One place for every background task.** A reactive store module in `ux/shell/runtime/`,
   `BackgroundTasks` (CONVENTIONS §16.3): a task publishes a label and a count, and clears itself
   when its count reaches zero. It knows nothing of uploads or of any app.
2. **The Helm shows it.** A reserved command, `@tasks`, beside `@theme`, places an icon in the
   Helm's cluster wherever the dashboard's configuration puts it. The icon appears only while a task
   runs, with the total count; it opens a popover listing each task by its label ("Uploading 3
   files"). Nothing shows when no task runs.
3. **Leaving asks.** While a task runs, closing or reloading the page raises the browser's own
   "Leave site?" prompt (`beforeunload`).
4. **Admin's drain publishes upload.** The loop in `front/app-admin/app.tsx` publishes "Uploading
   N files" from `Attachments.drain()`'s `remaining`, and clears it when nothing remains.

## Why the Helm

A workbench opens as a dialog over the dashboard, so the Helm sits behind whatever is being
worked on and is the first thing seen when the workbench closes, beside Logout: the moment that
matters. A marker on each attachment row was considered and dropped: one signal, in one place.

## Open

1. **The glyph.** The catalog has `upload`, `update`, and `reload`; `upload` names only one kind of
   task.
2. **The task's shape.** A label and a count may not serve every task: a fetch may know its total,
   and a failing task may need to say so. Settle it against upload and the Field Binder.
3. **Where the store's documentation lives:** architecture-front §9.6, State Management, and the
   Helm's reserved commands in its header.

## Not in this brief

- **A document that can never upload,** and why: the Supabase provider brief, which owns the size
  limit.
- **Ops' and the Customer Portal's tasks,** which publish to the same store when they arrive.
