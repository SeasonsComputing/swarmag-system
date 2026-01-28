# swarmAg Code Style Guide

This guide defines the coding conventions and patterns used throughout the swarmAg codebase. Follow these standards when writing or modifying code in `serverless/functions/`, `domain/`, `api/`, and `utils/`.

## 1. Language and Tooling

| Item     | Guideline                                                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Compiler | Deno `check` with strict TypeScript                                                                                                       |
| Aliases  | `@domain/*`, `@utils/*`, `@api/*`, `@serverless-lib/*`, `@serverless-functions/*`, `@serverless-mappings/*`, test aliases via `deno.json` |
| Types    | Prefer type aliases and interfaces; avoid runtime-heavy helpers                                                                           |
| Encoding | ASCII only; no non-ASCII literals                                                                                                         |

## 2. Imports and Organization

| Item        | Guideline                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------- |
| Paths       | Use aliases instead of deep relatives                                                               |
| Ordering    | Domain -> utils -> api -> serverless lib; use `import type` where helpful                           |
| Exports     | Default export only for Netlify Edge `createApiHandler(handle)`                                     |
| Extensions  | Include `.ts` in local/alias import specifiers                                                      |
| Import maps | Keep `netlify-import-map.json` aligned with `deno.json`; use root-relative paths in the Netlify map |
| Layout      | Files live only in leaf directories; directories with subdirectories must not contain files         |

## 3. Naming Conventions

| Item            | Guideline                                                                              |
| --------------- | -------------------------------------------------------------------------------------- |
| Acronyms        | Use title case for acronyms in identifiers: `Api`, `Url`, `Id`, not `API`, `URL`, `ID` |
| Classes         | PascalCase: `UsersApi`, `JobsApi`                                                      |
| Files           | Kebab-case: `users-api.ts`, `job-validators.ts`                                        |
| Type aliases    | PascalCase: `UserCreateInput`, `JobStatus`                                             |
| Constants       | camelCase for exported constants: `httpCodes` (exception: `HttpCodes` object)          |
| Domain-specific | Use domain names: `JobAssessment`, `JobLogEntry`, not generic names                    |

## 4. Domain Modeling (`source/domain/*`)

| Item         | Guideline                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------- |
| Abstractions | Interfaces with immutable intent; no mutation helpers                                       |
| Docs         | Single-sentence JSDoc on types/enums                                                        |
| Primitives   | Reuse `ID` (UUID v7 string) and `When` (ISO 8601 string)                                    |
| Payloads     | JSON-serializable only; no methods on domain objects                                        |
| Validators   | Validators live in `source/domain/{abstraction}-validators.ts` (singular abstraction names) |

## 5. Utilities (`source/utils/*`)

| Item          | Guideline                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------- |
| identifier.ts | UUID v7 via `id()`; validate with `isID()`                                                     |
| datetime.ts   | UTC ISO via `when()`; validate with `isWhen()`                                                 |
| app.ts        | Use `App.init` to validate required env vars, `App.get` to read them, and `App.test` for tests |
| Scope         | Keep utilities focused and dependency-light                                                    |

## 6. API Layer (`source/api/*`)

| Item           | Guideline                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------- |
| Purpose        | Typed SDK for apps to consume the serverless runtime                                         |
| Structure      | Utility classes with static methods only; no instance state                                  |
| Naming         | `{Abstraction}Api` class in `{abstraction}-api.ts` file (e.g., `UsersApi` in `users-api.ts`) |
| Return types   | Return domain types directly (`User`, `User[]`); never expose HTTP or result envelopes       |
| Error handling | Throw exceptions on errors; callers handle failures via try/catch                            |
| Encapsulation  | Hide all RPC internals (fetch, headers, JSON parsing, result unwrapping)                     |
| Methods        | Use `create`, `update`, `delete`, `get`, `list` to match serverless endpoint naming          |
| Base URL       | Configure via environment variable using `App` utility class                                 |

## 7. API Functions (`source/serverless/functions/*`)

| Item       | Guideline                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Naming     | `{resource}-{action}.ts` (plural resource), e.g., `users-create.ts`                                                             |
| Exports    | Default export only: Netlify `createApiHandler(handle)`                                                                         |
| Config     | Export `config = { path: "/api/{resource}/{action}" }` for routing                                                              |
| Types      | Use `ApiRequest`/`ApiResponse` from `@serverless-lib/api-binding`                                                               |
| Status     | Use `HttpCodes`; no numeric literals                                                                                            |
| Platform   | Use `Supabase.client()`; paginate via `clampLimit`/`parseCursor`                                                                |
| Validation | Guard with `validate` + `HttpCodes.unprocessableEntity`                                                                         |
| Methods    | Guard unsupported verbs with `HttpCodes.methodNotAllowed`                                                                       |
| Responses  | Success: `{ data: ... }`; failure: `{ error, details? }`                                                                        |
| JSON       | Always JSON; `createApiHandler` sets headers and wraps errors                                                                   |
| Mapping    | Use mapping helpers from `source/serverless/mappings/` (e.g., `users-mapping.ts`) instead of ad hoc column maps in each handler |

## 8. Database Mapping

| Rule           | Requirement                                                       |
| -------------- | ----------------------------------------------------------------- |
| Boundary types | Use `unknown` at database boundaries; never coerce with `as any`. |
| Validation     | Validate once, then return a domain type.                         |
| Abstractions   | Do not introduce generic row wrappers like `Row<T>`.              |
| Checks         | Prefer small, explicit runtime checks over clever typing.         |
| Failure mode   | Mapping code may throw on invalid input.                          |
| Scope          | Shared helpers must live in the narrowest possible scope.         |

Bad:

```ts
const user = rowToUser(data as any)
```

Good:

```ts
const user = rowToUser(data)
```

## 9. Error Handling

| Item    | Guideline                                                        |
| ------- | ---------------------------------------------------------------- |
| Parsing | Invalid JSON -> `HttpCodes.badRequest`                           |
| Server  | Persistence/unknown -> `HttpCodes.internalError`; safe `details` |
| Control | Do not throw past `createApiHandler`; return `ApiResponse`       |

## 10. Pagination

| Item    | Guideline                                            |
| ------- | ---------------------------------------------------- |
| Limits  | Clamp to `1..100`; default 25                        |
| Cursor  | Default 0; non-negative only                         |
| Helpers | Use `Supabase.clampLimit` and `Supabase.parseCursor` |

## 11. Commenting Style

| Item     | Guideline                                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| JSDoc    | JSDoc on exports with a one-sentence summary plus @param/@returns (and @throws when relevant), ending sentences with periods |
| Inline   | Add only when logic is non-obvious                                                                                           |
| Internal | Add brief JSDoc when grouping internal type aliases that clarify adapter shapes (e.g., raw Netlify event types)              |
| Fields   | Comment class attributes and fields with brief JSDoc.                                                                        |
| Types    | Comment type aliases and interfaces with brief JSDoc.                                                                        |

## 12. Naming and Data Shapes

| Item      | Guideline                                                        |
| --------- | ---------------------------------------------------------------- |
| Clarity   | Use domain-specific names (e.g., `JobAssessment`, `JobLogEntry`) |
| Enums     | String unions for enums (e.g., `JobStatus`, `JobLogType`)        |
| Optionals | Mark optional fields with `?`; handle defaults in handlers       |
