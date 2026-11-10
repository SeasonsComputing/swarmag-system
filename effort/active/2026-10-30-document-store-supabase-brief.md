# Document Store Supabase Provider — Brief

**Active; for the AI Coding Engine's review.** Recorded 2026-10-30 from a CA + AI Architect session, split
from the document storage brief, `effort/completed/2026-10-23-document-storage-brief.md`, which is
the kernel and the contract this provider implements. Third of four features of roadmap M-6,
Document Storage: it provides `DocumentServer`, the shared store each app composes
(`architecture-core.md` §10.2), in place of the IndexedDB stand-in the attachments and upload
briefs built against. Foundation mode, read with the DevOps context beside Base.
`architecture-back.md` and `architecture-devops.md` are locked; the CA opens them for this brief's
production, recorded here.

## What triggered it

The kernel's first provider, IndexedDB, keeps documents in one browser. Documents shared across
devices and people need a server: an SDS uploaded at a desk and read in the field, a customer's
photos seen in the portal. Admin attaches (`effort/completed/2026-11-09-attachments-brief.md`) and
drains (`effort/completed/2026-10-30-document-upload-brief.md`) into `DocumentServer`, which is
still a second IndexedDB database on the same device.

## Scope

1. **The provider:** `SupabaseDocumentProvider` in `core/cli/supabase-docstore-provider.ts`,
   composed under `DocumentStore`, over `core/db/supabase.ts`.
2. **The swap:** `front/api/api.ts` composes `DocumentServer` over the provider, and the stand-in's
   key, `DOCUMENT_SERVER_DB_NAME`, retires from `front/config/ux-config.ts`, the env templates, and
   the documents that list it. The stand-in's documents are not migrated: stage's records are reset
   with the storage configuration, and no other target ever had the stand-in.
3. **The drain waits for a session:** Admin's `DocumentDrain` starts once a session is prepared.
4. **What the server needs:** storage configuration, its provisioning task, storage policies and the
   rename function, and reset, in `supabase/`, `devops/`, and `back/`.

## The provider

The repository's rule for the backend holds for storage: what can be a direct operation under RLS
is not an edge function (`architecture-back.md` §3). Supabase enforces policies on
`storage.objects` and `storage.buckets` on the server, so they give the provider its server-side
check, and a client reaches the provider through the kernel, as the CRUD clients reach theirs.

Supabase Storage keeps its own nodes, so the provider keeps no table. Storage is flat: objects
under keys in Supabase buckets. It records each object's size, content type, and creation time,
and carries custom metadata, `user_metadata`, set at upload. A node's id is its lineage (the
document storage brief, platform point 2), so every id locates its node directly.

1. **A namespace is a Supabase bucket,** whose id is the namespace's id. Its placement is the
   Supabase bucket's own settings: file size limit, MIME types, public access. Namespaces are
   provisioned (DevOps 1), never created at runtime: a namespace's `create` returns the provisioned
   Supabase bucket with that id, and any other is refused by policy. `Staging` never exists on the
   server.
2. **A bucket is a key prefix,** `{bucket}/`, with a marker object, `{bucket}/.bucket`, whose
   `user_metadata` holds the bucket's name and whose creation time is the bucket's. A bucket's
   `create` returns its existing marker.
3. **A document is an object,** `{bucket}/{document}` in its namespace's Supabase bucket, its name
   in `user_metadata`. Its size and content type are Storage's, set on upload from the content type
   the format table assigned (`front/api/attachment-formats.ts`), and served with the bytes. A
   document's `create` uploads without overwrite and returns the existing document if its object is
   there.
4. **Counts are never stored,** so they cannot drift: a container's is listed, a document's is
   its size.
5. **`find` lists and filters.** Storage's API cannot query `user_metadata`, so `find` lists the
   parent and keeps the matching names; swarmAg's buckets are small.
6. **Empty-only delete.** Supabase refuses to delete a non-empty Supabase bucket, so a namespace's
   is native. A bucket's is the provider's: it lists the prefix and removes the marker only if
   nothing else is there. The check and the removal are not atomic; a document arriving during a
   bucket's deletion is the race, and bucket deletion is rare and deliberate.
7. **Rename is one function.** Storage's API cannot update `user_metadata` after upload, so a
   Postgres function updates it, called by RPC: the provider's only code in `back/`.
8. **Links.** `link` is a signed URL whose expiry, the kernel's default, is fixed when it is issued.
   A signed URL is not revocable. It serves the stored content type, so a disguised file never runs
   (the attachments brief).
9. **Refusals are told apart.** An upload Storage refuses for its size or its type is an `ApiError`
   with 413 or 415, so a caller can tell a refusal that will never succeed from one that may. The
   drain counts it as a failure and keeps the document; showing it is the background tasks brief's
   (`effort/pending/2026-11-10-background-tasks-brief.md`).
10. **The provider takes the Supabase client,** injected (CONVENTIONS §11), and nothing that names a
    store: there is one store on the server.

| Operation          | Storage                                                    |
| ------------------ | ---------------------------------------------------------- |
| namespace `create` | return the provisioned Supabase bucket                     |
| bucket `create`    | upload the marker, its name in `user_metadata`             |
| document `create`  | upload `{bucket}/{document}`, its name in `user_metadata`  |
| `get`              | the Supabase bucket, the marker, or the object             |
| `find`, `list`     | list the parent                                            |
| `update`           | the rename function                                        |
| `delete`           | remove; a bucket's only when its prefix is otherwise empty |
| `read`             | download                                                   |
| `link`             | sign                                                       |

## Access

Storage policies grant M-6's roles, Admin's alone:

| Role                             | Customers, Users, Jobs, `Library` |
| -------------------------------- | --------------------------------- |
| administrator, sales, operations | read and write                    |
| customer                         | none                              |

The customer role gains its rules with the Customer Portal (roadmap M-10). Settled by the CA
2026-11-10, for M-6.

## DevOps

Storage is the first platform service since Auth that the repository must own. Auth's
configuration sets the pattern (`architecture-devops.md` §13): the repository is authoritative, not
the dashboard; `config.toml` owns local behavior, a per-target contract owns hosted behavior, and a
task applies it and reads back every value. Nothing of this exists for storage: `config.toml`'s
`[storage]` block is the scaffold default (50 MiB, no buckets).

1. **Storage configuration.** A task, `app-deploy-storage-config`, beside
   `app-deploy-auth-config`, creates or updates each namespace as a Supabase bucket and reads back
   every value. The facts come from where they live, so each has one home:
   - **Which namespaces, with their ids and names:** `Attachments.namespaces`, a static, read-only
     list on the class, of the four namespaces a placed document can be in. The catalog's
     constants stay private; `Staging` and the `Library` buckets are not in the list.
   - **Which content types:** `AttachmentFormats.contentTypes()`, every type the format table
     accepts.
   - **The server's own settings,** file size limit and public access: a per-target contract,
     `supabase/storage/{target}.jsonc`, as Auth's is (`architecture-devops.md` §13).

   ```ts
   import { AttachmentFormats } from '@front/api/attachment-formats.ts'
   import { Attachments } from '@front/api/attachments.ts'

   for (const namespace of Attachments.namespaces) {
     await provisionBucket(target, {
       ...namespace,
       ...contract,
       allowedMimeTypes: AttachmentFormats.contentTypes()
     })
   }
   ```

   The task imports these modules directly, never `api.ts`, so it needs no app configuration; devops
   may import `front` (`architecture-core.md` §7). Local Supabase is provisioned by the same task;
   `config.toml`'s `[storage]` block keeps only its switch and size limit.
2. **Storage policies and the rename function,** in a file of their own under `back/`, which
   `db-genesis` applies after `schema.sql`. They are not `schema.sql`'s: its policies sit beside
   their tables, and storage's tables are Supabase's; and `schema.sql` is the domain's genesis
   output, which takes no hand-written idiom.
3. **Genesis and reset.** `db-genesis` resets the database and leaves stored objects behind, so a
   stage reset leaves documents whose records no longer exist. A trigger on Supabase's storage
   tables refuses deletion by SQL, which would leave the files behind, so a storage reset empties
   the Supabase buckets through the Storage API, and joins `db-reset` with its verification.
4. **Free-tier usage.** Keeping infrastructure at $0 means watching the 1 GB limit: a task reports
   storage usage per target.

## Production scope

| Where                                               | Change                                                                |
| --------------------------------------------------- | --------------------------------------------------------------------- |
| `core/cli/supabase-docstore-provider.ts`            | `SupabaseDocumentProvider` (new)                                      |
| `front/api/api.ts`, `front/config/`                 | `DocumentServer` over the provider; `DOCUMENT_SERVER_DB_NAME` retired |
| `front/api/attachments.ts`, `attachment-formats.ts` | `Attachments.namespaces`; `AttachmentFormats.contentTypes()`          |
| `front/app-admin/document-drain.ts`                 | Starts once a session is prepared                                     |
| `supabase/config.toml`, `supabase/storage/`         | Local and per-target storage configuration                            |
| `devops/scripts/`, `deno.jsonc`                     | `app-deploy-storage-config`, the storage reset, the usage report      |
| `back/`                                             | Storage policies and the rename function                              |
| `source/tests/`                                     | The provider against the contract's tests                             |

**Unchanged:** `domain/`, `schema.sql`, the kernel and the IndexedDB provider, `ux/`.

**Not in this brief:**

- **The CLI,** `document-store {noun} {verb}`: nothing in M-6 uses it. It waits for the back profile
  that needs it.
- **Resumable uploads (TUS):** survey maps need them; field mapping's.
- **Cron, secrets, and the edge broker and sweep** (the former DevOps 4–6): they arrive with the
  broker or the sweep of unreferenced documents (backlog B-42), whichever comes first.
- **The import node** (ODM, GDAL, ExifTool): field mapping's, or a later brief.
- **The Customer Portal's access rules:** roadmap M-10.

## Checks

**Before production,** the AI Coding Engine verifies against stage: that listing returns
`user_metadata`; whether a Supabase bucket can be renamed (if not, a namespace keeps its name in a
marker object, as a bucket does); and that a signed URL serves the stored content type with
`X-Content-Type-Options: nosniff`.

`deno task check`, `deno task fmt:check`, `deno task test` (the two environment-dependent files
excluded); `STYLE_AUDIT`; the provider passes the contract's tests against stage. The CA runs
`app-deploy-storage-config` and `db-reset` against stage, then verifies in Admin: a document
attached on one device opens on another after it drains; a signed-out tab drains nothing.

## Records

- `architecture-back.md` §4.7: storage policies and the rename function, in their own file.
- `architecture-devops.md`: a section on storage configuration, as §13 is for Auth; the new tasks
  in §10; `DOCUMENT_SERVER_DB_NAME` out of §4.2 and §12.4.
- `architecture-front.md` §9.5.1: the `DOCUMENT_SERVER_DB_NAME` row retires.

## Design history

- **2026-10-30, a brief of its own.** The document storage brief carried the Supabase provider, its
  configuration and policies, and the CLI, and ACE's review found every blocker there. A first
  provider in IndexedDB needs none of them, so the kernel closes without them, and this provider
  became its own brief, the one that must pass the contract's test as a remote store.
- **2026-10-30, Storage keeps its own nodes.** The first draft kept nodes in a Postgres table and
  bytes in one physical bucket keyed by document id, the pattern Rails' Active Storage uses: a
  table, its RLS, and the policies in `back/`. Supabase Storage carries custom metadata on its
  objects, as `auth.users` does on its users, so the provider uses it instead: a namespace is a
  Supabase bucket, a bucket a prefix with a marker, a document an object. Placement became the
  Supabase bucket's settings, and `back/` became the policies and one rename function. Locating a
  node by a bare id would have needed a second function; identity became lineage instead (the
  document storage brief, 2026-10-30).
- **2026-10-30, soft delete is not the store's.** Soft delete belongs to the domain's records, an
  abstraction over a relational database, and the document store is neither. It removes its nodes
  and bytes physically.
- **2026-11-04, `DocumentServer`.** The provider became `DocumentServer`, the shared store in each
  app's composition, and its creates became idempotent at every level, for the supplied namespace
  and bucket ids the catalog uses.
- **2026-11-06, a provider, not a maker.** A document store is `DocumentStore` constructed over a
  provider class per binding (the attachments brief), so this brief's maker became
  `SupabaseDocumentProvider`.
- **2026-11-09, the sweep's home.** The document storage brief gave this brief sweeps of orphaned
  bytes, while items 4–6 waited on the broker, which no brief holds. The sweep of unreferenced
  documents is backlog B-42; items 4–6 arrive with whichever of the two comes first.
- **2026-11-10, access moves here from the upload brief,** which builds against the IndexedDB
  stand-in, where no access rules exist; and **the drain waits for a session,** settled at the
  upload brief's closure.
- **2026-11-10, reviewed in the DevOps context.** The swap into `api.ts` and the retiring key joined
  the scope. Namespaces became provisioned by a storage contract and task on Auth's pattern, not
  created at runtime. The policies left `schema.sql` for a file of their own. Refusals for size and
  type became 413 and 415. The CLI and resumable uploads left the brief; plain uploads and the 50 MB
  cap stay. The design moments became decisions; the checks to verify moved to Checks.
- **2026-11-10, the namespace ids' one home.** The provisioning task needs the ids `Attachments`
  keeps private. Restating them in the contract, with a check comparing the two, and moving them to
  configuration were considered. They are not configuration: an id is written into every stored
  reference, as `APP_STATE_ID` is a constant in `app-state.ts` while `LOCAL_DB_NAME` is configured.
  `Attachments.namespaces` exposes the four, read-only, and `AttachmentFormats.contentTypes()` the
  content types, so the task reads each fact where it lives.
