# Attachments — Brief

**Active, draft.** First of four features of roadmap M-6, Document Storage: the Admin side. It
depends on `effort/completed/2026-11-08-document-store-platform-brief.md`, shipped. Feature
mode.

**Its changes are within `front/` only,** with their tests in `source/tests/`. A need outside
`front/` is an escalation, not a change this brief makes.

## What triggered it

swarmAg's records carry notes, and notes carry attachments, but nothing can attach a document: the
`Attachment` shape exists, no surface adds one, and no store holds the bytes. Admin needs to attach
files to the notes of its records, open them, rename and remove them, and have them reach the shared
store. Beside it, the URL fields (`Chemical.sdsUrl`, `ChemicalLabel.url`) are plain text inputs.

## What the repository holds

- **The domain** (`b423087`): `Attachment` is
  `{ filename, documentAddress, contentType, kind, uploadedAt }`.
- **The platform** (`1249a05`): `DocumentStore` over `IndexedDbDocumentProvider(dbKey)`,
  supplied ids at every level, and `isUrl` / `expectUrl`.
- **Records are created without an id until saved.** A new draft has no id; the client makers mint
  it inside `create`.
- **`makeAggregateSave`** (`ux/shell/workbench/workbench-save.ts`): `create`, `update`, and
  `complete` for writes after persistence.
- **`NotesEditor`** (`front/app/shell/notes-editor.tsx`) takes `notes`, `onChange`, `drill`; it
  preserves attachments and shows none. Six hosts: chemical, customer detail, customer sites, user,
  asset, and service step details.
- **The SDS field** is a plain `UiInput` (`chemical-step-detail.tsx:152`); there is no labels
  editor.
- **`front/api/api.ts`** composes no document store; `front/config/ux-config.ts` declares only
  `LOCAL_DB_NAME`.
- **The architecture already describes the design:** `architecture-core.md` §10,
  `architecture-front.md` §7.2.4, §9.5.1, §10.1.5.

## Decisions

Settled in the design conversation (the 2026-10-29 brief and its amendments).

1. **Attachments are uploads; URLs point elsewhere.** An attachment is a document swarmAg owns,
   held as its id-form `documentAddress`; a URL field holds an `https://` address.
2. **Every app has an inbox,** `DocumentInbox`; `DocumentServer` is the shared store, an IndexedDB
   stand-in until the Supabase provider ships. A drain copies a committed document to the server at
   the same address; draining is the upload brief's.
3. **`Attachments` places every document,** a singleton in `front/api` over the document store
   contract. Its catalog is private: fixed namespace ids; a bucket per owner, its id the owner's; a
   shared bucket per company-wide topic in `Library`.
4. **Attaching is a transaction over the record.** An editing session stages chosen files in the
   inbox at once, durably, at their final address. Save commits them, with the record write as the
   commit point; Cancel discards them; a removal is deleted after the commit. A private ledger
   records each staged document as staged, saving, or committed; recovery at start discards a dead
   session's staged documents and presumes its saving ones committed. A session holds a browser
   lock (Web Locks), so recovery never touches a live session. The ledger is a `Ledger` store in
   the inbox's database, registered at module load. Its states and verbs (`stage`, `commit`,
   `discard`, `pending`) are shaped as a document store API, so it can move into the contract
   (parking lot P-14) as a lift, not a rewrite.
5. **The editing session is the API.** `Attachments.begin()` returns a session with a typed
   `attach` per topic, `remove`, `commit(write)`, and `cancel()`; `link`, `recover`, and `upload`
   stay on the container. The host binds `attach` into the `NotesEditor`.
6. **A new record attaches after its first save.** Staging needs the owner's id, which a new
   record's draft lacks until Save, and giving it one changes the shared create contract, outside
   `front/`. For an owner's bucket the Attachments tab opens once the record is saved;
   shared-bucket topics attach at once.
7. **The NotesEditor** has two tabs, Note and Attachments with their count; the notes list shows a
   paperclip on a note with attachments. Add files by picker or drop, with no second step; a row
   shows icon, name, and size, opens the document, renames, and removes after confirmation. An
   optional `attachmentKinds` limits what a host accepts.
8. **Accepted files** come from a closed table owned by `Attachments`: `document` is PDF, plain
   text, Markdown, and JSON; `photo` is images; `map` is GeoTIFF; video is deferred. Formats that
   run in a browser are never accepted. A signed form is a PDF. Recognition's contract is settled in
   the production scope.
9. **`uploadedAt`** is when the person attached the document: set when the file is chosen, once,
   never updated.
10. **`UrlField`** in `front/app/shell/` edits a URL with `type='url'`, checks it with `isUrl` and
    its field's schemes, and opens it in a secondary window. The Chemical labels editor follows the
    Sites pattern.

## Production scope

| Where                              | Change                                                              |
| ---------------------------------- | ------------------------------------------------------------------- |
| `front/config/ux-config.ts`        | `DOCUMENT_INBOX_DB_NAME`, `DOCUMENT_SERVER_DB_NAME`                 |
| `front/api/attachments.ts` (new)   | `Attachments`: catalog, sessions, ledger, recovery, links           |
| `front/api/api.ts`                 | `DocumentInbox`, `DocumentServer`, `Attachments`                    |
| `front/app/shell/notes-editor.tsx` | Tabs, the Attachments tab, `attach`, `attachmentKinds`, a paperclip |
| `front/app/shell/url-field.tsx`    | `UrlField` (new)                                                    |
| The six NotesEditor hosts          | Begin a session, bind `attach`, commit and cancel with the record   |
| `front/app-admin/chemicals/`       | `UrlField` for SDS; the labels editor                               |
| `front/app-admin/app.tsx`          | `Attachments.recover()` at start                                    |
| `source/tests/`                    | Sessions, the ledger, recovery, recognition, links                  |

**Unchanged:** everything outside `front/` and its tests: `core/`, `ux/`, `domain/`, `back/`.

**Not in this brief:**

- **A new record's id from New** changes the shared create contract (`core/std/protocols.ts`,
  `makeScope`, the CRUD makers, the Users edge path): a Foundation decision of its own.
- **The id-form check of `documentAddress`** in the domain guard needs `DocumentAddresses` from
  `@core/stdx`, while the domain's validators import `@core/std` alone (`architecture-core.md`
  §11.1.1): a domain-boundary decision of its own.
- **Draining** (the upload brief), the Supabase provider, the Field Binder, Ops capture, the
  Customer Portal, video, and avatar removal (backlog B-41).

## Checks

`deno task check`, `deno task fmt:check`, `deno task test` (the two stage-environment tests
excluded); `STYLE_AUDIT`. Failure injection across stage, save, interrupted save, cancel, and
restart; two tabs with recovery; lock behavior on a suspended tab on the target devices. The CA
verifies attach, open, rename, remove, cancel, and the SDS and labels fields in Admin, and, from
the platform brief, that the inbox persists across a reload and requests persistent storage.

## Design history

- **2026-10-29 to 2026-11-08,** the design conversation, its two amendments, and its decisions:
  `effort/active/2026-10-29-attachments-brief.md`.
- **2026-11-08, rewritten.** A production carried the feature with platform changes, among them the
  shared create contract, written into an amendment as a sentence; it was withdrawn. The platform
  moved to a brief of its own, and this one changes `front/` only, so a need beyond it is visible as
  an escalation. A new record attaching after its first save follows from that boundary.
