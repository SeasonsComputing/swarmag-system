# Architecture: swarmAg System — UX

## Overview

This document describes the UX layer of the swarmAg system: the Admin, Ops, and Customer applications, the shared UX infrastructure, and the API client architecture used by those apps.

The UX layer consumes typed API contracts defined in `source/ux/api/contracts/` and uses client implementations from `source/ux/api/client/`.

**Prerequisites:** Read `architecture-core.md` first to understand the system boundary and API abstraction.

## UX Structure

```
source/ux/
  api/
    client/             # API client implementations and factory
    contracts/          # API interface definitions
  applications/
    administration/
    operations/
    customer/
    components/
    library/
```

## UX Applications

### Admin UX

**Purpose:** Management and configuration interface for internal staff.

**Key characteristics:**

- Online-first
- Desktop and tablet optimized
- Rich data management interface

### Ops UX

**Purpose:** Field execution interface for operations crews.

**Key characteristics:**

- Offline-first and mobile optimized
- Minimal UI for physical work
- Append-only execution logs
- IndexedDB as primary storage when offline

### Customer UX

**Purpose:** Customer-facing scheduling and status interface.

**Key characteristics:**

- Static/read-mostly
- Public-facing
- SEO optimized

## API Contracts

Contracts define the logical API surface and domain intent without implementation. They live in `source/ux/api/contracts/` and are imported by UX applications and API clients.

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

## API Clients

A client implementation lives under `source/ux/api/client/` and calls backend functions while preserving domain-level types.

| Client Module   | Purpose                                            |
| --------------- | -------------------------------------------------- |
| `api.ts`        | Public API surface consumed by UX applications     |
| `api-client.ts` | HTTP client plumbing and request/response handling |

API clients adapt transport results into domain abstractions using `source/domain/adapter/`.

## Client Usage

```typescript
import { Api } from '@ux-api/client/api.ts'

const api = Api
```

## Ops UX: Offline-First Patterns

The Ops UX treats offline execution as the default:

- UX state and workflows are designed to tolerate unreliable connectivity.
- Operation queues capture mutations while disconnected.
- Sync behavior remains append-only and conflict-resistant.

Offline is not a degraded mode; it is a first-class execution environment.

## Shared UX Infrastructure

Shared UX infrastructure lives in `source/ux/applications/library/` and provides:

- Runtime configuration bootstrap
- Common UI utilities and formatting helpers
- Shared UX primitives

**End of UX Document**

See also:

- `architecture-core.md` - System boundary and invariants
- `architecture-back.md` - Backend implementation
- `domain.md` - Domain model definitions
