# Document Store Supabase Provider — Brief

**Completed 2026-11-10.** Shipped in `81ce07c`, with the architecture records in `e64e17b`. Recorded
2026-10-30 from a CA + AI Architect session, split
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
3. _[Extended by the amendment "After AI Coding Engine review", item 5.]_ **The drain waits for a session:** Admin's `DocumentDrain` starts once a session is prepared.
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

1. _[Extended by the amendment "After AI Coding Engine review", item 2.]_ **A namespace is a Supabase bucket,** whose id is the namespace's id. Its placement is the
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
5. _[Revised by the amendment "After AI Coding Engine review", item 3.]_ **`find` lists and filters.** Storage's API cannot query `user_metadata`, so `find` lists the
   parent and keeps the matching names; swarmAg's buckets are small.
6. **Empty-only delete.** Supabase refuses to delete a non-empty Supabase bucket, so a namespace's
   is native. A bucket's is the provider's: it lists the prefix and removes the marker only if
   nothing else is there. The check and the removal are not atomic; a document arriving during a
   bucket's deletion is the race, and bucket deletion is rare and deliberate.
7. _[Revised by the amendment "After AI Coding Engine review", item 1.]_ **Rename is one function.** Storage's API cannot update `user_metadata` after upload, so a
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
2. _[Revised by the amendment "After AI Coding Engine review", item 1.]_ **Storage policies and the rename function,** in a file of their own under `back/`, which
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
| `back/`                                             | Storage policies (amendment item 1: no rename function)               |
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

_[Revised by the amendment "After AI Coding Engine review", item 4, and "After scope review", item 2.]_ **Before production,** the AI Coding Engine verifies against stage: that listing returns
`user_metadata`; whether a Supabase bucket can be renamed (if not, a namespace keeps its name in a
marker object, as a bucket does); and that a signed URL serves the stored content type with
`X-Content-Type-Options: nosniff`.

`deno task check`, `deno task fmt:check`, `deno task test` (the two environment-dependent files
excluded); `STYLE_AUDIT`; the provider passes the contract's tests against stage. _[Extended by the amendment "After the AI
Coding Engine's escalation", item 3.]_ The CA runs
`app-deploy-storage-config` and `db-reset` against stage, then verifies in Admin: a document
attached on one device opens on another after it drains; a signed-out tab drains nothing.

## Records

- `architecture-back.md` §4.7: storage policies and the rename function, in their own file.
- `architecture-devops.md`: a section on storage configuration, as §13 is for Auth; the new tasks
  in §10; `DOCUMENT_SERVER_DB_NAME` out of §4.2 and §12.4.
- `architecture-front.md` §9.5.1: the `DOCUMENT_SERVER_DB_NAME` row retires.

## Amendment — 2026-11-10 — After AI Coding Engine review

The review blocked on rename, which wrote `user_metadata` by SQL against Supabase's guidance that
its storage tables are read-only, and on unverified Storage behavior. A spike against local
Supabase, 2026-11-10, settled both.

1. **Rename is a copy onto the same key, through Storage's API.** `POST /object/copy` with the
   source and destination keys equal, `copyMetadata: false`, the new name in the `x-metadata`
   header (base64 JSON), and `x-upsert: true`. The spike renamed a document with its key, object
   id, bytes (eTag), and content type unchanged; Storage records a new internal version. No SQL
   function exists, so `back/` holds the storage policies alone. A bucket renames its marker the
   same way.
2. **A namespace is not renamed at runtime.** Its name comes from `Attachments.namespaces` through
   provisioning; the provider's namespace `update` is refused (405). No namespace marker exists.
3. **Names come from `info`, not from listings.** Neither `list` nor `listV2` returns
   `user_metadata`; `info` does. `list` and `find` page the parent (100 per page) and read each
   object's name with `info`. Nothing in M-6 lists the server; the sweep and the CLI bear the cost.
4. _[Revised by the amendment "After scope review", item 2.]_ **Headers.** A signed URL serves the stored content type. Local Supabase sends no
   `X-Content-Type-Options: nosniff`; before production, one request against stage shows whether
   hosted Supabase adds it. If it does not, the CA accepts the gap: a type the format table
   assigned is never one a browser renders as a page.
5. **Scope details from the review:**
   - **The drain checks for a session before every pass,** including after sign-out, and
     `DocumentDrain.start()` is idempotent, so signing in again never starts a second loop.
     `front/app-admin/app.tsx` joins the scope.
   - **`DOCUMENT_SERVER_DB_NAME` retires from the test configuration and fixtures** too.
   - **Every listing paginates,** for counts, lookup, deletion, reset, and the usage report.
   - _[Revised by the amendment "After scope review", item 3.]_ **The contract tests gain a stage form** that works within the provisioned namespaces and
     removes what it writes, in place of creating and deleting arbitrary namespaces.
   - **The architecture records lead the code.** `architecture-core.md` §10.4 is reconciled:
     `Library` is read by every staff role until the Customer Portal's rules (M-10), and the
     catalog is private but for the namespaces it exposes, read-only, to provisioning.

## Amendment — 2026-11-10 — After scope review

1. **The architecture records are written,** in `e64e17b`, and the production builds to them; a
   need for them to say otherwise is an escalation, not an edit the production makes.
2. **The hosted header check comes at provisioning,** not before production: a signed response on
   stage needs an object in a provisioned Supabase bucket. Right after the CA runs
   `app-deploy-storage-config` against stage, and before the CA's acceptance in Admin, one signed
   response is inspected for its content type and `X-Content-Type-Options: nosniff`; a missing
   header is the gap item 4 of "After AI Coding Engine review" accepts.
3. **Denied access is tested signed out.** The stage contract tests show the policies refusing a
   caller with no session. A customer-role caller would need a second seeded identity, a change to
   `schema.sql` this brief does not make; the customer's case comes with the Customer Portal's
   rules (roadmap M-10).
4. **A marker is an empty `text/plain` object,** a type the format table accepts, so a Supabase
   bucket's allowed types admit it. Markers stay out of counts and listings.
5. **A rename keeps `createdAt`.** The spike showed the object's creation time unchanged after the
   copy; the production verifies it.

## Amendment — 2026-11-10 — After the AI Coding Engine's escalation

1. **Rename goes through `Supabase.storageRequest`.** The SDK's `copy()` cannot send a custom name
   or the overwrite flag, in 2.108.1, in the 2.119.0 release, or on its development branch; with
   `copyMetadata: false` it drops custom metadata. The CA authorizes one additive static in
   `core/db/supabase.ts`, beside `client()`: an authenticated Storage REST request, under the given
   client's session so storage policies see the caller, for what the SDK cannot express. Rename is
   its one caller; every other operation stays on the SDK.

   ```ts
   static async storageRequest(client: SupabaseClient, path: string, init: RequestInit): Promise<Response>
   ```

   ```ts
   await Supabase.storageRequest(this.#client, 'object/copy', {
     method: 'POST',
     headers: {
       'content-type': 'application/json',
       'x-upsert': 'true',
       'x-metadata': btoa(JSON.stringify({ name }))
     },
     body: JSON.stringify({ bucketId, sourceKey: path, destinationKey: path, copyMetadata: false })
   })
   ```

2. **The SDK moves to 2.119.0.** The import map pins `@supabase/supabase-js@2.108.1` and the
   lockfile records 2.89.0; the production pins 2.119.0 in `deno.jsonc` and the edge import maps
   kept in step with it (`architecture-core.md` §3.2.4), reconciles the lockfile, and runs the full
   checks. `core/db/supabase.ts` and the version pins join the scope.
3. **The edge functions are redeployed.** They run on the same SDK, so after the production the CA
   deploys `user-create`, `user-update`, `user-delete`, and `user-eject` to stage
   (`architecture-devops.md` §8.5), and the AI Architect verifies them (§8.6): each `ACTIVE` with
   `verify_jwt`, OPTIONS 204, GET 405, and the new build stamp. This joins the CA's operations in
   Checks, before acceptance in Admin.

## Amendment — 2026-11-10 — After production review

The AI Architect reviewed the production under strict scrutiny and ran it against local Supabase:
provisioning, then every provider operation. Provisioning passes and repeats cleanly; create, the
repeated create, list, read, link, rename (a Unicode name, creation time and size kept), the 415
refusal, the 405 namespace rename, and empty-only deletion all behave, once item 1 is fixed.

1. **Names are read from `metadata`.** The SDK's `info()` returns the name under `metadata`, not
   `userMetadata`, so every `get`, `create`, and `list` failed against a real Storage. The tests
   passed because their mocked `info` response carried a `user_metadata` field Storage does not
   send. The provider reads `metadata`, and the mocks answer with Storage's real shape, as the
   local spike recorded it.
2. **No runtime deletion of a namespace.** The policies granted the staff roles `DELETE` on
   `storage.buckets`, so the app could delete a provisioned namespace. That policy is removed;
   provisioning and reset, under the service key, are the only paths that add or remove one.
3. **The drain starts from the root, as declared.** `app.tsx` wrapped the session coordinator
   inline with a reactive effect, against the root's declarative form (CONVENTIONS §16.1). The root
   calls `DocumentDrain.start()` once after bootstrap; `start()` is idempotent and does not require
   a session, and each pass checks for one (amendment "After AI Coding Engine review", item 5).
4. **Composing `api` stays free of side effects.** `DocumentServer` called `Supabase.client()`
   while `api.ts` loaded, which is why four API test fixtures had to supply Supabase
   configuration. The provider takes `Supabase.client`, the getter, and calls it on first use; the
   fixtures return to what they were.
5. **A Storage status code outranks the message.** Error mapping matched message text before the
   response's status code. The status code decides; the text is the fallback when there is none.
6. **House form.** The provider holds its client as a `#private` field, as the other providers do,
   not as a constructor parameter property.
7. **`config.toml` keeps its explicit storage switches.** The brief said the `[storage]` block
   keeps only its switch and size limit; that meant no bucket declarations, not dropping the
   explicit `enabled = false` of `[storage.analytics]` and `[storage.vector]`. They are restored.
   The S3 protocol block stays removed.
8. **The sign-out test.** The stage-session test now expects five sign-out requests, not seven.
   The production states the SDK change that caused it.

## Closure (2026-11-10)

Production by the AI Coding Engine in two rounds, the second after the amendment "After production
review"; committed in `81ce07c`. Verified:

- **Against local Supabase,** by the AI Architect: provisioning, run twice, and every provider
  operation, unpatched: idempotent creates, listings, rename keeping name, creation time, and size,
  read, link, and the 415, 405, and 409 refusals.
- **The repository checks,** re-run by the AI Architect: guards, types, lint, formatting, and 201
  tests, the two environment-dependent files excluded; `STYLE_AUDIT: PASS`.
- **On stage,** by the CA: storage provisioning, `db-reset` with the storage reset and the policies,
  the edge redeploy, and the stage contract test (1 passed), which includes the signed-out refusal.
- **On stage,** by the AI Architect: the four edge functions `ACTIVE` with `verify_jwt`, OPTIONS 204,
  GET 405, and build `0.1.1375+81ce07c`; the four namespaces as the contract declares them; and a
  signed response carrying the stored content type and `X-Content-Type-Options: nosniff`, so the
  gap item 4 of "After AI Coding Engine review" anticipated does not arise.

The CA closed the brief on that evidence and his own use of Admin.

Settled at closure:

- **The CLI:** backlog B-44.
- **Resumable uploads (TUS):** the field mapping brief, `effort/pending/2026-10-24-field-mapping-brief.md`,
  design moment 6.
- **Cron, secrets, the broker, and the sweep:** backlog B-42.
- **The import node:** the field mapping brief.
- **The customer role's storage access:** the Customer Portal brief,
  `effort/pending/2026-10-08-customer-portal-brief.md`, Open 7.
- **Showing a document that cannot upload:** the background tasks brief,
  `effort/pending/2026-11-10-background-tasks-brief.md`.
- **The CLI's `import_map` deprecation warning,** seen at the edge redeploy: backlog B-45.

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
