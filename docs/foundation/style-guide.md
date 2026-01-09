# swarmAg Code Style Guide

Working norms inferred from the current `serverless/functions/`, `domain/`, and `utils/` sources.

## 1. Language & Tooling

| Item     | Guideline                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------- |
| Compiler | Deno `check` with strict TypeScript                                                                     |
| Aliases  | `@domain/*`, `@utils/*`, `@serverless-lib/*`, `@serverless-functions/*`, `@serverless-mappings/*`, test aliases via `deno.json` |
| Types    | Prefer type aliases and interfaces; avoid runtime-heavy helpers                                         |
| Encoding | ASCII only; no non-ASCII literals                                                                       |

## 2. Imports & Organization

| Item       | Guideline                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------- |
| Paths      | Use aliases instead of deep relatives                                                         |
| Ordering   | Domain -> utils -> serverless lib; use `import type` where helpful                            |
| Exports    | Default export only for Netlify Edge `createApiHandler(handle)`                               |
| Extensions | Include `.ts` in local/alias import specifiers                                                 |
| Import maps | Keep `netlify-import-map.json` aligned with `deno.json`; use root-relative paths in the Netlify map |

## 3. Domain Modeling (`source/domain/*`)

| Item         | Guideline                                                |
| ------------ | -------------------------------------------------------- |
| Abstractions | Interfaces with immutable intent; no mutation helpers    |
| Docs         | Single-sentence JSDoc on types/enums                     |
| Primitives   | Reuse `ID` (UUID v7 string) and `When` (ISO 8601 string) |
| Payloads     | JSON-serializable only; no methods on domain objects     |
| Validators   | Validators live in `source/domain/{abstraction}-validators.ts` (singular abstraction names) |

## 4. Utilities (`source/utils/*`)

| Item          | Guideline                                      |
| ------------- | ---------------------------------------------- |
| identifier.ts | UUID v7 via `id()`; validate with `isID()`     |
| datetime.ts   | UTC ISO via `when()`; validate with `isWhen()` |
| Scope         | Keep utilities focused and dependency-light    |

## 5. API Functions (`source/serverless/functions/*`)

| Item       | Guideline                                                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Naming     | `{resource}-{action}.ts` (plural resource), e.g., `users-create.ts`                                                                                                  |
| Exports    | Default export only: Netlify `createApiHandler(handle)`                                                                                                            |
| Config     | Export `config = { path: "/api/{resource}/{action}" }` for routing                                                                                                  |
| Types      | Use `ApiRequest`/`ApiResponse` from `@serverless-lib/api-binding`                                                                                                   |
| Status     | Use `HttpCodes`; no numeric literals                                                                                                                                |
| Platform   | Use `Supabase.client()`; paginate via `clampLimit`/`parseCursor`                                                                                                    |
| Validation | Guard with `validate` + `HttpCodes.unprocessableEntity`                                                                                                             |
| Methods    | Guard unsupported verbs with `HttpCodes.methodNotAllowed`                                                                                                           |
| Responses  | Success: `{ data: ... }`; failure: `{ error, details? }`                                                                                                            |
| JSON       | Always JSON; `createApiHandler` sets headers and wraps errors                                                                                                       |
| Mapping    | Use mapping helpers from `source/serverless/mappings/` (e.g., `user-mapping.ts`) instead of ad hoc column maps in each handler                                      |

## 6. Database Mapping

| Rule | Requirement |
| ---- | ----------- |
| Boundary types | Use `unknown` at database boundaries; never coerce with `as any`. |
| Validation | Validate once, then return a domain type. |
| Abstractions | Do not introduce generic row wrappers like `Row<T>`. |
| Checks | Prefer small, explicit runtime checks over clever typing. |
| Failure mode | Mapping code may throw on invalid input. |
| Scope | Shared helpers must live in the narrowest possible scope. |

Bad:

```ts
const user = rowToUser(data as any)
```

Good:

```ts
const user = rowToUser(data)
```

## 7. Error Handling

| Item    | Guideline                                                        |
| ------- | ---------------------------------------------------------------- |
| Parsing | Invalid JSON -> `HttpCodes.badRequest`                           |
| Server  | Persistence/unknown -> `HttpCodes.internalError`; safe `details` |
| Control | Do not throw past `createApiHandler`; return `ApiResponse`      |

## 8. Pagination

| Item    | Guideline                                            |
| ------- | ---------------------------------------------------- |
| Limits  | Clamp to `1..100`; default 25                        |
| Cursor  | Default 0; non-negative only                         |
| Helpers | Use `Supabase.clampLimit` and `Supabase.parseCursor` |

## 9. Commenting Style

| Item   | Guideline                                              |
| ------ | ------------------------------------------------------ |
| JSDoc  | JSDoc on exports with a one-sentence summary plus @param/@returns (and @throws when relevant), ending sentences with periods |
| Inline | Add only when logic is non-obvious                     |
| Internal | Add brief JSDoc when grouping internal type aliases that clarify adapter shapes (e.g., raw Netlify event types) |

## 10. Naming & Data Shapes

| Item      | Guideline                                                        |
| --------- | ---------------------------------------------------------------- |
| Clarity   | Use domain-specific names (e.g., `JobAssessment`, `JobLogEntry`) |
| Enums     | String unions for enums (e.g., `JobStatus`, `JobLogType`)        |
| Optionals | Mark optional fields with `?`; handle defaults in handlers       |
