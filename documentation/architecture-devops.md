<img src="../swarmag-ops-logo.png" title

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
│   ├── guard-bare-html.ts
│   ├── guard-chart.ts
│   ├── guard-core-std-types.ts
│   ├── guard-css.ts
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
    ├── app-deploy.sh
    ├── app-local.sh
    ├── app-ops-package.sh
    ├── app-ops-package-verify.sh
    ├── app-style-guide-local.sh
    ├── gen-ai-context.ts
    ├── gen-id-seeds.ts
    ├── gen-jwt-secret.ts
    ├── read-secret.ts
    ├── db-genesis.ts
    ├── db-genesis-verify.ts
    ├── set-secret.ts
    ├── smoke-ux.ts
    └── validate-secrets.ts
```

## 3. Deployable Packages

Not all packages in the repository are deployed. Guards, tooling, and workflows that exist to protect deployment artifacts apply only to **deployable packages**.

| Package              | Deployable | Platform        | App ID                       |
| -------------------- | ---------- | --------------- | ---------------------------- |
| `app-admin`          | yes        | Netlify CDN     | `swarmag-app-admin`          |
| `app-ops`            | yes        | Netlify CDN     | `swarmag-app-ops`            |
| `app-customer`       | yes        | Netlify CDN     | `swarmag-app-customer`       |
| `back-supabase-edge` | yes        | Supabase        | `swarmag-back-supabase-edge` |
| `app-style-guide`    | **no**     | dev server only | n/a                          |

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

Local UX hosting is development tooling. It serves a bundle that is bound to a real backend target, normally dev or stage. The system does not define a local Supabase backend target for UX packages. The local runner preserves the generated target `.env` file and applies a process-local package metadata override by appending `-local` to `VITE_PACKAGE_VERSION` before Vite starts.

Backend packages still use environment files for their own runtime deployment environment.

### 4.1 Naming Convention

Each deployable package maintains configuration templates and generated
configuration files at the locations below. For UX apps, the target token
(`dev`, `stage`, `prod`) names the backend binding target.

The `.env.example` file is the committed package-environment template. The
corresponding `.env` file is a generated, gitignored package input. It is
disposable and may be recreated from the template by the package script when
`--init-env` is used.

**UX apps** — `source/ux/config/`

```
app-{admin|ops|customer}-{dev|stage|prod}.env.example  ← committed template
app-{admin|ops|customer}-{dev|stage|prod}.env          ← gitignored
```

**Backend (Supabase edge)** — `source/back/supabase-edge/config/`

```
back-supabase-edge-{dev|stage|prod}.env.example         ← committed template
back-supabase-edge-{dev|stage|prod}.env                 ← gitignored
```

### 4.2 Placeholder Convention

Any env value that must be resolved from the secret registry at package time is
set to the literal string `__SECRET__` in the env template:

```bash
# app-admin-stage.env.example
VITE_PACKAGE_APP_ID=swarmag-app-admin
VITE_PACKAGE_TARGET=stage
VITE_PACKAGE_VERSION=__PACKAGE_VERSION__
VITE_PRODUCT_NAME="swarmAg Operations System"
VITE_APPLICATION_NAME="Administration Portal"
VITE_SUPABASE_EDGE_URL=__SECRET__
VITE_SUPABASE_RDBMS_URL=__SECRET__
VITE_SUPABASE_PUBLIC_KEY=__SECRET__
VITE_SUPABASE_CLIENT_MODE=browser
VITE_SERVICE_WORKER_ENABLED=true
VITE_LOCAL_DB_NAME=swarmag-app-admin
```

The packaging script resolves `__SECRET__` values from `secrets.jsonc` before
invoking the Vite build. The resolved value is never written to disk — it is
injected into the build process environment only.

For UX package templates, target-specific package values use `__SECRET__` when
they vary by binding target and are secret material. This includes:

- `VITE_SUPABASE_EDGE_URL`
- `VITE_SUPABASE_RDBMS_URL`
- `VITE_SUPABASE_PUBLIC_KEY`

`VITE_PACKAGE_VERSION` is operational metadata, not a secret. UX package
templates set it to `__PACKAGE_VERSION__`, and the packaging workflow computes
the concrete value.

Stable non-secret package identity values remain literal in the template. This
includes:

- `VITE_PACKAGE_APP_ID`
- `VITE_PACKAGE_TARGET`
- `VITE_PACKAGE_VERSION`
- `VITE_PRODUCT_NAME`
- `VITE_APPLICATION_NAME`
- `VITE_SUPABASE_CLIENT_MODE`
- `VITE_SERVICE_WORKER_ENABLED`
- `VITE_LOCAL_DB_NAME`

### 4.3 Security Rules

- Never commit actual `.env` files — only `.env.example` templates
- `__SECRET__` must never appear in a production build artifact
- Use platform-managed secrets (Netlify environment variables, Supabase secrets) for dev, stage, and prod targets
- Rotate secrets regularly; use `deno task gen:jwt-secret` for packages that
  define a JWT secret

## 5. Secret Registry

### 5.1 Purpose

The secret registry is a local developer file that stores the actual resolved
values for package targets. It is never committed to the repository and never
included in a build artifact.

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

For example, the entry for `VITE_SUPABASE_PUBLIC_KEY` in the `app-admin` stage
target has key `app-admin.stage.VITE_SUPABASE_PUBLIC_KEY`.

### 5.4 Schema

Each entry is an object with these fields:

| Field    | Type       | Constraint                                                                   |
| -------- | ---------- | ---------------------------------------------------------------------------- |
| `app`    | `string`   | Non-empty; matches a deployable package App ID without the `swarmag-` prefix |
| `env`    | `string`   | One of `dev`, `stage`, `prod`                                                |
| `config` | `string`   | Non-empty; matches the env var name                                          |
| `tags`   | `string[]` | Zero or more descriptive tags                                                |
| `secret` | `string`   | The resolved secret value                                                    |

```jsonc
{
  // Public Supabase client key for app-admin stage backend binding target
  "app-admin.stage.VITE_SUPABASE_PUBLIC_KEY": {
    "app": "app-admin",
    "env": "stage",
    "config": "VITE_SUPABASE_PUBLIC_KEY",
    "tags": ["supabase", "public-key"],
    "secret": "<value>"
  }
}
```

### 5.5 Bootstrap Workflow

A developer provisions `secrets.jsonc` as follows:

1. Create `secrets.jsonc` at the repository root as an empty object `{}`.
2. For each `__SECRET__` placeholder in the env templates, add an entry to
   `secrets.jsonc` with the correct composite key and a real or
   development-safe value.
3. Run `deno task guard:secrets` to validate the file structure.
4. Run the package script with `--init-env` to recreate the target `.env` from
   its template and confirm the packaging workflow resolves all secrets.

For JWT secrets in packages that require them: `deno task gen:jwt-secret` prints
a secure value ready to paste into `secrets.jsonc`.

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
deno run --allow-read source/devops/scripts/read-secret.ts secrets.jsonc "app-admin.stage.VITE_SUPABASE_PUBLIC_KEY"

# Set one secret
deno run --allow-read --allow-write source/devops/scripts/set-secret.ts secrets.jsonc "app-admin.stage.VITE_SUPABASE_PUBLIC_KEY" "<value>"
```

## 7. Packaging Workflow

### 7.1 Package Versioning

UX package versions use this format:

```text
{major}.{minor}.{build}-{target}
```

Version parts are sourced as follows:

| Part          | Source                         | Purpose                        |
| ------------- | ------------------------------ | ------------------------------ |
| `major.minor` | Committed root `VERSION` file  | Product release line           |
| `build`       | `git rev-list --count HEAD`    | Repository-derived build trace |
| `target`      | Package script target argument | Backend binding target         |

For example, a stage package built from release line `0.1` at Git build count
`247` has version `0.1.247-stage`.

The package script exports the computed value as `VITE_PACKAGE_VERSION` for the
Vite build. It does not write the computed value to generated `.env` files or
store it in `secrets.jsonc`.

### 7.2 Package Scripts

Each deployable UX app has a pair of scripts:

| Script                         | Purpose                                            |
| ------------------------------ | -------------------------------------------------- |
| `app-{name}-package.sh`        | Build, resolve secrets, zip artifact, guard output |
| `app-{name}-package-verify.sh` | Post-package verification of the artifact          |

### 7.3 Packaging Steps

The `app-{name}-package.sh` script performs these steps in order:

1. Validate the target (`dev`, `stage`, `prod`)
2. When `--init-env` is present, remove the target `.env` and recreate it from
   the committed `.env.example` template
3. When `--init-env` is absent, require the target `.env` to exist
4. Load the env file for the target
5. Validate `VITE_PACKAGE_APP_ID` and `VITE_PACKAGE_TARGET` match expectations
6. Compute `VITE_PACKAGE_VERSION` from `VERSION`, Git build count, and target
7. Resolve all `__SECRET__` placeholders from `secrets.jsonc` into the process
   environment
8. Fail if any required env var is empty or unresolved after package version
   and secret resolution
9. Build the Vite PWA into a temp dist directory
10. Copy required static files (`manifest.webmanifest`, `sw.js`, `icon.png`)
11. **Secrets leak guard** — scan for and remove any `secrets.jsonc` files in
    the dist output
12. Write `build-meta.jsonc` (app, target, version, build number, UTC
    timestamp, git SHA)
13. Zip the dist directory into `build/packages/{artifact-basename}.zip`
14. **Post-zip secrets guard** — inspect the zip contents; delete artifact and
    exit 1 if `secrets.jsonc` is found
15. Print `PACKAGE_ARTIFACT` and `PACKAGE_SHA256`

Normal packaging does not mutate `.env`. Packaging with `--init-env` recreates
the target `.env` from the committed template before loading it. The package
script never writes resolved secret values into `.env`.

### 7.4 Artifact Naming

```
swarmag-{app-name}-{target}-{YYYYMMDDTHHMMSSZ}-{git-sha}.zip
```

Artifacts land in `build/packages/`. No build artifacts are committed to the repository.

### 7.5 JWT Secret Generation

`deno task gen:jwt-secret` prints a secure JWT secret for packages that require
one. The generated value is copied into the appropriate `secrets.jsonc` entry
and resolved by the normal packaging workflow.

### 7.6 Packaging Task Reference

```
app-{name}-package-dev                Build dev artifact
app-{name}-package-stage              Build stage artifact
app-{name}-package-prod               Build prod artifact
app-{name}-package-{target}-verify    Verify artifact for target
```

## 8. Deployment Workflow

The UX deployment script is `source/devops/scripts/app-deploy.sh`, exposed as
`deno task deploy`.

### 8.1 UX Deploy Command

```bash
deno task deploy --app {admin|ops|customer} [app ...] --target {dev|stage|prod}
```

The command deploys one or more UX apps for a single backend binding target.

### 8.2 UX Deploy Steps

`app-deploy.sh` performs these steps in order:

1. Run `deno task check`
2. Verify the git working tree is clean
3. Resolve Netlify site IDs by name
4. Package each requested app with the app package script
5. Verify each package artifact with the app verify script
6. Deploy each unzipped artifact to Netlify
7. Smoke-test deployed URLs with `smoke-ux.ts`

The script fails immediately on any failed check, package, verification, deploy,
or smoke-test step.

### 8.3 Netlify Site Naming

Netlify sites are resolved from this naming convention:

```text
swarmag-app-{admin|ops|customer}-{dev|stage|prod}
```

The deploy script uses `netlify sites:list --json` to resolve site IDs and
`netlify deploy --prod` to publish the artifact to the resolved site. A local
operator must already be authenticated with the Netlify CLI.

### 8.4 UX Smoke Tests

The UX smoke script is `source/devops/scripts/smoke-ux.ts`, exposed as:

```bash
deno task ux-smoke --target {dev|stage|prod} {app}={url} ...
deno task ux-stage-smoke
```

Stage smoke tests have default targets:

```text
admin    https://admin-stage.swarmag.com
ops      https://ops-stage.swarmag.com
customer https://customer-stage.swarmag.com
```

Non-stage targets require explicit `{app}={url}` arguments.

The smoke script verifies:

- Root HTML responds successfully
- `build-meta.jsonc` exists and has the expected target
- `sw.js` responds successfully
- Built CSS and referenced font assets respond successfully
- The login screen becomes browser-ready in headless Chrome
- Protected `/dashboard` routes redirect to `/login`
- Protected routes do not render dashboard content before authentication
- Protected routes do not contact the target backend before authentication
- Browser runtime errors fail the smoke test

Chrome is auto-detected from common local paths and executable names. Operators
may pass `chrome=/path/to/chrome` when auto-detection is insufficient.

## 9. Local Development Servers

Local UX hosting is development tooling. It serves a bundle bound to a real
backend target.

```bash
deno task app-dev-local {admin|ops|customer}
deno task app-stage-local {admin|ops|customer}
deno task app-style-guide-local
```

`app-local.sh` serves a dev-bound or stage-bound UX app locally and appends
`-local` to `VITE_PACKAGE_VERSION` in the Vite process environment. It does not
mutate the generated target `.env` file.

`app-style-guide-local` serves the non-deployable style-guide harness and has no
package env or secret-registry dependency.

## 10. deno.jsonc Task Surface

`deno.jsonc` is the authoritative task registry. This section describes the
supported task groups; individual task bodies remain in `deno.jsonc`.

| Group         | Tasks                                                                |
| ------------- | -------------------------------------------------------------------- |
| Validation    | `check`, `check:guards`, `check:types`, `check:lint`, `test`, `lint` |
| Formatting    | `fmt`, `fmt:check`                                                   |
| Generators    | `gen:jwt-secret`, `gen:id-seeds`, `gen:ai-context`                   |
| Guards        | `guard:*` tasks listed in Guard Inventory                            |
| Database      | `db-genesis`, `db-genesis-verify`                                    |
| Packaging     | `app-{name}-package-{target}`, `app-{name}-package-{target}-verify`  |
| Deployment    | `deploy`, `ux-smoke`, `ux-stage-smoke`                               |
| Local servers | `app-dev-local`, `app-stage-local`, `app-style-guide-local`          |

## 11. Architectural Guards

Guards are Deno scripts that enforce structural and operational invariants. They run as part of the CI check suite and can be run individually.

### 11.1 Guard Inventory

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
| `guard:css`            | `guard-css.ts`            | CSS architecture conventions                         |
| `guard:bare-html`      | `guard-bare-html.ts`      | HTML shell constraints                               |
| `guard:secrets`        | `validate-secrets.ts`     | `secrets.jsonc` structure and composite key identity |

### 11.2 Guard Scope

`check:guards` runs all guards in the suite. Guards in the suite must pass without a `secrets.jsonc` present, because:

- Not all developers have packaging responsibilities at any given time
- Non-deployable packages (e.g. `app-style-guide`) have no `secrets.jsonc` requirement
- The CI environment may not have a `secrets.jsonc` populated

**`guard:secrets` is a packaging guard, not a code health guard.** It validates the shape and integrity of `secrets.jsonc` when that file exists, and should only be required to pass as a precondition to the packaging workflow — not as part of `check:guards`.

The correct placement of `guard:secrets` is:

- **In**: `app-{name}-package.sh` (already enforced implicitly via script logic)
- **Not in**: `check:guards`

### 11.3 Guard Output Contract

All guards report results using the shared `guard-utils.ts` utility. The contract is:

- **Pass:** `✓ {Name} guard passed` — written to stdout
- **Fail:** `✗ {Name} guard failed:` followed by an indented violation list — written to stderr, then `Deno.exit(1)`

Guards that enforce a specific rule may append a hint line after the violation list. Guards must use `guardPass` and `guardFail` from `@devops/guards/guard-utils.ts` — inline `console.log`/`console.error` at the result boundary is a violation of this contract.

### 11.4 Non-Deployable Package Exemptions

`app-style-guide` is a development tool with no deployment target. It is exempt from:

- `guard:secrets`
- `guard:env` (to the extent env guards apply to deployable packages only)
- All packaging tasks

Its development server is started via `deno task app-style-guide-local`, which has no secrets or env file dependency.

## 12. Supabase Schema Management

### 12.1 Overview

The canonical Supabase schema is `source/domain/schema/schema.sql`. It is the authoritative DDL for the stage and production Supabase instances. All table definitions, RLS policies, indexes, seed data, and RPC functions are owned by this file.

Migrations in `source/back/migrations/` express deltas from the schema baseline and are applied after a genesis run to advance the schema forward.

### 12.2 Genesis Run

A **genesis run** is a full reset of the Supabase instance from `schema.sql`. It drops all public-schema tables and recreates the entire schema, including seed data and RPC functions, in a single execution.

**When to perform a genesis run:**

- Provisioning a new Supabase environment (dev, stage, prod)
- Resetting a broken or inconsistent stage environment
- Schema changes that require full recreation (e.g. structural constraint additions)
- Any situation where incremental migration is not feasible or trusted

**Supabase auth schema constraint:**

Supabase manages the `auth` schema internally — `auth.users` cannot be dropped or recreated. `schema.sql` handles this by using `INSERT ... ON CONFLICT (id) DO UPDATE SET ...` for all `auth.users` seed rows. This makes the genesis run idempotent with respect to existing auth users: existing rows are updated to the correct seed state, and new rows are inserted.

**Primary run path:**

Genesis runs are performed through the Supabase CLI using the repository task:

```bash
deno task db-genesis --target {dev|stage|prod}
deno task db-genesis-verify --target {dev|stage|prod}
```

The task applies the full contents of `source/domain/schema/schema.sql` to the selected Supabase target. It does not run migrations.
The verification task checks the seeded auth user, public user row, seed table
counts, and `user_has_access` RPC behavior without modifying schema or data.

The selected target must exist and must print the resolved target identity before applying SQL. The operator must confirm the target before the schema is applied.

`dev` and `stage` genesis runs are authorized development operations after interactive target confirmation. `prod` database maintenance of any kind requires explicit typed production confirmation in addition to the normal target confirmation.

**Migration visibility:**

`db-genesis` counts migration files in `source/back/migrations/` and when one or more migrations exist, the task must print a loud warning:

```text
WARNING: MIGRATIONS FOUND (###)
Genesis applies schema.sql only. Run required migrations after genesis.
```

Migration execution is intentionally outside the genesis task. A future migration runner may be added when incremental schema advancement becomes operationally necessary.

**Manual fallback:**

If the Supabase CLI is unavailable or the task is blocked, execute the full contents of `schema.sql` against the target Supabase instance via the Supabase MCP `execute_sql` tool or the Supabase dashboard SQL editor.

### 12.3 auth.users Seed Convention

All `auth.users` seed rows in `schema.sql` must use the upsert form:

```sql
INSERT INTO auth.users (id, aud, role, email, confirmation_token, email_confirmed_at, ...)
VALUES (...)
ON CONFLICT (id) DO UPDATE SET
  confirmation_token = EXCLUDED.confirmation_token,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  updated_at = now();
```

This ensures genesis runs are safe to execute against instances where the auth user already exists (e.g. created via the Supabase dashboard).

`confirmation_token` must be set to `''` (empty string) and `email_confirmed_at` must be set to a non-null timestamp for OTP delivery to succeed. A `NULL` confirmation_token causes a 500 error on the Supabase OTP endpoint.

_End of Architecture DevOps Document_
