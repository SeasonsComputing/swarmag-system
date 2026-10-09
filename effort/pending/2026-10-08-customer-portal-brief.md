# Customer Portal — Brief

**Backlog, not dispatched.** Recorded 2026-10-08 from a CA + AI Architect session. An outline for
the portal's milestone, not a design: its details are written when the roadmap reaches it. It
carries roadmap §1's open item "Additional-contact assignment" (`project-user-stories.md` §1.1,
story 4), which is portal users. The same session's account-manager work is
`effort/active/2026-10-08-account-manager-brief.md`.

## What the repository holds

- **`CustomerUser`:** a junction (`customerId`, `userId`) with `CustomerUserAdapter` and a
  `customer_users` table (RLS select, insert, delete, all `true`). There is no `api` surface and no
  UI.
- **`USER_ROLES`** includes `customer`. `user-create` creates the sign-in identity with the domain
  User's `id`, so `auth.uid()` equals `users.id`.
- **Every User write** (`user-create`, `user-update`, `user-delete`, `user-eject`) is behind
  `UserOrchestra.authorizeAdmin`: only an active administrator.
- **Job tables reach their Customer** through `jobs.customer_id`; `job_assessments`,
  `job_workflows`, `job_plans`, `job_work`, and `job_work_log_entries` through `job_id`; the
  `job_plan_*` tables through `plan_id`.
- **RLS today** has no policy referencing `auth.uid()`; nearly all are `USING (true)` or
  `WITH CHECK (true)`.
- `front/app-customer` has a slot; the dashboard and widget system is `ux/shell/dashboard/`.

## The portal (CA, 2026-10-08)

- **First release, read only:** a dashboard of customer-oriented widgets, and a report page with
  maps by site. Portal users never write, so their RLS needs only `SELECT`; widgets read through
  the ordinary `api`, and RLS narrows the rows.
- **Isolation by RLS,** from the user to their Customers: `customer_users` is many-to-many, so a
  Customer may have several portal users and a portal user several Customers. Each customer- and
  job-reaching table gains a staff branch and a portal branch:

  ```sql
  -- the current user's Customers
  my_customer_ids() → SELECT customer_id FROM customer_users WHERE user_id = auth.uid()

  customers:      id IN (SELECT my_customer_ids())
  jobs:           customer_id IN (SELECT my_customer_ids())
  job_* (by job): job_id IN (SELECT id FROM jobs WHERE customer_id IN (SELECT my_customer_ids()))
  job_plan_*:     plan_id IN (SELECT id FROM job_plans WHERE job_id IN (…the jobs above…))
  ```

- **RLS is row-level.** Notes and sites live inside the Customer row, so a portal user who sees the
  row sees its `internal` notes too. Showing only `shared` notes needs a view or function, or notes
  in their own table. A release that shows no notes can defer it.
- **Someday:** self-service account fields (phone and the like), through a function that accepts
  only those fields; and customer requests (follow-ups, sprays, messages), parked as the Request
  model in `project-parking-lot.md`.

## Portal users

- **Presentation:** Customer Users are **Portal users**, an Index-Detail list with drill-down in
  its own Customer step after Primary contact: Detail, Primary contact, Portal users, Billing,
  Sites.
- **Who grants access:** staff, not customers. Typically the primary contact becomes a portal user
  once the job is booked, on a request to a back-office person ("can you give Sara customer portal
  access?").

## Open

1. **Granting portal access creates a User, and only administrators may.** Granting access is two
   operations with different authority: creating the User (administrator only) and assigning it to
   the Customer (a `CustomerUser` row). A Portal users step that creates Users would offer
   non-administrators an operation the server refuses. Options:
   - **(a) Assignment only** in Customer Manager; administrators create customer Users in User
     Manager. No boundary change.
   - **(b) Delegated creation:** `sales` may create `customer`-role Users only. Loosens an
     authorization boundary; a Foundation decision.
   - **(c) A tracked request:** the rep records a portal-access request; an administrator fulfills
     it. A first use of the parked Request model.
2. **What a Portal user's drill-down holds,** given Open 1, and what unassigning does (the User
   survives).
3. **Lifecycle:** what happens to access when the job ends, the Customer goes inactive, or the
   person leaves.
4. **An `api` surface for `CustomerUser`,** and whether a junction write rides the Customer's
   aggregate commit or is written separately.
5. **Five steps overflow the Wizard's horizontal progress bar** (`PanelSequenceProgress`). A UI
   matter, settled during production when it appears (CA). Step labels cannot wrap, so the
   candidates are shrinking them, scrolling the bar horizontally, or truncating labels with an
   ellipsis. The control is shared in `ux/shell/panel/`, so one change serves every Wizard.
6. **Roadmap placement.** No roadmap section builds `app-customer`. Roadmap §1 says
   additional-contact assignment is "built before §5, or moved to a later milestone"; this brief is
   that later milestone once it has a slot.

_End of Brief_
