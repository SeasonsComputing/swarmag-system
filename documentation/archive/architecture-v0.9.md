# Architecture: swarmAg System

## 1. Overview

This document defines the architectural structure and principles for the swarmAg backend system. It serves as the authoritative source for structural decisions and component organization.

The system is built domain-first, with explicit boundaries between concerns and a conservative approach to complexity. All code, schemas, and infrastructure artifacts are derived from this architecture and the domain model defined in `domain.md`.

## 2. Architectural Principles

### 2.1 Domain-First

The domain model (`source/domain`) is the single source of truth for business meaning. All other layers (persistence, API, UI) consume domain types rather than redefining them.

Domain code:
- Contains no references to HTTP, SQL, or runtime concerns
- Defines validation rules and invariants
- Provides protocol shapes (input/output types)
- Is portable and testable in isolation

### 2.2 Explicit Boundaries

Every architectural boundary is explicit and enforced:
- Domain never imports from infrastructure
- Handlers orchestrate; they don't implement
- Persistence adapts to domain, never the reverse
- Validators live in domain, not at boundaries

Implicit coupling is treated as a defect.

### 2.3 Conservative Interpretation

When intent is unclear:
- Choose the most conservative interpretation
- Favor doing nothing over doing the wrong thing
- Stop and escalate rather than proceeding with assumptions

This applies to both human and AI contributors.

### 2.4 Minimalism

Prefer:
- Fewer abstractions over more
- Explicit repetition over premature generalization
- Concrete solutions over speculative frameworks
- Deletion over preservation of unused code

### 2.5 Regenerable Infrastructure

Infrastructure code (handlers, mappers, configuration) should be derivable from authoritative sources (domain, schema, contracts).

If deleting infrastructure code would cause loss of meaning, something upstream is wrong.

## 3. Constraints & Non-Goals

### 3.1 Hard Constraints

**Offline-First Operations**
The Ops application must be fully operable without network connectivity. This is a first-class requirement, not a degraded mode.

**Netlify Edge Functions**
Serverless functions must remain flat in a single directory due to Netlify discovery requirements. No subdirectories under `functions/`.

**Import Maps**
All cross-boundary imports use Deno import maps with trailing-slash aliases (e.g., `@domain/`, `@serverless-lib/`).

**Soft Delete Everywhere**
All lifecycled entities support soft delete via `deleted_at` timestamp. Hard deletes occur only under explicit data retention policy execution.

### 3.2 Non-Goals

**Not building:**
- Real-time collaboration features
- Complex state machines
- Speculative "enterprise" features
- Premature optimization

**Not supporting:**
- Multiple tenants (single organization system)
- Historical versioning (append-only logs are sufficient)
- Complex workflow engines (simple sequential execution)

## 4. Dependency Direction & Authority

### 4.1 Canonical Sources of Truth

In order of authority:
1. **Constitution** (`CONSTITUTION.md`) - governance, roles, philosophy
2. **Domain Model** (`domain.md`) - problem space, solution space, domain meaning
3. **Architecture** (`architecture.md`) - structural realization
4. **Style Guide** (`style-guide.md`) - coding standards, conventions

All code, schemas, and infrastructure are derived artifacts. If code conflicts with these documents, the code is wrong.

### 4.2 Dependency Rules

```
domain          ──────────────── (no dependencies)
  ↑
utils           ──────────────── (no dependencies)
  ↑
api/contracts   ──> domain
  ↑
backends/*      ──> api, domain, utils
  ↑
apps/*          ──> api, domain (never backends directly)
```

These rules are enforced through import discipline and architectural guards. Violations are build failures.

---

## 5. System Boundary

The system boundary is the **logical API surface** (`Api.*`), not any particular transport or storage mechanism.

All client applications (Admin, Ops, Customer) interact exclusively with this typed API abstraction. The concrete backend implementation is selected at runtime based on execution context, connectivity, and trust level.

```
Apps ──▶ Api.* ──▶ Backend Selection ──▶ Storage
```

Key properties:
- Apps never import repositories, SQL, or storage libraries
- Apps never branch on storage technology
- Backend selection is explicit and testable
- The API contract is stable; backends are replaceable

This architecture enables:
- Online execution via serverless (HTTP)
- Online trusted execution via direct database access (Supabase SDK)
- Offline execution via local storage (IndexedDB)

All three backends implement the same logical API surface and return validated domain types.

---

## 6. API Abstraction

The API abstraction is defined under `source/api/contracts/` as TypeScript interfaces expressing domain intent without implementation.

Example:
```typescript
// api/contracts/job-api.ts
export interface JobApi {
  create(input: JobCreateInput): Promise<Job>
  get(id: ID): Promise<Job | null>
  list(options?: ListOptions): Promise<ListResult<Job>>
  assess(jobId: ID, input: AssessmentInput): Promise<JobAssessment>
  plan(jobId: ID, input: PlanInput): Promise<JobPlan>
  logAppend(jobId: ID, entry: JobLogEntry): Promise<void>
}
```

These contracts:
- Express domain lifecycle and sequencing
- Use only domain types (no transport, no storage)
- Are implemented by multiple backends
- Are versioned and treated as immutable once published

Client applications import `Api.*` but never import backend implementations directly.

---

## 7. Backend Adapters

The system supports three backend adapters, each implementing the same `Api.*` contracts:

| Backend | Purpose | Storage | Transport |
|---------|---------|---------|-----------|
| Serverless | Online HTTP access | Postgres/Supabase | Netlify Edge Functions |
| Direct-DB | Online trusted access | Postgres/Supabase | Supabase SDK (no HTTP) |
| Offline | Disconnected execution | IndexedDB | None |

### 7.1 Serverless Backend

**Location:** `source/backends/serverless/`

**Purpose:** HTTP-accessible API for external clients (Admin app, Ops app when online).

**Structure:**
```
backends/serverless/
  functions/        # Flat {abstraction}-{verb}.ts files (Netlify requirement)
  lib/              # Shared infrastructure (auth, errors, HTTP binding)
  repositories/     # Postgres-backed persistence layer
```

**Responsibilities:**
- HTTP request/response handling
- Authentication/authorization
- Input validation (using domain validators)
- Orchestration via repositories
- Error translation (domain errors → HTTP status codes)

**Critical Rules:**
- Functions must remain flat in `functions/` (Netlify discovery requirement)
- Functions are thin orchestration; no business logic
- Functions never import `Supabase` directly; use repositories
- Functions are regenerable without loss of meaning

### 7.2 Direct-DB Backend

**Location:** `source/backends/direct-db/`

**Purpose:** Trusted server-side access bypassing HTTP (e.g., batch jobs, admin tasks, reports).

**Structure:**
```
backends/direct-db/
  repositories/     # Supabase SDK-backed persistence
```

**Responsibilities:**
- Direct Supabase SDK usage
- Same domain type contracts as serverless
- No HTTP overhead
- Used for trusted, high-throughput operations

**Critical Rules:**
- Implements same `Api.*` contracts as serverless
- Never used from untrusted client code
- Repositories may share SQL logic with serverless but are separate implementations

### 7.3 Offline Backend

**Location:** `source/backends/offline/`

**Purpose:** Fully offline execution for Ops app in disconnected field environments.

**Structure:**
```
backends/offline/
  repositories/     # IndexedDB-backed persistence
  sync/             # Optional: sync queue for later reconciliation
```

**Responsibilities:**
- Local-only execution (no network)
- IndexedDB storage
- Same API semantics as online backends
- Append-only operation queue for later sync (optional)

**Critical Rules:**
- Must implement identical `Api.*` contracts
- Must support full job execution lifecycle offline
- Must maintain referential integrity locally
- Must be testable without network access

**Offline is not a degraded mode; it is a first-class execution environment.**

---

## 8. Repositories

Repositories are **backend-internal persistence adapters**. They translate domain abstractions into storage operations and enforce architectural boundaries.

### 8.1 Responsibilities

Repositories:
- Translate domain types → storage operations (SQL, SDK calls, IndexedDB)
- Enforce soft-delete filtering (`deleted_at IS NULL`)
- Manage transactions
- Perform row ↔ domain mapping
- Return validated domain types only

Repositories do NOT:
- Live in `source/domain/`
- Define domain concepts
- Expose storage rows or internal types
- Leak upward into handlers or apps

### 8.2 Location

Each backend has its own repositories:
- `backends/serverless/repositories/` (Postgres via Supabase client)
- `backends/direct-db/repositories/` (Postgres via Supabase SDK)
- `backends/offline/repositories/` (IndexedDB)

Repository interfaces may be shared; implementations must not be.

### 8.3 Pattern

Each repository exposes domain-aligned methods:

```typescript
// backends/serverless/repositories/user-repository.ts
import type { User, UserCreateInput } from '@domain/abstractions/user.ts'
import type { ID } from '@utility/types.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { rowToUser } from './mappers/user-mapper.ts'

export const userRepository = {
  async get(id: ID): Promise<User | null> {
    const { data, error } = await Supabase.client()
      .from('users')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()
    
    if (error || !data) return null
    return rowToUser(data)
  },
  
  async create(input: UserCreateInput): Promise<User> {
    // ...
  },
  
  async softDelete(id: ID): Promise<void> {
    // ...
  }
}
```

### 8.4 Mapping

Row ↔ domain mapping is explicit and centralized:
- `backends/serverless/repositories/mappers/user-mapper.ts`
- Mapping functions validate and transform storage rows into domain types
- Parse errors are thrown, not silently ignored
- No ad-hoc field access in handlers

---

## 9. Directory Structure

```
source/
  domain/                   # Pure domain model (locked, no dependencies)
    abstractions/
    validators/
    protocol/
  
  api/                      # Logical API contracts (NEW)
    contracts/
      job-api.ts
      service-api.ts
      ...
    index.ts                # Unified Api.* export
  
  backends/                 # Backend implementations (NEW)
    serverless/             # HTTP backend (Netlify Edge Functions)
      functions/            # Flat {abstraction}-{verb}.ts files
        users-get.ts
        users-create.ts
        jobs-create.ts
        ...
      lib/                  # Shared infrastructure (baked)
        api-binding.ts
        api-handler.ts
        db-supabase.ts
        ...
      repositories/         # Postgres-backed persistence
        user-repository.ts
        job-repository.ts
        mappers/
    
    direct-db/              # Direct Supabase SDK backend
      repositories/
    
    offline/                # IndexedDB backend
      repositories/
  
  apps/                     # Client applications
    admin/                  # Admin PWA
    ops/                    # Ops offline-first SPA
    customer/               # Customer static site
  
  utils/                    # Shared primitives (ID, When, etc.)
```

### 9.1 Import Aliases

```json
{
  "imports": {
    "@domain/": "./source/domain/",
    "@utility/": "./source/utils/",
    "@api/": "./source/api/",
    "@serverless-lib/": "./source/backends/serverless/lib/",
    "@serverless-repositories/": "./source/backends/serverless/repositories/",
    "@direct-db/": "./source/backends/direct-db/",
    "@offline/": "./source/backends/offline/"
  }
}
```

### 9.2 Dependency Rules

```
domain          ──────────────── (no dependencies)
  ↑
utils           ──────────────── (no dependencies)
  ↑
api/contracts   ──> domain
  ↑
backends/*      ──> api, domain, utils
  ↑
apps/*          ──> api, domain (never backends)
```

Violations of these rules are architectural errors.

---

## 10. Offline-First Guarantees

The Ops application must be fully operable without network connectivity. This is achieved through:

### 10.1 Local Backend

The offline backend (`backends/offline/`) implements the complete `Api.*` surface using IndexedDB.

Key properties:
- Same lifecycle semantics as online (Assessment → Plan → Execution)
- Referential integrity enforced locally
- Soft-delete behavior preserved
- Append-only logs maintained

### 10.2 Backend Selection

Apps select backend at runtime:

```typescript
import { createApi } from '@api/index.ts'

const backend = await detectBackend() // 'serverless' | 'direct-db' | 'offline'
const api = createApi(backend)

await api.job.create(input)
```

Selection criteria:
- Network connectivity (navigator.onLine)
- Trust level (admin vs field)
- Execution context (browser vs server)

### 10.3 Sync Strategy (Optional)

Offline operations may be queued for later reconciliation:
- Append-only operation log
- Conflict-free sync when reconnected
- Out of scope for initial implementation

**Critical:** Offline is not a fallback or degraded mode. It is a first-class execution environment with the same correctness guarantees as online execution.

---

## 11. Handler Pattern (Serverless Backend)

Serverless functions follow a strict orchestration-only pattern.

### 11.1 Responsibilities

Handlers:
- Validate HTTP method
- Extract and validate input (using domain validators)
- Call repository methods
- Translate results to HTTP responses
- Handle errors (domain errors → HTTP status codes)

Handlers do NOT:
- Contain business logic
- Import `Supabase` directly
- Perform row mapping
- Manage transactions (repositories do this)

### 11.2 Example

```typescript
// backends/serverless/functions/users-get.ts
import type { User } from '@domain/abstractions/user.ts'
import { isNonEmptyString } from '@domain/validators/helper-validators.ts'
import { userRepository } from '@serverless-repositories/user-repository.ts'
import {
  type ApiRequest,
  type ApiResponse,
  toBadRequest,
  toMethodNotAllowed,
  toNotFound,
  toOk
} from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'

export const config = { path: '/api/users/get' }

const handle = async (
  req: ApiRequest<undefined, { id?: string }>
): Promise<ApiResponse> => {
  if (req.method !== 'GET') return toMethodNotAllowed()
  
  const userId = req.query?.id
  if (!isNonEmptyString(userId)) return toBadRequest('id is required')
  
  const user = await userRepository.get(userId)
  
  if (!user) return toNotFound('User not found')
  return toOk(user)
}

export default createApiHandler(handle)
```

### 11.3 Regeneration

Handlers are mechanical projections of:
- API contracts (`api/contracts/`)
- Domain validators (`domain/validators/`)
- Repository interfaces

Because they contain no unique logic, handlers may be regenerated at any time without loss of meaning.

---

## 12. Testing Strategy

### 12.1 Domain Testing

Domain types and validators are tested in isolation using sample data fixtures:
- `{abstraction}-samples.ts` exports instantiated domain objects
- `test-fixtures.ts` registers validation tests
- No infrastructure dependencies

### 12.2 Repository Testing

Repositories are tested against real storage (test database or in-memory IndexedDB):
- Test create/read/update/soft-delete operations
- Verify soft-delete filtering
- Verify row ↔ domain mapping correctness
- Test transaction boundaries

### 12.3 Handler Testing

Handlers are tested as HTTP request → response mappings:
- Mock repository responses
- Verify input validation
- Verify error translation
- No actual database calls

### 12.4 Integration Testing

Full backend flows tested end-to-end:
- Create job → assess → plan → log
- Verify lifecycle sequencing
- Verify referential integrity
- Test across online/offline backends

---

## 13. Deployment

### 13.1 Serverless Deployment (Netlify)

Netlify configuration:
```toml
# netlify.toml
[functions]
  directory = "source/backends/serverless/functions"
  node_bundler = "esbuild"

[build]
  command = "deno task build"
  publish = "dist"
```

Import map resolution handled by Deno build step.

### 13.2 Database Migrations

Migrations are authoritative and derived from the locked schema:
- Located in `source/db/migrations/`
- Applied in ascending timestamp order
- Never modified after deployment
- Rollback only by creating new forward migration

### 13.3 Environment Configuration

Configuration is explicit and colocated with deployment context:
- `backends/serverless/.env` for edge functions
- `apps/admin/.env` for admin app
- No shared environment files

Each context independently declares its requirements.

---

## 14. Evolution & Maintenance

### 14.1 Adding New Domain Concepts

1. Update `domain.md` (solution space, then domain model)
2. Implement domain abstractions, validators, protocol
3. Update schema and create migration
4. Implement repositories in all backends
5. Update API contracts
6. Regenerate/update handlers

Domain changes flow unidirectionally through the system.

### 14.2 Adding New Backends

New backends (e.g., mobile-native, embedded) follow the same pattern:
1. Implement `Api.*` contracts
2. Create backend-specific repositories
3. Register with backend selection logic
4. Test against full lifecycle

Existing backends and apps are unaffected.

### 14.3 Deprecation

Code is deleted, not commented out:
- Mark deprecated in documentation first
- Remove after one deployment cycle
- Clean up imports and dependencies
- Update tests

Dead code is a liability.

---

## 15. Architectural Invariants (Summary)

These rules must never be violated:

1. **Domain is pure** - no infrastructure dependencies
2. **API is the boundary** - apps never import backends
3. **Repositories are backend-internal** - not exposed to apps
4. **Handlers are thin** - orchestration only, no business logic
5. **Offline is first-class** - not degraded or bolted on
6. **Soft delete everywhere** - except append-only and pure joins
7. **Functions stay flat** - Netlify requirement, non-negotiable
8. **Import maps only** - no relative imports across boundaries
9. **Regenerable infrastructure** - meaning lives in domain/schema/contracts
10. **Conservative interpretation** - stop rather than guess

Code that violates these invariants is wrong, regardless of whether it "works."

---

**End of Architecture Document**
