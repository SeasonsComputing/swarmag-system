# User / Contact / Customer Refactor — UX Handoff

**Date:** 2026-06-29
**Mode:** Foundation
**Purpose:** New-session handoff after completing the approved UX scope and UX verification repairs for the User / Contact / Customer refactor.

## 1. Governing Context

- Invariants: `AGENTS.md`
- Required session context:
  - Base context
  - Domain Internals
  - UX Internals
  - Application Features
- Approved design: `documentation/project/2026-06-28-user-contact-customer-design.md`
- Working checklist: `documentation/project/2026-06-28-user-contact-customer-tasks.md`
- Prior handoff: `documentation/project/2026-06-29A-user-contact-customer-handoff.md`

The active work remained Foundation work because it touched shared UX form behavior,
domain-backed User contracts, common UI primitives, and verification fixtures still
blocked by the domain-model change.

## 2. Settled Decisions

- Domain Internals scope #2 is complete.
- User edge functions remain deferred until UX is in place:
  - `user-update`
  - `user-delete`
  - `user-eject`
- Customer app onboarding is out of this UX scope.
- `CustomerContact` domain artifacts exist in this milestone.
- `CustomerContact` API/client exposure is deferred to Customer Onboarding.
- `Customer.primaryContactId` membership in `customer_contacts` remains an open decision.
- User role selection in User Management is multi-select.
- User Management Cancel closes the edit/create dialog.
- The mobile back arrow remains list navigation.
- Dialog click-away close is disabled. Escape and explicit close controls remain normal close paths.
- `UiActionButton` owns visible command-label presentation through `labelMode='visible'`.
- AbstractionForm uses `UiActionButton labelMode='visible'` for Cancel, New, and Save.

## 3. Completed Work In This Session

### Task List

Updated:

- `documentation/project/2026-06-28-user-contact-customer-tasks.md`
- `documentation/ux/ux-components-guide.md`
- `documentation/ux/ux-components-guide-lite.md`

Recorded:

- Domain Internals #2 as complete.
- `CustomerContact` API/client exposure as deferred to Customer Onboarding.
- UX #5 as complete.
- Additional UX verification repairs completed during implementation.
- `UiActionButton labelMode='visible'` as a shared UI primitive capability.

### User Management UX

Updated:

- `source/ux/app-admin/users/users-form.tsx`

Implemented:

- Added `preferredChannel` state.
- Added editable notes state.
- Included `preferredChannel` in create and update payloads.
- Included `notes` in create and update payloads.
- Converted role controls to `UiMultiSelect`.
- Included the `'customer'` role in User Management.
- Grouped long-form content with fieldsets.
- Wired the provider `cancel` handler so the form Cancel button closes the dialog.

### Shared Form Shell

Updated:

- `source/ux/common/shell/abstraction-form-contract.ts`
- `source/ux/common/shell/abstraction-form.tsx`
- `source/ux/common/shell/abstraction-form.css`

Implemented:

- Added optional provider-level `cancel`.
- Separated Cancel behavior from mobile back-arrow list navigation.
- Kept form actions stable outside the scrolling form body.
- Restored a desktop-sized workbench with bounded height.
- Preserved full-height collapsed/mobile behavior.
- Kept popover clipping clear by allowing the outer form card to overflow visibly.
- Moved Cancel to the top AbstractionForm title row.
- Kept Save in the editor panel header.
- Used visible-label `UiActionButton` for Cancel, New, and Save command chrome.
- Preserved the mobile back-to-list action as icon button plus divider.

### Shared UI Primitives

Updated:

- `source/ux/common/components/ui/ui-action-button.tsx`
- `source/ux/common/components/css/themes.css`
- `source/ux/common/components/ui/ui-single-select.tsx`
- `source/ux/common/components/ui/ui-dialog.tsx`
- `source/ux/common/components/css/ui.css`

Implemented:

- Added `UiActionButton labelMode='visible'`.
- Documented and styled visible-label action buttons as one hit target: label, divider, icon.
- Kept default `UiActionButton` reveal behavior unchanged.
- Set `UiSingleSelect` trigger `type='button'` so it does not submit parent forms.
- Raised single-select content above modal dialogs.
- Made `UiDialog` explicitly modal.
- Set workbench dialog overflow to visible so action labels and popups are not clipped.
- Prevented pointer-down outside from closing dialogs.
- Preserved Escape close behavior.
- Made fieldset backgrounds transparent for long-form grouping.

### Style Guide Regression Coverage

Updated:

- `source/ux/app-style-guide/style-guide.tsx`

Implemented:

- Added a real form-contained `UiSingleSelect` regression specimen.
- Covered controlled value plus placeholder.
- Covered default value plus placeholder.
- Confirmed default value takes precedence over placeholder.
- Included a submit button to catch accidental submit-trigger behavior.

### App Icon Fix

Updated:

- `source/ux/app-admin/index.html`
- `source/ux/app-ops/index.html`
- `source/ux/app-customer/index.html`

Implemented:

- Added PNG favicon and Apple touch icon links to avoid the implicit missing `/favicon.ico` request.

## 4. Checks Run

Passed:

- `deno task check:domain-genesis`
- `deno task check:lint`
- `deno task guard:bare-html`
- `deno task guard:css`
- `deno task guard:env`
- `dprint fmt documentation/ux/ux-components-guide.md documentation/ux/ux-components-guide-lite.md`
- `dprint fmt documentation/project/2026-06-28-user-contact-customer-tasks.md documentation/project/2026-06-29A-user-contact-customer-handoff.md`
- Targeted `deno check` for changed UX TypeScript/TSX files.
- Targeted `deno lint` for changed UX TypeScript/TSX files.

Failed as expected until Tests scope #4 is completed:

- `deno task check:types`

Remaining type failures are in downstream tests and fixtures:

- `source/tests/cases/users-api-test.ts`
- `source/tests/fixtures/customer-samples.ts`
- `source/tests/fixtures/fixtures-test.ts`
- `source/tests/fixtures/user-samples.ts`

Expected fixes:

- Add `notes` and `preferredChannel` to user samples and user API create payloads.
- Remove embedded customer contact fixture data.
- Add `primaryContactId` to customer fixture data.
- Add CustomerContact fixture coverage if junction fixtures are included.
- Replace embedded-contact assertions with `primaryContactId` and optional CustomerContact linkage assertions.

## 5. Subagent Notes For Tests Scope #4

A read-only subagent review produced this recommended test scope:

- `source/tests/fixtures/user-samples.ts`
  - Add `notes: []` and `preferredChannel` to all existing user samples.
  - Avoid adding a customer-role fixture unless explicitly needed.
- `source/tests/fixtures/customer-samples.ts`
  - Remove embedded `contacts`.
  - Add required `primaryContactId`.
  - Add standalone `customerContactSamples` if junction fixture coverage is desired.
- `source/tests/fixtures/samples.ts`
  - No change is required if wildcard exports already carry added samples.
- `source/tests/fixtures/fixtures-test.ts`
  - Remove `customer.contacts` assertions.
  - Assert `customer.primaryContactId` is a valid Id.
  - Assert CustomerContact sample keys are valid if samples are added.
  - Do not assert `primaryContactId` must also appear in `customer_contacts`.
- `source/tests/cases/users-api-test.ts`
  - Add `notes` and `preferredChannel` to `UserCreate`.
  - Assert returned users include the new fields.

Recommended checks after Tests scope #4:

- `deno task test`
- `deno task check`
- `deno task check:domain-genesis`

## 6. Current Expected Git State

Modified files from this UX session:

- `documentation/project/2026-06-28-user-contact-customer-tasks.md`
- `documentation/ux/ux-components-guide.md`
- `documentation/ux/ux-components-guide-lite.md`
- `source/ux/app-admin/index.html`
- `source/ux/app-admin/users/users-form.tsx`
- `source/ux/app-customer/index.html`
- `source/ux/app-ops/index.html`
- `source/ux/app-style-guide/style-guide.tsx`
- `source/ux/common/components/css/themes.css`
- `source/ux/common/components/css/ui.css`
- `source/ux/common/components/ui/ui-action-button.tsx`
- `source/ux/common/components/ui/ui-dialog.tsx`
- `source/ux/common/components/ui/ui-single-select.tsx`
- `source/ux/common/shell/abstraction-form-contract.ts`
- `source/ux/common/shell/abstraction-form.css`
- `source/ux/common/shell/abstraction-form.tsx`

New file from this handoff:

- `documentation/project/2026-06-29A-user-contact-customer-handoff.md`

There may also be staged files from the earlier Domain Internals scope. Inspect
`git status --short` before committing or staging.

## 7. Next Recommended Scope

### Tests and Fixtures

Operating mode: Foundation.

Update:

- `source/tests/fixtures/user-samples.ts`
- `source/tests/fixtures/customer-samples.ts`
- `source/tests/fixtures/samples.ts` if CustomerContact samples are added explicitly.
- `source/tests/fixtures/fixtures-test.ts`
- `source/tests/cases/users-api-test.ts`

Do not expand into user edge functions or Customer Onboarding inside this scope.

### Deferred Scope

- `user-update`
- `user-delete`
- `user-eject`
- Customer app onboarding
- CustomerContact API/client exposure
- RLS/customer portal policy work

## 8. Cautions For Next Agent

- Do not rename `JobPlanAssignmentRole`.
- Do not reintroduce embedded `Contact`.
- Do not move auth/public user synchronization mechanics into `domain-model.md`.
- Do not add CustomerContact API/client exposure before Customer Onboarding scope.
- Do not encode the open `Customer.primaryContactId` plus `customer_contacts` membership decision in tests.
- Preserve `UiSingleSelect` trigger `type='button'`; the default button type submits parent forms.
- Preserve dialog modal behavior and disabled click-away close.
- Preserve workbench dialog `overflow: visible`; otherwise visible action labels and popups get clipped.
- Preserve `UiActionButton labelMode='visible'` as the shared primitive path for labeled command actions.
- Preserve the distinction between Cancel and mobile back-arrow navigation.
- Expect full repo typecheck to fail until Tests scope #4 is completed.
