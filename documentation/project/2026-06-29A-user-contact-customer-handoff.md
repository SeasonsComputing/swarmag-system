# User / Contact / Customer Refactor — Handoff

**Date:** 2026-06-29
**Mode:** Foundation
**Purpose:** New-session handoff for the approved User / Contact / Customer refactor.

## 1. Governing Context

- Invariants: `AGENTS.md`
- Required session context: Domain Internals
- Approved design: `documentation/project/2026-06-28-user-contact-customer-design.md`
- Working checklist: `documentation/project/2026-06-28-user-contact-customer-tasks.md`

The core refactor is Foundation work. It changes domain meaning, shared contracts, schema,
backend auth/domain boundaries, and downstream test/UX expectations.

## 2. Settled Decisions

- There is one domain `User`.
- `auth.users` is the authentication principal and Supabase security anchor.
- `public.users` is the domain user record queried and related by the application.
- `auth.users.id` and `public.users.id` intentionally share the same application-supplied UUID v7.
- Auth/domain synchronization belongs in backend architecture and solution-space documentation, not in `domain-model.md`.
- `Customer` is an account.
- `Contact` is removed as an embedded Customer value object.
- `CustomerContact` is a pure-key Junction between `Customer` and `User`.
- `Customer.primaryContactId` is a required `AssociationOne<User>`.
- `ContactPreferredChannel` belongs on `User`.
- `User.notes` is editable in canonical User Management.
- `UserRole` includes `'customer'`.
- `JobPlanAssignmentRole` keeps its name. Only its values changed.
- `JobPlanAssignmentRole` values are exactly:
  - `crew-lead`
  - `pilot`
  - `visual-observer`
  - `applicator`
  - `equipment-operator`
  - `technician`

## 3. Completed Work

### Docs

Updated documentation to align domain/solution/backend authority boundaries:

- `documentation/domain/domain-model.md`
- `documentation/architecture/architecture-back.md`
- `documentation/domain/domain-data-dictionary.md`
- `documentation/domain/domain-archetypes.md`
- `documentation/project/project-user-stories.md`
- `documentation/project/2026-06-28-user-contact-customer-design.md`
- `documentation/project/2026-06-28-user-contact-customer-tasks.md`

Important note: `documentation/domain/domain-data-dictionary.md` currently remains unstaged at handoff time.

### Domain Internals — Model and Schema

Updated:

- `source/domain/abstractions/user.ts`
- `source/domain/abstractions/customer.ts`
- `source/domain/abstractions/job.ts`
- `source/domain/protocols/customer-protocol.ts`
- `source/domain/validators/user-validator.ts`
- `source/domain/validators/customer-validator.ts`
- `source/domain/validators/job-validator.ts`
- `source/domain/adapters/user-adapter.ts`
- `source/domain/adapters/customer-adapter.ts`
- `source/domain/schema/schema.sql`

Implemented:

- `UserRole` gained `'customer'`.
- `ContactPreferredChannel` moved to `user.ts`.
- `User` gained `preferredChannel` and `notes`.
- Embedded `Contact` and `Customer.contacts` were removed.
- `Customer.primaryContactId` was added.
- `CustomerContact` pure-key Junction was added.
- `CustomerContactCreate` was added.
- `JobPlanAssignment.role` now uses `JobPlanAssignmentRole`, not `UserRole`.
- Schema added `users.preferred_channel`, `users.notes`, `customers.primary_contact_id`, and `customer_contacts`.
- Schema updated `job_plan_assignments.role` CHECK to the six crew assignment values.
- Seed user insert gained `notes` and `preferred_channel`.

## 4. Checks Run

Passed:

- `deno task check:domain-genesis`

This includes:

- `guard:domain-style`
- `guard:core-std-types`
- domain `deno check`
- domain `deno lint`

Failed as expected outside approved Domain Internals scope:

- `deno task check:types`

Failures were in downstream tests/fixtures/UX:

- `source/tests/cases/users-api-test.ts` needs `notes` and `preferredChannel` in `UserCreate`.
- `source/tests/fixtures/user-samples.ts` needs `notes` and `preferredChannel`.
- `source/tests/fixtures/customer-samples.ts` still uses removed `contacts`.
- `source/tests/fixtures/fixtures-test.ts` still asserts embedded contacts and primary contact flags.
- `source/ux/app-admin/users/user-manager.tsx` creates `UserCreate` without `notes` and `preferredChannel`.

## 5. Current Git State

At handoff time, the following files were staged:

- `documentation/project/2026-06-28-user-contact-customer-design.md`
- `documentation/project/2026-06-28-user-contact-customer-tasks.md`
- `source/domain/abstractions/customer.ts`
- `source/domain/abstractions/job.ts`
- `source/domain/abstractions/user.ts`
- `source/domain/adapters/customer-adapter.ts`
- `source/domain/adapters/user-adapter.ts`
- `source/domain/protocols/customer-protocol.ts`
- `source/domain/schema/schema.sql`
- `source/domain/validators/customer-validator.ts`
- `source/domain/validators/job-validator.ts`
- `source/domain/validators/user-validator.ts`

Unstaged known file:

- `documentation/domain/domain-data-dictionary.md`

This handoff file is newly created and may need staging.

## 6. Next Recommended Scopes

### Tests and Fixtures

Update:

- `source/tests/fixtures/user-samples.ts`
- `source/tests/fixtures/customer-samples.ts`
- `source/tests/fixtures/samples.ts` if CustomerContact samples are added
- `source/tests/fixtures/fixtures-test.ts`
- `source/tests/cases/users-api-test.ts`

Expected work:

- Add `preferredChannel` and `notes` to user samples and user API create payload.
- Replace embedded customer contact fixture data with `primaryContactId`.
- Add CustomerContact samples if fixture coverage includes the junction.
- Replace fixture integrity contact checks with `primaryContactId` and optional CustomerContact linkage checks.

### UX

Update:

- `source/ux/app-admin/users/user-manager.tsx`
- likely `source/ux/common/shell/abstraction-manager.tsx` for overflow behavior

Expected work:

- User manager exposes `'customer'` role.
- User manager supports editable notes.
- User manager includes preferred channel.
- `AbstractionManager` supports long-form overflow with grouped vertical scroll and stable actions.

### Domain Internals — User Edge Functions

Planned but not implemented:

- `user-update`
- `user-delete`
- `user-eject`

These must preserve the auth/domain user boundary and application-supplied UUID v7 invariant.

## 7. Open Decisions

- Whether `Customer.primaryContactId` must also have a matching row in `customer_contacts`.
- Whether `CustomerContact` needs API/client exposure in this milestone.

## 8. Cautions For Next Agent

- Do not rename `JobPlanAssignmentRole`.
- Do not reintroduce embedded `Contact`.
- Do not put auth/public user synchronization mechanics in `domain-model.md`.
- Do not expand from tests/UX into edge functions without a separate Foundation scope.
- Expect full repo typecheck to fail until tests/fixtures and UX are updated.
