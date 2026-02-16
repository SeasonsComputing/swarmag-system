# Architecture: swarmAg System — Core

## 1. Executive Summary

The **swarmAg System** is a domain-driven platform for agricultural service operations, built around a composed API namespace pattern. It consists of progressive web applications for administration and field execution, a customer portal, and Supabase Edge Functions for orchestration. Offline execution is enabled via deep cloning to IndexedDB.

The system focuses on two service classes—**Aerial** and **Ground**—and the workflows, assets, and regulated chemicals required to deliver them safely and repeatably.

Quality is measured against: **safety**, **efficiency**, **repeatability**, and **performance**.

This document defines the foundational architectural structure and principles for the entire system. It establishes the system boundary, core constraints, and governing rules that all other architectural decisions must respect.

## 2. Core Platforms

The system is built on the following technology stack:

| Platform     | Purpose                      | Features/Technology                                             |
| ------------ | ---------------------------- | --------------------------------------------------------------- |
| **Netlify**  | Static hosting, DNS          | SPA delivery, SSL certificates, DNS management                  |
| **Supabase** | Backend services, Data, Auth | Edge Functions, PostgreSQL, Storage buckets, JWT authentication |
| **GitHub**   | Version control, CI/CD       | Source control, Build pipelines                                 |
| **SolidJS**  | Application UX               | PWA, SPA, TanStack, Kobalte, Vanilla CSS                        |
| **Deno**     | TypeScript runtime           | Development, testing, backend edge functions                    |

### 2.1 Platform Responsibilities

The system cleanly separates platform responsibilities:

**Netlify:**

- Static web application hosting (Webapp PWAs: Admin, Ops, Customer)
- DNS management and SSL certificates
- Content delivery network (CDN)

**Supabase:**

- Edge Functions (orchestration operations requiring server-side logic)
- PostgreSQL database (persistent storage with Row Level Security)
- Storage buckets (file/image storage)
- Authentication and JWT token management

**Core Architecture Pattern:**

- UX applications connect **directly to Supabase** via SDK (no HTTP proxy for CRUD operations)
- Row Level Security (RLS) policies enforce authorization at the database layer
- Edge Functions handle **orchestration only** - complex operations requiring server-side coordination
- Static assets served via Netlify CDN

This separation eliminates backend complexity while maintaining security through database-level access control.

## 3. Governing Principles & Constraints

### 3.1. Principles

**Domain-First**

The domain model (`source/domain`) is the single source of truth for business meaning. All other layers consume domain types rather than redefining them.

**TypeScript Ontology**

All domain concepts, validation rules, and contracts are expressed in TypeScript. The type system is the authoritative representation of business rules.

**Zero-Cost Infrastructure**

The system targets free tiers of managed services (Netlify, Supabase) to minimize operational overhead during early phases.

**Explicit Boundaries**

Every architectural boundary is explicit and enforced through import discipline and dependency rules.

**Conservative Interpretation**

When intent is unclear, choose the most conservative interpretation. Favor doing nothing over doing the wrong thing.

**Minimalism**

Prefer fewer abstractions, explicit repetition over premature generalization, and concrete solutions over speculative frameworks.

**Regenerable Infrastructure**

Infrastructure code (handlers, adapters) should be derivable from authoritative sources. If deleting infrastructure causes loss of meaning, something upstream is wrong.

### 3.2 Constraints

#### 3.2.1 Offline-First Operations

Operational telemetry and job log records must be fully operable without network connectivity. This is a first-class requirement, not a degraded mode.

#### 3.2.2 Append-Only Logs

Execution logs are immutable records of reality. They are never updated or deleted during normal operation.

#### 3.2.3 Supabase Edge Functions

Edge functions must remain flat in a single directory due to platform discovery requirements:
- `source/back/supabase-edge/functions/`

No subdirectories under `functions/`. Each function is a single file.

#### 3.2.4 Import Maps

All cross-boundary imports use Deno import maps with path aliases defined in `deno.jsonc`.

**Import Map Structure:**

- **Top-level namespaces** - Map to logical architectural layers (`@core/`, `@domain/`, `@back/`, `@ux/`, `@devops/`, `@tests/`)
- **Convenience barrels** - Provided only for high-frequency dependencies (`@core-std`, `@ux-api`)
- **Package-specific namespaces** - Deployment target aliases (`@back-supabase-functions/`, `@ux-app-ops/`, `@ux-app-admin/`, etc.)
- **Vendor namespaces** - External dependencies with explicit version control (`@supabase-client`)

**Platform-Specific Import Maps:**

Development and local execution use `deno.jsonc` import map. Platform edge functions require platform-specific import maps:
- Supabase Edge Functions: `supabase-import-map.json` (synchronized with `deno.jsonc`)

Import maps must be kept in sync manually. Path aliases use root-relative paths for consistency across environments.

#### 3.2.5 Soft Delete Everywhere

All lifecycled entities support soft delete via `deletedAt?: When`. Hard deletes occur only under explicit data retention policy execution. Exceptions: append-only logs and pure join tables.

### 3.3 Non-Goals

**Not building:**

- Real-time collaboration features
- Complex state machines
- Speculative "enterprise" features
- Premature optimization

**Not supporting:**

- Multiple tenants (single organization system)
- Historical versioning (append-only logs are sufficient)
- Complex workflow engines (simple sequential execution)

## 4. System Overview

### 4.1 Components

The system consists of five primary components:

| Component                  | Purpose                                        | Technology         |
| -------------------------- | ---------------------------------------------- | ------------------ |
| **Ops PWA**                | Offline-first field execution (installed app)  | SolidJS, IndexedDB |
| **Admin PWA**              | Management and configuration (installed app)   | SolidJS            |
| **Customer Portal**        | Customer-facing scheduling and status (static) | SolidJS            |
| **Backend Orchestration**  | Edge Functions for complex operations          | Supabase Edge      |
| **Persistent Storage**     | PostgreSQL with Row Level Security             | Supabase           |

UX applications compose their API namespace (`@ux-api`) using client makers that connect directly to Supabase or IndexedDB.

### 4.2 Domain Model Summary

Core abstractions: **Service**, **Asset**, **Chemical**, **Workflow**, **Job**, **JobAssessment**, **JobPlan**, **JobLog**, **Customer**, **User**.

Supporting abstractions: **Location**, **Note**, **Attachment**, **Question**, **Answer**, **AssetType**.

The domain model is pure TypeScript with no infrastructure dependencies. Canonical domain definitions and rules live in `documentation/foundation/domain.md`. All architectural, API, persistence, and user-interface concerns are derived from and constrained by this model.

## 5. System Boundary

The system boundary is the **API namespace** (`source/ux/api/`), not a transport layer or provider abstraction.

### 5.1 The API Pattern

The API namespace is a **composed interface** built from domain abstractions using client makers that conform to standard contracts.

#### 5.1.1 Core Principle

The API is not a fixed interface or protocol—it is a **composition pattern** where applications declare their operational requirements by selecting appropriate client makers for each domain abstraction.
```typescript
// source/ux/api/api.ts
import { makeCrudRdbmsClient } from '@core/api/client-crud-supabase.ts'
import { makeCrudIndexedDbClient } from '@core/api/client-crud-indexeddb.ts'
import { makeBusRuleHttpClient } from '@core/api/client-busrule-http.ts'

// API namespace composed from client makers
export const api = {
  // Domain abstractions using appropriate storage bindings
  Users: makeCrudRdbmsClient<User, UserCreateInput, UserUpdateInput>({ table: 'users' }),
  Customers: makeCrudRdbmsClient<Customer, CustomerCreateInput, CustomerUpdateInput>({ table: 'customers' }),
  
  // Offline storage for field operations
  JobsLocal: makeCrudIndexedDbClient<Job, JobCreateInput, JobUpdateInput>({ store: 'jobs' }),
  
  // Orchestration operations
  deepCloneJob: makeBusRuleHttpClient({ basePath: '/api/jobs/deep-clone' })
}
```

#### 5.1.2 Key Properties

- **Domain-driven** - API surface mirrors domain model, not storage technology
- **Contract-based** - All clients conform to `ApiClientCrud` or `ApiClientBusRule` contracts
- **Composition over abstraction** - Select bindings explicitly rather than runtime provider switching
- **Type-safe** - Full TypeScript typing from domain through to storage

### 5.2 Client Contracts

The system defines two client contracts (in `source/core/api/client-crud-contract.ts`):

**CRUD Contract:**
```typescript
interface ApiClientCrud<T, TCreate, TUpdate> {
  create(input: TCreate): Promise<T>
  get(id: ID): Promise<T>
  update(input: TUpdate): Promise<T>
  delete(id: ID): Promise<DeleteResult>
  list?(options?: ListOptions): Promise<ListResult<T>>
}

type DeleteResult = { id: ID; deletedAt: When }
type ListOptions = { limit?: number; cursor?: number }
type ListResult<T> = { data: T[]; cursor: number; hasMore: boolean }
```

**Business Rule Contract:**
```typescript
interface ApiClientBusRule {
  run(input: Dictionary): Promise<Dictionary>
}
```

**Error Propagation:**
```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: string
  )
}
```

All client makers throw `ApiError` on failures. Applications handle errors uniformly:
```typescript
try {
  const user = await api.Users.get(userId)
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`${error.status}: ${error.message}`)
    if (error.details) console.error(error.details)
  }
}
```

**Contract Properties:**

- **Uniform interfaces** - Same method signatures regardless of underlying storage
- **Type-safe** - Full TypeScript generics (`T`, `TCreate`, `TUpdate`) for domain typing
- **Consistent errors** - `ApiError` with status codes and optional details
- **Domain-typed** - All inputs/outputs use domain abstractions, never storage primitives

These contracts ensure **uniform interfaces** regardless of underlying storage or transport mechanism.

### 5.3 Client Makers

Client makers are factory functions that produce clients conforming to contracts:

| Maker                        | Contract          | Purpose                              | Implementation        |
| ---------------------------- | ----------------- | ------------------------------------ | --------------------- |
| `makeCrudRdbmsClient<T>()`   | `ApiClientCrud`   | Direct Supabase SDK access           | PostgreSQL via RLS    |
| `makeCrudIndexedDbClient<T>()` | `ApiClientCrud` | Offline local storage                | Browser IndexedDB     |
| `makeCrudHttpClient<T>()`    | `ApiClientCrud`   | HTTP calls to edge functions         | Fetch API             |
| `makeBusRuleHttpClient()`    | `ApiClientBusRule` | Orchestration via edge functions     | Fetch API             |

**Maker Pattern:**

Each maker takes a specification object and returns a fully-typed client:
```typescript
// CRUD maker
const Users = makeCrudRdbmsClient<User, UserCreateInput, UserUpdateInput>({
  table: 'users'
})
await Users.create({ displayName: 'Ada', email: 'ada@example.com' })

// Business rule maker
const cloneJob = makeBusRuleHttpClient({ basePath: '/api/jobs/deep-clone' })
await cloneJob.run({ jobId: 'job-123' })
```

### 5.4 Application Usage

UX applications import the composed API namespace:
```typescript
import { api } from '@ux-api'

// CRUD operations - direct to database
const user = await api.Users.get(userId)
const customers = await api.Customers.list({ limit: 25 })

// Offline operations
const localJob = await api.JobsLocal.get(jobId)

// Orchestration operations
const result = await api.deepCloneJob.run({ jobId })
```

**Applications never:**
- Import storage libraries directly (`@supabase-client`, IndexedDB APIs)
- Branch on storage technology
- Know implementation details of client makers

**Applications always:**
- Import from `@ux-api` namespace
- Work with domain types
- Handle `ApiError` for failures

### 5.5 Authorization Model

Authorization is enforced at the **database layer** via Supabase Row Level Security (RLS) policies:
```sql
-- Example RLS policy
CREATE POLICY "users_own_data"
ON job_logs FOR SELECT
USING (created_by_id = auth.uid());
```

**Benefits:**
- Authorization rules live in migrations (single source of truth)
- Cannot be bypassed by client code
- Automatic enforcement across all access paths
- Simplified application logic (no authorization branching)

### 5.6 Edge Functions (Orchestration Only)

Supabase Edge Functions handle **complex orchestration** that cannot be expressed as simple CRUD operations.

**When to use:**
- Multi-step transactions requiring coordination
- Operations with complex business rules
- Deep cloning (copying complete Job aggregate with related entities)

**When NOT to use:**
- Simple CRUD operations (use direct Supabase SDK client)
- Read-only queries (use direct Supabase SDK client)

Edge functions are **thin orchestration wrappers** implemented using provider makers (covered in `architecture-back.md`).

## 6. Dependency Direction & Authority

### 6.1 Canonical Sources of Truth

In order of authority:

1. **Constitution** (`CONSTITUTION.md`) - governance, roles, philosophy
2. **Domain Model** (`domain.md`) - problem space, solution space, domain meaning
3. **Architecture Core** (`architecture-core.md`) - system boundary and invariants
4. **Architecture Backend** (`architecture-back.md`) - backend implementation
5. **Architecture UX** (`architecture-ux.md`) - UX implementation
6. **Style Guide** (`style-guide.md`) - coding standards, conventions

All code, schemas, and infrastructure are derived artifacts. If code conflicts with these documents, the code is wrong.

### 6.2 Dependency Rules
```
tests/devops  ──> ux, back, domain, core
  ↓
ux            ──> domain, core
  ↓
back          ──> domain, core
  ↓
domain        ──> core
  ↓
core          (no dependencies)
```

These rules are enforced through import discipline and architectural guards. Violations are build failures.

**Key Principle:** Dependencies flow downward. Lower layers have no knowledge of higher layers. Core is the foundation with no dependencies.

## 7. Directory Structure

```text
swarmag/
├── deploy/
├── documentation/
│   ├── foundation/
│   ├── applications/
│   └── archive/
├── source/
│   ├── core/
│   │   ├── api/
│   │   ├── db/
│   │   ├── runtime/
│   │   └── std/
│   ├── domain/
│   │   ├── abstractions/
│   │   ├── adapters/
│   │   ├── protocols/
│   │   └── validators/
│   ├── back/
│   │   ├── migrations/
│   │   ├── netlify-edge/
│   │   │   ├── config/
│   │   │   └── functions/
│   │   ├── supabase-edge/
│   │   │   ├── config/
│   │   │   └── functions/
│   ├── ux/
│   │   ├── api/
│   │   ├── app-admin/
│   │   │   └── config/
│   │   ├── app-customer/
│   │   │   └── config/
│   │   ├── app-ops/
│   │   │   └── config/
│   │   └── app-common/
│   │       ├── components/
│   │       └── lib/
│   ├── devops/
│   └── tests/
└── supabase/
```

### 7.1 Import Aliases

```jsonc
{
  "imports": {
    // Top-level namespace
    "@core/": "./source/core/",
    "@domain/": "./source/domain/",
    "@back": "./source/back/",
    "@ux/": "./source/ux/",
    "@devops": "./source/devops/",
    "@tests": "./source/tests/",

    // Convenience barrels
    "@core-std": "./source/core/std/std.ts",
    "@ux-api": "./source/ux/api/api.ts",

    // Backend namespaces
    "@back-netlify-functions/": "./source/back/netlify-edge/functions/",
    "@back-supabase-functions/": "./source/back/supabase-edge/functions/",

    // UX application namespaces
    "@ux-app-ops/": "./source/ux/app-ops/",
    "@ux-app-admin/": "./source/ux/app-admin/",
    "@ux-app-customer/": "./source/ux/app-customer/",
    "@ux-app-common/": "./source/ux/app-common/",

    // Vendor namespaces
    "@supabase-client": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

## 8. Offline-First Guarantees

Field operations must be fully executable without network connectivity. The Ops application achieves this through **deep cloning** of Job aggregates to IndexedDB, not sync/reconciliation patterns.

### 8.1 Deep Clone Pattern

When a Job is ready for field execution, the complete Job aggregate is cloned to local IndexedDB storage:

**What Gets Cloned:**
- Job entity
- JobAssessment (with locations, questions, risks, attachments)
- JobPlan (with assignments, chemicals, assets, target locations)
- Related domain data (Users, Workflows, Assets, Chemicals)

**Clone Operation:**
```typescript
// Orchestration edge function creates complete local copy
const localJob = await api.deepCloneJob.run({ jobId: 'job-123' })

// Job now exists in IndexedDB with all dependencies
const job = await api.JobsLocal.get('job-123')
const assessment = await api.JobAssessmentsLocal.get(job.assessmentId)
const plan = await api.JobPlansLocal.get(job.planId)
```

**Key Properties:**
- Complete Job aggregate copied to IndexedDB before field deployment
- All referenced entities (users, workflows, assets) included
- Job Plan locked during execution (no remote modifications)
- Local storage is read-write for execution, read-only for plan

### 8.2 Offline Execution

Field crews execute Jobs entirely from local storage:

**Execution Pattern:**
```typescript
import { api } from '@ux-api'

// All operations against IndexedDB clients
const job = await api.JobsLocal.get(jobId)
const plan = await api.JobPlansLocal.get(job.planId)

// Append-only log entries stored locally
await api.JobLogsLocal.create({
  jobId,
  type: 'checkpoint',
  message: 'Started drone preflight',
  occurredAt: when(),
  createdById: userId,
  location: { latitude, longitude }
})
```

**Characteristics:**
- Zero network dependency during execution
- Append-only logs prevent conflicts
- Plan is immutable (read-only during execution)
- Logs are per-user, timestamped, GPS-tagged

### 8.3 Log Upload (No Sync)

After field work completes, logs are uploaded in bulk. This is **not synchronization**—it's a one-way append operation:

**Upload Pattern:**
```typescript
// When connectivity returns
const logs = await api.JobLogsLocal.list({ jobId })

// Bulk append to remote (orchestration edge function)
await api.uploadJobLogs.run({ 
  jobId,
  logs: logs.data 
})

// Optional: Clear local storage after successful upload
await api.JobsLocal.delete(jobId)
```

**No Conflict Resolution:**
- Logs are append-only (no updates to reconcile)
- Job Plan was locked during execution (no remote changes)
- Timestamps and user IDs establish ordering
- No merge conflicts possible

### 8.4 Architecture Benefits

This pattern eliminates sync complexity:

**What We Avoid:**
- Conflict resolution algorithms
- Operational transform logic
- Last-write-wins semantics
- Distributed transaction coordination
- Network partition handling

**What We Gain:**
- Guaranteed offline execution
- Simple append-only semantics
- Clear operational boundaries
- Predictable behavior
- Reduced code complexity

**Critical Principle:** Offline is not a degraded mode—it is the **primary execution environment** for field operations. Network connectivity is only required for clone preparation and log upload, not execution.

## 9. Architectural Invariants

These rules must never be violated. Code that violates these invariants is wrong, regardless of whether it "works."

### 9.1 Core Invariants

#### 9.1.1 Domain is pure

- Domain layer (`source/domain/`) has no infrastructure dependencies
- Domain depends only on `@core-std` (ID, When, Dictionary types)
- No references to HTTP, SQL, storage, or runtime concerns
- Validators, protocols, and adapters all remain infrastructure-agnostic

#### 9.1.2 API namespace is the boundary

- UX applications import from `@ux-api`, never from backend or storage libraries
- Applications never import `@supabase-client`, IndexedDB APIs, or edge functions directly
- The API namespace composes clients using maker factories, not runtime provider selection

#### 9.1.3 Adapters are serialization boundaries

- Adapters live in `source/domain/adapters/`
- Convert between storage representations (Dictionary) and domain abstractions
- Shared by all storage mechanisms (Supabase, IndexedDB, HTTP)
- No adapter contains business logic or validation

#### 9.1.4 Authorization at database layer

- Row Level Security (RLS) policies enforce authorization
- Authorization rules live in migrations, not application code
- Cannot be bypassed by client code
- Applies uniformly across all access paths

#### 9.1.5 Offline is first-class

- Offline execution via deep clones, not degraded sync mode
- Job Plans locked during execution (immutable)
- Logs are append-only (no merge conflicts)
- Network required only for clone preparation and log upload

#### 9.1.6 Soft delete everywhere

- All lifecycled entities expose `deletedAt?: When`
- Queries filter `WHERE deleted_at IS NULL`
- Hard deletes only under explicit data retention policies
- Exceptions: append-only logs and pure join tables

#### 9.1.7 Edge functions stay flat

- Supabase Edge Functions in `source/back/supabase-edge/functions/`
- No subdirectories (platform discovery requirement)
- Each function is a single file
- Functions are thin orchestration wrappers, not business logic

#### 9.1.8 Import maps only

- All cross-boundary imports use path aliases (`@core/`, `@domain/`, `@ux-api`)
- No relative imports across top-level namespaces
- Import maps defined in `deno.jsonc`
- Platform-specific maps (e.g., `supabase-import-map.json`) synchronized manually

#### 9.1.9 Regenerable infrastructure

- Infrastructure code derivable from domain, schema, and contracts
- If deleting infrastructure loses meaning, something upstream is wrong
- Adapters, clients, providers are all mechanically generateable
- Meaning lives in `domain/`, not implementation

#### 9.1.10 Conservative interpretation

- When intent is unclear, favor doing nothing over doing the wrong thing
- Stop and escalate rather than proceeding with assumptions
- Applies to both human and AI contributors
- Fast-fail configuration over defensive programming

### 9.2 Enforcement

These invariants are enforced through:
- Import discipline (developer responsibility)
- Architectural guards (`source/devops/guards/`)
- Type system constraints (TypeScript strict mode)
- Code review (human verification)

When invariants conflict with convenience, **invariants win**.

## 10. Evolution & Maintenance

### 10.1 Adding New Domain Concepts

1. Update `domain.md` (solution space, then domain model)
2. Implement domain abstractions, validators, protocols, and adapters
3. Update schema and create migration54. Implement backend functions
4. Update UX application integration

Domain changes flow unidirectionally through the system.

### 10.2 Adding New API Clients

New clients are added by composing makers in the `@ux-api` namespace:

1. **Identify storage mechanism** - Determine appropriate client maker (Supabase SDK, IndexedDB, HTTP)
2. **Compose into API namespace** - Add to `source/ux/api/api.ts` using appropriate maker
3. **Configure specification** - Provide table name, store name, or endpoint path
4. **Test full lifecycle** - Verify create, read, update, delete, list operations

**Example:**
```typescript
// source/ux/api/api.ts
import { makeCrudRdbmsClient } from '@core/api/client-crud-supabase.ts'

export const api = {
  // ... existing clients
  
  // New domain abstraction
  Services: makeCrudRdbmsClient<Service, ServiceCreateInput, ServiceUpdateInput>({
    table: 'services'
  })
}
```

Existing UX applications immediately have access to the new client via `api.Services`.

### 10.3 Deprecation

Code is deleted, not commented out:

- Mark deprecated in documentation first
- Remove after one deployment cycle
- Clean up imports and dependencies
- Update tests

Dead code is a liability.

**End of Architecture Core Document**
