# swarmAg Operations System — Architecture Backend

![swarmAg ops logo](../../swarmag-ops-logo.png)

## 1. Overview

This document defines the backend architecture of the swarmAg system. The backend consists of:

- **Supabase Edge Functions** — Orchestration operations only
- **PostgreSQL Database** — Persistent storage with Row Level Security
- **Storage Buckets** — File and image storage
- **Migrations** — Forward-only schema deltas and RLS policy changes

**Prerequisites:** Read `domain.md` and `architecture-core.md` first to understand the domain model and system boundary.

## 2. Backend Structure

The backend is intentionally minimal. Most operations go **directly to the database** from UX applications via Supabase SDK. Edge functions exist only for orchestration that cannot be expressed as simple CRUD.

### 2.1 Directory Structure

```text
back/
├── migrations/          # Forward-only schema deltas and RLS policies
└── supabase-edge/
    ├── config/          # Runtime configuration
    └── functions/       # Flat orchestration functions
```

**Key Principle:** If it can be a direct database operation with RLS, it shouldn't be an edge function.

## 3. Supabase Edge Functions

Edge functions handle **orchestration only** — complex multi-step operations that cannot be performed client-side.

### 3.1 When to Use Edge Functions

#### 3.1.1 YES — Use edge functions for

- Multi-step transactions requiring coordination (e.g. deep clone Job aggregate)
- Operations with complex business rules spanning multiple tables
- Background processing or async workflows
- Operations requiring elevated privileges

#### 3.1.2 NO — Do NOT use edge functions for

- Simple CRUD operations (use direct Supabase SDK client)
- Read-only queries (use direct Supabase SDK client)
- Client-side validation (use domain validators)
- Authorization (use RLS policies)

### 3.2 Edge Function Patterns

#### 3.2.1 Business Rule Pattern (Simple Orchestration)

```typescript
// source/back/supabase-edge/functions/job-deep-clone.ts
import { Config } from '@back-supabase-edge/config/config.ts'
import type { Dictionary } from '@core-std'
import { wrapHttpHandler } from '@core/api/wrap-http-handler.ts'

const handler = async (params: Dictionary): Promise<Dictionary> => {
  const jobId = params.jobId as string
  const job = await fetchJob(jobId)
  const assessment = await fetchAssessment(job.assessmentId)
  const plan = await fetchPlan(job.planId)
  const logs = await fetchLogs(job.id)
  const clonedJob = await createJobClone(job, assessment, plan, logs)
  return { clonedJobId: clonedJob.id }
}

export default wrapHttpHandler(handler, { cors: true })
```

Use when: simple Dictionary → Dictionary, no custom HTTP status codes, default error handling sufficient.

#### 3.2.2 REST Pattern (Full HTTP Control)

```typescript
// source/back/supabase-edge/functions/jobs-batch-update.ts
import type { Dictionary } from '@core-std'
import type { HttpRequest, HttpResponse } from '@core/api/wrap-http-handler.ts'
import {
  toBadRequest,
  toMethodNotAllowed,
  toOk,
  toUnprocessable,
  wrapHttpHandler
} from '@core/api/wrap-http-handler.ts'
import { validateJobBatchUpdate } from '@domain/validators/job-validator.ts'

const handler = async (req: HttpRequest): Promise<HttpResponse> => {
  if (req.method !== 'POST') return toMethodNotAllowed()
  const validated = validateJobBatchUpdate(req.body)
  if (!validated.success) return toUnprocessable(validated.error)
  const dryRun = req.query.dry_run === 'true'
  const results = await batchUpdateJobs(validated.data, dryRun)
  return toOk({ updated: results.updated, failed: results.failed, dryRun })
}

export default wrapHttpHandler(handler, { cors: true, maxBodySize: 1024 * 1024 })
```

Use when: HTTP method routing, custom error codes (400/422), query parameters, or custom response structures needed.

### 3.3 Function Responsibilities

Edge functions **do**:

- Orchestrate multi-step operations
- Use `Supabase.client()` for database access
- Use domain adapters for serialization
- Use domain validators for input validation

Edge functions **do not**:

- Contain business logic (that lives in domain)
- Implement authorization (use RLS policies)
- Duplicate CRUD operations (use direct SDK)

### 3.4 Platform Requirements

- Stay flat in `source/back/supabase-edge/functions/` — no subdirectories
- Single file per function
- Filename = function name (platform discovery)

## 4. Database Layer

### 4.1 Schema vs. Migrations

The canonical schema lives in `source/domain/schema/schema.sql` — a domain artifact generated from the domain model. It is the authoritative current-state DDL for the entire system. It is not a migration.

See `domain-archetypes.md` section 7 for all DDL authoring conventions.

Migrations in `source/back/migrations/` are forward-only change records expressing deltas from one schema state to the next. **Do not define the schema in migrations.** The schema file is the source of truth; migrations derive from it.

### 4.2 Migration Rules

- One migration per conceptual change
- Timestamp-based naming: `YYYYMMDDHHMMSS_description.sql`
- Forward-only — never modify a deployed migration
- Express deltas only: `ALTER TABLE`, `CREATE INDEX`, new or changed RLS policies, etc.
- Do not repeat full table definitions — those belong in `schema.sql`

### 4.3 Row Level Security

Authorization is enforced at the **database layer** via RLS policies, not application code.

#### 4.3.1 Policy Pattern

```sql
CREATE POLICY "job_logs_select_own"
ON job_logs FOR SELECT
USING (created_by_id = auth.uid());

CREATE POLICY "job_logs_insert_ops"
ON job_logs FOR INSERT
WITH CHECK (auth.jwt() ->> 'role' = 'operations');
```

#### 4.3.2 RLS Principles

- Policies defined in `schema.sql` alongside their tables — canonical current state
- Migrations express RLS deltas (policy changes, additions, removals)
- Cannot be bypassed by client code
- Automatic enforcement across all access paths
- Tested via integration tests with different user contexts

### 4.4 Seed Data

Canonical seed data known at schema time is part of `schema.sql` — not a migration. The following seed data is defined in `schema.sql`:

- **Asset types** — canonical `asset_types` records from `data-lists.md §4`
- **Services** — canonical `services` records from `data-lists.md §2` and `§3`
- **Internal questions** — canonical `questions` seed records with `QuestionType = 'internal'` from `data-lists.md §5`
- **Bootstrap admin user** — `devops-admin@swarmag.com` with `administrator` role and stable UUID; password reset via Supabase Auth dashboard post-deploy

All seed record IDs are stable UUID v7 values drawn from `documentation/devops/seed-ids.txt`. No seed record uses a database-generated ID.

## 5. Configuration Management

Edge functions use the singleton `Config` pattern defined in `architecture-core.md` section 6.

### 5.1 Supabase Edge Function Configuration

```typescript
// source/back/supabase-edge/config/supabase-config.ts
import { Config } from '@core/cfg/config.ts'
import { SupabaseProvider } from '@core/cfg/supabase-provider.ts'

Config.init(new SupabaseProvider(), [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY',
  'JWT_SECRET'
])

export { Config }
```

### 5.2 Environment Files

- `back-local.env.example` — Template for local development
- `back-stage.env` — Staging environment (gitignored)
- `back-prod.env` — Production environment (gitignored)

### 5.3 Usage in Edge Functions

```typescript
import { Config } from '@back-supabase-edge/config/config.ts'
import type { Dictionary } from '@core-std'
import { wrapHttpHandler } from '@core/api/wrap-http-handler.ts'

const runBusRule = async (input: Dictionary): Promise<Dictionary> => {
  const supabaseUrl = Config.get('SUPABASE_URL')
  // ... orchestration logic
  return result
}

export default wrapHttpHandler(runBusRule)
```

See `architecture-core.md` section 6 for the complete configuration pattern and rationale.

## 6. Testing Strategy

### 6.1 Integration Tests

- Test edge functions against local Supabase instance
- Verify RLS policies enforce authorization correctly
- Test multi-user scenarios
- Located in `source/tests/`

### 6.2 Migration Tests

- Verify migrations apply cleanly
- Test RLS policies with different user contexts
- Automated via `supabase test db`

See `style-guide.md` section 11 for general testing conventions.

## 7. Deployment

### 7.1 Supabase Edge Functions

```bash
supabase functions deploy job-deep-clone
```

Platform-specific import map required for edge runtime: `supabase-import-map.json` — synchronized with `deno.jsonc`.

### 7.2 Database Migrations

```bash
supabase db push
```

Migration Safety:

- Always test migrations locally first (`supabase db reset`)
- Verify RLS policies in staging environment
- Never modify deployed migrations — create new ones

## 8. Security

### 8.1 Authentication

- JWT tokens issued by Supabase Auth
- Tokens verified automatically by Supabase SDK
- Edge functions access user context via `auth.uid()` in RLS

### 8.2 Authorization

- **Primary:** RLS policies enforce all access control
- **Secondary:** Edge functions validate inputs via domain validators
- **Never:** Application-level authorization checks — RLS is authoritative

### 8.3 Input Validation

```typescript
import { validateJobCreateInput } from '@domain/validators/job-validator.ts'

const handler = async (input: Dictionary): Promise<Dictionary> => {
  const error = validateJobCreateInput(input)
  if (error) throw new Error(error)
  // ... proceed with validated input
}
```

## 9. Key Principles

1. **Orchestration only** — Edge functions coordinate; they do not implement business logic
2. **RLS is authoritative** — Authorization lives in the database, not the application
3. **Direct-to-DB preferred** — Only use edge functions when SDK client can't suffice
4. **Schema lives in domain** — `source/domain/schema/schema.sql` is the canonical current state
5. **Migrations are forward-only** — Express deltas only; never modify deployed migrations
6. **Functions stay flat** — No subdirectories (platform requirement)

_End of Architecture Backend Document_
