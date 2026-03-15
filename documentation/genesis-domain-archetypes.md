# Genesis Prompt -- Domain Archetypes

You are an AI Coding Engine operating under `CONSTITUTION.md`. You have no
architectural authority. Implement exactly what is specified. Do not invent
abstractions, reinterpret intent, or cross architectural boundaries.

## 1. Authority

Authoritative source set, in order:

1. `CONSTITUTION.md`
2. `documentation/architecture-core.md`
3. `documentation/domain.md`
4. `documentation/domain-archetypes.md`
5. `documentation/domain-data-dictionary.md`
6. `documentation/style-guide.md`

Do not restate or fork these rules in this prompt. This prompt is orchestration only.

## 2. Task Contract

The domain model SDK is composed of _archetypes_ each of which has a unique manifestation within the source code. The 5 archetypes are: abstractions, adapters, protocols, validators, and schema. Each archetype is organized as a directory containing the archetype artifacts unique to it.

The definitive topic list including each topic's contents is `domain-data-dictionary.md`

Always prompt the user to determine if this is a "genesis" run or not. If it's a genesis run then always remove all artifacts for an archetype prior to generation. Avoid git history, genesis is intended to supplant all prior knowledge, as if running this prompt for the first time.

Next prompt the user for which archetype, with "all" as an option.

Next proceed generation in the following order using the above parameters.

### 2.1 Phase I — Domain Abstractions

1. `source/domain/abstractions/`

### 2.2 Phase II - Adapters, Protocols and Validators

2. `source/domain/adapters/`
3. `source/domain/protocols/`
4. `source/domain/validators/`

### 2.3 Phase III — Schema

Generate `source/domain/schema/schema.sql` as canonical current-state DDL.
Not a migration — must be idempotent and fully reproducible.

Per `style-guide.md` §10–11 and `domain-archetypes.md` §7.

#### Seed ID Protocol

Use `source/devops/genesis/seed-ids.txt` as the sole ID source for seed records.

Required for each genesis run:

1. Remove `source/devops/seed-ids.txt` if it exists.
2. Replace `source/devops/genesis/seed-ids.txt` with a new file.
3. Fill with exactly the IDs needed for seed data, in contiguous file order.
4. Consume IDs in order while writing seed inserts.
5. After schema generation completes successfully, delete the file.

Assignment order (contiguous):

- Asset types (9)
- Services (12)
- Internal questions (14)

## 3. Execution Contract

1. Ingest the authority set in §1.
2. Ingest all files under `source/domain/abstractions/` — confirm no conflicts before generating.
3. **Phase 1:** Generate all four archetype directories in one run.
4. Run `deno task genesis:domain`. Fix and re-run until all checks pass.
5. **Phase 2:** Generate `schema.sql` per §2.2 and the authority set.
6. Rotate and populate `source/devops/genesis/seed-ids.txt` per the Seed ID Protocol.
7. Lint schema in a disposable database:

```bash
# find container
docker ps --format '{{.Names}}' | rg '^supabase_db'

# create lint db
docker exec <db_container> psql -U postgres -d template1 -v ON_ERROR_STOP=1 \
  -c "DROP DATABASE IF EXISTS schema_lint_db;" \
  -c "CREATE DATABASE schema_lint_db;"

# auth stubs (lint db only)
docker exec <db_container> psql -U postgres -d schema_lint_db -v ON_ERROR_STOP=1 \
  -c "CREATE SCHEMA IF NOT EXISTS auth;" \
  -c "CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT NULL::uuid';" \
  -c "CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS 'SELECT ''{}''::jsonb';"

# lint apply
docker exec -i <db_container> psql -U postgres -d schema_lint_db -v ON_ERROR_STOP=1 \
  < source/domain/schema/schema.sql
```

8. Apply to local Supabase runtime:

```bash
docker exec -i <db_container> psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  < source/domain/schema/schema.sql

# if blocked by legacy tables
docker exec <db_container> psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  -c "DO \$\$ DECLARE r RECORD; BEGIN FOR r IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END \$\$;"

docker exec -i <db_container> psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  < source/domain/schema/schema.sql
```

9. Verify — report exact counts:
   - number of `public` tables
   - `users` seed count
   - `asset_types` seed count
   - `services` seed count
   - internal `questions` seed count (`type = 'internal'`)
10. Delete `source/devops/genesis/seed-ids.txt`.
11. Return only when both phases are green.

## 4. Output Contract

Responses that include code changes must include:

**Phase 1:**

- `STYLE_AUDIT: PASS` or `STYLE_AUDIT: FAIL`
- If `FAIL`: `- path:line — rule — issue`
- If `PASS`: list of audited generated files/directories

**Phase 2:**

- `SCHEMA_AUDIT: PASS` or `SCHEMA_AUDIT: FAIL`
- If `FAIL`: which step failed and why
- If `PASS`: table count and seed counts from verification

## 5. Schema Quality Bar

Before reporting `SCHEMA_AUDIT: PASS`:

- `tasks` and `questions` are full Instantiable tables with RLS
- `workflow_tasks` and `task_questions` junctions exist with `sequence`
- `job_workflows` has no `sequence` column
- `workflows` has no `tasks` JSONB column
- All `Composition*` fields: `JSONB NOT NULL DEFAULT '[]'::jsonb`
- All const-enum columns have named `CHECK` constraints
- Every table has RLS enabled
- Drop order covers all tables in reverse dependency order
- `source/devops/genesis/seed-ids.txt` was rotated, populated, consumed in order, and deleted
- No `VARCHAR(n)`, no bare `TIMESTAMP`
- Both lint and runtime applies succeed with `ON_ERROR_STOP=1`
