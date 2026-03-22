![Seasons Computing logo](../seasonscomputing-logo.png)

# Coding Style Guide, Standards & Conventions

## 1. Overview

This guide is the authoritative reference for coding standards and conventions throughout the codebase.

Code that conflicts with this guide is wrong — not the guide.

## 2. Language & Tooling

| Item            | Guideline                                                                                                                                               |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime         | Deno with strict TypeScript (`deno task check`)                                                                                                         |
| Encoding        | UTF-8 (Unicode). Avoid non-ASCII only where required by a specific file format or external constraint.                                                  |
| Types           | Use `type` for data shapes, abstractions, aliases, and unions; use `interface` only for encapsulated API contracts that something explicitly implements |
| Primitives/ADTs | Use `Id` (UUID v7 string), `When` (ISO 8601 UTC string), `StringSet`, `Dictionary` and `StringDictionary` from `@core/std`                              |

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
| `@core/std` | `source/core/std/std.ts` |
| `@ux/api`   | `source/ux/api/api.ts`   |

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

## 5. Source Code Formatting

All TypeScript is formatted by `dprint` via `deno task fmt`. The formatter is authoritative — do not argue with it.

### 5.1 Rules

- **No semicolons** — statement terminators are omitted throughout
- **Single quotes** — string literals use `'...'` not `"..."`
- **Line length** — maximum length of any line is `105` characters.
- **Comment box length** — comment box maximum length is `80` characters
- **File order of symbols** — exported symbols are listed at the top of the file with non-exports below them, when possible.
- **Comment exported types** — every exported type has a comment. Single-line if sufficient. Multi-line if warranted.

### 5.2 Single-line statements

Prefer single-line statements for simple, non-loop control flow and import statements when readability is preserved.

- Never use single-line loop bodies (`for`, `for...of`, `for await...of`, `while`, `do...while`); always use braces and multiline bodies.
- Use multiline form when a statement exceeds max line length or when a single-line form reduces readability.
- Single-line `if`/guard-return is allowed only for one simple action.

Examples:

```typescript
export type Bar = Ding & Bat

if (!input) return null

let wingDings = { now: when() }

for (const item of items) {
  process(item)
}
```

## 6. Source Code File Format

Documentation intensity follows implementation complexity. The code speaks first; commentary fills only what the code cannot.

### 6.1 Spec files

```typescript
/**
 * Common types and utilities for handling ISO datetime strings.
 * Provides type safety and validation for date-time values.
 */

/** Represents a date-time in ISO 8601 string format. */
export type When = string

/** Valid ISO datetime format regex. */
const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/

/** Gets the current UTC datetime as an ISO string */
export const when = (): When => new Date().toISOString()

/** Checks if a string is a valid ISO date-time. */
export const isWhen = (value: unknown): value is When =>
  typeof value === 'string' && ISO_DATETIME_REGEX.test(value)
```

### 6.2 Functional files

Files where behavior matters and the public surface benefits from a documented contract.

A box header replaces the file-header JSDoc, followed by a detailed "PURPOSE" subsection header.
Finally a "PUBLIC" subsection header where symbols are enumerated with brief description of each symbol on the same line.

Boxes should have equal length lines to ensure the box sides align with the box corners.

Example:

```typescript
/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User protocol validator                                                      ║
║ Boundary validation for user protocol payloads.                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for user topic abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateUserCreate(input)  Validate UserCreate payloads.
validateUserUpdate(input)  Validate UserUpdate payloads.
*/
```

### 6.3 Header rules

- Ensure box sides align with box corners
- Subsection header (e.g. PURPOSE, PUBLIC)
  - 1 blank line prior to subsection
  - Subsection heading in ALL CAPS
  - 1 max-length dash-rule after the header
- Headers stay current. A stale header is worse than no header.

### 6.4 Section header

Files with clear categories of declarations and functions divide the code body into sections, each with a section header. Consistent width, no variation:

```typescript
// ────────────────────────────────────────────────────────────────────────────
// {SECTION LABEL}
// ────────────────────────────────────────────────────────────────────────────
```

Examples:

- PUBLIC
- PRIVATE
- PROTOCOLS
- VALIDATORS
- GUARDS

### 6.5 Comment conventions

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

Adapters map column-by-column. There is no `payload` field that bypasses mapping. The abstraction type is the truth; the adapter derives it from storage columns.

### 7.5 No redundant exports

Export only what callers need. Private helpers stay private.

### 7.6 No magic

No implicit behavior, no runtime reflection, no meta-programming. Configuration is explicit; providers are injected; contracts are stated in interfaces; structured data as types.

## 8. Implementation Patterns

### 8.1 `@core/std` types

Use types from `@core/std` instead of ad-hoc primitives and container generics.

| Prefer from `@core/std`   | Do not use                                                                 |
| ------------------------- | -------------------------------------------------------------------------- |
| `Dictionary<V = unknown>` | `Record<string, unknown>`                                                  |
| `StringDictionary`        | `Record<string, string>`                                                   |
| `StringSet`               | `Set<string>`                                                              |
| `Id`                      | raw `string` for identifiers                                               |
| `When`                    | raw `string` for ISO datetime                                              |
| `Instantiable`            | inline `{ id, createdAt, updatedAt, deletedAt? }` life-cycle shape         |
| `InstantiableOnly`        | inline `{ id, createdAt }` create-and-read-only life-cycle shape           |
| `CompositionOne<T>`       | ad-hoc tuple/array for exactly-one embedded composition                    |
| `CompositionOptional<T>`  | ad-hoc nullable/optional array for zero-or-one embedded composition        |
| `CompositionMany<T>`      | ad-hoc `T[]` where composition semantics are intended                      |
| `CompositionPositive<T>`  | ad-hoc non-empty array encodings (`[T, ...T[]]`) for composition semantics |
| `AssociationOne<T>`       | raw `Id` for required FK references                                        |
| `AssociationOptional<T>`  | raw `Id \| undefined` for optional FK references                           |
| `AssociationJunction<T>`  | raw `Id` in junction abstractions                                          |
| `ValidatorError`          | thrown by `notValid()`; generic `Error` for validation failures            |

- Import std primitives from `@core/std` only.
- Never declare `Record<string, unknown>`, `Record<string, string>`, or `Set<string>` outside `source/core/std/`.
- When narrowing unknown objects in guards, use `Dictionary` casts (`const x = v as Dictionary`) instead of `Record<string, unknown>`.
- Use `StringDictionary` for key/value string/string maps.

### 8.2 `const-enum`

Any value set requiring runtime validation is expressed as a `const` tuple paired with a derived type alias.

```typescript
/** Supported shape kinds. */
export const SHAPE_KINDS = ['circle', 'rect', 'triangle'] as const
export type ShapeKind = (typeof SHAPE_KINDS)[number]
```

- Tuple named `SCREAMING_SNAKE`; derived type named `PascalCase`.
- Both exported from the same file — never redeclared elsewhere.
- Consumers import the tuple and use `.includes()` — never redeclare a local copy.

```typescript
// CORRECT
import { SHAPE_KINDS } from '@domain/abstractions/shape.ts'
SHAPE_KINDS.includes(input.kind as ShapeKind)

// WRONG — local redeclaration is a violation
const SHAPE_KINDS = ['circle', 'rect'] as const
```

### 8.3 `intersection-type`

When a type extends a base type with additional or narrowed fields, express as a named intersection.

```typescript
export type CircleShape = BaseShape & { kind: 'circle'; radius: number }
```

- Always a named export — anonymous intersections are a violation.
- The narrowed discriminator field must appear in the intersection body, not the base.
- Used as constituents of a `union-type`.

### 8.4 `union-type`

When a concept has structurally distinct variants sharing a discriminator field, express as a named base type, named intersection-type constituents, and a discriminated union.

```typescript
/** Common shape fields. */
export type BaseShape = { kind: ShapeKind; color?: string }

/** Circle — no dimensional fields other than radius. */
export type CircleShape =
  & BaseShape
  & { kind: 'circle'; radius: number }

/** Rectangle — defined by width and height. */
export type RectShape =
  & BaseShape
  & { kind: 'rect'; width: number; height: number }

/** Discriminated union — boundary type used throughout the system. */
export type Shape = CircleShape | RectShape
```

- Base type holds shared fields only — no discriminator narrowing.
- Constituent types are named, exported intersection-types — they carry independent meaning.
- The union type is the boundary type used at all call sites.
- The discriminator field (`kind`) must be present in every constituent.
- No anonymous union arms.

**Adapter consumption** — switch on the discriminator, exhaustive, no fall-through default:

```typescript
export const toShape = (dict: Dictionary): Shape => {
  const kind = dict.kind as ShapeKind
  switch (kind) {
    case 'circle':
      return {
        kind,
        color: dict.color as string | undefined,
        radius: dict.radius as number
      } satisfies CircleShape
    case 'rect':
      return {
        kind,
        color: dict.color as string | undefined,
        width: dict.width as number,
        height: dict.height as number
      } satisfies RectShape
  }
}
```

**Validator consumption** — same discriminator-switch pattern, branch-specific checks:

```typescript
export const validateShapeCreate = (input: ShapeCreate): ExpectResult => {
  const error = expectConstEnum(input.kind, 'kind', SHAPE_KINDS)
  if (error) return error
  switch (input.kind) {
    case 'circle':
      return expectPositiveNumber(input.radius, 'radius')
    case 'rect':
      return expectValid(
        expectPositiveNumber(input.width, 'width'),
        expectPositiveNumber(input.height, 'height')
      )
  }
}
```

### 8.5 Runtime configuration pattern

The system uses a singleton `Config` with injected runtime providers. Defined in `@core/cfg/config.ts`; initialized once per deployment context.

**Initialization:**

```typescript
Config.init(provider, keys, aliases?)
```

- `provider` — runtime-specific `RuntimeProvider` instance (`SolidProvider`, `SupabaseProvider`, `DenoProvider`)
- `keys` — required environment variable names; fails fast at bootstrap if any are missing
- `aliases` — optional map of logical name to environment key; allows consuming code to use stable names regardless of platform-specific key prefixes

Vite requires client-side variables to carry a `VITE_` prefix. Aliases declare the mapping once at bootstrap; all consuming code uses the clean logical name:

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

**Rules:**

- `Config.init()` — call once at bootstrap; throws if called twice.
- `Config.get(name)` — resolves alias if present, then returns value; throws if not initialized, key not registered, or value missing. Never returns undefined.
- `Config.fail(msg)` — throws `never`; use for invariant violations.
- Never access `Deno.env` or `import.meta.env` directly. Always go through `Config.get()`.

### 8.6 Makers vs. wrappers

These are architecturally distinct patterns — naming must reflect it.

**Makers** (`make-*.ts`) produce configured API client instances. They are factory functions that accept a provider or configuration and return a ready-to-use client. Called once at composition root.

**Wrappers** (`wrap-*.ts`) adapt a function's calling convention without changing its behavior. They accept a handler function and return a new function that normalizes life-cycle concerns (CORS, body parsing, error serialization) around it.

Naming rule: `make` prefix for factories; `wrap` prefix for adapters. File name matches the prefix.

## 9. Error Handling

- Throw `Error` with actionable messages: `'Asset dictionary missing required field: id'`.
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
| `const-enum`      | `TEXT`          | Constrained via named `CHECK`             |

### 10.4 NOT NULL discipline

- Required columns are `NOT NULL`.
- Optional fields are nullable.
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
- Junction tables: `SELECT`, `INSERT`, `DELETE` only — no `UPDATE` policy.
- `InstantiableOnly` (append-only) tables: `SELECT`, `INSERT` only — no `UPDATE`, no `DELETE` policy.

### 10.9 JSONB columns

- JSONB is only for `Composition*<T>` subordinate compositions.
- Composition columns store arrays regardless of cardinality.
- Use `DEFAULT '[]'::jsonb` for `CompositionMany` and `CompositionPositive`.
- `CompositionOne` is required and has no empty-array default.

### 10.10 Soft delete

- `Instantiable` tables use `deleted_at TIMESTAMPTZ`.
- Active rows are `deleted_at IS NULL`.
- RLS `SELECT` policies must filter soft-deleted rows.
- `InstantiableOnly` tables have no `updated_at` or `deleted_at` columns.

### 10.11 SQL comment and spacing conventions

Use this fixed-width section divider:

```sql
-- ──────────────────────────────────────────────────────────────────────────────────────
-- section_name
-- ──────────────────────────────────────────────────────────────────────────────────────
```

Spacing:

- One blank line between `CREATE TABLE` and `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
- One blank line between `ENABLE ROW LEVEL SECURITY` and first `CREATE POLICY`.
- One blank line between consecutive `CREATE POLICY` blocks.
- One blank line between consecutive `CREATE INDEX` blocks.

### 10.12 Schema file header

Every `schema.sql` begins with:

```sql
-- =============================================================================
-- swarmAg System — Canonical Schema
-- source/domain/schema/schema.sql
--
-- Authoritative current-state DDL. Generated from domain model.
-- Do not edit manually — regenerate from domain model.
-- Includes canonical seed data known at schema time.
-- Migrations in source/back/migrations/ express deltas from this state.
-- =============================================================================
```

### 10.13 Drop order

Emit `DROP TABLE IF EXISTS` for all domain tables in reverse dependency order at the top of the file, before any `CREATE TABLE` statements.

### 10.14 Schema section order

Sections within `schema.sql` follow this order:

1. Users
2. Asset Types & Assets
3. Chemicals
4. Customers
5. Services
6. Workflows, Tasks & Questions
7. Jobs
8. Seed Data

## 11. SQL DDL Conventions

SQL DDL ownership is split by artifact type:

- **Canonical schema DDL** (`@domain/schema/schema.sql`) defines the full current-state schema.
- **Migration DDL** (`@back/migrations/`) defines forward-only deltas from one state to the next.

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

_End of Style Guide Document_
