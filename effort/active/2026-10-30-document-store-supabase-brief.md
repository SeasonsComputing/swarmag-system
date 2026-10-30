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

`core/db/document-store-supabase.ts`, beside `core/db/supabase.ts`, and what it needs to run, as
the database has its own needs beside `core/db/supabase.ts`: its node table, storage configuration,
storage policies, and reset, in `back/`, `devops/`, and Supabase's configuration. The CLI is here
too: it serves the back profile, which runs in Deno and has no IndexedDB.

## The provider

The repository's rule for the backend holds for storage: what can be a direct operation under RLS
is not an edge function (`architecture-back.md` §3). Supabase enforces RLS on its tables and on
`storage.objects` on the server, so policies give the provider its server-side check, and a client
reaches the provider through the kernel, as the CRUD clients reach theirs.

Supabase Storage is flat: objects under keys in physical buckets, with no hierarchy of its own. So
the provider keeps the nodes in Postgres and the bytes in Storage.

1. **Nodes, one table.** Every level in one table, its parent enforced by a foreign key:

   ```sql
   create table document_nodes (
     id          uuid primary key,
     parent_id   uuid references document_nodes (id) on delete restrict,
     level       text not null check (level in ('namespace', 'bucket', 'document')),
     name        text not null,
     size        bigint,
     created_at  timestamptz not null default now()
   );
   create index on document_nodes (parent_id, name);
   ```

   A namespace has no parent; `size` is a document's only.
2. **Bytes, one physical bucket.** A document's bytes are the object keyed by its id, in one
   physical bucket for the default placement. The content type is set on upload and served with
   the bytes.
3. **Counts are queried,** a container's children or a document's size, never stored, so they
   cannot drift.
4. **Empty-only delete is the database's.** The foreign key's `restrict` refuses a container with
   children, under any concurrency.
5. **Bytes first, then the node.** A document's create uploads the bytes, then writes its node. If
   the node's write fails, the bytes are invisible, and the deferred sweep can collect them; the
   other order would leave a visible document with nothing behind it.
6. **Idempotent create.** A document's node is inserted on conflict do nothing. A node with the
   same id under another bucket is a conflict (the document storage brief, platform point 2).
7. **Links.** `link` is a signed URL whose expiry, the kernel's default, is fixed when it is issued.
   A signed URL is not revocable.

| Operation                    | Postgres                                 | Storage         |
| ---------------------------- | ---------------------------------------- | --------------- |
| namespace or bucket `create` | insert the node                          |                 |
| document `create`            | insert the node, after the bytes         | upload `{id}`   |
| `get`                        | select by id; count its children or size |                 |
| `find`                       | select by parent and name                |                 |
| `list`                       | select by parent                         |                 |
| `update`                     | update the name                          |                 |
| container `delete`           | delete the node; `restrict` refuses      |                 |
| document `delete`            | delete the node                          | remove `{id}`   |
| `read`                       |                                          | download `{id}` |
| `link`                       |                                          | sign `{id}`     |

## The review's findings

| Finding              | Disposition                                                  |
| -------------------- | ------------------------------------------------------------ |
| Link lifetime        | Settled: fixed when issued; not revocable (point 7)          |
| Provider persistence | Settled: the node table and one physical bucket (points 1–2) |
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

1. **Storage configuration.** The physical bucket, file size limit, MIME restrictions, and the S3
   protocol switch: local in `config.toml`, hosted in a per-target contract, applied by a task and
   verified by reading back.
2. **Storage policies.** RLS on the node table, and SQL on `storage.objects`, a schema Supabase
   manages as it does `auth`. M-5 starts from a baseline, signed-in users only; the rules swarmAg's
   namespaces need are specified by the attachments brief and written here.
3. **Genesis and reset.** `db-genesis` resets the database and leaves stored objects behind, so a
   stage reset leaves documents whose nodes no longer exist. Supabase does not allow deleting
   objects by SQL (verify), so a storage reset empties the physical bucket through the Storage
   API, and joins `db-reset` with its verification.

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

1. **Policy ownership.** Where the node table's SQL and the storage policies live: `schema.sql`,
   as genesis owns the `auth.users` seeds, or a file of their own beside it.
2. **Uploads.** Signed and resumable uploads (TUS), and the free plan's 50 MB file cap.
3. **Placement.** How the default placement, and later placements, map namespaces onto physical
   buckets.
4. **The CLI's location.**
5. **Soft delete. Settled 2026-10-30:** soft delete belongs to the domain's records, an abstraction
   over a relational database, and the document store is neither. It removes its nodes and bytes
   physically; the node table is the provider's implementation, not a domain record.

## Records

Storage policies earn a section in `architecture-back.md` beside Row Level Security (§4.3), and
storage configuration a section in `architecture-devops.md`, as Auth has (§13). Both documents are
locked; the CA opens them for this brief's production, recorded here, as he does `domain/`.

## Design history

- **2026-10-30, a brief of its own.** The document storage brief carried the Supabase provider, its
  configuration and policies, and the CLI, and ACE's review found every blocker there. A first
  provider in IndexedDB needs none of them, so the kernel closes without them, and this provider
  became its own brief, the one that must pass the contract's test as a remote store. Its metadata
  is a Postgres node table, since Supabase Storage is flat, with the bytes in Storage keyed by
  document id, the pattern Rails' Active Storage uses.
