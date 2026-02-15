# Architecture: swarmAg System — UX

## Overview (TODO: update)

This document describes the UX layer of the swarmAg system: the Admin, Ops, and Customer applications, the shared UX infrastructure, and the API client architecture used by those apps.

The UX layer consumes typed API contracts defined in `source/ux/api/contracts/` and uses client implementations from `source/ux/api/client/`.

**Prerequisites:** Read `architecture-core.md` first to understand the system boundary and API abstraction.

## UX Structure (TODO: update)

```
source/ux/
  ├── api/
  ├── app-ops/
  │   └── config/
  ├── app-admin/
  │   └── config/
  ├── app-customer/
  │   └── config/
  ├── components/
  └── lib/
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

## `api` Namespace (TODO: update, this is now api namespace, @ux/client/api.ts)

```text
const api = {
  // authentication
  authenticate(): Promise<Token>
  login(email: string, password: string): Promise<User>
  logout(): Promise<void>
  register(email: string, password: string): Promise<User>
  
  // app services
  isNetworkAvailable(): Promise<boolean>
  deepCloneJob(jobId: ID): Promise<Job>
  
  // crud: direct to db
  Users: makeCrudRdbmsClient<User>()
  Customers: makeCrudRdbmsClient<Customer>()
  
  // crud: over httpd
  JobsRemote: makeCrudHttpdClient<Job>()
  
  // crud: to local indexed-db
  JobsLocal: makeCrudIndexedDbClient<Job>()
}
```

## API Clients (TODO: update)

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

## Ops UX: Offline-First Patterns (TODO: update)

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
