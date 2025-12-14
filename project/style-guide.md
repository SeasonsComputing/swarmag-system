# swarmAg Code Style Guide

Working norms inferred from the current `core/api/`, `domain/`, and `utils/` sources.

## Language & Tooling

| Item      | Guideline |
| --------- | --------- |
| Compiler  | `strict`; `module: ESNext`; `moduleResolution: bundler` |
| Aliases   | `@domain/*`, `@utils/*`, `@core/*`, `@/*` |
| Types     | Prefer type aliases and interfaces; avoid runtime-heavy helpers |
| Encoding  | ASCII only; no non-ASCII literals |

## Imports & Organization

| Item     | Guideline |
| -------- | --------- |
| Paths    | Use aliases instead of deep relatives |
| Ordering | Domain -> utils -> platform; use `import type` where helpful |
| Exports  | Default export only for Netlify `handler`; prefer named exports |

## Domain Modeling (`source/domain/*`)

| Item      | Guideline |
| --------- | --------- |
| Entities  | Interfaces with immutable intent; no mutation helpers |
| Docs      | Single-sentence JSDoc on types/enums |
| Primitives| Reuse `ID` (UUID v7 string) and `When` (ISO 8601 string) |
| Payloads  | JSON-serializable only; no methods on domain objects |

## Utilities (`source/utils/*`)

| Item           | Guideline |
| -------------- | --------- |
| identifier.ts  | UUID v7 via `id()`; validate with `isID()` |
| datetime.ts    | UTC ISO via `when()`; validate with `isWhen()` |
| Scope          | Keep utilities focused and dependency-light |

## API Functions (`source/core/api/*`)

| Item        | Guideline |
| ----------- | --------- |
| Naming      | `{abstraction}-{action}.ts` (singular), e.g., `job-create.ts` |
| Exports     | Default export only: Netlify `handler = withNetlify(handle)` |
| Types       | Use `ApiRequest`/`ApiResult` from `@core/platform/netlify` |
| Status      | Use `HttpCodes`; no numeric literals |
| Platform  | Use `Supabase.client()`; paginate via `clampLimit`/`parseCursor` |
| Validation| Guard with `validate` + `HttpCodes.unprocessableEntity` |
| Methods     | Guard unsupported verbs with `HttpCodes.methodNotAllowed` |
| Responses   | Success: `{ data: ... }`; failure: `{ error, details? }` |
| JSON        | Always JSON; `withNetlify` sets headers and wraps errors |
| Mapping     | Keep per-entity mapping helpers (e.g., `user-mapping.ts`) to convert between domain shapes and Supabase rows instead of ad hoc column maps in each handler |

## Error Handling

| Item    | Guideline |
| ------- | --------- |
| Parsing | Invalid JSON -> `HttpCodes.badRequest` |
| Server  | Persistence/unknown -> `HttpCodes.internalError`; safe `details` |
| Control | Do not throw past `withNetlify`; return `ApiResult` |

## Pagination

| Item   | Guideline |
| ------ | --------- |
| Limits | Clamp to `1..100`; default 25 |
| Cursor | Default 0; non-negative only |
| Helpers| Use `Supabase.clampLimit` and `Supabase.parseCursor` |

## Commenting Style

| Item  | Guideline |
| ----- | --------- |
| JSDoc | Single-sentence JSDoc on exports, ending with a period |
| Inline| Add only when logic is non-obvious |

## Naming & Data Shapes

| Item    | Guideline |
| ------- | --------- |
| Clarity | Use domain-specific names (e.g., `JobAssessment`, `JobLogEntry`) |
| Enums   | String unions for enums (e.g., `JobStatus`, `JobLogType`) |
| Optionals| Mark optional fields with `?`; handle defaults in handlers |
