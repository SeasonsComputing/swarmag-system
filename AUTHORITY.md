# AUTHORITY

## 1. Scope

- Follow this document as the highest-priority engineering rules for this project.
- In case of conflict, correctness > authority > convention > examples.

## 2. Stack and Architecture

- Use the prescribed stack (Netlify Edge Functions + Supabase + TypeScript + SolidJS + TanStack + Kobalte + Docker) and do not add new frameworks or services without explicit approval.
- Maintain zero-cost deployment constraints for all environments.
- Prefer classes when state, lifecycle, or invariants must be enforced; use free functions only for pure utilities.
- Prefer utility classes (static methods only) for stateless operations that benefit from namespace grouping and encapsulation.
- Favor encapsulation; hide implementation details (HTTP, RPC, result envelopes) behind clean interfaces that return domain types or throw exceptions.
- Do not introduce new patterns, abstractions, or conventions unless explicitly requested.
- Extend the domain model first, then implement or update the API layer that exposes it, and only then build or modify the apps that consume it.
- Get it right the first time; do not defer correctness or completeness.
- Prefer less over more; keep solutions minimal and KISS.

### 2.1 Namespace dependencies

- Follow the top-level dependency boundaries defined in `docs/foundation/architecture.md` section 8.

## 3. Language, Build, and Tooling

- Write all code in TypeScript.
- Keep TypeScript compiler settings aligned with `module: ESNext`, `moduleResolution: bundler`, and `baseUrl: source`.
- Use path aliases `@domain/*`, `@utils/*`, `@api/*`, `@serverless-lib/*`, `@serverless-functions/*`, `@serverless-mappings/*` for imports.
- Keep tooling, linting, and builds free of warnings.
- Treat all environment variables as required; do not use hard-coded defaults.
- Files must live in leaf directories; directories with subdirectories must not contain files.

## 4. Identifiers and Time

- Use UUID v7 for all identifiers; generate with `@utils/identifier` `id()` and validate with `isID`.
- Represent all timestamps as ISO 8601 UTC strings; generate with `@utils/datetime` `when()` and validate with `isWhen`.

## 5. API Handlers

- Implement serverless APIs as Netlify handlers wrapped with `createApiHandler(handle)` and typed with `ApiRequest`/`ApiResponse`.
- Return JSON envelopes only: success `{ data }`, failure `{ error, details? }`.
- Use `HttpCodes` constants for all HTTP status codes; do not use numeric literals.

## 6. Supabase Access and Persistence

- Use `Supabase.client()` as the singleton client configured from `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`, with session persistence disabled.
- Apply soft deletes using a `deletedAt` timestamp and filter active rows with `deleted_at IS NULL`.
- Keep job logs append-only.
- For list endpoints, clamp `limit` to 1-100 with a default of 25 and parse `cursor` as a non-negative integer defaulting to 0.

## 7. Documentation

| Rule              | Requirement                                                            |
| ----------------- | ---------------------------------------------------------------------- |
| Markdown sections | Number all Markdown sections.                                          |
| Markdown lint     | Keep Markdown files free of lint warnings.                             |
| Blank lines       | No multiple consecutive blank lines.                                   |
| Filenames         | Prefer dashes over underscores in filenames.                           |
| Tables            | Prefer tables over lists when there is more than a simple description. |
| Table spacing     | Tables should be surrounded by blank lines.                            |

## 8. API and Data Boundaries

- data.swarmag.com is a pure persistence layer (RDBMS + object storage only).
- api.swarmag.com is a runtime API composition and is not a shared library.
- All apps (web or native) must consume the backend exclusively through the runtime API.
- Apps must not import serverless code or persistence logic directly.
- Architecture is enforced by CI, not convention.
- Import boundary violations are build failures.
- The CI guard is authoritative and non-optional for all changes.
- Diagrams explain intent; CI enforces reality.
- Developer-owned bundling and committed build artifacts are forbidden.

## 9. Domain Validation Ownership

- All invariant validation lives in `source/domain`.
- Shared validation logic must be implemented once in the domain and reused elsewhere.
- Duplicating invariant validation in serverless is forbidden.
- Upper layers translate domain validation failures but must not redefine the rules.
- DRY applies to truth, not transport.

## 10. Api Layer

- The Api layer (`source/api/`) is the typed SDK for apps to consume the serverless runtime.
- Api classes are utility classes with static methods only; no instance state.
- Api methods return domain types directly; never expose HTTP, result envelopes, or RPC internals.
- Api methods throw exceptions on errors; callers handle failures via try/catch.
- Name Api classes as `{Abstraction}Api` (e.g., `UsersApi`, `JobsApi`).

## 11. Collaboration Preferences

| Preference          | Requirement                                                                            |
| ------------------- | -------------------------------------------------------------------------------------- |
| Communication style | Prefer direct, no-fluff communication and concrete actions.                            |
| Engineering focus   | Emphasize rigorous engineering, architecture quality, and correctness.                 |
| Standards           | Keep changes aligned with documented conventions and keep tooling/builds warning-free. |
| Naming              | Prefer dashes over underscores in filenames.                                           |
| Version guidance    | Do not suggest legacy/older tooling variants; assume current, modern tooling only.     |

## 12. Execution Permissions

| Permission     | Requirement                                    |
| -------------- | ---------------------------------------------- |
| Project access | You are authorized to access the project root. |
| Deno           | You are authorized to run Deno.                |

## 13. Environment Variable Access

Direct access to `Deno.env` or `Netlify.env` is restricted to config provider implementations:

**Allowed:**

- `utils/configure-deno.ts` - Accesses `Deno.env`.
- `serverless/lib/configure-netlify.ts` - Accesses `Netlify.env`.
- `api/lib/configure-solid.ts` - Accesses `import.meta.env`.
- `tests/lib/test-config.ts` - Accesses `Deno.env` (if needed for test-specific config).

**Forbidden:**

- Application code using `Deno.env.get()` directly.
- Utility functions accessing environment variables.
- Domain logic reading configuration directly.

**Rationale:** Centralizing environment access through config providers enables context-appropriate error handling, a priori parameter validation, consistent fast-fail behavior, and runtime environment detection.

## 14. Configuration File Locations

### 14.1 Bootstrap files

Bootstrap files (`config.ts`) must live in deployment context `config/` directories:

```text
source/
  serverless/config/config.ts
  apps/admin/config/config.ts
  apps/ops/config/config.ts
  apps/customer/config/config.ts
  tests/config/config.ts
```

### 14.2 Environment files

Environment value files (`.env`) must be co-located with bootstrap files:

```text
source/
  serverless/config/
    serverless-local.env
    serverless-stage.env
    serverless-prod.env
  apps/admin/config/
    admin-local.env
    admin-stage.env
    admin-prod.env
  [etc.]
```

### 14.3 Config providers

Config provider implementations:

```text
source/
  utils/
    configure-deno.ts       # Shared Deno provider (used by serverless, api, tests)
  serverless/lib/
    configure-netlify.ts    # Netlify-specific provider
  api/lib/
    configure-solid.ts      # Browser/SSR provider for apps
```

**Rationale:** `ConfigureDeno` lives in utils as a shared foundation. Context-specific providers (Netlify, Solid) live in their respective lib directories.
