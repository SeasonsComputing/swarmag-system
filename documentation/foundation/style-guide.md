# swarmAg Code Style Guide

This guide defines the coding conventions and patterns used throughout the swarmAg codebase. Follow these standards when writing or modifying
any software artifact with the system.

## 1. Language and Tooling

| Item     | Guideline                                                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compiler | Deno `check` with strict TypeScript                                                                                                                                                                           |
| Aliases  | `@domain/`, `@utility`, `@utility/`, `@back-config/`, `@back-functions/`, `@back-lib/`, `@ux-api/`, `@ux-app-admin/`, `@ux-app-ops/`, `@ux-app-customer/`, `@ux-components/`, `@ux-lib/`, `@devops`, `@tests` |
| Types    | Prefer type aliases and interfaces; avoid runtime-heavy helpers                                                                                                                                               |
| Encoding | ASCII only; no non-ASCII literals                                                                                                                                                                             |

## 2. Imports and Organization

| Item        | Guideline                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------- |
| Paths       | Use aliases for cross-directory imports; use relative (`./`) for same-directory imports             |
| Ordering    | Domain -> utils -> adapters -> api -> back-lib; use `import type` where helpful                     |
| Exports     | Default export only for Netlify Edge `createApiHandler(handle)`                                     |
| Extensions  | Include `.ts` in local/alias import specifiers                                                      |
| Import maps | Keep `netlify-import-map.json` aligned with `deno.json`; use root-relative paths in the Netlify map |
| Layout      | Files live only in leaf directories; directories with subdirectories must not contain files         |

**Import path examples:**

```typescript
// Same directory - use relative
import { isNonEmptyString } from './helper-validator.ts'

// Different directory - use alias
import type { ID, When } from '@core-std'
import type { User } from '@domain/abstractions/user.ts'
```

## Directory Organization Rules

### Source Structure

```
source/
  back/             # Backend runtime and migrations
  devops/           # Guard scripts
  domain/           # Domain abstractions + adapters + protocol + validators
  tests/            # Cases and fixtures
  utilities/        # Shared utilities
  ux/               # User experience applications and API client
```

**Rules:**

1. `source/domain/abstraction/` and `source/domain/protocol/` are domain-first and infrastructure-agnostic
2. `source/utilities/` has no domain dependencies
3. `source/domain/adapter/` depends on domain + utilities
4. `source/back/` depends on domain, domain adapters, and utilities
5. `source/ux/` depends on domain and the UX API layer (never backend internals)

### Import Alias Discipline

**Required aliases:**

- `@domain/` - Domain modules
- `@utility` and `@utility/` - Utilities
- `@back-config/`, `@back-functions/`, `@back-lib/` - Backend namespaces
- `@ux-api/` - UX API layer
- `@ux-app-admin/`, `@ux-app-ops/`, `@ux-app-customer/` - UX app namespaces
- `@ux-components/`, `@ux-lib/` - Shared UX modules
- `@devops`, `@tests` - Guard and test roots

**Never use relative imports across boundaries.**

### Configuration Files

Each deployment package must have:

```
{package}/
  config/
    config.ts              # Runtime detection + Config export
    local.env.example
    stage.env.example
    prod.env.example
```

**Rules:**

1. Runtime providers live in `source/utilities/configure-deno.ts` and `source/back/library/configure-netlify.ts`
2. Package config imports from `@utility`, never defines providers
3. Never import providers directly (always use `./config/config.ts`)
4. Never access `Deno.env`, `import.meta.env` directly (use `Config.get()`)

### Deployment Artifacts

Build artifacts go to `deploy/` (gitignored):

```
deploy/{app}/
  swarmag-{component}-pkg.{hash}.{ext}
  swarmag-{app}-pkg.json
```

Never commit deployment artifacts.

## 3. Naming Conventions

| Item            | Guideline                                                                              |
| --------------- | -------------------------------------------------------------------------------------- |
| Acronyms        | Use title case for acronyms in identifiers: `Api`, `Url`, `Id`, not `API`, `URL`, `ID` |
| Classes         | PascalCase: `UsersApi`, `JobsApi`                                                      |
| Files           | Kebab-case: `users-api.ts`, `job-validator.ts`                                         |
| Type aliases    | PascalCase: `UserCreateInput`, `JobStatus`                                             |
| Constants       | camelCase for exported constants: `httpCodes` (exception: `HttpCodes` object)          |
| Domain-specific | Use domain names: `JobAssessment`, `JobLogEntry`, not generic names                    |

## 4. Domain Modeling (`source/domain/*`)

| Item         | Guideline                                                                  |
| ------------ | -------------------------------------------------------------------------- |
| Abstractions | Interfaces with immutable intent; no mutation helpers                      |
| Docs         | Single-sentence JSDoc on types/enums                                       |
| Primitives   | Reuse `ID` (UUID v7 string) and `When` (ISO 8601 string)                   |
| Payloads     | JSON-serializable only; no methods on domain objects                       |
| Organization | Abstraction-per-file pattern across abstractions, validators, and protocol |

### 4.1 Domain file organization

Each domain abstraction has corresponding files across three subdirectories:

| Layer           | Abstraction file             | Shared/helper file    |
| --------------- | ---------------------------- | --------------------- |
| `abstractions/` | `{abstraction}.ts`           | `common.ts`           |
| `validators/`   | `{abstraction}-validator.ts` | `helper-validator.ts` |
| `protocol/`     | `{abstraction}-protocol.ts`  | `helper-protocol.ts`  |

**Placement rules:**

- Abstraction-specific types (User, UserRole) belong in abstraction files (`user.ts`), not `common.ts`.
- Shared types used by multiple abstractions (Location, Note, Attachment) stay in `common.ts`.
- Concept-owning types live with their owner (Question, Answer live in `workflow.ts`).
- Generic protocol shapes (ListOptions, ListResult, DeleteResult) live in `helper-protocol.ts`.
- Shared validators (isNonEmptyString) live in `helper-validator.ts`.

## 5. Utilities (`source/utilities/*`)

| Item              | Guideline                                                        |
| ----------------- | ---------------------------------------------------------------- |
| identifier.ts     | UUID v7 via `id()`; validate with `isID()`                       |
| datetime.ts       | UTC ISO via `when()`; validate with `isWhen()`                   |
| runtime.ts        | `RuntimeConfig` class and `RuntimeProvider` interface for config |
| configure-deno.ts | Deno environment provider; exports `ConfigureDeno`               |
| Scope             | Keep utilities focused and dependency-light                      |

## 6. UX API Layer (`source/ux/api/*`)

| Item           | Guideline                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------- |
| Purpose        | Typed SDK for ux to consume backend functions and local providers                             |
| Factory        | Use `makeApiClient<T, TCreate, TUpdate>(spec)` to create typed client objects                 |
| Naming         | `{Abstraction}Api` object in `{abstraction}-api.ts` file (e.g., `UsersApi` in `users-api.ts`) |
| Return types   | Return domain types directly (`User`, `User[]`); never expose HTTP or result envelopes        |
| Error handling | Throw `ApiError` on errors; callers handle failures via try/catch                             |
| Encapsulation  | Hide all RPC internals (fetch, headers, JSON parsing, result unwrapping)                      |
| Methods        | Use `create`, `update`, `delete`, `get`, `list` to match backend endpoint naming              |
| Base URL       | Configure via `Config.get('VITE_API_URL')` from ux api config bootstrap                       |

## 7. Backend Functions (`source/back/functions/*`)

| Item       | Guideline                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| Naming     | `{resource}-{action}.ts` (plural resource), e.g., `users-create.ts`                                                |
| Exports    | Default export only: Netlify `createApiHandler(handle)`                                                            |
| Config     | Export `config = { path: "/api/{resource}/{action}" }` for routing                                                 |
| Types      | Use `ApiRequest`/`ApiResponse` from `@back-lib/api-binding`                                                        |
| Status     | Use `HttpCodes`; no numeric literals                                                                               |
| Platform   | Use `Supabase.client()`; paginate via `clampLimit`/`parseCursor`                                                   |
| Validation | Guard with `validate` + `HttpCodes.unprocessableEntity`                                                            |
| Methods    | Guard unsupported verbs with `HttpCodes.methodNotAllowed`                                                          |
| Responses  | Success: `{ data: ... }`; failure: `{ error, details? }`                                                           |
| JSON       | Always JSON; `createApiHandler` sets headers and wraps errors                                                      |
| Adaptation | Use adapters from `source/domain/adapter/` (e.g., `jobs-adapter.ts`) instead of ad hoc column maps in each handler |

## 8. Adapters and Storage Adaptation

| Rule           | Requirement                                                      |
| -------------- | ---------------------------------------------------------------- |
| Boundary types | Use `unknown` at storage boundaries; never coerce with `as any`. |
| Validation     | Validate once, then return a domain abstraction.                 |
| Abstractions   | Do not introduce generic row wrappers like `Row<T>`.             |
| Checks         | Prefer small, explicit runtime checks over clever typing.        |
| Failure mode   | Adapter code may throw on invalid input.                         |
| Scope          | Shared helpers must live in the narrowest possible scope.        |

Bad:

```ts
const user = rowToUser(data as any)
```

Good:

```ts
const user = rowToUser(data)
```

## 9. Control Flow

### 9.1 Single-line if statements

Prefer single-line if statements when there is no else clause and the line is under 120 columns:

```typescript
// Preferred
if (req.method !== 'GET') return toMethodNotAllowed()
if (!isNonEmptyString(userId)) return toBadRequest('id is required')
if (error || !data) return toNotFound('User not found')

// Avoid
if (req.method !== 'GET') {
  return toMethodNotAllowed()
}
```

Use braces when there is an else clause or when the line exceeds 120 columns.

## 10. Error Handling

| Item    | Guideline                                                        |
| ------- | ---------------------------------------------------------------- |
| Parsing | Invalid JSON -> `HttpCodes.badRequest`                           |
| Server  | Persistence/unknown -> `HttpCodes.internalError`; safe `details` |
| Control | Do not throw past `createApiHandler`; return `ApiResponse`       |

## 11. Pagination

| Item    | Guideline                                            |
| ------- | ---------------------------------------------------- |
| Limits  | Clamp to `1..100`; default 25                        |
| Cursor  | Default 0; non-negative only                         |
| Helpers | Use `Supabase.clampLimit` and `Supabase.parseCursor` |

## 12. Commenting Style

| Item     | Guideline                                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| JSDoc    | JSDoc on exports with a one-sentence summary plus @param/@returns (and @throws when relevant), ending sentences with periods |
| Inline   | Add only when logic is non-obvious                                                                                           |
| Internal | Add brief JSDoc when grouping internal type aliases that clarify adapter shapes (e.g., raw Netlify event types)              |
| Fields   | Comment class attributes and fields with brief JSDoc.                                                                        |
| Types    | Comment type aliases and interfaces with brief JSDoc.                                                                        |

## 13. Naming and Data Shapes

| Item      | Guideline                                                        |
| --------- | ---------------------------------------------------------------- |
| Clarity   | Use domain-specific names (e.g., `JobAssessment`, `JobLogEntry`) |
| Enums     | String unions for enums (e.g., `JobStatus`, `JobLogType`)        |
| Optionals | Mark optional fields with `?`; handle defaults in handlers       |

## 14. Runtime Configuration Conventions

### 14.1 Config provider classes

Config provider classes follow a consistent static class pattern with isomorphic interface conformance. Use the class name (not `this`) when referring to static members:

```typescript
export class ExampleConfig {
  static #initialized = false
  static #cache = new Set<string>()

  static init(required: readonly string[]): void {
    if (ExampleConfig.#initialized) ExampleConfig.fail('Already initialized')

    const missing = required.filter(key => !ExampleConfig.#source.get(key))
    if (missing.length > 0) {
      ExampleConfig.fail(`Missing required config: ${missing.join(', ')}`)
    }

    ExampleConfig.#cache = new Set(required)
    ExampleConfig.#initialized = true
  }

  static get(name: string): string {
    if (!ExampleConfig.#initialized) ExampleConfig.fail('Not initialized')
    if (!ExampleConfig.#cache.has(name)) {
      ExampleConfig.fail(`Config not registered: ${name}`)
    }

    const value = ExampleConfig.#source.get(name)
    if (!value) ExampleConfig.fail(`${name} missing at runtime`)
    return value
  }

  static fail(message: string): never {
    // Context-appropriate error handling
  }
}
```

### 14.2 Bootstrap files

Bootstrap files (`config.ts`) live in each deployment context's `config/` directory and:

1. Import appropriate config provider(s).
2. Detect runtime environment if needed (backend only).
3. Call `init()` with required parameters list.
4. Re-export as `Config` for isomorphic interface.

```typescript
// source/back/config/back-config.ts
import { ConfigureNetlify } from '@back-lib/configure-netlify.ts'
import { ConfigureDeno } from '@utility/configure-deno.ts'

const Config = 'Deno' in self ? ConfigureDeno : ConfigureNetlify

Config.init(['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'])

export { Config }
```

### 14.3 Environment files

Environment files follow the naming convention `{env}.env.example` and `{env}.env`:

- Use kebab-case for filenames when necessary.
- One file per deployment package per environment.
- Co-located with bootstrap file in `config/` directory.
- Never committed if they contain secrets (use `.gitignore`).

Example structure:

```text
source/back/config/
  back-config.ts
  back-local.env.example
  back-stage.env.example
  back-prod.env.example
```

### 14.4 Import conventions

Always import from bootstrap, never from provider directly:

```typescript
import { Config } from '@back-config/back-config.ts' // Correct
import { ConfigureNetlify } from '@back-lib/configure-netlify.ts' // Wrong
import { Config } from '@ux-app-admin/config/app-admin-config.ts' // Correct
```

### 14.5 Parameter naming

Configuration parameter names should be:

- **SCREAMING_SNAKE_CASE** for environment variables.
- Prefixed appropriately: `VITE_` for client-side app variables, no prefix for server-side.
- Descriptive and unambiguous: `SUPABASE_URL`, `API_BASE_URL` (not `URL`, `DB`).

### 14.6 Error messages

Error messages from config failures should be:

- Actionable: "Missing required config: SUPABASE_URL".
- Context-aware: Include what failed and why.
- Consistent: Use same phrasing across providers.
- Never expose secrets in error messages.

### 14.7 Documentation

When adding new configuration parameters:

1. Add to architecture parameter matrix table.
2. Add to appropriate `.env` files with example values.
3. Update bootstrap `init()` call to include new parameter.
4. Document purpose and valid value formats.
