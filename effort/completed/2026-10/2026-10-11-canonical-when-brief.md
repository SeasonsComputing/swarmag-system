# Canonical When — Brief

**Withdrawn 2026-10-11, never dispatched.** Heavier than the problem it solved. ACE's review
(2026-10-11) found the design incomplete: a delegate was the wrong carrier for a scalar conversion,
`toWhen`'s accepted inputs were unbounded, and the migration rounded existing values. Each answer
added machinery. Restarting from the two failures it addressed: keyset paging duplicated rows only
because adapters were to rewrite timestamps, and a cursor carrying the value exactly as the store
returned it compares exactly; lexical comparison of mixed forms arises only in the in-memory
evaluator over deep-cloned data, which does not exist yet. Kept for its stage evidence, below.
Recorded 2026-10-11 from a CA + AI Architect session.

## What triggered it

ACE's review of the list-query brief found that `When` is `string`, so the type cannot tell a
timestamp from text. The CA settled that every string takes comparison operators, because ISO 8601
UTC strings collate chronologically. Checking that premise against stage showed that timestamps
read from Supabase are not in the form the system writes.

## What the repository holds

- **`core/std/datetime.ts`:** `When = string`; `when()` returns `new Date().toISOString()`
  (`YYYY-MM-DDTHH:mm:ss.sssZ`); `isWhen` matches
  `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/`, so milliseconds are optional.
- **PostgREST returns `TIMESTAMPTZ` as Postgres serializes it to JSON,** checked on stage
  (`TimeZone` is `UTC`):

  | Written                      | Read back                          |
  | ---------------------------- | ---------------------------------- |
  | `…14.273Z`                   | `2026-10-11T15:08:14.273+00:00`    |
  | `…14.270Z`                   | `2026-10-11T15:08:14.27+00:00`     |
  | `…14.000Z`                   | `2026-10-11T15:08:14+00:00`        |
  | a `users.created_at` default | `2026-10-07T03:30:32.719719+00:00` |

  Every timestamp column read back fails `isWhen`. Nothing has failed because adapters pass values
  through and no read path validates.
- **Timestamps inside JSONB are stored verbatim.** A stored Customer note's `created_at` is
  `2026-10-09T02:22:04.040Z`, so `Note`, `Attachment`, `Location`, and `Answer` timestamps
  round-trip canonically today.
- **`TIMESTAMPTZ` columns:** 58 in `schema.sql`, 35 with `DEFAULT now()`. Beyond the lifecycle
  columns, `job_assessments.scheduled_at`, `started_at`, `completed_at`, `job_plans.scheduled_start`, and
  `job_work.started_at` and `completed_at`.
- **Casts that bypass any normalization:** `row['deleted_at'] as When` in
  `core/cli/make-supabase-client.ts`, `core/cli/make-indexeddb-client.ts`, and
  `back/supabase-edge/orchestration/user-orchestra.ts`.
- **Test literals:** 46 string-literal timestamps across six fixture modules and two state tests.
- **`source/back/migrations/`** holds only `placeholder.txt`.

## Decisions (CA, 2026-10-11)

1. **One canonical form: `YYYY-MM-DDTHH:mm:ss.sssZ`,** the `toISOString()` form: UTC, milliseconds
   always present, `Z`. String order is chronological order, so lexical comparison is correct in
   every store and in memory.
2. **`When` is a branded type.** Only `when()` and `toWhen(input)` produce one. `toWhen` accepts any
   ISO 8601 instant (offset form, any fractional digits), returns the canonical form, and throws on
   input it cannot parse. Both live in `core/std/datetime.ts` beside the brand, exported through
   `@core/std` as today. Code that only passes a `When` along recompiles unchanged.
3. **`isWhen` matches the canonical form only.**
4. **The adapter canonicalizes on read.** `makeAdapter` gains a `When` delegate whose `toDomain`
   applies `toWhen`; `InstantiableAdapt` and `InstantiableOnlyAdapt` use it for `createdAt`,
   `updatedAt`, and `deletedAt`. Domain adapters mark their other `When` fields with it. Converting
   a timestamp's format is serialization (`architecture-core.md` §10.1.3), not business logic.
5. **Columns store milliseconds: `TIMESTAMPTZ(3)`,** in the canonical schema and through a forward
   migration, so a column default cannot store precision the domain cannot carry.
6. **The three `deleted_at` casts become `toWhen`.**

## Why it precedes the list-query brief

- **Comparisons.** The in-memory evaluator compares `When` values as strings; mixed forms from a
  deep clone would sort wrongly.
- **Keyset paging.** A cursor records the last row's sort value as read. Without decision 5, a
  stored `…32.719719` reads as `…32.719Z`, and the next page's `created_at > '…32.719'` returns that
  row again: one row on two pages. `createdAt` is the default order of every unqueried `list()`.

## If only `core` is fixed

The test literals fail to compile, so they cannot be deferred. Unmarked domain adapter fields and
the back-end cast compile but carry non-canonical values under a canonical type; nothing fails until
Job screens round-trip them. A missing precision change duplicates rows across pages.

## Scope the production will touch

- `core/std/datetime.ts`: the brand, `toWhen`, and `isWhen`.
- `core/std/make-adapter.ts`: the `When` delegate, and the lifecycle metadata using it.
- `core/cli/make-supabase-client.ts`, `core/cli/make-indexeddb-client.ts`, and
  `back/supabase-edge/orchestration/user-orchestra.ts`: the `deleted_at` casts.
- `domain/adapters/`: the `When` fields of `common`, `job`, and `workflow` abstractions.
- `domain/schema/schema.sql` and a forward migration in `back/migrations/`: `TIMESTAMPTZ(3)`.
- `tests/`: the 46 literals through `toWhen`; tests for `toWhen` across offset forms, fractional
  digits, and unparsable input; an adapter round-trip of a server-form timestamp.
- Generated edge copies through `deno task edge-sync`.
- `architecture-core.md` and `domain-archetypes.md` §6 where they describe `When` and adapter
  metadata; `CONVENTIONS.md` §2 and §10.3 name `When` and its column type and are governance
  documents, so any change there is the CA's.

## Open

1. **Existing data under the migration.** Altering a column to `TIMESTAMPTZ(3)` rounds stored
   microseconds; `toWhen` truncates input beyond milliseconds. Once columns hold milliseconds the two
   cannot disagree, but the migration's effect on existing rows is to be stated and checked on stage.
2. **Domain genesis.** `When` fields in adapters are marked by hand here; the genesis prompts that
   regenerate `domain/` must produce the same marking.

_End of Brief_
