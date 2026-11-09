# Attachments — Brief

**Active, draft.** First of four features of roadmap M-6, Document Storage: the Admin side. It
depends on `effort/completed/2026-11-08-document-store-platform-brief.md`, shipped. Feature
mode. It supersedes `effort/completed/2026-11-08-attachments-brief.md`; the design conversation is
`effort/active/2026-10-29-attachments-brief.md`.

**Its changes are within `front/` only,** with their tests in `source/tests/`. A need outside
`front/` is an escalation, not a change this brief makes.

## What triggered it

swarmAg's records carry notes, and notes carry attachments, but nothing can attach a document: the
`Attachment` shape exists, no surface adds one, and no store holds the bytes. Admin needs to attach
files to the notes of its records, new or existing, open them, rename and remove them, and have
them reach the shared store. Beside it, the URL fields (`Chemical.sdsUrl`, `ChemicalLabel.url`)
are plain text inputs.

## What the repository holds

- **The domain** (`b423087`): `Attachment` is
  `{ filename, documentAddress, contentType, kind, uploadedAt }`.
- **The platform** (`1249a05`): `DocumentStore` over `IndexedDbDocumentProvider(dbKey)`,
  supplied ids at every level, and `isUrl` / `expectUrl`.
- **Records are created without an id until saved.** A new draft has no id; the client makers mint
  it inside `create`.
- **`makeAggregateSave`** (`ux/shell/workbench/workbench-save.ts`): `create`, `update`, and
  `complete(record, draft)`, which receives the persisted record, its id included. A failed
  `complete` is retried against the pending record. The Service Manager uses it; the other hosts
  do not yet.
- **`NotesEditor`** (`front/app/shell/notes-editor.tsx`) takes `notes`, `onChange`, `drill`; it
  preserves attachments and shows none. Six hosts: chemical, customer detail, customer sites, user,
  asset, and service step details.
- **The SDS field** is a plain `UiInput` (`chemical-step-detail.tsx:152`); there is no labels
  editor.
- **`front/api/api.ts`** composes no document store; `front/config/ux-config.ts` declares only
  `LOCAL_DB_NAME`.
- **The architecture describes this design:** `architecture-core.md` §10.2–§10.4,
  `architecture-front.md` §7.2.4, §9.5.1, §10.1.5.

## Requirements

- **A new record attaches as an existing one does,** in its Manager and in Onboarding.
- **The domain's API does not change.** Records are created at Save, as rows always are.
- **Access is per bucket.** A user, and a customer in the portal, reads their own bucket; the
  portal's job report reads the job's.

## Decisions

1. **Attachments are uploads; URLs point elsewhere.** An attachment is a document swarmAg owns,
   held as its id-form `documentAddress`; a URL field holds an `https://` address.
2. **Every app has an inbox,** `DocumentInbox`; `DocumentServer` is the shared store, an IndexedDB
   stand-in until the Supabase provider ships. A drain copies each document in a bucket to the
   server at the same address, and never takes staging; draining is the upload brief's.
3. **`Attachments` places every document,** a singleton in `front/api` over the document store
   contract. Its catalog is private, with fixed namespace ids: Customers, Jobs, Users, and
   `Library`, whose shared bucket per company-wide topic (chemicals, assets, services) is fixed. An
   owner's bucket is the owner's id. A private `Staging` namespace sits outside every bucket.
4. **Choosing a file stages it; Save places it.** Choosing a file stores it in `Staging` at once,
   durably, and the note holds its staging address; the editor opens it from there. The record
   saves as it always does. In `makeAggregateSave`'s `complete`, every reference still in
   `Staging` is copied into the owner's bucket under the same document id, the reference is
   rewritten to the bucket address, and the record is updated with it. New and existing records
   take this one path. Placement is idempotent: a save interrupted before `complete` leaves the
   record referring to staged documents, and its next Save places them.
5. **Nothing a record references is ever deleted.** Cancel discards the documents its editor
   staged, which nothing saved refers to. Removing an attachment drops its reference. A sweep
   clears what nothing references, in the inbox and on the server; until it exists, an
   unreferenced document costs only its bytes.
6. **The host binds staging and placement.** The `NotesEditor` takes an `attach` callback; the
   host's `makeAggregateSave` places in `complete`. The shape, settled in the production scope:

   ```tsx
   // NotesEditorProps
   attach: (file: File) => Promise<Attachment>

   // customer-step-detail.tsx
   <NotesEditor … attach={Attachments.stage} />

   // the host's makeAggregateSave
   complete: async (customer, draft) => {
     const notes = await Attachments.Customers.place(customer.id, draft.notes)
     …
   }
   ```

7. **The NotesEditor** has two tabs, Note and Attachments with their count; the notes list shows a
   paperclip on a note with attachments. Add files by picker or drop, with no second step; a row
   shows icon, name, and size, opens the document, renames, and removes after confirmation. An
   optional `attachmentKinds` limits what a host accepts.
8. **Accepted files** come from a closed table owned by `Attachments`: `document` is PDF, plain
   text, Markdown, and JSON; `photo` is images; `map` is GeoTIFF; video is deferred. Formats that
   run in a browser are never accepted. A signed form is a PDF. Recognition's contract is settled
   in the production scope.
9. **`uploadedAt`** is when the person attached the document: set when the file is chosen, once,
   never updated. A rename changes `filename` only.
10. **`UrlField`** in `front/app/shell/` edits a URL with `type='url'`, checks it with `isUrl` and
    its field's schemes, as its Domain declares them in the data dictionary
    (`domain-data-dictionary.md` §3; `url (https, http)` for both fields), and opens it in a
    secondary window. The Chemical labels editor follows the Sites pattern.

## Known risks

- **A staged document lives only on its device** until its record is saved and placed. A record
  saved but not placed shows another device a reference it cannot open, until that record's next
  Save on the first device.
- **Unreferenced documents accumulate** until the sweep exists: cancelled edits, removals, and
  pages closed mid-edit.

## Production scope

| Where                              | Change                                                              |
| ---------------------------------- | ------------------------------------------------------------------- |
| `front/config/ux-config.ts`        | `DOCUMENT_INBOX_DB_NAME`, `DOCUMENT_SERVER_DB_NAME`                 |
| The app environment templates      | Values for both database keys                                       |
| `front/api/attachments.ts` (new)   | `Attachments`: catalog, `stage`, `place`, `discard`, `link`         |
| `front/api/api.ts`                 | `DocumentInbox`, `DocumentServer`, `Attachments`                    |
| `front/api/scopes.ts`              | Chemical labels in `scopes.Chemicals.detail`                        |
| `front/app/shell/notes-editor.tsx` | Tabs, the Attachments tab, `attach`, `attachmentKinds`, a paperclip |
| `front/app/shell/url-field.tsx`    | `UrlField` (new)                                                    |
| The six NotesEditor hosts          | Bind `attach`; place in `complete`, adopting `makeAggregateSave`    |
| `front/app-admin/chemicals/`       | `UrlField` for SDS; the labels editor                               |
| `source/tests/`                    | Staging, placement and its retry, cancel, recognition, links        |

Discarding a nested Note or Site drops its references; its staged documents are left to the sweep.

**Unchanged:** everything outside `front/` and its tests: `core/`, `ux/`, `domain/`, `back/`.

**Not in this brief:**

- **The sweep.**
- **Draining** (the upload brief), the Supabase provider, the Field Binder, Ops capture, the
  Customer Portal, and video.

## Checks

`deno task check`, `deno task fmt:check`, `deno task test` (the two stage-environment tests
excluded); `STYLE_AUDIT`. Failure injection between the record write and placement, then a second
Save. The CA verifies attach on new and existing records, open, rename, remove, cancel, and the SDS
and labels fields in Admin, and, from the platform brief, that the inbox persists across a reload
and requests persistent storage.

## Design history

- **2026-10-29 to 2026-11-08,** the design conversation, its two amendments, and its decisions:
  `effort/active/2026-10-29-attachments-brief.md`.
- **2026-11-08,** rewritten as a `front/`-only brief,
  `effort/completed/2026-11-08-attachments-brief.md`: attaching a transaction over the record, with
  staging at the final address, a ledger, recovery, and editing sessions. Because the final address
  included the owner's id, a new record could attach only after its first save.
- **2026-11-09, two directions.** Not attaching to a new record was unacceptable, and giving a new
  draft its id from New would change the domain's create API. Two threads answered in parallel.
  One made attaching ordinary: a document under its own identity, a reference on the note, an
  ordinary save, a sweep for what nothing references, and the bucket rule left open, which left
  open what the portal's access rests on. The other kept the bucket per owner and staged outside
  it, moving documents in at Save, deleting removals at Save, and clearing staging after a day; it
  named the save interrupted before placement as the gap the ledger had closed.
- **2026-11-09, this brief.** The bucket per owner stands, since access is per bucket. Staging
  outside it and placing in `complete` let a new record attach with no domain change. From the
  first direction, nothing referenced is ever deleted: removals and stale staging are left to the
  sweep, and placement is idempotent, so the interrupted save is finished by the record's next
  Save, with no ledger. The transaction, ledger, Web Locks, editing sessions, and recovery are
  withdrawn.
