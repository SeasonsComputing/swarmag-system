# User / Contact / Customer Refactor — Shell And Architecture Handoff

**Date:** 2026-06-30
**Mode:** Foundation
**Purpose:** New-session handoff after completing tests/fixtures cleanup, documentation organization, shell chrome refinements, and UX architecture metaphor cleanup.

## 1. Governing Context

- Invariants: `AGENTS.md`
- Required session context:
  - Base context
  - Domain Internals
  - UX Internals
  - Application Features
- Approved design: `effort/completed/2026-06-28-user-contact-customer-design.md`
- Working checklist: `effort/completed/2026-06-28-user-contact-customer-tasks.md`
- Prior handoff: `effort/completed/2026-06-29B-user-contact-customer-handoff.md`

The active work remained Foundation work because it touched shared UX architecture,
theme token behavior, shared shell composition, and foundational documentation.

## 2. Settled Decisions

- User / Contact / Customer Tests scope #4 is complete except for optional broader adapter and role guard coverage.
- `deno task check` is green after the fixture/test repairs.
- Full `deno task test` remains blocked by missing Supabase test configuration:
  - `SUPABASE_RDBMS_URL`
  - `SUPABASE_PUBLIC_KEY`
  - `SUPABASE_CLIENT_MODE`
- From-scratch genesis schema deployment and app deployment verification remain required.
  Review `documentation/architecture/architecture-devops.md` before running any
  target mutation, deployment command, or app smoke workflow.
- Documentation is organized by flat category directories under `documentation/`.
- `STYLE-GUIDE.md` is a root governance artifact with `AGENTS.md` and `CONSTITUTION.md`.
- `Content` is no longer a named UX architecture primitive.
- Authenticated routes still render a semantic `main` landmark.
- The current UX metaphors are:
  - Dashboard
  - Widget
  - Abstraction Manager
  - Workflow Manager
  - Custom Full Device
- Light-mode shell chrome uses a light surface again.
- Dark-mode shell chrome remains intact.
- Footer logo treatment is theme-owned through `--sa-footer-logo-filter`.
- The gradient-mask footer logo experiment was rejected as too clever and removed.

## 3. Completed Work Since Prior Handoff

### Tests And Fixtures

Updated:

- `source/tests/fixtures/user-samples.ts`
- `source/tests/fixtures/customer-samples.ts`
- `source/tests/fixtures/fixtures-test.ts`
- `source/tests/cases/users-api-test.ts`
- `effort/completed/2026-06-28-user-contact-customer-tasks.md`

Implemented:

- Added `preferredChannel` and `notes` to User samples and API create payloads.
- Removed embedded Customer contact fixture expectations.
- Added `primaryContactId` fixture coverage.
- Added CustomerUser junction fixture coverage without encoding the open membership decision.
- Restored full repo typecheck by repairing downstream tests/fixtures.

### Documentation Organization

Updated:

- `README.md`
- `AGENTS.md`
- `STYLE-GUIDE.md`
- Documentation references across `documentation/**`

Implemented:

- Renamed root style guide to `STYLE-GUIDE.md`.
- Moved documentation into flat category directories:
  - `documentation/genesis/`
  - `documentation/architecture/`
  - `documentation/domain/`
  - `documentation/project/`
  - `documentation/ux/`
- Kept files only at the root and category-root levels.
- Updated markdown links and documentation category references.

### Shell Chrome And Theme Work

Updated:

- `source/ux/common/shell/dashboard.tsx`
- `source/ux/common/shell/dashboard.css`
- `source/ux/common/components/css/themes.css`
- `source/ux/common/components/css/ui.css`
- `source/ux/common/components/ui/ui-footer.tsx`
- `documentation/ux/ux-design-language.md`
- `documentation/ux/ux-components-internals.md`

Implemented:

- Added the flat swarmAg logo to the dashboard header.
- Preserved the established dashboard header height and padding rhythm.
- Kept the dashboard logo at the inline start.
- Distributed header widgets across the remaining inline row.
- Restored light-mode shell chrome to a light surface.
- Preserved dark-mode shell chrome behavior.
- Added `--sa-footer-logo-filter` as a theme-owned token.
- Set dark footer logo to softened light mono.
- Set light footer logo to primary-brand-style mono.
- Cataloged `--sa-footer-*` in UX design and internals documentation.

### UX Architecture Cleanup

Updated:

- `source/ux/common/shell/bootstrap.tsx`
- `source/ux/common/shell/shell-dialog.tsx`
- `documentation/architecture/architecture-ux.md`

Deleted:

- `source/ux/common/shell/content.tsx`

Implemented:

- Removed `Content` as a named shell primitive.
- Inlined semantic `main` landmarks in authenticated dashboard and dialog routes.
- Updated UX architecture to describe the real feature metaphors rather than a generic content wrapper.

### About Dialog Behavior

Updated:

- `source/ux/common/components/ui/ui-dialog.tsx`
- `source/ux/common/shell/bootstrap.tsx`
- UX component documentation

Implemented:

- Added `dismissible` dialog behavior.
- Kept click-away close disabled by default.
- Made the About dialog dismissible by outside pointer interaction.

## 4. Checks Run

Passed:

- `deno task check`
- `deno task guard:css`
- Targeted `deno check` for changed shell/footer files.
- `dprint fmt` for changed architecture and UX documentation.

Known blocked:

- `deno task test`
  - Fixture integrity tests passed earlier.
  - Full task still requires Supabase test configuration.

## 5. Current Expected Git State

The working tree should contain this handoff and the updated task list if this
handoff has not yet been committed.

Recent completed implementation touched:

- Documentation organization and link repairs.
- User / Contact / Customer test fixtures.
- Shared shell dashboard header.
- Shared theme and footer logo tokens.
- UX architecture documentation.
- Removal of `source/ux/common/shell/content.tsx`.

Run `git status --short` before staging because earlier scopes may already have
been committed or staged by the Chief Architect.

## 6. Next Recommended Scope

### Genesis And App Deployment Verification

Operating mode: Foundation.

Before this work begins, reread `documentation/architecture/architecture-devops.md`.
That document owns the deployment and target-environment rules. Do not infer a
deployment sequence from memory or from prior terminal history.

Required remaining work:

- Deploy a from-scratch genesis schema to an approved target environment.
- Run `deno task db-genesis-verify --target {target}` against that environment.
- Validate app configuration and secrets for Admin, Ops, and Customer.
- Build or deploy Admin, Ops, and Customer against the genesis target.
- Smoke the deployed or stage-bound apps.

### User Edge Functions

Operating mode: Foundation.

Still deferred:

- `user-update`
- `user-delete`
- `user-eject`

Do not expand into Customer Onboarding or CustomerUser API/client exposure inside this scope.

### Optional Test Expansion

Operating mode: Repair or Foundation depending on coverage target.

Remaining optional coverage:

- Adapter round-trip tests for User new fields.
- Adapter round-trip tests for `Customer.primaryContactId`.
- Adapter coverage for CustomerUser if junction fixtures are expanded.
- Role guard coverage for user roles and job assignment roles.

## 7. Cautions For Next Agent

- Do not rename `JobPlanAssignmentRole`.
- Do not reintroduce embedded `Contact`.
- Do not expose CustomerUser through API/client before Customer Onboarding scope.
- Do not encode the open `Customer.primaryContactId` plus `customer_contacts` membership decision in tests.
- Preserve `UiSingleSelect` trigger `type='button'`.
- Preserve default non-dismissible dialog behavior; use `dismissible` only where intended.
- Preserve dashboard header height and padding rhythm.
- Preserve semantic `main` landmarks even though `Content` was removed.
- Treat Dashboard, Widget, Abstraction Manager, Workflow Manager, and Custom Full Device as the active UX metaphors.
- Review `documentation/architecture/architecture-devops.md` before any genesis,
  target, deployment, secret, or app smoke work.
