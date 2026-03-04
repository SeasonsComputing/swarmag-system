# swarmAg Operations System — Coding Style Guide, Standards & Conventions

![swarmAg ops logo](../../swarmag-ops-logo.png)

## 1. Overview

This guide is the authoritative reference for coding standards and conventions throughout the `swarmAg System` codebase.
In case of conflict, the `CONSTITUTION.md` takes precedence.

Code that conflicts with this guide is wrong — not the guide.

## 2. Language & Tooling

| Item            | Guideline                                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime         | Deno with strict TypeScript (`deno task check`)                                                                                                         |
| Encoding        | ASCII only; no non-ASCII literals                                                                                                                       |
| Types           | Use `type` for data shapes, abstractions, aliases, and unions; use `interface` only for encapsulated API contracts that something explicitly implements |
| Primitives/ADTs | Use `Id` (UUID v7 string), `When` (ISO 8601 UTC string), `StringSet`, `Dictionary` and `StringDictionary` from `@core-std`                              |

## 3. Import Aliases

All cross-boundary imports use path aliases defined in `deno.jsonc`. Never use relative imports across top-level namespaces.

### 3.1 Primary top-level aliases

| Alias      | Resolves to      |
| ---------- | ---------------- |
| `@core/`   | `source/core/`   |
| `@domain/` | `source/domain/` |
| `@back/`   | `source/back/`   |
| `@ux/`     | `source/ux/`     |
| `@devops/` | `source/devops/` |
| `@tests/`  | `source/tests/`  |

### 3.2 Convenience barrel aliases

| Alias       | Resolves to              |
| ----------- | ------------------------ |
| `@core-std` | `source/core/std/std.ts` |
| `@ux-api`   | `source/ux/api/api.ts`   |

### 3.3 Deployment package aliases

| Alias                  | Resolves to                  |
| ---------------------- | ---------------------------- |
| `@back-supabase-edge/` | `source/back/supabase-edge/` |
| `@ux-app-ops/`         | `source/ux/app-ops/`         |
| `@ux-app-admin/`       | `source/ux/app-admin/`       |
| `@ux-app-customer/`    | `source/ux/app-customer/`    |

### 3.4 Vendor aliases

| Alias              | Resolves to                              |
| ------------------ | ---------------------------------------- |
| `@supabase-client` | `https://esm.sh/@supabase/supabase-js@2` |

## 4. Naming Conventions

### 4.1 The single commandment

Minimize visual noise. Every naming rule derives from this. Names must be immediately readable, carry no redundant weight, and signal meaning through structure rather than decoration.

### 4.2 Symbol classes

Each symbol class has one casing convention. All words — regardless of their natural language form — are transformed into the convention for their class. There are no special cases for acronyms, abbreviations, or domain shorthand. The symbol class determines the transformation.

| Symbol class                                             | Convention      | Example                                   |
| -------------------------------------------------------- | --------------- | ----------------------------------------- |
| File names                                               | kebab-case      | `job-adapter.ts`, `api-config.ts`         |
| Types, type aliases, interfaces, classes, const-as-class | PascalCase      | `JobAssessment`, `ApiConfig`, `HttpCodes` |
| Functions, methods, arrow functions                      | camelCase       | `fromJobAssessment`, `apiClient`          |
| Global immutable constants                               | SCREAMING_SNAKE | `USER_ROLES`, `ASSET_STATUSES`            |
| SQL tables and columns                                   | snake_case      | `created_at`, `deleted_at`                |

### 4.3 The acronym corollary

Acronyms are not a special case — they are words, and words transform with their symbol class.

| Natural form | PascalCase | camelCase | kebab-case |
| ------------ | ---------- | --------- | ---------- |
| API          | `Api`      | `api`     | `api-`     |
| URL          | `Url`      | `url`     | `url-`     |
| ID           | `Id`       | `id`      | `id-`      |

### 4.4 Makers vs. wrappers

Factory functions that produce API clients are prefixed `make` and live in `make-*.ts` files. Handler adapters that wrap functions live in `wrap-*.ts` files. These are architecturally distinct; naming must reflect it.

## 5. Source Code Formatting

All TypeScript is formatted by `dprint` via `deno task fmt`. The formatter is authoritative — do not argue with it.

Two rules are non-negotiable and must be reflected in all code samples and generated code:

- **No semicolons** — statement terminators are omitted throughout
- **Single quotes** — string literals use `'...'` not `"..."`

These are enforced by `dprint.json` configuration and will cause `deno task fmt:check` to fail if violated.

## 6. Source Code File Format

Documentation intensity follows implementation complexity. The code speaks first; commentary fills only what the code cannot.

### 6.1 Spec files

The code is the documentation. Inline `/** */` comments only where a name alone is insufficient. No box, no dash-rules, no sections.

Example:

```typescript
/**
 * Domain models for assets in the swarmAg system.
 * Assets represent equipment and resources used in operations,
 * such as vehicles, sprayers, and drones.
 */

import type { AssociationOne, CompositionMany, Instantiable } from '@core-std'
import type { Note } from '@domain/abstractions/common.ts'

/** Reference type for categorizing assets. */
export type AssetType = Instantiable & {
  label: string
  active: boolean
}

/** Lifecycle and availability state. */
export const ASSET_STATUSES = ['active', 'maintenance', 'retired', 'reserved'] as const
export type AssetStatus = (typeof ASSET_STATUSES)[number]

/** Operational equipment or resource. */
export type Asset = Instantiable & {
  label: string
  description?: string
  serialNumber?: string
  type: AssociationOne<AssetType>
  status: AssetStatus
  notes: CompositionMany<Note>
}
```

### 6.2 Functional files

Files where behavior matters and the public surface benefits from a documented contract. A box header replaces the top JSDoc. JSDoc on exported functions where params or return values need prose. No section dividers needed — no significant private machinery to separate.

Example:

```typescript
/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Runtime configuration singleton                                             ║
║ Validated, fast-fail access to environment variables across all runtimes.   ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Initialized once at bootstrap with a runtime provider and a list of required
keys. All subsequent reads go through Config.get(). Throws immediately on
missing keys, double initialization, or unregistered access.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
Config.init(provider, keys, aliases?)  Initialize with provider and required keys
Config.get(name)                       Return required config value; throws if missing
Config.fail(msg)                       Throw never; use for invariant violations
*/
```

### 6.3 Non-trivial functional files

Complex implementations with a well-defined public surface and significant private machinery. Full decoration — box header, typed export signatures grouped by category, internals summary, runnable example.

Example:

```typescript
/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ HTTP handler wrapper                                                        ║
║ Normalizes Supabase Edge Function request/response lifecycle.               ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Wraps typed handler functions with CORS, body parsing, method validation,
error serialization, and response normalization.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
HttpHandler
  → (request: Request) → Promise<Response>
  → Wraps typed handler with CORS, body parsing, method validation,
    error serialization, and response normalization.

╔═════════════════════════════════════════════════════════════════════════════╗
║ INTERNALS                                                                   ║
╚═════════════════════════════════════════════════════════════════════════════╝
normalizeHeaders, parseRequestBody, makeCorsHeaders, serializeError
  → Private pipeline functions; not exported; no external contract.

EXAMPLE
───────────────────────────────────────────────────────────────────────────────
export default wrapHttpHandler(async (req) => {
  if (req.method !== 'POST') return toMethodNotAllowed()
  const user = await createUser(req.body)
  return toCreated(user)
}, { cors: true })
*/

import { ... } from '...'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC EXPORTS
// ────────────────────────────────────────────────────────────────────────────

export type HttpHandler = ...
export const toOk = ...
export const wrapHttpHandler = ...

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE IMPLEMENTATION
// ────────────────────────────────────────────────────────────────────────────

function normalizeHeaders() { ... }
function parseRequestBody() { ... }
```

### 6.4 Header rules

- Spec files carry no box, no dash-rules. Inline `/** */` only where the name is insufficient.
- Functional file box width: 77 characters. Title and description on consecutive lines — no blank lines inside the box.
- One blank line between the box close and PURPOSE.
- One blank line between PURPOSE prose and the next section label.
- One blank line between distinct subsection groups within EXPORTED APIs & TYPEs.
- No blank line between a section label and its dash-rule.
- No blank line between the dash-rule and its content.
- INTERNALS and EXAMPLE only when private implementation is non-trivial.
- EXAMPLE is valid, runnable TypeScript — not pseudocode.
- Headers stay current. A stale header is worse than no header.

### 6.5 Exported symbols

Exported symbols are always listed at the top of the file with non-exports below them.

### 6.6 Section divider header

Files with clear categories of declarations and functions divide the code body into sections, each with a section divider header. Consistent width, no variation:

```typescript
// ────────────────────────────────────────────────────────────────────────────
// {SECTION LABEL}
// ────────────────────────────────────────────────────────────────────────────
```

#### 6.6.1 Encapsulation & Information hiding

Files with a public API and implementation (internal) API are divided into sections: PUBLIC EXPORTS then PRIVATE INTERNALS:

```typescript
// ────────────────────────────────────────────────────────────────────────────
// PUBLIC EXPORTS
// ────────────────────────────────────────────────────────────────────────────

// ... exported types, functions, constants ...

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE INTERNALS
// ────────────────────────────────────────────────────────────────────────────

// ... unexported helpers ...
```

### 6.7 Comment conventions

| Context                       | Style                                                               |
| ----------------------------- | ------------------------------------------------------------------- |
| Spec file types               | Single-line `/** */` — one sentence, only when name is insufficient |
| Functional exported functions | JSDoc with `@param` and `@returns` for non-obvious args             |
| Private helpers               | Inline `//` — only when intent isn't obvious from the code          |
| Dead comments                 | Delete them. Version control exists.                                |

## 7. Code Tone

These are non-negotiable.

### 7.1 Explicit over clever

Code must be readable by a developer unfamiliar with the codebase. If it requires explanation, it requires refactoring or a comment.

### 7.2 Fast-fail

Validate at boundaries. Throw early with clear messages. Never proceed on bad state.

### 7.3 No defensive programming

Do not null-check values that cannot be null by contract. Do not write try/catch around code that should not fail. Trust the type system.

### 7.4 No payload-as-truth adapters

Adapters map column-by-column. There is no `payload` field that bypasses mapping. The domain type is the truth; the adapter derives it from storage columns.

### 7.5 No redundant exports

Export only what callers need. Private helpers stay private.

### 7.6 No magic

No implicit behavior, no runtime reflection, no metaprogramming. Configuration is explicit; providers are injected; contracts are stated in interfaces; structured data as types.

### 7.7 Prefer @core-std types

Use types and classes from `@core-std` instead of ad-hoc primitives and container generics.

| Prefer from `@core-std`   | Do not use                                                                 |
| ------------------------- | -------------------------------------------------------------------------- |
| `Dictionary<V = unknown>` | `Record<string, unknown>`                                                  |
| `StringDictionary`        | `Record<string, string>`                                                   |
| `StringSet`               | `Set<string>`                                                              |
| `Id`                      | raw `string` for identifiers                                               |
| `When`                    | raw `string` for ISO datetimes                                             |
| `Instantiable`            | inline `{ id, createdAt, updatedAt, deletedAt? }` lifecycle shape          |
| `CompositionOne<T>`       | ad-hoc tuple/array for exactly-one embedded composition                    |
| `CompositionOptional<T>`  | ad-hoc nullable/optional array for zero-or-one embedded composition        |
| `CompositionMany<T>`      | ad-hoc `T[]` where composition semantics are intended                      |
| `CompositionPositive<T>`  | ad-hoc non-empty array encodings (`[T, ...T[]]`) for composition semantics |
| `AssociationOne<T>`       | raw `Id` for required FK references                                        |
| `AssociationOptional<T>`  | raw `Id \| undefined` for optional FK references                           |
| `AssociationJunction<T>`  | raw `Id` in junction abstractions                                          |
| `ValidatorError`          | generic `Error` for validation failures                                    |

Rules:

- Import std primitives from `@core-std` only.
- Never declare `Record<string, unknown>`, `Record<string, string>`, or `Set<string>` outside `source/core/std/`.
- When narrowing unknown objects in guards, use `Dictionary` casts (`const x = v as Dictionary`) instead of `Record<string, unknown>`.
- Use `StringDictionary` for key/value string/string maps.

## 8. Configuration Pattern

The system uses a singleton `Config` with injected runtime providers. Defined in `@core/cfg/config.ts`; initialized once per deployment context.

### 8.1 Config initialization

```typescript
Config.init(provider, keys, aliases?)
```

- `provider` — runtime-specific `RuntimeProvider` instance (`SolidProvider`, `SupabaseProvider`, `DenoProvider`)
- `keys` — required environment variable names; fails fast at bootstrap if any are missing
- `aliases` — optional map of logical name to environment key; allows consuming code to use stable names regardless of platform-specific key prefixes

### 8.2 Why aliases matter

Vite requires client-side environment variables to be prefixed `VITE_`. Without aliases, every call site must know the prefix. With aliases, the bootstrap declares the mapping once and all consuming code uses the clean logical name:

```typescript
// source/ux/config/ux-config.ts
import { Config } from '@core/cfg/config.ts'
import { SolidProvider } from '@core/cfg/solid-provider.ts'

Config.init(new SolidProvider(), [
  'VITE_SUPABASE_EDGE_URL',
  'VITE_SUPABASE_RDBMS_URL',
  'VITE_SUPABASE_SERVICE_KEY',
  'VITE_JWT_SECRET'
], {
  'SUPABASE_EDGE_URL': 'VITE_SUPABASE_EDGE_URL',
  'SUPABASE_RDBMS_URL': 'VITE_SUPABASE_RDBMS_URL',
  'SUPABASE_SERVICE_KEY': 'VITE_SUPABASE_SERVICE_KEY',
  'JWT_SECRET': 'VITE_JWT_SECRET'
})

export { Config }
```

Consuming code calls `Config.get('SUPABASE_EDGE_URL')` — no `VITE_` prefix, no platform knowledge.

### 8.3 Rules

- `Config.init()` — call once at bootstrap; throws if called twice.
- `Config.get(name)` — resolves alias if present, then returns value; throws if not initialized, key not registered, or value missing. Never returns undefined.
- `Config.fail(msg)` — throws `never`; use for invariant violations.
- Never access `Deno.env` or `import.meta.env` directly. Always go through `Config.get()`.

## 9. Error Handling

- Throw `Error` with actionable messages: `'JobAssessment dictionary missing required field: jobId'`.
- Never swallow errors silently.
- Never log and continue — log and throw, or throw without logging.
- Never expose stack traces or internal state in HTTP responses.
- Use `toInternalError()` for unexpected server failures in edge functions.

## 10. Schema

General schema authoring conventions for canonical DDL (`source/domain/schema/schema.sql`).

### 10.1 Identifiers

- All table names, column names, constraint names, index names, and policy names use `snake_case`.
- Table names are plural nouns.
- No quoted identifiers.

### 10.2 Column ordering

Columns within a table follow this order:

1. `id` (primary key, always first)
2. Foreign key columns (`*_id`)
3. Domain columns
4. Lifecycle columns (`created_at`, `updated_at`, `deleted_at`)

### 10.3 Data types

| Domain type       | PostgreSQL type | Notes                                     |
| ----------------- | --------------- | ----------------------------------------- |
| `Id`              | `UUID`          | UUID v7; application-supplied, no default |
| `When`            | `TIMESTAMPTZ`   | Always timezone-aware; never `TIMESTAMP`  |
| `string`          | `TEXT`          | Never `VARCHAR(n)`                        |
| `number` (int)    | `INTEGER`       |                                           |
| `number` (float)  | `NUMERIC`       |                                           |
| `boolean`         | `BOOLEAN`       |                                           |
| `Composition*<T>` | `JSONB`         | Embedded subordinate; never normalized    |
| const-enum values | `TEXT`          | Constrained via named `CHECK`             |

### 10.4 NOT NULL discipline

- Required domain columns are `NOT NULL`.
- Optional domain fields are nullable.
- `updated_at` is `NOT NULL DEFAULT now()`.
- `deleted_at` is nullable.
- Junction foreign keys are `NOT NULL`.

### 10.5 CHECK constraints for const-enum columns

- Every const-enum-backed column has a named `CHECK` constraint.
- Constraint naming: `{table}_{column}_check`.

### 10.6 Foreign key cascade policies

| Relationship type             | Policy               | Rationale                                         |
| ----------------------------- | -------------------- | ------------------------------------------------- |
| Ownership (parent owns child) | `ON DELETE CASCADE`  | Child has no meaning without parent               |
| Cross-entity reference        | `ON DELETE RESTRICT` | Prevent silent data loss across entity boundaries |

### 10.7 Indexes

- Primary keys are indexed automatically.
- Add an explicit index on every foreign key column.
- Add explicit indexes for columns referenced by RLS `USING` clauses.
- Index naming: `{table}_{column}_idx`.

### 10.8 Row Level Security

- Enable RLS on every table.
- Define policies immediately after each `CREATE TABLE` block.
- Policy naming: `"{table}_{operation}_{scope}"` (lowercase, double-quoted).
- Operation tokens: `select`, `insert`, `update`, `delete`.

### 10.9 JSONB columns

- JSONB is only for `Composition*<T>` subordinate compositions.
- Composition columns store arrays regardless of cardinality.
- Use `DEFAULT '[]'::jsonb` for `CompositionMany` and `CompositionPositive`.
- `CompositionOne` is required and has no empty-array default.

### 10.10 Soft delete

- Lifecycled tables (`Instantiable`) use `deleted_at TIMESTAMPTZ`.
- Active rows are `deleted_at IS NULL`.
- RLS `SELECT` policies must filter soft-deleted rows.

### 10.11 SQL comment and spacing conventions

Use this fixed-width section divider:

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- section_name
-- ─────────────────────────────────────────────────────────────────────────────
```

Spacing:

- One blank line between `CREATE TABLE` and `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
- One blank line between `ENABLE ROW LEVEL SECURITY` and first `CREATE POLICY`.
- One blank line between consecutive `CREATE POLICY` blocks.
- One blank line between consecutive `CREATE INDEX` blocks.

## 11. SQL DDL Conventions

SQL DDL ownership is split by artifact type:

- **Canonical schema DDL** (`<domain_root>/schema/schema.sql`) defines the full current-state schema.
- **Migration DDL** (`<backend_root>/migrations/`) defines forward-only deltas from one state to the next.

### 11.1 Rules

- Keep canonical schema and migrations aligned; either artifact may be used to reconstruct expected runtime state.
- Canonical schema is idempotent and reproducible.
- Migrations are append-only and never rewritten after application in shared environments.
- A migration changes only what is required for that versioned step.
- Destructive changes must be explicit and reviewed (drop/rename/type narrowing/data rewrite).
- Data backfills in migrations must be deterministic and safe to rerun when possible.
- Constraint, index, and policy naming follows section 10 naming conventions.
- If canonical schema and migrations conflict, treat it as a release blocker until reconciled.

## 12. Testing Conventions

```text
source/tests/
  cases/                      <- test files: {abstraction}-api-test.ts
  fixtures/
    samples.ts                <- barrel export for all fixtures
    {abstraction}-samples.ts  <- named constants producing valid domain objects
    fixtures-test.ts          <- fixture integrity checks
```

- Test files live in `source/tests/cases/`, named `{abstraction}-api-test.ts`.
- `{abstraction}-samples.ts` — exports named constants and factory functions producing valid, realistic domain objects. These are the ground truth for tests.
- `fixtures-test.ts` — validates fixture integrity: Id format, required fields, association linkage. If a fixture fails here the domain types have drifted.
- Tests exercise the public contract of each layer, not implementation details.
- Each abstraction's adapter must have a round-trip test: `toAbstraction(fromAbstraction(obj))` round-trips cleanly.
