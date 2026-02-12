# Architecture: swarmAg System — Core

## 1. Executive Summary

The **swarmAg System** is a domain-driven platform for agricultural service operations, built around a logical API boundary with interchangeable client providers. It consists of progressive web applications for administration and field execution, a customer portal, and a single Netlify backend backed by Supabase Postgres. Offline execution is enabled via IndexedDB-based UX providers.

The system focuses on two service classes—**Aerial** and **Ground**—and the workflows, assets, and regulated chemicals required to deliver them safely and repeatably.

Quality is measured against: **safety**, **efficiency**, **repeatability**, and **performance**.

This document defines the foundational architectural structure and principles for the entire system. It establishes the system boundary, core constraints, and governing rules that all other architectural decisions must respect.

## 2. Core Platforms

The system is built on the following technology stack:

| Platform                                       | Purpose                                          |
| ---------------------------------------------- | ------------------------------------------------ |
| **Netlify**                                    | Static hosting, edge functions compute, DNS, SSL |
| **Supabase**                                   | Postgres database, Auth, Storage, Realtime       |
| **GitHub Actions**                             | CI/CD pipelines                                  |
| **SolidJS + TanStack + Kobalte + vanilla CSS** | UI platform                                      |
| **Deno & Docker**                              | Runtime hosts used across the stack              |

These platforms are considered stable and are not subject to change without architectural review.

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

**Offline-First Operations**

The Ops application must be fully operable without network connectivity. This is a first-class requirement, not a degraded mode.

**Append-Only Logs**

Execution logs are immutable records of reality. They are never updated or deleted during normal operation.

**Netlify Edge Functions**

Backend functions must remain flat in a single directory due to Netlify discovery requirements. No subdirectories under `source/back/functions/`.

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

| Component             | Purpose                                        | Technology             |
| --------------------- | ---------------------------------------------- | ---------------------- |
| **Ops PWA**           | Offline-first field execution (installed app)  | SolidJS, IndexedDB     |
| **Admin PWA**         | Management and configuration (installed app)   | SolidJS                |
| **Customer Portal**   | Customer-facing scheduling and status (static) | SolidJS                |
| **Backend Functions** | HTTP API surface                               | Netlify Edge Functions |
| **Supabase Data**     | Persistent storage and auth                    | Postgres, Supabase     |

UX API providers (clients) are part of the UX layer and select the correct backend or storage implementation at runtime.

### 4.2 System Diagram

```text
+-----------------------+  +-----------------------+  +-----------------------+
|       Ops PWA         |  |      Admin PWA        |  |       Customer        |
|     (installed)       |  |     (installed)       |  |       (static)        |
|   ops.swarmag.com     |  |  admin.swarmag.com    |  |   me.swarmag.com      |
+-----------+-----------+  +-----------+-----------+  +-----------+-----------+
            |                          |                          |
            +--------------------------+--------------------------+
                                       |
                                       v
                           +-----------+-----------+
                           |        Api.*          | (logical interface)
                           |       (client)        |
                           +-----------+-----------+
                                       |
                           +-----------+-----------+
                           |   Provider Selection  |
                           +-----+-----------+-----+
                                 |           |
                     +-----------+--+     +--+-----------+
                     |  netlify     |     |  indexeddb   |
                     |  provider    |     |  provider    |
                     +------+-------+     +------+-------+
                            |                    |
                            v                    v
                  +---------+---------+   +-------+-------+
                  |   Backend Functions |  |   IndexedDB  |
                  |  (Netlify Edge)     |  |    (local)   |
                  +---------+---------+   +-------+-------+
                            |
                            v
                  +---------+---------+
                  |     Supabase      |
                  |    (Postgres)     |
                  +-------------------+
```

### 4.3 Domain Model Summary

Core abstractions: **Service**, **Asset**, **Chemical**, **Workflow**, **Job**, **JobAssessment**, **JobPlan**, **JobLog**, **Customer**, **User**.

Supporting abstractions: **Location**, **Note**, **Attachment**, **Question**, **Answer**, **AssetType**.

The domain model is pure TypeScript with no infrastructure dependencies. Canonical domain definitions and rules live in `documentation/foundation/domain.md`. All architectural, API, persistence, and user-interface concerns are derived from and constrained by this model.

## 5. System Boundary

The system boundary is the **logical API surface** (`Api.*`), not any particular transport or storage mechanism.

All client ux (Admin, Ops, Customer) interact exclusively with this typed API abstraction. The concrete provider implementation is selected at runtime based on execution context, connectivity, and trust level.

```
UX ──▶ Api.* ──▶ Provider Selection ──▶ Storage
```

Key properties:

- UX never import storage libraries directly
- UX never branch on storage technology without the provider selector
- Provider selection is explicit and testable
- The API contract is stable; providers are replaceable

This architecture enables:

- Online execution via the Netlify backend (HTTP)
- Online trusted execution via direct Supabase SDK access
- Offline execution via local IndexedDB storage

All three providers implement the same logical API surface and return validated domain types.

### 5.1 API Abstraction

The API abstraction is defined under `source/ux/api/contracts/` as TypeScript interfaces expressing domain intent without implementation.

Example:

```typescript
// source/ux/api/contracts/job-api.ts
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
- Are implemented by multiple providers
- Are versioned and treated as immutable once published

Client ux import `Api.*` but never import provider implementations directly.

### 5.2 API Providers (Clients)

The system supports three API providers, each implementing the same `Api.*` contracts:

| Provider  | Purpose                   | Storage / Transport |
| --------- | ------------------------- | ------------------- |
| netlify   | Online HTTP client        | Netlify backend     |
| supabase  | Trusted direct SDK client | Supabase Postgres   |
| indexeddb | Offline browser client    | IndexedDB           |

Detailed backend implementation is described in `architecture-back.md`.

### 5.3 Architectural Diagram

The domain model drives all downstream architecture:

```text
                +--------------------------+
                |      API Abstraction     |
                |   (logical API surface)  |
                +------------+-------------+
                             |
                 +-----------+-----------+
                 |  Provider Selection  |
                 +-----+-----------+-----+
                       |           |
         +-------------+--+     +--+-------------+
         |   netlify      |     |   indexeddb    |
         |   provider     |     |   provider     |
         +-------+--------+     +--------+-------+
                 |                       |
                 v                       v
       +---------+---------+     +-------+-------+
       |  Backend Functions |     |   IndexedDB  |
       |  (Netlify Edge)    |     |    (local)   |
       +---------+---------+     +-------+-------+
                 |
                 v
       +---------+---------+
       |     Supabase      |
       |    (Postgres)     |
       +-------------------+

--------------------------------------------------------------

             +--------------------------------+
             |          Domain Model          |
             |      (authoritative truth)     |
             +----------------+---------------+
             |  types, protocol, validators   |
             +----------------+---------------+
```

## 6. Dependency Direction & Authority

### 6.1 Canonical Sources of Truth

In order of authority:

1. **Constitution** (`CONSTITUTION.md`) - governance, roles, philosophy
2. **Domain Model** (`domain.md`) - problem space, solution space, domain meaning
3. **Architecture Foundation** (`architecture-core.md`) - system boundary and invariants
4. **Architecture Backend** (`architecture-back.md`) - backend implementation
5. **Architecture UX** (`architecture-ux.md`) - UX implementation
6. **Style Guide** (`style-guide.md`) - coding standards, conventions

All code, schemas, and infrastructure are derived artifacts. If code conflicts with these documents, the code is wrong.

### 6.2 Dependency Rules

```
source/utilities      ──────────────── (no dependencies)
  ↑
source/domain         ──> source/utilities
  ↑
source/domain/adapters ──> source/domain, source/utilities
  ↑
source/back           ──> source/domain, source/domain/adapters, source/utilities
  ↑
source/ux/api         ──> source/domain, source/domain/adapters, source/utilities
  ↑
source/ux/applications/* ──> source/ux/api, source/domain
```

These rules are enforced through import discipline and architectural guards. Violations are build failures.

## 7. Directory Structure

```
swarmag/
  documentation/
  source/
    back/             # Backend (Netlify Edge Functions)
      config/
      functions/      # Flat HTTP handlers
      library/        # Shared backend infrastructure
      migrations/
    devops/           # Architecture and environment guards
    domain/           # Pure domain model
      abstractions/
      adapters/       # Storage ↔ domain boundary adapters
      protocol/
      validators/
    tests/
      cases/
      fixtures/
    utilities/        # Shared utilities and Deno runtime provider
    ux/               # User experience layer
      api/
        client/
        contracts/
      applications/
        administration/
        components/
        customer/
        library/
        operations/
  supabase/
  deploy/             # Build artifacts (gitignored)
```

### 7.1 Import Aliases

```json
{
  "imports": {
    "@domain/": "./source/domain/",
    "@utils": "./source/utilities/mod.ts",
    "@utils/": "./source/utilities/",
    "@back-config/": "./source/back/config/",
    "@back-functions/": "./source/back/functions/",
    "@back-lib/": "./source/back/library/",
    "@ux-api/": "./source/ux/api/",
    "@ux-app-ops/": "./source/ux/applications/operations/",
    "@ux-app-admin/": "./source/ux/applications/administration/",
    "@ux-app-customer/": "./source/ux/applications/customer/",
    "@ux-components/": "./source/ux/applications/components/",
    "@ux-lib/": "./source/ux/applications/library/",
    "@devops": "./source/devops/",
    "@tests": "./source/tests/"
  }
}
```

## 8. Offline-First Guarantees

The Ops application must be fully operable without network connectivity. This is achieved through:

### 8.1 Local-First Execution

The operations UX is designed to continue execution when connectivity is degraded:

- Local workflow progression remains available.
- Append-only logs preserve execution integrity.
- Synchronization is reconciled when connectivity returns.

### 8.2 Client Selection

UX uses the shared API client namespace:

```typescript
import { Api } from '@ux-api/client/api.ts'

const api = Api
await api.jobs.list()
```

### 8.3 Sync Strategy (Optional)

Offline operations may be queued for later reconciliation:

- Append-only operation log
- Conflict-aware sync when reconnected
- Out of scope for initial implementation

**Critical:** Offline is not a fallback or degraded mode. It is a first-class execution environment with the same correctness guarantees as online execution.

## 9. System Diagram Updates

```
source/
  domain/           ──┐
    adapters/       ──┤── Used by both back and ux/api
  utilities/        ──┤
  back/             ──┤
  ux/               ──┘
    api/
      client/
```

## 10. Architectural Invariants

These rules must never be violated:

1. **Domain is pure** - no infrastructure dependencies
2. **API is the boundary** - UX applications import the API layer, not backend libraries
3. **Adapters are the storage boundary** - under `source/domain/adapters/`
4. **Functions are thin** - orchestration only, call adapters directly
5. **Offline is first-class** - not degraded or bolted on
6. **Soft delete everywhere** - except append-only and pure joins
7. **Functions stay flat** - Netlify requirement, non-negotiable
8. **Import maps only** - no cross-layer relative imports
9. **Regenerable infrastructure** - meaning lives in domain/schema/contracts
10. **Conservative interpretation** - stop rather than guess

Code that violates these invariants is wrong, regardless of whether it "works."

## 11. Evolution & Maintenance

### 11.1 Adding New Domain Concepts

1. Update `domain.md` (solution space, then domain model)
2. Implement domain abstractions, validators, protocol
3. Update schema and create migration
4. Update API contracts (`source/ux/api/contracts/`)
5. Update adapters (`source/domain/adapters/`)
6. Implement backend functions
7. Update UX application integration

Domain changes flow unidirectionally through the system.

### 11.2 Adding New API Clients

New clients follow the same pattern:

1. Implement `Api.*` contracts
2. Use adapters for storage-to-domain adaptation
3. Register in the UX API client composition
4. Test against the full lifecycle

Existing UX applications are unaffected.

### 11.3 Deprecation

Code is deleted, not commented out:

- Mark deprecated in documentation first
- Remove after one deployment cycle
- Clean up imports and dependencies
- Update tests

Dead code is a liability.

**End of Foundation Document**

See also:

- `architecture-back.md` - Backend implementation details
- `architecture-ux.md` - UX implementation details
- `domain.md` - Domain model definitions
- `CONSTITUTION.md` - Governance and authority
