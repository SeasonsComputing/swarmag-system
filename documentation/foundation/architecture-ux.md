# Architecture: swarmAg System — UX

## 1. Overview

This document defines how UX applications integrate with the swarmAg system architecture. It focuses on **what the UX layer receives from the foundation**, not implementation patterns.

UX architectural patterns (component structure, state management, routing, etc.) will be documented after initial iteration with the stack. See `documentation/applications/` for current application requirements.

**Prerequisites:** Read `architecture-core.md` to understand the API namespace pattern and system boundaries.

## 2. UX Applications

### 2.1 Directory Structure
```text
ux/
├── api/
│   └── api.ts              # Composed API namespace (@ux-api barrel)
├── app-admin/
│   └── config/             # Admin app configuration
├── app-customer/
│   └── config/             # Customer app configuration
├── app-ops/
│   └── config/             # Ops app configuration
└── app-common/
    ├── components/         # Shared UI components
    └── lib/                # Shared utilities
```

### 2.2 Applications

The system includes three SolidJS applications:

| Application | Purpose                                    | Primary Users      |
| ----------- | ------------------------------------------ | ------------------ |
| **Admin**   | Management and configuration               | Internal staff     |
| **Ops**     | Field execution (offline-capable)          | Operations crews   |
| **Customer**| Scheduling and status (read-only)          | Customers          |

**Shared Infrastructure:**
- `source/ux/app-common/` - Shared components and utilities
- All apps use SolidJS + TanStack + Kobalte + Vanilla CSS

**Shared Infrastructure:**
- `source/ux/app-common/` - Shared components and utilities
- All apps use SolidJS + TanStack + Kobalte + Vanilla CSS

## 3. API Namespace Integration

### 3.1 Single Composed API

All UX applications consume the **same API namespace** defined in `source/ux/api/api.ts`:
```typescript
import { api } from '@ux-api'

// All apps use the same API
const user = await api.Users.get(userId)
const jobs = await api.Jobs.list()
const localJob = await api.JobsLocal.get(jobId)  // Ops app uses this
```

The API namespace is composed once using client makers (Supabase SDK, IndexedDB, HTTP). Applications consume it directly without configuration or provider selection.

### 3.2 Provided Infrastructure

The foundation provides:

**Type Safety:**
- Import domain types from `@domain/abstractions/`
- All API operations return typed domain objects
- TypeScript strict mode enforced

**Storage Abstraction:**
- Direct database access via RLS (no HTTP for CRUD)
- Offline storage via IndexedDB (Ops app)
- Orchestration via edge functions (complex operations)
- Client makers handle all serialization

**Offline Capability:**
- `api.JobsLocal` (IndexedDB client) available to all apps
- Ops app uses for field execution
- Deep clone via `api.deepCloneJob` business rule
- Log upload via `api.uploadJobLogs` business rule

**Configuration:**
- Per-app config module initializes `Config` singleton
- Environment-specific `.env` files per deployment
- See `architecture-core.md` Section 6 for pattern
- 
## 4. Architectural Boundaries

### 4.1 Import Discipline

**UX applications MAY import:**
- `@ux-api` - Composed API namespace
- `@domain/abstractions/*` - Domain types
- `@core-std` - Standard types (ID, When, Dictionary)
- `@ux-app-common/*` - Shared UX components

**UX applications MUST NOT import:**
- `@core/api/*` - Client makers (use composed `@ux-api`)
- `@core/db/*` - Database clients
- `@back/*` - Backend edge functions
- `@domain/adapters/*` - Storage serialization

**Violations detected by architectural guards are build failures.**

### 4.2 Configuration Pattern

Each application has its own configuration module:
```typescript
// source/ux/app-admin/config/config.ts
import { Config } from '@core/runtime/config.ts'
import { BrowserProvider } from '@core/runtime/browser-provider.ts'

Config.init(new BrowserProvider(), [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
])

export { Config }
```

**Pattern:**
- Import `Config` singleton from `@core/runtime/config.ts`
- Initialize with browser provider and required keys
- Re-export for use within the app
- Environment files: `{app}-local.env`, `{app}-stage.env`, `{app}-prod.env`

## 5. Application-Specific Notes

### 5.1 Admin Application

- **Runtime:** Browser (desktop/tablet optimized)
- **Storage:** Direct Supabase SDK via `api.Users`, `api.Jobs`, etc.
- **Deployment:** Static files via Netlify CDN

### 5.2 Ops Application

- **Runtime:** Browser (mobile-optimized PWA)
- **Storage:** IndexedDB via `api.JobsLocal` when offline, Supabase when online
- **Offline:** Uses deep-cloned Job aggregates, append-only logs
- **Deployment:** Installable PWA via Netlify

### 5.3 Customer Application

- **Runtime:** Browser (static site)
- **Storage:** Direct Supabase SDK (read-only queries)
- **Deployment:** Static files via Netlify CDN

## 6. UX Architecture Patterns

**Status: To Be Documented**

UX architectural patterns will be documented after initial iteration with the SolidJS + TanStack + Kobalte stack. Topics to be addressed:

- Component composition patterns
- State management strategy
- Routing architecture
- Form handling patterns
- Data flow and reactivity
- Error boundary patterns
- Loading and optimistic UI

See `documentation/applications/` for current application requirements and user stories.

## 7. Technology Stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Framework    | SolidJS (reactive, compiled)        |
| Data Fetching| TanStack Query                      |
| UI Primitives| Kobalte (accessible components)     |
| Styling      | Vanilla CSS (no preprocessor)       |
| Build        | Vite                                |
| Runtime      | Modern browsers (ES2022+)           |

## 8. Key Principles

1. **Apps consume, don't configure** - API namespace pre-composed, just import and use
2. **Types flow from domain** - All data structures defined in `@domain/abstractions/`
3. **Storage is transparent** - Client makers handle Supabase, IndexedDB, HTTP
4. **Import discipline enforced** - Architectural guards prevent boundary violations
5. **Configuration is explicit** - Per-app config modules, no magic globals
6. **UX patterns emerge** - Document architecture after iteration, not before

**End of Architecture UX Document**
