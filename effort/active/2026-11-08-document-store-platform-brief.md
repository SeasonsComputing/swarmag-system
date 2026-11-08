# Document Store Platform — Brief

**Active, draft.** An enabler of roadmap M-6, consumed by
`effort/active/2026-11-08-attachments-brief.md`. Foundation mode.

**Its changes are within `core/` only,** with their tests in `source/tests/`. A need outside
`core/` is an escalation, not a change this brief makes.

## What triggered it

Designing attachments found four things the document store platform does not yet do:

1. **Several document stores on one device.** An app composes an inbox and, until the Supabase
   provider ships, a stand-in server store; Ops later adds the Field Binder. Every IndexedDB
   document store registers the same two object stores in the app's database, so two stores would
   share storage.
2. **Supplied ids at every level.** A catalog fixes namespace ids and names a bucket by its owner's
   id, so an address is known before anything is stored. Only `document.create` takes an id.
3. **A store is an instance, not generated code.** CONVENTIONS §10.1: a maker "does not create an
   instance of an object; it creates code". `makeDocumentStoreIndexedDbClient` constructs a provider
   and hands it to the kernel: a factory under a maker's name.
4. **A URL check.** URL fields are edited in the UX, and `core/std` has no URL validator.

## What the repository holds

- **The shipped design:** `effort/completed/2026-10-23-document-storage-brief.md` records the
  kernel and the IndexedDB provider as they stand.
- **The kernel:** `core/cli/make-docstore-client.ts`, `makeDocumentStore(provider, linkLifetime)`,
  closures over an internal provider contract.
- **The IndexedDB provider:** `core/cli/make-indexeddb-docstore-client.ts`, a provider class and
  `makeDocumentStoreIndexedDbClient`, which registers `DocumentNodes` and `DocumentContent` in the
  app's database.
- **The contract:** `core/std/docstore-contract.ts`. `namespace.create(name)` and
  `bucket.create(parent, name)` take no id (lines 172, 177); `document.create` takes an optional
  id (line 182). `DocumentProviderContract` is described as internal.
- **The wrapper:** `core/db/indexeddb.ts`. `registerStore` and `connection` serve one database,
  named by `Config.get('LOCAL_DB_NAME')`; registration happens at module evaluation, after each
  app's root initializes `Config`.
- **Validators:** `core/std/validators.ts` has no URL check.
- **Consumers:** none outside `core/` and its tests.
- **The documentation already describes the result:** CONVENTIONS §10.8 and §13 (1.13),
  `architecture-front.md` §9.5.1, `architecture-back.md` §4.7.

## Decisions

1. **A store is composed.** `DocumentStore`, the kernel, is a class implementing
   `ApiDocumentStoreContract`, constructed over a provider:
   `new DocumentStore(provider, { linkLifetime })`. A provider is a class per binding implementing
   `DocumentProviderContract`, which becomes public (CONVENTIONS §8.3, `DenoProvider`'s form). The
   files are named for what they hold.
2. **Supplied ids at every level.** `namespace.create` and `bucket.create` take an optional id, as
   `document.create` does. Identity is lineage: creating at an existing lineage returns the node
   there, at every level, and a differing name is ignored. A name is a label, checked only for its
   format. Without an id, the kernel mints one.
3. **A database per document store.** Each IndexedDB document store is a database of its own, named
   by a config key, with fixed object stores `Nodes` and `Content`. The wrapper's `registerStore`
   and `connection` take an optional config key, defaulting to `LOCAL_DB_NAME`, so every current
   caller is unchanged. The provider takes the key: `new IndexedDbDocumentProvider(dbKey)`.
4. **URL validators.** `UrlScheme`, `isUrl(value, schemes)`, and
   `expectUrl(value, field, schemes, optional = false)`, parameterized by scheme as `isConstEnum` is
   by its values; schemes have no default. Each joins its family's section of `validators.ts`.

```ts
// core/cli/docstore-client.ts
export class DocumentStore implements ApiDocumentStoreContract {
  constructor(provider: DocumentProviderContract, settings: { linkLifetime: number })
}

// core/cli/indexeddb-docstore-provider.ts
export class IndexedDbDocumentProvider implements DocumentProviderContract {
  constructor(dbKey: string) // registers Nodes and Content in its own database
}

// core/db/indexeddb.ts
static registerStore(storeName: string, specification: IndexedDbStore = {}, dbKey = 'LOCAL_DB_NAME')
static connection(dbKey = 'LOCAL_DB_NAME'): Promise<IDBPDatabase>

// core/std/validators.ts
export type UrlScheme = 'http' | 'https' | 'mailto' | 'tel' | 'ftp' | 'data' | 'blob'
export const isUrl = (value: unknown, schemes: readonly UrlScheme[]): value is string => …
```

## Production scope

| Where                                                                           | Change                                                               |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `core/cli/make-docstore-client.ts` → `docstore-client.ts`                       | `DocumentStore`, a class; supplied ids at every level                |
| `core/cli/make-indexeddb-docstore-client.ts` → `indexeddb-docstore-provider.ts` | `IndexedDbDocumentProvider(dbKey)`; `Nodes`, `Content`; idempotent   |
| `core/std/docstore-contract.ts`                                                 | `id?` on namespace and bucket `create`; the provider contract public |
| `core/db/indexeddb.ts`                                                          | An optional config key on `registerStore` and `connection`           |
| `core/std/validators.ts`                                                        | `UrlScheme`, `isUrl`, `expectUrl`                                    |
| `source/tests/`                                                                 | The tests below                                                      |

**Records:** `core/` is locked; the CA opens exactly the five files above for this brief.

**Unchanged:** everything outside `core/` and its tests; within `core/`, the create protocol
(`protocols.ts`), `makeScope`, and the CRUD makers.

## Checks

- The kernel over an in-memory provider: names, addresses, minted and supplied ids, resolution.
- Create with a supplied id at each level; a second create at the same lineage returns the first
  node; a differing name is ignored.
- Two document stores under two config keys do not see each other's nodes; the app's database is
  untouched.
- `isUrl` accepts a URL with a given scheme and rejects other schemes, relative paths, and
  non-strings.
- The IndexedDB provider in a real browser: isolation, supplied ids, repeated create, bytes, links,
  deletion.
- `deno task check`, `deno task fmt:check`, `deno task test` (the two stage-environment tests
  excluded); `STYLE_AUDIT`.

## Design history

- **2026-11-04 to 2026-11-06,** designed as the attachments brief's platform prerequisites:
  supplied ids for the catalog, a database per store for several stores on a device, the composed
  store when the maker was found to be a factory, and the URL check for `UrlField`.
- **2026-11-08, a brief of its own.** A production carried these with a change to the shared create
  contract, written into the feature's amendment as a sentence; it was withdrawn. Separating the
  platform from the feature makes each brief's boundary a rule: this one changes `core/` only.
