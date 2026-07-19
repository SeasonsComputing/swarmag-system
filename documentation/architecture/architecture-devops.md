<img src="../../swarmag-ops-logo.png" title="" alt="swarmAg Operations System" data-align="center">

# swarmAg Operations System — Architecture DevOps

## 1. Overview

This document defines the operational architecture for building, packaging, and deploying the swarmAg system. It governs environment configuration, the local secret registry, the packaging workflow, and the guard suite that enforces architectural and operational invariants.

### 1.1 Authority Chain

| Document                      | File                        | Intent                                                                     |
| ----------------------------- | --------------------------- | -------------------------------------------------------------------------- |
| **Canonical Authority Chain** | `architecture-core.md §1.1` | Defines global documentation precedence for the system                     |
| └→ **Architecture DevOps**    | _(this file)_               | Environment configuration, secret registry, packaging workflow, and guards |

### 1.2 Scope Boundary of Governing Documents

| Document                 | File                    | Scope Ownership                                                            |
| ------------------------ | ----------------------- | -------------------------------------------------------------------------- |
| **Architecture Core**    | `architecture-core.md`  | System boundary, platform constraints, and dependency direction            |
| **Style Guide**          | `STYLE-GUIDE.md`        | Implementation conventions and coding/file standards                       |
| **Architecture Backend** | `architecture-back.md`  | Backend integration architecture and runtime constraints                   |
| **Architecture UX**      | `architecture-front.md` | UX-layer boundaries, composition contracts, and app-specific architecture  |
| **Architecture DevOps**  | _(this file)_           | Environment configuration, secret registry, packaging workflow, and guards |

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
│   ├── guard-front-state.ts
│   ├── guard-imports.ts
│   ├── guard-leaf.ts
│   ├── guard-namespaces.ts
│   └── guard-validation.ts
└── scripts/
    ├── app-admin-package.sh
    ├── app-admin-package-verify.sh
    ├── app-customer-package.sh
    ├── app-customer-package-verify.sh
    ├── app-deploy.sh
    ├── app-deploy-auth-config.sh
    ├── app-local.sh
    ├── app-ops-package.sh
    ├── app-ops-package-verify.sh
    ├── app-style-guide-local.sh
    ├── edge-sync.ts
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

**UX apps** — `source/front/config/`

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

### 4.4 Supabase Edge Runtime Configuration

Supabase Edge is a server-side execution dimension. It is not a browser bundle
and does not consume `VITE_*` variables.

Browser-to-edge invocation and edge-to-Supabase access are separate concerns:

| Direction                 | Caller                       | Credentials                                                  |
| ------------------------- | ---------------------------- | ------------------------------------------------------------ |
| Browser to Supabase Edge  | UX Supabase browser client   | Public client key plus the current user's JWT                |
| Supabase Edge to database | Edge function caller client  | Public client key plus forwarded caller Authorization header |
| Supabase Edge to Auth     | Edge function service client | Service-role key from Supabase Edge secrets                  |

The browser invokes edge functions through the Supabase SDK, for example
`Supabase.client().functions.invoke(...)`. UX code must not hand-roll browser
fetch plumbing for edge calls unless the SDK fails a concrete requirement.

Supabase Edge functions read runtime configuration only through `Config`.
`SupabaseProvider` is the repository adapter for that runtime and encapsulates
the concrete Supabase Edge environment API behind the `RuntimeProvider`
contract. Edge function code must not call runtime environment APIs directly.
It must not depend on UX `VITE_*` names or browser configuration providers.

The Supabase Edge runtime injects its own configuration and reserves the
`SUPABASE_` prefix — custom secrets must not use it. The three values the edge
package needs are all platform-injected; the configuration bootstrap binds the
repository's logical names to the platform-injected names through the `Config`
alias map (`architecture-back.md §5.1`):

| Logical name (repository) | Platform-injected name      | Purpose                                            |
| ------------------------- | --------------------------- | -------------------------------------------------- |
| `SUPABASE_URL`            | `SUPABASE_URL`              | Supabase project URL in the Supabase Edge runtime  |
| `SUPABASE_PUBLIC_KEY`     | `SUPABASE_ANON_KEY`         | Public/anon key for caller-scoped Supabase clients |
| `SUPABASE_SERVICE_KEY`    | `SUPABASE_SERVICE_ROLE_KEY` | Service-role key for privileged orchestration only |

No custom Supabase secrets are set for these values. `supabase secrets set`
is reserved for future keys that do not carry the `SUPABASE_` prefix.

`SUPABASE_RDBMS_URL` is the UX logical name for direct browser database access.
It is not a Supabase Edge runtime name.

The service-role key boundary is strict:

- It is owned by Supabase Edge runtime secrets.
- It is never present in UX env templates, UX config aliases, browser bundles,
  Netlify env for UX apps, or client-visible metadata.
- It is used only for privileged orchestration that cannot be performed with the
  caller-scoped client, such as Supabase Auth admin operations.
- It does not replace caller verification or administrator authorization checks
  inside privileged edge functions.

## 5. Secret Registry

### 5.1 Purpose

The secret registry is a local developer file that stores the actual resolved
values for package targets and repository-level platform operations. It is
never committed to the repository and never included in a build artifact.

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
target has key `swarmag-app-admin.stage.VITE_SUPABASE_PUBLIC_KEY`.

The canonical secret scopes are the four deployable package App IDs from §3
plus `swarmag-system` for repository-level platform operations such as database
administration. Prefixless aliases such as `app-admin` are invalid.

### 5.4 Schema

Each entry is an object with these fields:

| Field    | Type       | Constraint                                 |
| -------- | ---------- | ------------------------------------------ |
| `app`    | `string`   | Matches one of the canonical secret scopes |
| `env`    | `string`   | One of `dev`, `stage`, `prod`              |
| `config` | `string`   | Non-empty; matches the env var name        |
| `tags`   | `string[]` | Zero or more descriptive tags              |
| `secret` | `string`   | The resolved secret value                  |

```jsonc
{
  // Public Supabase client key for app-admin stage backend binding target
  "swarmag-app-admin.stage.VITE_SUPABASE_PUBLIC_KEY": {
    "app": "swarmag-app-admin",
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
deno run --allow-read source/devops/scripts/read-secret.ts secrets.jsonc "swarmag-app-admin.stage.VITE_SUPABASE_PUBLIC_KEY"

# Set one secret
deno run --allow-read --allow-write source/devops/scripts/set-secret.ts secrets.jsonc "swarmag-app-admin.stage.VITE_SUPABASE_PUBLIC_KEY" "<value>"
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
10. Copy required static and deploy files (`manifest.webmanifest`, `sw.js`,
    `icon.png`, `netlify.toml`, `_redirects`)
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
swarmag-app-{admin|ops|customer}-{target}-{YYYYMMDDTHHMMSSZ}-{git-sha}.zip
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
6. Require `netlify.toml` and `_redirects` in each artifact, then deploy from
   the unzipped artifact root so Netlify discovers the packaged configuration
7. Smoke-test deployed URLs with `smoke-ux.ts`

The script fails immediately on any failed check, package, verification, deploy,
or smoke-test step.

### 8.3 Netlify Site Naming

Netlify sites are resolved from this naming convention:

```text
swarmag-app-{admin|ops|customer}-{dev|stage|prod}
```

The deploy script uses `netlify sites:list --json` to resolve site IDs and runs
`netlify deploy --dir . --prod` with the unzipped artifact as its working
directory. This makes the packaged `netlify.toml` the configuration Netlify
discovers for the deployment. A local operator must already be authenticated
with the Netlify CLI.

### 8.4 UX Smoke Tests

UX smoke tests apply to remotely deployed applications only (not `-local` local deployments). The UX smoke script is `source/devops/scripts/smoke-ux.ts`, exposed as:

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

- Root HTML responds successfully and `/index.html` has `Cache-Control: no-store`
- `build-meta.jsonc` exists and has the expected target
- `sw.js` responds successfully and has `Cache-Control: no-store`
- Built CSS responds successfully and has the immutable one-year cache policy
- Referenced font assets respond successfully
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
| Database      | `db-reset`, `db-genesis`, `db-genesis-verify`                        |
| Edge          | `edge-sync`, `edge-serve`, `edge-deploy`                             |
| Packaging     | `app-{name}-package-{target}`, `app-{name}-package-{target}-verify`  |
| Deployment    | `deploy`, `app-deploy-auth-config`, `ux-smoke`, `ux-stage-smoke`     |
| Local servers | `app-dev-local`, `app-stage-local`, `app-style-guide-local`          |

## 11. Architectural Guards

Guards are Deno scripts that enforce structural and operational invariants. They run as part of the CI check suite and can be run individually.

### 11.1 Guard Inventory

| Task                   | Script                    | What it enforces                                               |
| ---------------------- | ------------------------- | -------------------------------------------------------------- |
| `guard:architecture`   | `guard-architecture.ts`   | Dependency direction across layers                             |
| `guard:env`            | `guard-env.ts`            | Env file structure and required keys                           |
| `guard:leaf`           | `guard-leaf.ts`           | Leaf-module export discipline                                  |
| `guard:validation`     | `guard-validation.ts`     | Validator shape conventions                                    |
| `guard:domain-style`   | `guard-domain-style.ts`   | Domain layer code style conventions                            |
| `guard:core-std-types` | `guard-core-std-types.ts` | Core std type usage                                            |
| `guard:front-state`    | `guard-front-state.ts`    | Front state management conventions                             |
| `guard:chart`          | `guard-chart.ts`          | Chart component conventions                                    |
| `guard:imports`        | `guard-imports.ts`        | Import discipline across all layers                            |
| `guard:namespaces`     | `guard-namespaces.ts`     | Front namespace boundaries: ui seam, widget SPI, app isolation |
| `guard:css`            | `guard-css.ts`            | CSS architecture conventions                                   |
| `guard:bare-html`      | `guard-bare-html.ts`      | HTML shell constraints                                         |
| `guard:secrets`        | `validate-secrets.ts`     | `secrets.jsonc` structure and composite key identity           |

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
deno task db-reset --target {dev|stage|prod}
```

`db-genesis` applies the full contents of `source/domain/schema/schema.sql` to the selected Supabase target. It does not run migrations.
`db-genesis-verify` checks the seeded auth user, public user row, seed table counts, and `user_has_access` RPC behavior without modifying schema or data.
`db-reset` runs genesis first, then runs genesis verification for the same target.

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
INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '{devops-generated-UUID}',
  'authenticated',
  'authenticated',
  '{email}',
  '',
  '',
  '',
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  confirmation_token = EXCLUDED.confirmation_token,
  recovery_token = EXCLUDED.recovery_token,
  email_change = EXCLUDED.email_change,
  email_change_token_new = EXCLUDED.email_change_token_new,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  updated_at = now();
```

This ensures genesis runs are safe to execute against instances where the auth user already exists (e.g. created via the Supabase dashboard).

The Supabase Go auth server scans several `auth.users` string columns as non-nullable. Any column seeded as `NULL` instead of `''` causes a `500: Database error finding user` on the OTP endpoint. The following fields must be explicitly set to `''` in every seed row:

| Field                    | Reason                                                               |
| ------------------------ | -------------------------------------------------------------------- |
| `confirmation_token`     | Required non-null for OTP flow                                       |
| `recovery_token`         | Scanned as string on every user lookup                               |
| `email_change`           | Scanned as string on every user lookup                               |
| `email_change_token_new` | Scanned as string on every user lookup                               |
| `email_confirmed_at`     | Required non-null timestamp for the user to be treated as confirmed. |

## 13. Supabase Auth Configuration

### 13.1 Ownership

All Supabase auth configuration is owned by this repository. The Supabase
dashboard is not an authoritative source for auth settings.

`supabase/config.toml` owns local Supabase Auth behavior. Hosted Auth behavior
is declared separately in `supabase/auth/{target}.jsonc` and applied through
the Supabase Management API. Database pushes and resets do not apply hosted
Auth configuration.

### 13.2 Email Templates

Email templates live under `supabase/templates/` and are referenced from
`supabase/config.toml` for local Supabase. Template edits are expected
operational changes, but the repository files remain authoritative. For hosted
targets, `app-deploy-auth-config.sh` injects the same template into the
Management API payload and GET-verifies the readable value after applying it.

Supabase email templates are not UX application shell assets. They are exempt
from repository HTML/CSS formatting and architecture guard expectations because
they must conform to Supabase Auth and email-client rendering constraints.

| Template file                        | Config key                         | Trigger                         |
| ------------------------------------ | ---------------------------------- | ------------------------------- |
| `supabase/templates/magic-link.html` | `[auth.email.template.magic_link]` | `signInWithOtp({ email })` call |

### 13.3 OTP Flow

The system uses passwordless email OTP. `signInWithOtp({ email })` triggers the `magic_link` template. The template surfaces `{{ .Token }}` — the 6-digit code — which the user enters in the login screen. The `{{ .ConfirmationURL }}` magic link is intentionally omitted from the template; the code-entry flow is the only supported path.

OTP login never provisions users. `sendOtp` passes `shouldCreateUser: false`
and auth signups are disabled in `config.toml` (`enable_signup = false`), so an
email without an existing Auth identity cannot mint one through the login flow.
User provisioning happens only through the `user-create` edge function, whose
service-role Auth admin operations are exempt from the signup switch. This
protects the auth/domain UUID invariant (`architecture-back.md §4.5`): a
login-path signup would create an Auth identity with an ID that matches no
domain user.

OTP parameters are ratified system values (CA, 2026-07-19), declared in
`config.toml` under `[auth.email]` for local and in the hosted Auth
contract for deployed environments — one decision, two enforcement
surfaces, and the deployment tooling GET-verifies the hosted values after
applying them:

```toml
otp_length = 6
otp_expiry = 600
max_frequency = "60s"
```

Rationale — none of these are inherited defaults:

- **`otp_length = 6`** — standard code entropy for a 600-second lifetime.
- **`otp_expiry = 600`** — ten minutes tolerates ordinary email delivery
  delay and user context-switching while staying well inside Supabase's
  production-checklist guidance (≤ 1 hour). The platform default (3600)
  was rejected as an undecided inheritance.
- **`max_frequency = "60s"`** — the per-address resend cooldown is the
  abuse control; the project-wide email rate ceiling (60/hour) is a
  blast-radius cap, not a substitute. The two are separate layers.

### 13.4 Configuration Posture

Stage exercises the security posture intended for production. Divergence
requires a concrete testing reason, stated in this document — never a
quietly loosened value. A platform default is not a decision: every value
in a deployed configuration contract either traces to a recorded rationale
or is replaced by a chosen value. If test workflows ever need rapid auth
cycling, the correct mechanism is a scoped test affordance with a written
reason, not a global relaxation of these parameters.

### 13.5 Applying Auth Configuration

To apply and verify the repository-owned Auth configuration for a provisioned
hosted target:

```bash
deno task app-deploy-auth-config --target {dev|stage|prod}
```

The task resolves the canonical project target, requires
`SUPABASE_ACCESS_TOKEN` and `BREVO_SMTP_KEY`, PATCHes the Management API, then
GET-verifies every readable repository-owned value. The SMTP password is
injected at runtime, is never committed or printed, and cannot be GET-verified
because the API does not return plaintext credentials. A target without
`supabase/auth/{target}.jsonc` is intentionally not provisioned and fails
without mutating hosted state.

## 14. Platform Target Listings

### 14.1 Overview

Two scripts provide canonical platform topology queries. They are the single source of truth for target metadata across the devops layer. Other scripts consume their output rather than resolving platform topology independently.

| Script                     | Platform | Output shape                               |
| -------------------------- | -------- | ------------------------------------------ |
| `list-netlify-targets.ts`  | Netlify  | `{ [app]: { [target]: { siteId, url } } }` |
| `list-supabase-targets.ts` | Supabase | `{ [target]: { projectRef, url } }`        |

Both scripts write structured JSON to stdout and errors to stderr, then exit 1 on failure.

### 14.2 Netlify Target Listing

**Task:**

```bash
deno task list-netlify-targets [--app {admin|ops|customer}] --target {dev|stage|prod}
```

**Params:**

| Flag       | Values                         | Required | Description                                |
| ---------- | ------------------------------ | -------- | ------------------------------------------ |
| `--app`    | `admin` \| `ops` \| `customer` | no       | Filter to one app; omit to return all apps |
| `--target` | `dev` \| `stage` \| `prod`     | yes      | Select the target to list                  |

**Output (stdout, JSON):**

```json
{
  "admin": {
    "dev":   { "siteId": "abc123", "url": "https://swarmag-app-admin-dev.netlify.app" },
    "stage": { "siteId": "def456", "url": "https://admin-stage.swarmag.com" },
    "prod":  { "siteId": "ghi789", "url": "https://admin.swarmag.com" }
  },
  "ops": { ... },
  "customer": { ... }
}
```

When `--app` is applied, the output is scoped to that app but preserves the same shape.

**Errors (stderr + exit 1):**

| Condition                          | Message prefix       |
| ---------------------------------- | -------------------- |
| Netlify CLI unavailable            | `LIST_NETLIFY_FAIL:` |
| Not authenticated                  | `LIST_NETLIFY_FAIL:` |
| Site not found for app/target pair | `LIST_NETLIFY_FAIL:` |

**Site naming convention:**

Netlify sites are matched by name using the pattern:

```
swarmag-app-{app}-{target}
```

A site missing from the Netlify account for any requested app/target pair is a hard failure.

### 14.3 Supabase Target Listing

**Task:**

```bash
deno task list-supabase-targets --target {dev|stage|prod}
```

**Params:**

| Flag       | Values                     | Required | Description               |
| ---------- | -------------------------- | -------- | ------------------------- |
| `--target` | `dev` \| `stage` \| `prod` | yes      | Select the target to list |

**Output (stdout, JSON):**

```json
{
  "dev": { "projectRef": "abcdefgh", "url": "https://abcdefgh.supabase.co" },
  "stage": { "projectRef": "ijklmnop", "url": "https://ijklmnop.supabase.co" },
  "prod": { "projectRef": "qrstuvwx", "url": "https://qrstuvwx.supabase.co" }
}
```

The output is scoped to the requested target but preserves the same shape.

**Errors (stderr + exit 1):**

| Condition                                  | Message prefix        |
| ------------------------------------------ | --------------------- |
| Supabase CLI unavailable                   | `LIST_SUPABASE_FAIL:` |
| Not authenticated                          | `LIST_SUPABASE_FAIL:` |
| No project found for target                | `LIST_SUPABASE_FAIL:` |
| Multiple projects match target (ambiguous) | `LIST_SUPABASE_FAIL:` |

**Project naming convention:**

Supabase projects are matched by name. A project matches a target when its name (case-insensitive) contains `swarmag` and one of the target keywords:

| Target  | Accepted name keywords |
| ------- | ---------------------- |
| `dev`   | `dev`, `development`   |
| `stage` | `stage`, `staging`     |
| `prod`  | `prod`, `production`   |

Exactly one project must match per target. Zero matches and multiple matches are both hard failures.

### 14.4 Deno Task Group

Both scripts are registered under the `PLATFORM LISTINGS` task group in `deno.jsonc`:

```
list-netlify-targets    Query Netlify site topology for all or filtered apps/targets
list-supabase-targets   Query Supabase project topology for all or filtered targets
```

_End of Architecture DevOps Document_
