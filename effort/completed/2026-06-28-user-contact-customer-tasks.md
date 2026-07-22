# User / Contact / Customer Refactor — Task List

**Date:** 2026-06-28
**Mode:** Foundation
**Status:** Planning checklist
**Source design:** `effort/completed/2026-06-28-user-contact-customer-design.md`

This task list decomposes the approved design into implementation workstreams.
It is a planning aid, not a replacement for the approved design or governing
domain documentation.

## 1. Docs

- [x] Update `documentation/domain/domain-model.md`
  - [x] Update User semantics for customer access, preferred channel, and notes.
  - [x] Update Customer semantics from embedded contacts to primary contact FK.
  - [x] Replace Contact with CustomerUser as a pure-key Junction.
- [x] Update `documentation/architecture/architecture-back.md`
  - [x] Add Auth / Domain User Boundary section.
  - [x] State that there is one domain `User`.
  - [x] Explain that `auth.users` is the authentication principal and Supabase security anchor.
  - [x] Explain that `public.users` is the domain user record queried and related by the application.
  - [x] State that `auth.users.id` and `public.users.id` intentionally share the same application-supplied UUID v7.
  - [x] Explain that the parallel structure avoids a translation layer while preserving auth/RLS alignment.
  - [x] State that backend user create, update, delete, and eject paths must maintain the invariant.
  - [x] State that the database must not generate the domain user ID.
- [x] Update `documentation/domain/domain-data-dictionary.md`
  - [x] Move `ContactPreferredChannel` into Users.
  - [x] Add `preferredChannel` and `notes` to User.
  - [x] Add `'customer'` to `UserRole`.
  - [x] Document `public.users.id` as the domain user identifier.
  - [x] Document synchronization with `auth.users.id` as a solution-space invariant.
  - [x] Document that the shared UUID is application-supplied UUID v7.
  - [x] Remove Contact from Customers.
  - [x] Add `Customer.primaryContactId`.
  - [x] Add `CustomerUser` Junction.
  - [x] Split crew assignment roles from `UserRole`.
- [x] Update `documentation/project/project-user-stories.md`
  - [x] Replace embedded contact capture wording.
  - [x] Align primary-contact language with `Customer.primaryContactId`.
- [x] Decide whether to update `documentation/domain/domain-archetypes.md`
  - [x] Refresh `USER_ROLES` examples because examples should stay canonical.
- [x] Correct or supersede the implementation note in the source design
  - [x] Clarify that `UserCreate` changes shape because it derives from `User`.
  - [x] Add missing affected documentation files found during verification.

## 2. Domain Internals — Model and Schema

- [x] Update `source/domain/abstractions/user.ts`
  - [x] Add `'customer'` to `USER_ROLES`.
  - [x] Move `CONTACT_PREFERRED_CHANNELS` and `ContactPreferredChannel` here.
  - [x] Add `preferredChannel`.
  - [x] Add `notes: CompositionMany<Note>`.
  - [x] Update file header and PUBLIC list.
- [x] Update `source/domain/abstractions/customer.ts`
  - [x] Remove `CONTACT_PREFERRED_CHANNELS`.
  - [x] Remove `ContactPreferredChannel`.
  - [x] Remove `Contact`.
  - [x] Remove `Customer.contacts`.
  - [x] Add `Customer.primaryContactId: AssociationOne<User>`.
  - [x] Add `CustomerUser` as pure-key Junction.
  - [x] Update file header and PUBLIC list.
- [x] Update job assignment role modeling
  - [x] Update `JobPlanAssignmentRole` const-enum for planned job crew functions.
  - [x] Use exactly: `'crew-lead'`, `'pilot'`, `'visual-observer'`, `'applicator'`, `'equipment-operator'`, and `'technician'`.
  - [x] Change `JobPlanAssignment.role` away from widened `UserRole`.
  - [x] Update `source/domain/validators/job-validator.ts` to validate against `JobPlanAssignmentRole`.
  - [x] Update `job_plan_assignments.role` schema CHECK to use crew assignment values.
- [x] Update `source/domain/protocols/customer-protocol.ts`
  - [x] Add `CustomerUserCreate`.
  - [x] Do not add update protocol for pure-key CustomerUser.
  - [x] Update file header and PUBLIC list.
- [x] Review `source/domain/protocols/user-protocol.ts`
  - [x] Confirm derived `UserCreate` and `UserUpdate` compile with new User shape.
  - [x] No wording update required.
- [x] Update `source/domain/validators/user-validator.ts`
  - [x] Validate `preferredChannel`.
  - [x] Validate `notes`.
  - [x] Import `isNote`.
  - [x] Add or update preferred-channel guard.
- [x] Update `source/domain/validators/customer-validator.ts`
  - [x] Remove `isContact`.
  - [x] Remove contact validation.
  - [x] Validate `primaryContactId`.
  - [x] Add `validateCustomerUserCreate`.
  - [x] Update file header and PUBLIC list.
- [x] Update `source/domain/adapters/user-adapter.ts`
  - [x] Map `preferredChannel` to `preferred_channel`.
  - [x] Map `notes` through `NoteAdapter`.
- [x] Update `source/domain/adapters/customer-adapter.ts`
  - [x] Remove `ContactAdapter`.
  - [x] Remove `contacts` mapping.
  - [x] Map `primaryContactId` to `primary_contact_id`.
  - [x] Add `CustomerUserAdapter`.
  - [x] Update file header and PUBLIC list.
- [x] Update `source/domain/schema/schema.sql`
  - [x] Add `users.preferred_channel`.
  - [x] Add `users.notes`.
  - [x] Add preferred-channel CHECK constraint.
  - [x] Keep user roles CHECK or JSONB role validation aligned with role model.
  - [x] Drop `customers.contacts`.
  - [x] Drop contacts JSONB constraints.
  - [x] Add `customers.primary_contact_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT`.
  - [x] Add `customers_primary_contact_id_idx`.
  - [x] Add `customer_contacts` pure-key junction table.
  - [x] Enable RLS on `customer_contacts`.
  - [x] Add select, insert, and delete policies only.
  - [x] Add FK indexes for `customer_contacts`.
  - [x] Update drop order.
- [x] Preserve application-supplied UUID v7 identity creation
  - [x] Ensure user creation supplies the UUID v7 from application code.
  - [x] Ensure the same UUID is used for both `auth.users.id` and `public.users.id`.
  - [x] Ensure any RDBMS trigger or RPC path receives the application-supplied UUID, not a database-generated UUID.
  - [x] Keep schema aligned with the invariant that the database does not generate domain IDs.
- [x] Decide API/client posture for `CustomerUser`
  - [x] Domain abstractions, protocols, validators, adapters, schema, and archetypes exist in this milestone.
  - [x] API/client exposure is deferred to Customer Onboarding.

## 3. Domain Internals — User Edge Functions

- [x] Update architecture before implementation
  - [x] Update `documentation/architecture/architecture-devops.md` for Supabase Edge as a server-side execution dimension.
  - [x] Document browser-to-edge invocation separately from edge-to-Supabase access.
  - [x] Document Supabase Edge runtime configuration and secret ownership.
  - [x] Confirm the concrete Supabase Edge config provider behavior before relying on it in user functions.
  - [x] Document service-key boundary: edge-only, never UX, only for privileged orchestration.
  - [x] Update `documentation/architecture/architecture-back.md` for user auth attribute synchronization.
  - [x] Clarify that the new work is attribute synchronization, not UUID synchronization.
  - [x] Clarify that user edge functions are authenticated user-invoked operations, not open endpoints.
- [x] Validate Supabase Edge runtime configuration path
  - [x] Confirm Supabase Edge functions read config through `Config` and `SupabaseProvider`.
  - [x] Reconcile backend edge env examples with the confirmed runtime names.
  - [x] Add `SUPABASE_SERVICE_KEY` or the approved service-key name only to backend edge configuration.
  - [x] Keep UX env/config free of service-role secrets.
  - [x] Run `deno task guard:env`.
- [ ] Add or update user mutation edge functions
  - [x] Add `user-create` edge function.
  - [x] Add `user-update` edge function.
  - [x] Add `user-delete` edge function.
  - [x] Add `user-eject` edge function.
  - [x] Keep edge functions flat under `source/back/supabase-edge/functions/`.
  - [x] Preserve the standard user-management API surface from UX.
- [x] Define user edge function contracts
  - [x] Confirm `user-create` creates `auth.users` and `public.users` consistently.
  - [x] Confirm `user-update` synchronizes Auth attributes with `public.users`.
  - [x] Confirm `user-delete` handles domain soft-delete behavior.
  - [x] Confirm `user-eject` revokes authentication access without silently destroying domain history.
  - [x] Confirm all user edge functions respect `public.users.id = auth.users.id`.
  - [x] Confirm all create/update paths preserve application-supplied UUID v7 identity without treating UUID sync as the new work.
  - [x] Confirm each function verifies the authenticated caller and checks administrator authorization before privileged work.
- [ ] Update supporting backend artifacts as needed
  - [ ] Add request/response protocol types if the existing contract is insufficient.
  - [x] Add validation at the edge-function boundary.
  - [x] Keep shared edge orchestration code outside the flat `functions/` deployable directory if needed.
  - [x] Update `makeAuthUsers()` so `api.Users` hides auth/domain synchronization details.
  - [x] Move login access check under `api.Users.hasAccess()`.
  - [x] Add `api.Users.eject()` to the returned user API contract.
  - [ ] Add focused tests for auth/domain consistency if test infrastructure exists.

## 4. Tests

- [x] Update `source/tests/fixtures/user-samples.ts`
  - [x] Add `preferredChannel`.
  - [x] Add `notes`.
  - [x] Avoid adding a customer-role sample until a test needs one.
- [x] Update `source/tests/fixtures/customer-samples.ts`
  - [x] Remove embedded contact sample data.
  - [x] Add `primaryContactId`.
  - [x] Add CustomerUser sample data for junction fixture coverage.
- [x] Update `source/tests/fixtures/samples.ts`
  - [x] Confirm wildcard exports already expose CustomerUser samples.
- [x] Update `source/tests/fixtures/fixtures-test.ts`
  - [x] Remove embedded contact assertions.
  - [x] Assert `primaryContactId` is a valid Id.
  - [x] Assert CustomerUser linkage without encoding the open primary-contact membership decision.
- [x] Update `source/tests/cases/users-api-test.ts`
  - [x] Add `preferredChannel` to `UserCreate`.
  - [x] Add `notes` to `UserCreate`.
  - [x] Assert returned user includes new fields.
- [ ] Add or update adapter round-trip coverage as needed
  - [ ] User new fields.
  - [ ] Customer `primaryContactId`.
  - [ ] CustomerUser adapter if included.
- [ ] Add role guard coverage if available
  - [ ] User accepts `'customer'`.
  - [ ] JobPlanAssignment accepts valid crew assignment roles.
  - [ ] JobPlanAssignment rejects user authorization roles.

## 5. UX

- [x] Update AbstractionManager overflow behavior
  - [x] Support editor panels whose fields exceed the available viewport height.
  - [x] Use a vertically scrollable form content region as the default overflow pattern.
  - [x] Keep form actions outside the scrolling region.
  - [x] Add optional field groups or fieldsets for visual breakpoints in long forms.
  - [x] Prefer grouped vertical scroll over tabs for the default long-form pattern.
  - [x] Avoid artificial tab segmentation unless a form has true conceptual sections.
  - [x] Ensure the pattern ports cleanly to mobile.
  - [x] Ensure validation and error states remain discoverable inside the scroll region.
- [x] Update `source/ux/app-admin/users/user-manager.tsx`
  - [x] Add state for `preferredChannel`.
  - [x] Add editable state for `notes`.
  - [x] Include `preferredChannel` in create and update payloads.
  - [x] Include `notes` in create and update payloads.
  - [x] Expose `'customer'` in role selection because this is User Management.
  - [x] Group fields for long-form scanning, likely Identity, Contact Preferences, Notes, Roles, and Status.
- [x] Complete UX verification repairs
  - [x] Use `UiMultiSelect` for User roles.
  - [x] Add form-contained `UiSingleSelect` style-guide regression coverage for controlled and default values.
  - [x] Prevent `UiSingleSelect` trigger clicks from submitting parent forms.
  - [x] Layer `UiSingleSelect` content above dialogs.
  - [x] Make `UiDialog` explicitly modal.
  - [x] Prevent click-away close while preserving Escape and close-button behavior.
  - [x] Wire `AbstractionManager` Cancel to provider cancel behavior.
  - [x] Preserve the mobile back arrow as list navigation.
  - [x] Keep workbench dialog overflow visible so action labels and popups are not clipped.
  - [x] Add `UiActionButton labelMode='visible'` for labeled command chrome.
  - [x] Use visible-label `UiActionButton` for AbstractionManager Cancel, New, and Save actions.
  - [x] Update UX component documentation for `UiActionButton labelMode`.
  - [x] Keep AbstractionManager command styling on shared UI primitives instead of shell-local icon masks.
  - [x] Make fieldset backgrounds transparent for long-form grouping.
  - [x] Add app icon links to Admin, Ops, and Customer HTML entrypoints.
- [x] Keep customer app UX out of scope
  - [x] No onboarding wizard changes.
  - [x] No customer dashboard access workflow changes.
  - [x] No RLS/customer portal policy work.
- [x] Complete shell chrome and UX metaphor cleanup
  - [x] Add the flat swarmAg logo to the dashboard header.
  - [x] Preserve the existing dashboard header height and padding rhythm.
  - [x] Keep dashboard header widgets distributed across the remaining inline row after the logo.
  - [x] Make light-mode shell header and footer chrome use a light surface again.
  - [x] Keep dark-mode shell chrome behavior intact.
  - [x] Replace the footer's hardcoded mono logo filter with theme-owned `--sa-footer-logo-filter`.
  - [x] Document `--sa-footer-*` as a component-specified token family.
  - [x] Remove `Content` as a named shell primitive.
  - [x] Preserve semantic `main` landmarks in authenticated routes.
  - [x] Update UX architecture to name the real UX metaphors: Dashboard, Widget, Abstraction Manager, Workflow Manager, and Custom Full Device.

## 6. Verification

- [x] Run `deno task check:domain-genesis`.
- [ ] Run `deno task test`.
  - [x] Fixture integrity tests passed.
  - [ ] Full task remains blocked by missing Supabase test config:
        `SUPABASE_RDBMS_URL`, `SUPABASE_PUBLIC_KEY`, `SUPABASE_CLIENT_MODE`.
- [x] Run `deno task check`.
- [ ] Run `deno task db-genesis-verify --target {target}` when an environment is available.
- [x] Report all checks, failures fixed, failures remaining, and explicit out-of-scope work.
- [x] Verify shell chrome and UX metaphor cleanup.
  - [x] Run `deno task guard:css`.
  - [x] Run targeted `deno check` for changed shell/footer TypeScript files.
  - [x] Run `deno task check`.
  - [x] Format changed UX architecture/component documentation with `dprint`.
- [ ] Complete from-scratch genesis and app deployment verification.
  - [ ] Review `documentation/architecture/architecture-devops.md` before running any deployment or target mutation.
  - [ ] Deploy a fresh genesis schema to an approved target environment.
  - [ ] Run `deno task db-genesis-verify --target {target}` against that environment.
  - [ ] Validate app configuration and secrets for Admin, Ops, and Customer.
  - [ ] Build or deploy Admin, Ops, and Customer against the genesis target.
  - [ ] Smoke the deployed or stage-bound apps.

## 7. Open Decisions

- [ ] Confirm whether `Customer.primaryContactId` must also have a matching row in `customer_contacts`.
- [x] Confirm whether `CustomerUser` needs an API client in this milestone.
  - Deferred to Customer Onboarding.
