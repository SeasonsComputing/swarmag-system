# Document Store Supabase Provider — Brief

**Active, draft.** Recorded 2026-10-30 from a CA + AI Architect session, split from the document
storage brief, `effort/active/2026-10-23-document-storage-brief.md`, which is the kernel and the
contract this provider implements. The attachments brief,
`effort/active/2026-10-29-attachments-brief.md`, depends on this one for documents shared across
devices. Awaits the design moments, CA review, and the production gate.

## What triggered it

The kernel's first provider, IndexedDB, keeps documents in one browser. Documents shared across
devices and people need a server: an SDS uploaded at a desk and read in the field, a customer's
photos seen in the portal. ACE's review of the document storage brief found it blocked on link
lifetime, provider persistence, policy ownership, and reset, and all four are this provider's.

## Scope

`core/db/document-store-supabase.ts`, beside `core/db/supabase.ts`, and what it needs to run, as the
database has its own needs beside `core/db/supabase.ts`: storage configuration, storage policies,
its one function, and reset, in `back/`, `devops/`, and Supabase's configuration. The CLI is here
too: it serves the back profile, which runs in Deno and has no IndexedDB.

## The provider

The repository's rule for the backend holds for storage: what can be a direct operation under RLS
is not an edge function (`architecture-back.md` §3). Supabase enforces RLS on its tables and on
`storage.objects` on the server, so policies give the provider its server-side check, and a client
reaches the provider through the kernel, as the CRUD clients reach theirs.

Supabase Storage keeps its own nodes, so the provider keeps no table. Storage is flat: objects
under keys in Supabase buckets. It records each object's size, content type, and creation time,
and carries custom metadata, `user_metadata`, set at upload, as `auth.users` carries metadata for
an application's users. A node's id is its lineage (the document storage brief, platform point 2),
so every id locates its node directly.

1. **A namespace is a Supabase bucket,** whose id is the namespace's id. Placement is the Supabase
   bucket's own settings (file size limit, MIME types, public access), so a namespace binds its
   placement directly. If a Supabase bucket cannot be renamed, the namespace keeps its name in a
   marker object, as a bucket does (to verify).
2. **A bucket is a key prefix,** `{bucket}/`, with a marker object, `{bucket}/.bucket`, whose
   `user_metadata` holds the bucket's name and whose creation time is the bucket's.
3. **A document is an object,** `{bucket}/{document}` in its namespace's Supabase bucket, its name
   in `user_metadata`. Its size and content type are Storage's, set on upload and served with the
   bytes.
4. **Counts are never stored,** so they cannot drift: a container's is listed, a document's is
   its size.
5. **`find` lists and filters.** Storage's API cannot query `user_metadata`, so `find` lists the
   parent and keeps the matching names; swarmAg's buckets are small.
6. **Empty-only delete.** Supabase refuses to delete a non-empty Supabase bucket, so a namespace's
   is native. A bucket's is the provider's: it lists the prefix and removes the marker only if
   nothing else is there. The check and the removal are not atomic; a document arriving during a
   bucket's deletion is the race, and bucket deletion is rare and deliberate. An RPC that makes it
   atomic is a later piece, if the race ever matters.
7. **Rename is one function.** Storage's API cannot update `user_metadata` after upload, so a
   Postgres function updates it, called by RPC: the provider's only code in `back/`.
8. **Idempotent create.** A document's create uploads without overwrite; if its object already
   exists, the create returns the existing document.
9. **Links.** `link` is a signed URL whose expiry, the kernel's default, is fixed when it is issued.
   A signed URL is not revocable.

| Operation          | Storage                                                    |
| ------------------ | ---------------------------------------------------------- |
| namespace `create` | create the Supabase bucket                                 |
| bucket `create`    | upload the marker, its name in `user_metadata`             |
| document `create`  | upload `{bucket}/{document}`, its name in `user_metadata`  |
| `get`              | the Supabase bucket, the marker, or the object             |
| `find`, `list`     | list the parent                                            |
| `update`           | the rename function                                        |
| `delete`           | remove; a bucket's only when its prefix is otherwise empty |
| `read`             | download                                                   |
| `link`             | sign                                                       |

## The review's findings

| Finding              | Disposition                                                  |
| -------------------- | ------------------------------------------------------------ |
| Link lifetime        | Settled: fixed when issued; not revocable (point 9)          |
| Provider persistence | Settled: Storage's own metadata (points 1–3)                 |
| Identity             | The kernel's: the document storage brief, points 2 and 4     |
| Policy ownership     | Open (design moment 1)                                       |
| Reset sequencing     | Settled: through the Storage API (DevOps 3)                  |
| Soft delete          | Settled: not the store's (design moment 5)                   |

## The CLI

`document-store {noun} {verb}`, one to one with the contract; its table is in the document storage
brief. It is the back profile's first consumer, and runs over this provider.

## DevOps

Storage is the first platform service since Auth that the repository must own, and it is a
feature set of its own. Auth's configuration sets the pattern (`architecture-devops.md` §13): the
repository is authoritative, not the dashboard; `config.toml` owns local behavior, a per-target
contract owns hosted behavior, and a task applies it and reads back every value. Nothing of this
exists for storage: `config.toml`'s `[storage]` block is the scaffold default (50 MiB, no buckets),
and the architecture documents name storage only in passing.

1. **Storage configuration.** Supabase bucket defaults, file size limit, MIME restrictions, and the
   S3 protocol switch: local in `config.toml`, hosted in a per-target contract, applied by a task
   and verified by reading back.
2. **Storage policies.** SQL on `storage.objects` and `storage.buckets`, a schema Supabase manages
   as it does `auth`, with the rename function beside them. M-5 starts from a baseline, signed-in
   users only; the rules swarmAg's namespaces need are specified by the attachments brief and
   written here.
3. **Genesis and reset.** `db-genesis` resets the database and leaves stored objects behind, so a
   stage reset leaves documents whose records no longer exist. A trigger on Supabase's storage
   tables refuses deletion by SQL, which would leave the files behind, so a storage reset empties
   the Supabase buckets through the Storage API, and joins `db-reset` with its verification.

Items 4–6 arrive with the broker; M-5 needs 1–3 and 7.

4. **Cron.** The `pg_cron` and `pg_net` extensions, the job definitions, and the credential the job
   uses to call the sweep entry point, held in Vault. Open: where the job definitions live and how
   each target receives them.
5. **Secrets and runtime configuration.** Secret Registry entries (§5) and edge runtime
   configuration (§4.4): the Cron credential now; the archive's S3 credentials and the provider
   selection later.
6. **Edge deployment.** The broker and the sweep, one service with two entry points, deploy through
   `edge-deploy` and its verification (§8.6). Stage integration tests remove the objects they
   write.
7. **Free-tier usage.** Keeping infrastructure at $0 means watching the 1 GB limit: a task reports
   storage usage per target.
8. **The import node** (ODM, GDAL, ExifTool) is a deployable outside Supabase, and not this brief's:
   it belongs with field mapping or a later brief of its own.

The production is Foundation mode and reads the DevOps context beside Base.

## Design moments

1. **Policy ownership.** Where the storage policies and the rename function live: `schema.sql`,
   as genesis owns the `auth.users` seeds, or a file of their own beside it.
2. **Uploads.** Signed and resumable uploads (TUS), and the free plan's 50 MB file cap.
3. **Placement. Settled 2026-10-30:** a namespace is a Supabase bucket, and its placement is that
   bucket's settings.
4. **The CLI's location.**
5. **Soft delete. Settled 2026-10-30:** soft delete belongs to the domain's records, an abstraction
   over a relational database, and the document store is neither. It removes its nodes and bytes
   physically.
6. **To verify,** before production: that listing returns `user_metadata`, and whether a Supabase
   bucket can be renamed.

## Records

Storage policies earn a section in `architecture-back.md` beside Row Level Security (§4.3), and
storage configuration a section in `architecture-devops.md`, as Auth has (§13). Both documents are
locked; the CA opens them for this brief's production, recorded here, as he does `domain/`.

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
