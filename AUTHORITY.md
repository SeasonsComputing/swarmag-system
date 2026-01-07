# AUTHORITY

## 1. Scope

- Follow this document as the highest-priority engineering rules for this project.
- In case of conflict, correctness > authority > convention > examples.

## 2. Stack and Architecture

- Use the prescribed stack (Netlify Functions + Supabase + TypeScript + SolidJS + TanStack + Kobalte + Docker) and do not add new frameworks or services without explicit approval.
- Maintain zero-cost deployment constraints for all environments.
- Prefer classes when state, lifecycle, or invariants must be enforced; use free functions only for pure utilities.
- Do not introduce new patterns, abstractions, or conventions unless explicitly requested.
- Extend the domain model first, then implement or update the API layer that exposes it, and only then build or modify the apps that consume it.
- Get it right the first time; do not defer correctness or completeness.
- Prefer less over more; keep solutions minimal and KISS.

## 3. Language, Build, and Tooling

- Write all new code in TypeScript.
- Keep TypeScript compiler settings aligned with `module: ESNext`, `moduleResolution: bundler`, and `baseUrl: source`.
- Use path aliases `@domain/*`, `@utils/*`, and `@serverless/*` for imports.
- Keep tooling, linting, and builds free of warnings.

## 4. Identifiers and Time

- Use UUID v7 for all identifiers; generate with `@utils/identifier` `id()` and validate with `isID`.
- Represent all timestamps as ISO 8601 UTC strings; generate with `@utils/datetime` `when()` and validate with `isWhen`.

## 5. API Handlers

- Implement serverless APIs as Netlify handlers wrapped with `withNetlify(handle)` and typed with `ApiRequest`/`ApiResponse`.
- Return JSON envelopes only: success `{ data }`, failure `{ error, details? }`.
- Use `HttpCodes` constants for all HTTP status codes; do not use numeric literals.

## 6. Supabase Access and Persistence

- Use `Supabase.client()` as the singleton client configured from `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`, with session persistence disabled.
- Apply soft deletes using a `deletedAt` timestamp and filter active rows with `deleted_at IS NULL`.
- Keep job logs append-only.
- For list endpoints, clamp `limit` to 1-100 with a default of 25 and parse `cursor` as a non-negative integer defaulting to 0.

## 7. Documentation

| Rule | Requirement |
| ---- | ----------- |
| Markdown sections | Number all Markdown sections. |
| Markdown lint | Keep Markdown files free of lint warnings. |
| Filenames | Prefer dashes over underscores in filenames. |
| Tables | Prefer tables over lists when there is more than a simple description. |
| Table spacing | Tables should be surrounded by blank lines. |
