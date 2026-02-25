# swarmAg System — Architecture Backend

![swarmAg ops logo](../../swarmag-ops-logo.png)

## 1. Overview

This document defines the backend architecture of the swarmAg system. The backend consists of:

- **Supabase Edge Functions** - Orchestration operations only
- **PostgreSQL Database** - Persistent storage with Row Level Security
- **Storage Buckets** - File and image storage
- **Migrations** - Forward-only schema deltas and RLS policies

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

Edge functions handle **orchestration only** - complex multi-step operations that cannot be performed client-side.

### 3.1 When to Use Edge Functions

#### 3.1.1 YES - Use edge functions for

- Multi-step transactions requiring coordination (deep clone Job aggregate)
- Operations with complex business rules spanning multiple tables
- Background processing or async workflows
- Operations requiring elevated privileges

#### 3.1.2 NO - Do NOT use edge functions for

- Simple CRUD operations (use direct Supabase SDK client)
- Read-only queries (use direct Supabase SDK client)
- Client-side validation (use domain validators)
- Authorization (use RLS policies)

### 3.2 Edge Function Patterns

#### 3.2.1 Business Rule Pattern (Simple Orchestration)

Use for operations that coordinate multiple steps without needing HTTP-level control:

```typescript
// source/back/supabase-edge/functions/job-deep-clone.ts
import { Config } from '@back-supabase-edge/config/config.ts'
import type { Dictionary } from '@core-std'
import { wrapHttpHandler } from '@core/api/wrap-http-handler.ts'

const handler = async (params: Dictionary): Promise<Dictionary> => {
  const jobId = params.jobId as string

  // Multi-step orchestration
  const job = await fetchJob(jobId)
  const assessment = await fetchAssessment(job.assessmentId)
  const plan = await fetchPlan(job.planId)
  const logs = await fetchLogs(job.id)

  // Create coordinated clone
  const clonedJob = await createJobClone(job, assessment, plan, logs)

  return { clonedJobId: clonedJob.id }
}

export default wrapHttpHandler(handler, { cors: true })
```

##### 3.2.1.1 When to use

- Simple input/output (Dictionary → Dictionary)
- No custom HTTP status codes needed
- Straightforward orchestration logic
- Default error handling sufficient

#### 3.2.2 REST Pattern (Full HTTP Control)

Use when you need fine-grained control over HTTP semantics:

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
  // HTTP method validation
  if (req.method !== 'POST') return toMethodNotAllowed()

  // Domain validation with specific error responses
  const validated = validateJobBatchUpdate(req.body)
  if (!validated.success) {
    return toUnprocessable(validated.error)
  }

  // Query parameter handling
  const dryRun = req.query.dry_run === 'true'

  // Complex orchestration with conditional logic
  const results = await batchUpdateJobs(validated.data, dryRun)

  // Custom response structure
  return toOk({
    updated: results.updated,
    failed: results.failed,
    dryRun
  })
}

export default wrapHttpHandler(handler, {
  cors: true,
  maxBodySize: 1024 * 1024 // 1MB limit for batch operations
})
```

##### 3.2.2.1 When to use

- Need HTTP method routing (GET/POST/PUT/DELETE)
- Custom validation with specific error codes (400/422)
- Query parameter handling
- Custom response structures beyond simple Dictionary
- Size limits or other HTTP-level controls

### 3.3 Function Responsibilities

Edge functions:

- Orchestrate multi-step operations
- Use `Supabase.client()` for database access
- Use domain adapters for serialization
- Use domain validators for input validation
- Return domain types or simple dictionaries

Edge functions do NOT:

- Contain business logic (that lives in domain)
- Implement authorization (use RLS policies)
- Duplicate CRUD operations (use direct SDK)

### 3.4 Platform Requirements

#### 3.4.1 All edge functions must

- Stay flat in `source/back/supabase-edge/functions/` (no subdirectories)
- Be a single file per function
- Use platform discovery naming (filename = function name)

## 4. Database Layer

### 4.1 PostgreSQL Schema

The canonical schema lives in `source/domain/schema/schema.sql` and is generated from the domain model. It is the authoritative current-state SQL — not a migration. Migrations in `source/back/migrations/` are forward-only change records that express deltas from one schema state to the next.

**Do not define the schema in migrations.** The schema file is the source of truth; migrations derive from it.

#### 4.1.1 Migration Rules

- One migration per conceptual change
- Timestamp-based naming: `YYYYMMDDHHMMSS_description.sql`
- Forward-only — never modify deployed migrations
- Express deltas only (ALTER TABLE, CREATE INDEX, new RLS policies, etc.)
- Do not repeat full table definitions — those belong in the schema file

#### 4.1.2 JSONB Exceptions

Use JSONB only for:

1. End-user specialization (custom fields)
2. Third-party metadata (opaque payloads)
3. Payload-as-truth (versioning snapshots)
4. Subordinate composition (embedded entities without independent lifecycle)

#### 4.1.3 Seed Data

Initial catalog values for `Services`, `AssetTypes`, and canonical `internal` Questions are defined in `documentation/foundation/data-lists.md`. These should be loaded via a dedicated seed migration after schema creation.

### 4.2 Row Level Security (RLS)

Authorization is enforced at the **database layer** via RLS policies, not application code.

#### 4.2.1 Policy Pattern

```sql
-- Example: Users can only see their own job logs
CREATE POLICY "job_logs_select_own"
ON job_logs FOR SELECT
USING (created_by_id = auth.uid());

-- Example: Only operations role can create job logs
CREATE POLICY "job_logs_insert_ops"
ON job_logs FOR INSERT
WITH CHECK (
  auth.jwt() ->> 'role' = 'operations'
);
```

#### 4.2.2 RLS Principles

- Policies live in migrations (single source of truth)
- Cannot be bypassed by client code
- Automatic enforcement across all access paths
- Tested via integration tests with different user contexts

### 4.3 Soft Deletes

All lifecycled entities implement soft delete via `deleted_at` column:

```sql
ALTER TABLE jobs ADD COLUMN deleted_at TIMESTAMPTZ;

-- RLS policy filters soft-deleted rows
CREATE POLICY "jobs_select_active"
ON jobs FOR SELECT
USING (deleted_at IS NULL);
```

**Exceptions:** Append-only logs and pure join tables (no lifecycle).

## 5. Domain Adapters

Adapters live in `source/domain/adapters/` and convert between database representations and domain abstractions.

### 5.1 Adapter Pattern

```typescript
// source/domain/adapters/job-adapter.ts
import type { Dictionary } from '@core-std'
import type { Job } from '@domain/abstractions/job.ts'

export function toJob(dict: Dictionary): Job {
  return {
    id: dict.id as string,
    customerId: dict.customer_id as string,
    serviceId: dict.service_id as string,
    status: dict.status as JobStatus,
    createdAt: dict.created_at as When,
    updatedAt: dict.updated_at as When,
    deletedAt: dict.deleted_at as When | undefined
  }
}

export function fromJob(job: Job): Dictionary {
  return {
    id: job.id,
    customer_id: job.customerId,
    service_id: job.serviceId,
    status: job.status,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
    deleted_at: job.deletedAt
  }
}
```

#### 5.1.1 Adapter Rules

- File naming: `{abstraction}-adapter.ts`
- Functions: `to{Abstraction}(dict)` and `from{Abstraction}(abstraction)`
- Shared by edge functions and UX SDK clients
- No business logic or validation (that's in validators)

## 6. Configuration Management

Edge functions use the singleton `Config` pattern defined in `architecture-core.md` Section 6.

### 6.1 Supabase Edge Function Configuration

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

### 6.2 Environment Files

Backend environment files follow the package naming convention:

- `back-local.env.example` - Template for local development
- `back-stage.env` - Staging environment (gitignored)
- `back-prod.env` - Production environment (gitignored)

#### 6.2.1 Example

```bash
# back-local.env.example
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
JWT_SECRET=your-jwt-secret-here
```

### 6.3 Usage in Edge Functions

```typescript
import { Config } from '@back-supabase-edge/config/config.ts'
import { wrapHttpHandler } from '@core/api/wrap-http-handler.ts'
import type { Dictionary } from '@core-std'

const async runBusRule = (input: Dictionary): Promise<Dictionary> => {
  const supabaseUrl = Config.get('SUPABASE_URL')
  // ... orchestration logic
  return result
}

export default wrapHttpHandler(runBusRule)
```

See `architecture-core.md` Section 6 for the complete configuration pattern and rationale.

## 7. Testing Strategy

Backend testing focuses on:

### 7.1 Adapter Tests

- Verify `to{Abstraction}` and `from{Abstraction}` roundtrip correctly
- Test edge cases (missing optional fields, invalid types)
- Located in `source/tests/`

### 7.2 Integration Tests

- Test edge functions against local Supabase instance
- Verify RLS policies enforce authorization correctly
- Test multi-user scenarios
- Located in `source/tests/`

### 7.3 Migration Tests

- Verify migrations apply cleanly (up and down)
- Test RLS policies with different user contexts
- Automated via `supabase test db`

## 8. Deployment

### 8.1 Supabase Edge Functions

Functions deploy via Supabase CLI:

```bash
supabase functions deploy job-deep-clone
```

#### 8.1.1 Import Map

Platform-specific import map required for edge runtime:

- `supabase-import-map.json` - Synchronized with `deno.jsonc`

### 8.2 Database Migrations

Migrations deploy via Supabase CLI:

```bash
supabase db push
```

#### 8.2.1 Migration Safety

- Always test migrations locally first (`supabase db reset`)
- Verify RLS policies in staging environment
- Never modify deployed migrations (create new ones)

## 9. Security

### 9.1 Authentication

- JWT tokens issued by Supabase Auth
- Tokens verified automatically by Supabase SDK
- Edge functions access user context via `auth.uid()` in RLS

### 9.2 Authorization

- **Primary:** RLS policies enforce all access control
- **Secondary:** Edge functions validate inputs via domain validators
- **Never:** Application-level authorization checks (RLS is authoritative)

### 9.3 Input Validation

```typescript
import { validateJobCreateInput } from '@domain/validators/job-validator.ts'

const handler = async (input: Dictionary): Promise<Dictionary> => {
  if (!validateJobCreateInput(input)) {
    throw new Error('Invalid input')
  }
  // ... proceed with validated input
}
```

#### 9.3.1 Validation Flow

1. Edge function validates input using domain validators
2. Adapters convert to domain types (assumes valid input)
3. RLS policies enforce authorization at database
4. Domain types returned to client

## 10. Key Principles

1. **Orchestration only** - Edge functions coordinate, don't implement business logic
2. **RLS is authoritative** - Authorization lives in database, not application
3. **Direct-to-DB preferred** - Only use edge functions when SDK client can't suffice
4. **Adapters are shared** - Same serialization logic for edge functions and UX clients
5. **Schema lives in domain** - `source/domain/schema/schema.sql` is the canonical current state; generated from domain
6. **Migrations are forward-only** - Express deltas only; never modify deployed migrations
7. **Soft delete via Instantiable** - Except append-only logs and pure joins
8. **Functions stay flat** - No subdirectories (platform requirement)

_End of Architecture Backend Document_
