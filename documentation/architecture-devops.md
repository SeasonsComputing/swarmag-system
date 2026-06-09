![swarmAg Operations System](../swarmag-ops-logo.png)

# swarmAg Operations System — Architecture DevOps

## 1. Overview

This document defines the operational architecture for building, packaging, and deploying the swarmAg system. It governs environment configuration, the local secret registry, the packaging workflow, and the guard suite that enforces architectural and operational invariants.

### 1.1 Authority Chain

| Document                      | File                        | Intent                                                                     |
| ----------------------------- | --------------------------- | -------------------------------------------------------------------------- |
| **Canonical Authority Chain** | `architecture-core.md §1.1` | Defines global documentation precedence for the system                     |
| └→ **Architecture DevOps**    | _(this file)_               | Environment configuration, secret registry, packaging workflow, and guards |

### 1.2 Scope Boundary of Governing Documents

| Document                 | File                   | Scope Ownership                                                            |
| ------------------------ | ---------------------- | -------------------------------------------------------------------------- |
| **Architecture Core**    | `architecture-core.md` | System boundary, platform constraints, and dependency direction            |
| **Style Guide**          | `style-guide.md`       | Implementation conventions and coding/file standards                       |
| **Architecture Backend** | `architecture-back.md` | Backend integration architecture and runtime constraints                   |
| **Architecture UX**      | `architecture-ux.md`   | UX-layer boundaries, composition contracts, and app-specific architecture  |
| **Architecture DevOps**  | _(this file)_          | Environment configuration, secret registry, packaging workflow, and guards |

## 2. Directory Structure

The devops layer contains two subdirectories: guards that enforce architectural invariants, and scripts that implement the packaging and tooling workflows.

```text
source/devops/
├── guards/
│   ├── guard-architecture.ts
│   ├── guard-chart.ts
│   ├── guard-core-std-types.ts
│   ├── guard-domain-style.ts
│   ├── guard-env.ts
│   ├── guard-imports.ts
│   ├── guard-leaf.ts
│   ├── guard-ux-state.ts
│   └── guard-validation.ts
└── scripts/
    ├── app-admin-package.sh
    ├── app-admin-package-verify.sh
    ├── app-customer-package.sh
    ├── app-customer-package-verify.sh
    ├── app-ops-package.sh
    ├── app-ops-package-verify.sh
    ├── app-style-guide-local.sh
    ├── gen-ai-context.ts
    ├── gen-id-seeds.ts
    ├── gen-jwt-secret.ts
    ├── read-secret.ts
    ├── set-secret.ts
    └── validate-secrets.ts
```

## 3. Deployable Packages

Not all packages in the repository are deployed. Guards, tooling, and workflows that exist to protect deployment artifacts apply only to **deployable packages**.

| Package           | Deployable | Platform        | App ID                 |
| ----------------- | ---------- | --------------- | ---------------------- |
| `app-admin`       | yes        | Netlify CDN     | `swarmag-app-admin`    |
| `app-ops`         | yes        | Netlify CDN     | `swarmag-app-ops`      |
| `app-customer`    | yes        | Netlify CDN     | `swarmag-app-customer` |
| `supabase-edge`   | yes        | Supabase        | _(edge functions)_     |
| `app-style-guide` | **no**     | dev server only | n/a                    |

Non-deployable packages are explicitly exempt from packaging guards, the secret registry, and environment file requirements.

## 4. Environment Files

For UX applications, environment files define the backend binding target for a
static bundle. They do not describe the static host from which that bundle is
served. The meaningful UX build matrix is:

```text
application × backend binding target
```

For example, an `app-admin` bundle built with the stage endpoint, stage public
key, and browser client mode is stage-bound even when served locally during
development.

Backend packages still use environment files for their own runtime deployment
environment.

### 4.1 Naming Convention

Each deployable package maintains configuration files at the locations below. For
UX apps, the target token (`local`, `stage`, `prod`) names the backend binding
target. All actual env files are gitignored; only `.env.example` templates are
committed.

**UX apps** — `source/ux/config/`

```
app-{admin|ops|customer}-local.env.example    ← committed template
app-{admin|ops|customer}-local.env            ← gitignored
app-{admin|ops|customer}-stage.env            ← gitignored
app-{admin|ops|customer}-prod.env             ← gitignored
```

**Backend (Supabase edge)** — `source/back/supabase-edge/config/`

```
supabase-local.env.example    ← committed template
supabase-local.env            ← gitignored
supabase-stage.env            ← gitignored
supabase-prod.env             ← gitignored
```

### 4.2 Placeholder Convention

Any env value that must be resolved from the secret registry at package time is set to the literal string `__SECRET__` in the env file:

```bash
# app-admin-local.env.example
VITE_PACKAGE_APP_ID=swarmag-app-admin
VITE_PACKAGE_TARGET=local
VITE_PACKAGE_VERSION=0.0.0
VITE_SUPABASE_EDGE_URL=http://localhost:54321
VITE_SUPABASE_RDBMS_URL=http://localhost:54321
VITE_SUPABASE_PUBLIC_KEY=__SECRET__
VITE_SUPABASE_CLIENT_MODE=browser
VITE_SERVICE_WORKER_ENABLED=false
VITE_LOCAL_DB_NAME=swarmag-app-admin
```

The packaging script resolves `__SECRET__` values from `secrets.jsonc` before invoking the Vite build. The secret value is never written to disk — it is injected into the build process environment only.

### 4.3 Security Rules

- Never commit actual `.env` files — only `.env.example` templates
- `__SECRET__` must never appear in a production build artifact
- Use platform-managed secrets (Netlify environment variables, Supabase secrets) for stage and prod targets
- Rotate secrets regularly; use genesis workflows only for packages that define
  a JWT secret

## 5. Secret Registry

### 5.1 Purpose

The secret registry is a local developer file that stores the actual resolved
values for local and stage targets. It is never committed to the repository and
never included in a build artifact.

### 5.2 File Location and Format

```
secrets.jsonc    ← repository root, gitignored
```

The file is JSONC (JSON with comments). Block and line comments are stripped before parsing.

### 5.3 Composite Key Identity

Every entry's JSON key **must equal** the composed identity derived from its own `app`, `env`, and `config` attributes:

```
<app>.<env>.<config>
```

For example, the entry for `VITE_SUPABASE_PUBLIC_KEY` in the `app-admin` local
target has key `app-admin.local.VITE_SUPABASE_PUBLIC_KEY`.

### 5.4 Schema

Each entry is an object with these fields:

| Field    | Type       | Constraint                                                                   |
| -------- | ---------- | ---------------------------------------------------------------------------- |
| `app`    | `string`   | Non-empty; matches a deployable package App ID without the `swarmag-` prefix |
| `env`    | `string`   | One of `local`, `stage`, `prod`                                              |
| `config` | `string`   | Non-empty; matches the env var name                                          |
| `tags`   | `string[]` | Zero or more descriptive tags                                                |
| `secret` | `string`   | The resolved secret value                                                    |

```jsonc
{
  // Public Supabase client key for app-admin local backend binding target
  "app-admin.local.VITE_SUPABASE_PUBLIC_KEY": {
    "app": "app-admin",
    "env": "local",
    "config": "VITE_SUPABASE_PUBLIC_KEY",
    "tags": ["supabase", "public-key"],
    "secret": "<hex-value>"
  }
}
```

### 5.5 Bootstrap Workflow

A new developer provisions `secrets.jsonc` as follows:

1. Copy a `.env.example` for each deployable package to its `.env` counterpart.
2. Create `secrets.jsonc` at the repository root as an empty object `{}`.
3. For each `__SECRET__` placeholder in the env files, add an entry to `secrets.jsonc` with the correct composite key and a real or development-safe value.
4. Run `deno task guard:secrets` to validate the file structure.
5. Run `deno task app-{name}-package-local` to confirm the packaging workflow resolves all secrets.

For local JWT secrets in packages that require them: `deno task gen:jwt-secret`
prints a secure value ready to paste into `secrets.jsonc`.

## 6. Secret Management Scripts

All scripts live under `source/devops/scripts/`.

| Script                | Purpose                                                                 |
| --------------------- | ----------------------------------------------------------------------- |
| `validate-secrets.ts` | Validates `secrets.jsonc` structure and enforces composite key identity |
| `read-secret.ts`      | Reads one secret value by composite key from a JSONC secrets file       |
| `set-secret.ts`       | Updates one secret value by composite key in a JSONC secrets file       |
| `gen-jwt-secret.ts`   | Generates a 64-byte cryptographically secure hex JWT secret             |

### 6.1 Usage

```bash
# Validate secrets.jsonc
deno task guard:secrets

# Generate a new JWT secret (prints to stdout)
deno task gen:jwt-secret

# Read one secret
deno run --allow-read source/devops/scripts/read-secret.ts secrets.jsonc "app-admin.local.VITE_SUPABASE_PUBLIC_KEY"

# Set one secret
deno run --allow-read --allow-write source/devops/scripts/set-secret.ts secrets.jsonc "app-admin.local.VITE_SUPABASE_PUBLIC_KEY" "<value>"
```

## 7. Packaging Workflow

### 7.1 Package Scripts

Each deployable UX app has a pair of scripts:

| Script                         | Purpose                                            |
| ------------------------------ | -------------------------------------------------- |
| `app-{name}-package.sh`        | Build, resolve secrets, zip artifact, guard output |
| `app-{name}-package-verify.sh` | Post-package verification of the artifact          |

### 7.2 Packaging Steps

The `app-{name}-package.sh` script performs these steps in order:

1. Validate the target (`local`, `stage`, `prod`)
2. Load the env file for the target
3. Validate `VITE_PACKAGE_APP_ID` and `VITE_PACKAGE_TARGET` match expectations
4. Resolve all `__SECRET__` placeholders from `secrets.jsonc` into the process environment
5. Fail if any required env var is empty or unresolved after secret resolution
6. Build the Vite PWA into a temp dist directory
7. Copy required static files (`manifest.webmanifest`, `sw.js`, `icon.png`)
8. **Secrets leak guard** — scan for and remove any `secrets.jsonc` files in the dist output
9. Write `build-meta.json` (app, target, UTC timestamp, git SHA)
10. Zip the dist directory into `build/packages/{artifact-basename}.zip`
11. **Post-zip secrets guard** — inspect the zip contents; delete artifact and exit 1 if `secrets.jsonc` is found
12. Print `PACKAGE_ARTIFACT` and `PACKAGE_SHA256`

### 7.3 Artifact Naming

```
swarmag-{app-name}-{target}-{YYYYMMDDTHHMMSSZ}-{git-sha}.zip
```

Artifacts land in `build/packages/`. No build artifacts are committed to the repository.

### 7.4 Genesis Build

The `--genesis` flag rotates the JWT secret before building. It:

1. Generates a new secret via `gen-jwt-secret.ts`
2. Writes it to `secrets.jsonc` using `set-secret.ts`
3. Proceeds with the normal packaging workflow

Genesis builds require `--secrets-file`. Attempting a genesis build without a secrets file is a hard failure.

```bash
deno task app-admin-package-local-genesis
```

### 7.5 deno.jsonc Task Reference

```
app-{name}-package-local              Build local artifact
app-{name}-package-local-genesis      Rotate JWT secret, then build local artifact
app-{name}-package-stage              Build stage artifact
app-{name}-package-prod               Build prod artifact
app-{name}-package-{target}-verify    Verify artifact for target
```

## 8. Architectural Guards

Guards are Deno scripts that enforce structural and operational invariants. They run as part of the CI check suite and can be run individually.

### 8.1 Guard Inventory

| Task                   | Script                    | What it enforces                                     |
| ---------------------- | ------------------------- | ---------------------------------------------------- |
| `guard:architecture`   | `guard-architecture.ts`   | Dependency direction across layers                   |
| `guard:env`            | `guard-env.ts`            | Env file structure and required keys                 |
| `guard:leaf`           | `guard-leaf.ts`           | Leaf-module export discipline                        |
| `guard:validation`     | `guard-validation.ts`     | Validator shape conventions                          |
| `guard:domain-style`   | `guard-domain-style.ts`   | Domain layer code style conventions                  |
| `guard:core-std-types` | `guard-core-std-types.ts` | Core std type usage                                  |
| `guard:ux-state`       | `guard-ux-state.ts`       | UX state management conventions                      |
| `guard:chart`          | `guard-chart.ts`          | Chart component conventions                          |
| `guard:imports`        | `guard-imports.ts`        | Import discipline across all layers                  |
| `guard:secrets`        | `validate-secrets.ts`     | `secrets.jsonc` structure and composite key identity |

### 8.2 Guard Scope

`check:guards` runs all guards in the suite. Guards in the suite must pass without a `secrets.jsonc` present, because:

- Not all developers have packaging responsibilities at any given time
- Non-deployable packages (e.g. `app-style-guide`) have no `secrets.jsonc` requirement
- The CI environment may not have a `secrets.jsonc` populated

**`guard:secrets` is a packaging guard, not a code health guard.** It validates the shape and integrity of `secrets.jsonc` when that file exists, and should only be required to pass as a precondition to the packaging workflow — not as part of `check:guards`.

The correct placement of `guard:secrets` is:

- **In**: `app-{name}-package.sh` (already enforced implicitly via script logic)
- **Not in**: `check:guards`

### 8.3 Non-Deployable Package Exemptions

`app-style-guide` is a development tool with no deployment target. It is exempt from:

- `guard:secrets`
- `guard:env` (to the extent env guards apply to deployable packages only)
- All packaging tasks

Its development server is started via `deno task app-style-guide-local`, which has no secrets or env file dependency.

_End of Architecture DevOps Document_
