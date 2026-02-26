# swarmAg System — Code Style Guide

![swarmAg ops logo](../../swarmag-ops-logo.png)

## 1. Overview

This guide is the authoritative reference for coding conventions throughout the swarmAg codebase. The governing principles in this guide are also codified as constitutional law in `CONSTITUTION.md` section 9. In case of conflict, the CONSTITUTION takes precedence.

Code that conflicts with this guide is wrong — not the guide.

## 2. Language & Tooling

| Item       | Guideline                                                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime    | Deno with strict TypeScript (`deno task check`)                                                                                                         |
| Encoding   | ASCII only; no non-ASCII literals                                                                                                                       |
| Types      | Use `type` for data shapes, abstractions, aliases, and unions; use `interface` only for encapsulated API contracts that something explicitly implements |
| Primitives | Use `Id` (UUID v7 string) and `When` (ISO 8601 UTC string) from `@core-std`                                                                             |

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

Type declarations, enums, pure domain shapes. The code is the documentation. Inline `/** */` comments only where a name alone is insufficient. No box, no dash-rules, no sections.

`source/domain/abstractions/asset.ts`:

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

Bootstraps, adapters, validators, contracts, makers — files where behavior matters and the public surface benefits from a documented contract. A box header replaces the top JSDoc. JSDoc on exported functions where params or return values need prose. No section dividers needed — no significant private machinery to separate.

`source/core/cfg/config.ts`:

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

Complex implementations with a well-defined public surface and significant private machinery. Full decoration — box header, typed export signatures grouped by category, internals summary, runnable example. In the code body, PUBLIC EXPORTS and PRIVATE IMPLEMENTATION are each bounded top and bottom by section dividers.

`source/core/api/wrap-http-handler.ts`:

```typescript
/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ HTTP handler types, response builders, and handler wrapper                  ║
║ Platform-agnostic typed handler contract for all edge functions.            ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the typed HTTP handler contract and wraps it into a Fetch API-
compatible function. All edge functions use wrapHttpHandler as their
entry point. Uses only Web Standards — no platform-specific imports.

╔═════════════════════════════════════════════════════════════════════════════╗
║ EXPORTED APIs & TYPEs                                                       ║
╚═════════════════════════════════════════════════════════════════════════════╝
TYPES
───────────────────────────────────────────────────────────────────────────────
HttpHandler<RequestBody, Query, ResponseBody>
  → Typed async function: HttpRequest → HttpResponse
HttpRequest<Body, Query, Headers>
  → Typed request wrapper passed into handlers
HttpResponse<Body, Headers>
  → Standardized response envelope: { statusCode, body, headers? }

RESPONSE BUILDERS
───────────────────────────────────────────────────────────────────────────────
toOk(data)           → 200 { data: T }
toCreated(data)      → 201 { data: T }
toBadRequest(error)  → 400 { error: string }
toNotFound(error)    → 404 { error: string }
toInternalError(...) → 500 { error: string, details?: string }

WRAPPER
───────────────────────────────────────────────────────────────────────────────
wrapHttpHandler(handler, config?) → (request: Request) → Promise<Response>
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

- Spec files carry no box, no dash-rules, no sections. Inline `/** */` only where the name is insufficient.
- Functional file box width: 77 characters. Title and description on consecutive lines — no blank lines inside the box.
- One blank line between the box close and PURPOSE.
- One blank line between PURPOSE prose and the next section label.
- One blank line between distinct subsection groups within EXPORTED APIs & TYPEs.
- No blank line between a section label and its dash-rule.
- No blank line between the dash-rule and its content.
- INTERNALS and EXAMPLE only when private implementation is non-trivial.
- EXAMPLE is valid, runnable TypeScript — not pseudocode.
- Headers stay current. A stale header is worse than no header.

### 6.5 Section dividers

Non-trivial files divide the code body into PUBLIC EXPORTS and PRIVATE IMPLEMENTATION, each bounded top and bottom. Consistent width, no variation:

```typescript
// ────────────────────────────────────────────────────────────────────────────
// PUBLIC EXPORTS
// ────────────────────────────────────────────────────────────────────────────

// ... exported types, functions, constants ...

// ────────────────────────────────────────────────────────────────────────────
// PRIVATE IMPLEMENTATION
// ────────────────────────────────────────────────────────────────────────────

// ... unexported helpers ...
```

### 6.6 Comment conventions

| Context                       | Style                                                               |
| ----------------------------- | ------------------------------------------------------------------- |
| Spec file types               | Single-line `/** */` — one sentence, only when name is insufficient |
| Functional exported functions | JSDoc with `@param` and `@returns` for non-obvious args             |
| Private helpers               | Inline `//` — only when intent isn't obvious from the code          |
| Dead comments                 | Delete them. Version control exists.                                |

## 7. Code Tone

These are non-negotiable. They are also codified in `CONSTITUTION.md` section 9.5.

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
- Use `Dictionary<string>` (or `StringDictionary` where useful) for key/value string maps.

## 8. Domain Layer (`source/domain/`)

### 8.1 File organization

Each abstraction has four files, one per sub-layer:

| Sub-layer       | File                         |
| --------------- | ---------------------------- |
| `abstractions/` | `{abstraction}.ts`           |
| `adapters/`     | `{abstraction}-adapter.ts`   |
| `protocols/`    | `{abstraction}-protocol.ts`  |
| `validators/`   | `{abstraction}-validator.ts` |

Shared abstractions: `abstractions/common.ts`.

### 8.2 Abstractions

- `type` for all domain abstractions, object shapes, aliases, and unions. `interface` only for API contracts that something explicitly implements — `ApiCrudContract`, `RuntimeProvider`, etc.
- Single-sentence JSDoc on every exported type and const-enum.
- All lifecycled abstractions expose `deletedAt?: When` via `Instantiable` intersection — do not redeclare inline.
- JSON-serializable only; no methods on domain objects.

#### 8.2.1 Const-enum pattern

Any domain value set that requires runtime validation (inclusion checks in validators, guards, or adapters) must be expressed as a `const` tuple paired with a derived type alias. This is the **const-enum pattern** and is non-negotiable.

```typescript
/** Lifecycle and availability state. */
export const ASSET_STATUSES = ['active', 'maintenance', 'retired', 'reserved'] as const
export type AssetStatus = (typeof ASSET_STATUSES)[number]
```

Rules:

- The tuple is named `SCREAMING_SNAKE` (global immutable constant).
- The derived type is named `PascalCase` (type alias).
- Both are exported from the abstraction file — never redeclared elsewhere.
- Validators import the tuple directly and use `.includes()` for membership checks — never redeclare a local copy.
- A plain union literal (`type Foo = 'a' | 'b'`) is only acceptable when the values are never used in runtime checks. If in doubt, use the const-enum pattern.

### 8.3 Adapters

- Functions only: `toAbstraction(dict: Dictionary): Abstraction` and `fromAbstraction(abstraction: Abstraction): Dictionary`.
- Map every field explicitly. No `...spread`, no `payload` shortcut.
- Fast-fail on missing required fields using `notValid` from `@core-std` — not `throw`. All `notValid` calls precede the single return statement.
- `snake_case` keys for database column names; `camelCase` for domain fields.
- Embedded composition fields: map with `.map(toChild)` / `.map(fromChild)` — no raw casts of array fields.

### 8.4 Validators

- Functions only: `validate{Abstraction}Create(input): string | null` — return error message or `null`.
- Validate at system boundaries only. Never re-validate inside domain logic.
- Use shared primitive validators from `@core-std` (`isNonEmptyString`, `isId`, `isWhen`, `isPositiveNumber`). Domain-specific guards live in their abstraction's validator file.
- Enum membership checks use the exported tuple from the abstraction file — never redeclare a local tuple in a validator.
- Follow the explicit decomposition archetype: every domain object gets a named private `is{Abstraction}` guard; no anonymous object-level guards inline in `isComposition*` calls; anonymous arrows permitted only for primitive pass-throughs.

### 8.5 Protocols

- Input types for create and update operations: `AbstractionCreateInput`, `AbstractionUpdateInput`.
- Partial shapes — only fields relevant to the operation.
- No domain logic; protocols are data shapes for transmission.

## 9. Configuration Pattern

The system uses a singleton `Config` with injected runtime providers. Defined in `@core/cfg/config.ts`; initialized once per deployment context.

```typescript
Config.init(provider, keys, aliases?)
```

### 9.1 Arguments

- `provider` — runtime-specific `RuntimeProvider` instance (`SolidProvider`, `SupabaseProvider`, `DenoProvider`)
- `keys` — required environment variable names; fails fast at bootstrap if any are missing
- `aliases` — optional map of logical name to environment key; allows consuming code to use stable names regardless of platform-specific key prefixes

### 9.2 Why aliases matter

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

### 9.3 Rules

- `Config.init()` — call once at bootstrap; throws if called twice.
- `Config.get(name)` — resolves alias if present, then returns value; throws if not initialized, key not registered, or value missing. Never returns undefined.
- `Config.fail(msg)` — throws `never`; use for invariant violations.
- Never access `Deno.env` or `import.meta.env` directly. Always go through `Config.get()`.

## 10. Error Handling

- Throw `Error` with actionable messages: `'JobAssessment dictionary missing required field: jobId'`.
- Never swallow errors silently.
- Never log and continue — log and throw, or throw without logging.
- Never expose stack traces or internal state in HTTP responses.
- Use `toInternalError()` for unexpected server failures in edge functions.

## 11. Testing Conventions

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

## 12. SQL DDL Conventions

These conventions apply to `source/domain/schema/schema.sql` and all migration files under `source/back/migrations/`. They are non-negotiable and enforced by code review.

### 12.1 Identifiers

- All table names, column names, constraint names, index names, and policy names use `snake_case`
- Table names are plural nouns: `jobs`, `customers`, `job_plans`, `job_work_log_entries`
- No quoted identifiers — names must be valid unquoted PostgreSQL identifiers

### 12.2 Column Ordering

Columns within a table follow this order:

1. `id` — primary key, always first
2. Foreign key columns (`*_id`) — in dependency order
3. Domain columns — business fields
4. Lifecycle columns — always last, in this order: `created_at`, `updated_at`, `deleted_at`

```sql
CREATE TABLE job_plan_assignments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id    UUID        NOT NULL REFERENCES job_plans(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

### 12.3 Data Types

| Domain type       | PostgreSQL type | Notes                                     |
| ----------------- | --------------- | ----------------------------------------- |
| `Id`              | `UUID`          | UUID v7; default `gen_random_uuid()`      |
| `When`            | `TIMESTAMPTZ`   | Always timezone-aware; never `TIMESTAMP`  |
| `string`          | `TEXT`          | Never `VARCHAR(n)` unless length enforced |
| `number` (int)    | `INTEGER`       |                                           |
| `number` (float)  | `NUMERIC`       |                                           |
| `boolean`         | `BOOLEAN`       |                                           |
| `Composition*<T>` | `JSONB`         | Embedded subordinate; never normalized    |
| const-enum values | `TEXT`          | Constrained via `CHECK` — see §12.5       |

### 12.4 NOT NULL Discipline

- All required domain columns are `NOT NULL`
- `deleted_at` is always nullable — absence means active
- `updated_at` carries `NOT NULL DEFAULT now()`
- Optional domain fields (marked `?` in TypeScript) are nullable — omit `NOT NULL`
- Junction FK columns are always `NOT NULL`

### 12.5 CHECK Constraints for Const-Enum Columns

Every column that maps to a `(const-enum)` domain type gets a `CHECK` constraint using the canonical value set:

```sql
status TEXT NOT NULL CHECK (status IN (
  'open', 'assessing', 'planning', 'preparing',
  'executing', 'finalizing', 'closed', 'cancelled'
)),
```

Constraint naming: `{table}_{column}_check`

```sql
CONSTRAINT jobs_status_check CHECK (status IN (...))
```

### 12.6 Foreign Key Cascade Policies

Two rules — apply consistently:

| Relationship type             | Policy               | Rationale                                         |
| ----------------------------- | -------------------- | ------------------------------------------------- |
| Ownership (parent owns child) | `ON DELETE CASCADE`  | Child has no meaning without parent               |
| Cross-entity reference        | `ON DELETE RESTRICT` | Prevent silent data loss across entity boundaries |

Examples:

- `job_assessments.job_id → jobs.id` — CASCADE (assessment owned by job)
- `jobs.customer_id → customers.id` — RESTRICT (job references customer; customer deletion must be explicit)
- `job_plan_assignments.plan_id → job_plans.id` — CASCADE (assignment owned by plan)
- `job_plan_assignments.user_id → users.id` — RESTRICT (references independent entity)

### 12.7 Indexes

- Primary keys are indexed automatically
- Add explicit indexes for every FK column (Supabase/PostgreSQL does not auto-index FKs)
- Add indexes for columns used in RLS policy `USING` clauses
- Index naming: `{table}_{column}_idx`

```sql
CREATE INDEX job_assessments_job_id_idx ON job_assessments(job_id);
CREATE INDEX job_work_log_entries_job_id_idx ON job_work_log_entries(job_id);
CREATE INDEX job_work_log_entries_user_id_idx ON job_work_log_entries(user_id);
```

### 12.8 Row Level Security

Every table has RLS enabled and policies defined immediately after its `CREATE TABLE` block:

```sql
CREATE TABLE jobs ( ... );

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_select_active"
ON jobs FOR SELECT
USING (deleted_at IS NULL);

CREATE POLICY "jobs_select_own"
ON jobs FOR SELECT
USING (customer_id IN (
  SELECT id FROM customers WHERE account_manager_id = auth.uid()
));
```

Policy naming: `"{table}_{operation}_{scope}"` — all lowercase, double-quoted.

Operations: `select`, `insert`, `update`, `delete`
Scope: describes who or what is permitted — `active`, `own`, `ops`, `admin`

### 12.9 JSONB Columns

JSONB is permitted only for the four exceptions defined in `architecture-back.md §4.1.2`:

1. End-user specialization (custom fields)
2. Third-party metadata (opaque payloads)
3. Payload-as-truth (versioning snapshots)
4. Subordinate composition (`Composition*<T>` — embedded entities without independent lifecycle)

All `Composition*<T>` fields from the domain map to JSONB columns. Column name matches the domain field name in `snake_case`. Default to empty array `'[]'::jsonb` for `CompositionMany` and `CompositionPositive` columns:

```sql
notes  JSONB NOT NULL DEFAULT '[]'::jsonb,
tasks  JSONB NOT NULL DEFAULT '[]'::jsonb,
```

`CompositionOne` has no meaningful empty state — omit the default and treat as required.

### 12.10 Soft Delete

Lifecycled tables (`Instantiable` types) carry `deleted_at TIMESTAMPTZ`. Active rows have `deleted_at IS NULL`. All RLS `SELECT` policies filter soft-deleted rows.

Exceptions — no `deleted_at`:

- Append-only logs (`job_work_log_entries`)
- Pure junction tables (`service_required_asset_types`, `job_plan_assets`)

### 12.11 Comment Conventions

- One blank line between `CREATE TABLE` block and `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- One blank line between `ENABLE ROW LEVEL SECURITY` and first `CREATE POLICY`
- One blank line between consecutive `CREATE POLICY` blocks
- One blank line between `CREATE INDEX` blocks
- Section comments for logical groupings:

```sql
-- ─────────────────────────────────────────────────────────────────────────────
-- jobs
-- ─────────────────────────────────────────────────────────────────────────────
```
