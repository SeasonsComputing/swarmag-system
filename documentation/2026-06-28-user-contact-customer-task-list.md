# User / Contact / Customer Refactor — Task List

**Date:** 2026-06-28
**Mode:** Foundation
**Status:** Planning checklist
**Source design:** `documentation/2026-06-28-user-contact-customer-design.md`

This task list decomposes the approved design into implementation workstreams.
It is a planning aid, not a replacement for the approved design or governing
domain documentation.

## 1. Docs

- [x] Update `documentation/domain-model.md`
  - [x] Update User semantics for customer access, preferred channel, and notes.
  - [x] Update Customer semantics from embedded contacts to primary contact FK.
  - [x] Replace Contact with CustomerContact as a pure-key Junction.
- [x] Update `documentation/architecture-back.md`
  - [x] Add Auth / Domain User Boundary section.
  - [x] State that there is one domain `User`.
  - [x] Explain that `auth.users` is the authentication principal and Supabase security anchor.
  - [x] Explain that `public.users` is the domain user record queried and related by the application.
  - [x] State that `auth.users.id` and `public.users.id` intentionally share the same application-supplied UUID v7.
  - [x] Explain that the parallel structure avoids a translation layer while preserving auth/RLS alignment.
  - [x] State that backend user create, update, delete, and eject paths must maintain the invariant.
  - [x] State that the database must not generate the domain user ID.
- [x] Update `documentation/domain-data-dictionary.md`
  - [x] Move `ContactPreferredChannel` into Users.
  - [x] Add `preferredChannel` and `notes` to User.
  - [x] Add `'customer'` to `UserRole`.
  - [x] Document `public.users.id` as the domain user identifier.
  - [x] Document synchronization with `auth.users.id` as a solution-space invariant.
  - [x] Document that the shared UUID is application-supplied UUID v7.
  - [x] Remove Contact from Customers.
  - [x] Add `Customer.primaryContactId`.
  - [x] Add `CustomerContact` Junction.
  - [x] Split crew assignment roles from `UserRole`.
- [x] Update `documentation/user-stories.md`
  - [x] Replace embedded contact capture wording.
  - [x] Align primary-contact language with `Customer.primaryContactId`.
- [x] Decide whether to update `documentation/domain-archetypes.md`
  - [x] Refresh `USER_ROLES` examples because examples should stay canonical.
- [x] Correct or supersede the implementation note in the source design
  - [x] Clarify that `UserCreate` changes shape because it derives from `User`.
  - [x] Add missing affected documentation files found during verification.

## 2. Domain Internals — Model and Schema

- [ ] Update `source/domain/abstractions/user.ts`
  - [ ] Add `'customer'` to `USER_ROLES`.
  - [ ] Move `CONTACT_PREFERRED_CHANNELS` and `ContactPreferredChannel` here.
  - [ ] Add `preferredChannel`.
  - [ ] Add `notes: CompositionMany<Note>`.
  - [ ] Update file header and PUBLIC list.
- [ ] Update `source/domain/abstractions/customer.ts`
  - [ ] Remove `CONTACT_PREFERRED_CHANNELS`.
  - [ ] Remove `ContactPreferredChannel`.
  - [ ] Remove `Contact`.
  - [ ] Remove `Customer.contacts`.
  - [ ] Add `Customer.primaryContactId: AssociationOne<User>`.
  - [ ] Add `CustomerContact` as pure-key Junction.
  - [ ] Update file header and PUBLIC list.
- [ ] Update job assignment role modeling
  - [ ] Update `JobPlanAssignmentRole` const-enum for planned job crew functions.
  - [ ] Use exactly: `'crew-lead'`, `'pilot'`, `'visual-observer'`, `'applicator'`, `'equipment-operator'`, and `'technician'`.
  - [ ] Change `JobPlanAssignment.role` away from widened `UserRole`.
  - [ ] Update `source/domain/validators/job-validator.ts` to validate against `JobPlanAssignmentRole`.
  - [ ] Update `job_plan_assignments.role` schema CHECK to use crew assignment values.
- [ ] Update `source/domain/protocols/customer-protocol.ts`
  - [ ] Add `CustomerContactCreate`.
  - [ ] Do not add update protocol for pure-key CustomerContact.
  - [ ] Update file header and PUBLIC list.
- [ ] Review `source/domain/protocols/user-protocol.ts`
  - [ ] Confirm derived `UserCreate` and `UserUpdate` compile with new User shape.
  - [ ] Update wording if header or comments imply no shape impact.
- [ ] Update `source/domain/validators/user-validator.ts`
  - [ ] Validate `preferredChannel`.
  - [ ] Validate `notes`.
  - [ ] Import `isNote`.
  - [ ] Add or update preferred-channel guard.
- [ ] Update `source/domain/validators/customer-validator.ts`
  - [ ] Remove `isContact`.
  - [ ] Remove contact validation.
  - [ ] Validate `primaryContactId`.
  - [ ] Add `validateCustomerContactCreate`.
  - [ ] Update file header and PUBLIC list.
- [ ] Update `source/domain/adapters/user-adapter.ts`
  - [ ] Map `preferredChannel` to `preferred_channel`.
  - [ ] Map `notes` through `NoteAdapter`.
- [ ] Update `source/domain/adapters/customer-adapter.ts`
  - [ ] Remove `ContactAdapter`.
  - [ ] Remove `contacts` mapping.
  - [ ] Map `primaryContactId` to `primary_contact_id`.
  - [ ] Add `CustomerContactAdapter`.
  - [ ] Update file header and PUBLIC list.
- [ ] Update `source/domain/schema/schema.sql`
  - [ ] Add `users.preferred_channel`.
  - [ ] Add `users.notes`.
  - [ ] Add preferred-channel CHECK constraint.
  - [ ] Keep user roles CHECK or JSONB role validation aligned with role model.
  - [ ] Drop `customers.contacts`.
  - [ ] Drop contacts JSONB constraints.
  - [ ] Add `customers.primary_contact_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT`.
  - [ ] Add `customers_primary_contact_id_idx`.
  - [ ] Add `customer_contacts` pure-key junction table.
  - [ ] Enable RLS on `customer_contacts`.
  - [ ] Add select, insert, and delete policies only.
  - [ ] Add FK indexes for `customer_contacts`.
  - [ ] Update drop order.
- [ ] Preserve application-supplied UUID v7 identity creation
  - [ ] Ensure user creation supplies the UUID v7 from application code.
  - [ ] Ensure the same UUID is used for both `auth.users.id` and `public.users.id`.
  - [ ] Ensure any RDBMS trigger or RPC path receives the application-supplied UUID, not a database-generated UUID.
  - [ ] Keep schema aligned with the invariant that the database does not generate domain IDs.
- [ ] Decide API/client posture for `CustomerContact`
  - [ ] No API exposure in this milestone, or
  - [ ] Add an explicit junction client/API pattern under approved Foundation scope.

## 3. Domain Internals — User Edge Functions

- [ ] Add or update user mutation edge functions
  - [ ] Add `user-update` edge function.
  - [ ] Add `user-delete` edge function.
  - [ ] Add `user-eject` edge function.
  - [ ] Keep edge functions flat under `source/back/supabase-edge/functions/`.
  - [ ] Preserve the standard user-management API surface from UX.
- [ ] Define user edge function contracts
  - [ ] Confirm `user-update` updates `auth.users` and `public.users` consistently.
  - [ ] Confirm `user-delete` handles domain soft-delete behavior.
  - [ ] Confirm `user-eject` revokes authentication access without silently destroying domain history.
  - [ ] Confirm all user edge functions respect `public.users.id = auth.users.id`.
  - [ ] Confirm all create/update paths preserve application-supplied UUID v7 identity.
- [ ] Update supporting backend artifacts as needed
  - [ ] Add request/response protocol types if the existing contract is insufficient.
  - [ ] Add validation at the edge-function boundary.
  - [ ] Add or update API client wiring only inside an approved scope.
  - [ ] Add focused tests for auth/domain consistency if test infrastructure exists.

## 4. Tests

- [ ] Update `source/tests/fixtures/user-samples.ts`
  - [ ] Add `preferredChannel`.
  - [ ] Add `notes`.
  - [ ] Add or avoid a customer-role sample by explicit decision.
- [ ] Update `source/tests/fixtures/customer-samples.ts`
  - [ ] Remove embedded contact sample data.
  - [ ] Add `primaryContactId`.
  - [ ] Add CustomerContact sample data if fixtures cover junctions.
- [ ] Update `source/tests/fixtures/samples.ts`
  - [ ] Export CustomerContact samples if added.
- [ ] Update `source/tests/fixtures/fixtures-test.ts`
  - [ ] Remove embedded contact assertions.
  - [ ] Assert `primaryContactId` is a valid Id.
  - [ ] Assert CustomerContact linkage if samples are added.
- [ ] Update `source/tests/cases/users-api-test.ts`
  - [ ] Add `preferredChannel` to `UserCreate`.
  - [ ] Add `notes` to `UserCreate`.
  - [ ] Assert returned user includes new fields.
- [ ] Add or update adapter round-trip coverage as needed
  - [ ] User new fields.
  - [ ] Customer `primaryContactId`.
  - [ ] CustomerContact adapter if included.
- [ ] Add role guard coverage if available
  - [ ] User accepts `'customer'`.
  - [ ] JobPlanAssignment accepts valid crew assignment roles.
  - [ ] JobPlanAssignment rejects user authorization roles.

## 5. UX

- [ ] Update AbstractionForm overflow behavior
  - [ ] Support editor panels whose fields exceed the available viewport height.
  - [ ] Use a vertically scrollable form content region as the default overflow pattern.
  - [ ] Keep form actions outside the scrolling region.
  - [ ] Add optional field groups or fieldsets for visual breakpoints in long forms.
  - [ ] Prefer grouped vertical scroll over tabs for the default long-form pattern.
  - [ ] Avoid artificial tab segmentation unless a form has true conceptual sections.
  - [ ] Ensure the pattern ports cleanly to mobile.
  - [ ] Ensure validation and error states remain discoverable inside the scroll region.
- [ ] Update `source/ux/app-admin/users/users-form.tsx`
  - [ ] Add state for `preferredChannel`.
  - [ ] Add editable state for `notes`.
  - [ ] Include `preferredChannel` in create and update payloads.
  - [ ] Include `notes` in create and update payloads.
  - [ ] Expose `'customer'` in role checkboxes because this is User Management.
  - [ ] Group fields for long-form scanning, likely Identity, Contact Preferences, Notes, Roles, and Status.
- [ ] Keep customer app UX out of scope
  - [ ] No onboarding wizard changes.
  - [ ] No customer dashboard access workflow changes.
  - [ ] No RLS/customer portal policy work.

## 6. Verification

- [ ] Run `deno task check:domain-genesis`.
- [ ] Run `deno task test`.
- [ ] Run `deno task check`.
- [ ] Run `deno task db-genesis-verify --target {target}` when an environment is available.
- [ ] Report all checks, failures fixed, failures remaining, and explicit out-of-scope work.

## 7. Open Decisions

- [ ] Confirm whether `Customer.primaryContactId` must also have a matching row in `customer_contacts`.
- [ ] Confirm whether `CustomerContact` needs an API client in this milestone.
