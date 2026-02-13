# Architecture: swarmAg System — Backend

## Overview

This document defines the backend architecture of the swarmAg system. The backend is a single Netlify Edge Functions surface that implements the `Api.*` contracts defined in `architecture-core.md`, stores data in Supabase Postgres, and returns validated domain abstractions.

**Prerequisites:** 

Read `domain.md` and `architecture-core.md` first to understand the domain model and system boundary.

## Backend Structure

### Simplicity by Design

The backend is intentionally simple and concrete:

- **Cloud Providers:** Netlify and Supabase
- **Edge Functions:** Netlify and Supabase edge functions
- **Relational Database:** Supabase Postgres
- **Storage Buckets:** Supabase storage buckets
- **Networking**: Netlify networking services

### Backend Layout

```text
swarmag/
├── source/
│   └── back/
│       ├── edge-netlify/
│       │   ├── config/
│       │   └── functions/
│       ├── edge-supabase/
│       │   ├── config/
│       │   └── functions/
│       ├── lib/
│       └── migrations/
└── supabase/
```

## Functions (HTTP handlers) (TODO: update)

Functions are thin wrappers:

1. Validate HTTP method and input
2. Call adapters for storage operations
3. Return HTTP response

Functions do NOT:

- Contain business logic
- Introduce persistence abstractions
- Re-implement adapter logic

### Function Pattern (TODO: update)

```typescript
// source/back/functions/jobs-create.ts
import {
  type ApiRequest,
  type ApiResponse,
  toBadRequest,
  toInternalError,
  toMethodNotAllowed,
  toOk
} from '@back-lib/api-binding.ts'
import { createApiHandler } from '@back-lib/api-handler.ts'
import { Supabase } from '@back-lib/db-supabase.ts'
import type { Job } from '@domain/abstractions/job.ts'
import { rowToJob } from '@domain/adapters/jobs-adapter.ts'
import { validateJobCreateInput } from '@domain/validators/job-validator.ts'

export const config = { path: '/api/jobs/create' }

const handle = async (req: ApiRequest): Promise<ApiResponse> => {
  if (req.method !== 'POST') return toMethodNotAllowed()

  const input = await req.json()
  if (!validateJobCreateInput(input)) return toBadRequest('Invalid input')

  const { data, error } = await Supabase.client().from('jobs').insert(input).select().single()

  if (error || !data) return toInternalError('Failed to create job')

  return toOk(rowToJob(data))
}

export default createApiHandler(handle)
```

**Backend implementation = generate these flat functions.**

Libraries and adapters already exist and are verified.

## Adapters (TODO: update -- NO "row", to{Abstraction}, from{Abstraction})

Adapters live in `source/domain/adapter/` and define the storage-to-domain boundary. They are shared by both backend functions and ux API providers.

Rules:

- File naming: `*-adapter.ts` only.
- Functions adapt storage rows to domain abstractions and back
- Validation occurs inside adapters; callers receive domain abstractions

Example:

```typescript
// source/domain/adapter/jobs-adapter.ts
import type { Job } from '@domain/abstractions/job.ts'

export function rowToJob(row: Record<string, unknown>): Job {
  // Validate and adapt storage row to domain abstraction
}

export function jobToRow(job: Job): Record<string, unknown> {
  // Adapt domain abstraction to storage row
}
```

## Configuration Management (TODO: move to core)

### Runtime Configuration Pattern

The system uses runtime-agnostic configuration with environment-specific providers.

**Provider Location:**
Runtime configuration providers are split by runtime surface:

- `source/utilities/configure-deno.ts` - Deno runtime
- `source/back/library/configure-netlify.ts` - Netlify Edge runtime

**Package Configuration:**
Each deployment package has a runtime bootstrap file that:

1. Detects runtime environment
2. Imports appropriate provider from `@utility`
3. Initializes required variables
4. Exports `Config` singleton

**Example:**

```typescript
// source/back/config/back-config.ts
import { RuntimeConfig } from '@core-std'

let Config: RuntimeConfig

if ('Deno' in self) {
  const { ConfigureDeno } = await import('@utility/configure-deno.ts')
  Config = ConfigureDeno
} else {
  const { ConfigureNetlify } = await import('@back-lib/configure-netlify.ts')
  Config = ConfigureNetlify
}

Config.init(['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'])
export { Config }
```

**Usage:**

```typescript
// Always import from package-local config
import { Config } from '@back-config/back-config.ts'
const url = Config.get('SUPABASE_URL')

// Never import providers directly
// ❌ import { ConfigureDeno } from '@utility/configure-deno.ts'
```

**Environment Files:**
Each package includes:

- `back-local.env.example`
- `back-stage.env.example`
- `back-prod.env.example`

Actual env files (`.env`, gitignored) follow same naming without `.example`.

## Deployment Artifacts (TODO: move to core)

### Build Output Structure

Deployment artifacts are generated to `deploy/` directory:

```
deploy/
  admin/
    swarmag-admin-pkg.{hash}.js
    swarmag-adapters-pkg.{hash}.js
    swarmag-utils-pkg.{hash}.js
    swarmag-admin-pkg.json
```

### Package Naming Convention

All deployment artifacts follow: `swarmag-{component}-pkg.{hash}.{ext}`

- **Prefix:** `swarmag-` (namespace)
- **Component:** Package name (app-admin, app-ops, app-customer, core, edge-netlify, edge-supabase)
- **Suffix:** `-pkg` (signals "packaged artifact")
- **Hash:** Content hash for cache invalidation
- **Extension:** `.js`, `.json`, etc.

### Deployment Manifest

Each deployment includes a manifest (`swarmag-{app|edge|core}(-{qualifier})-pkg.json`):

```json
{
  "deployment": "app-admin",
  "version": "1.2.3",
  "built": "2026-02-11T19:15:00Z",
  "commit": "abc123def",
  "packages": {
    "app": {
      "file": "swarmag-app-admin-pkg.abc123.js",
      "hash": "abc123",
      "size": "245KB"
    },
    "core": {
      "file": "swarmag-core-pkg.ghi789.js",
      "hash": "ghi789",
      "size": "8KB"
    }
  }
}
```

### Build Strategy

**Pre-built chunks:**

- `adapters` and `utils` are built once and cached
- Only rebuilt when their source changes
- Apps reference pre-built chunks by hash
- Improves build performance (2s -> 200ms per app)

**Content hashing:**

- Each file includes content hash in filename
- Browser caching automatic
- No "cache invalidation" issues
- Rollback = deploy older hashed files

## Testing

Testing focuses on correctness at the storage boundary and handler orchestration:

- **Adapter tests:** Validate storage-to-domain adaptation and invariants
- **Function tests:** HTTP request -> response mapping, method guards, and error translation
- **Integration tests:** Job lifecycle flows through backend functions against a test database

## Security (TODO: move to core)

### Authentication

- JWT tokens passed via `Authorization` header
- Verified by backend functions before calling adapters

### Authorization

- Enforced by Postgres RLS policies
- Defined in migrations; backend assumes RLS is authoritative

### Input Validation

- All input validated using domain validators before persistence
- Adapters assume validated input and return domain abstractions only

**End of Architecture Backend Document**
