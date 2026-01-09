# AUTHORITY

## 1. Scope

- Follow this document as the highest-priority engineering rules for this project.
- In case of conflict, correctness > authority > convention > examples.

## 2. Stack and Architecture

- Use the prescribed stack (Netlify Edge Functions + Supabase + TypeScript + SolidJS + TanStack + Kobalte + Docker) and do not add new frameworks or services without explicit approval.
- Maintain zero-cost deployment constraints for all environments.
- Prefer classes when state, lifecycle, or invariants must be enforced; use free functions only for pure utilities.
- Do not introduce new patterns, abstractions, or conventions unless explicitly requested.
- Extend the domain model first, then implement or update the API layer that exposes it, and only then build or modify the apps that consume it.
- Get it right the first time; do not defer correctness or completeness.
- Prefer less over more; keep solutions minimal and KISS.

## 3. Language, Build, and Tooling

- Write all code in TypeScript.
- Keep TypeScript compiler settings aligned with `module: ESNext`, `moduleResolution: bundler`, and `baseUrl: source`.
- Use path aliases `@domain/*`, `@utils/*`, `@serverless-lib`, and `@serverless-api/*` for imports.
- Keep tooling, linting, and builds free of warnings.

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

## 10. Collaboration Preferences

| Preference          | Requirement                                                                            |
| ------------------- | -------------------------------------------------------------------------------------- |
| Communication style | Prefer direct, no-fluff communication and concrete actions.                            |
| Engineering focus   | Emphasize rigorous engineering, architecture quality, and correctness.                 |
| Standards           | Keep changes aligned with documented conventions and keep tooling/builds warning-free. |
| Naming              | Prefer dashes over underscores in filenames.                                           |
| Version guidance    | Do not suggest legacy/older tooling variants; assume current, modern tooling only.     |

## 11. Execution Permissions

| Permission     | Requirement                                    |
| -------------- | ---------------------------------------------- |
| Project access | You are authorized to access the project root. |
| Deno           | You are authorized to run Deno.                |
