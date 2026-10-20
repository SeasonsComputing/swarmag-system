# Access Model — Brief

**Backlog, not dispatched.** Recorded 2026-10-10 from a CA + AI Architect session. A design record
of the first release's access model: which apps a role may enter, what an app is about, and where
rules are enforced. It is decided but not scheduled; its productions are written when the roadmap
reaches them. The account manager work that surfaced it is
`effort/completed/2026-10-08-account-manager-brief.md`; portal isolation is designed in
`effort/pending/2026-10-08-customer-portal-brief.md`.

## What triggered it

Reviewing the account manager brief, the CA proposed finer rules for the User picker and for
Customer deletion by role. That exposed that the system has no notion of access beyond being an
active user.

## What the repository holds

- **Login** checks only that the email belongs to an active, undeleted User (`user_has_access`,
  through `api.Users.hasAccess`). It does not consider roles or which app is being entered, so any
  active User can enter any app.
- **RLS write policies** are `_all` on every table (`customers_insert_all`, `customers_update_all`,
  `customers_delete_all`, and so on). Any authenticated User may write anything.
- **User writes** are the exception: the `user-create`, `user-update`, and `user-eject` edge
  functions authorize through `UserOrchestra.authorizeAdmin`, and RLS grants `users` writes to no
  direct caller.
- **`SessionState`** holds identity and readiness only. The session coordinator validates the User
  and keeps only its id; no UX module knows the session User's roles.
- **Routes** are per app. `app-admin/app.tsx` declares `/onboarding`, `/users`, and `/customers` for
  everyone who enters Admin.
- **`USER_ROLES`:** `administrator`, `sales`, `operations`, `customer`.

## Decisions (CA, 2026-10-10)

### Entry and enforcement

1. **App entry is gated by role.** A User enters an app only if they hold a role that app admits.
   Admin admits `administrator`. Ops admits `operations` and `sales`. The Portal admits `customer`.
2. **Inside an app, its roles are trusted equally.** Each role's dashboard widgets shape what it is
   offered. Routes are not guarded by role: any route in an app is reachable by anyone who entered
   it.
3. **RLS is the only enforcement,** keyed on roles. It is locked down as it was always planned:
   the pattern is established once, then each table is locked down as its feature is designed.
4. **Access rules are centralized** in an app-tier capability module conforming to the Reactive
   Store Module Pattern (`architecture-front.md` §8.3). Features ask it what the session User may
   do; they do not test role names.

### Roles

5. **Roles carry authority or function.** `administrator` is authority: RLS and the edge functions
   check it. `sales` and `operations` are function: they decide who a User picker lists and which
   widgets a dashboard offers.
6. **Sales Users also hold `administrator`** until `app-leads` exists. A sales User created
   without it cannot enter Admin, so the omission is evident at first login.
7. **`app-leads` becomes the sales application.** When it ships, sales Users leave the
   administrator role.

### Subjects

8. **Each app has a subject,** what its dashboard is about.

   | App    | Subject      | Bound by                    |
   | ------ | ------------ | --------------------------- |
   | Admin  | the business | the `administrator` role    |
   | Ops    | Jobs         | crew assignment on the plan |
   | Portal | a Customer   | the `CustomerUser` junction |

9. **An ordinary User's subject comes from their relationships:** crew see the Jobs they are
   assigned to; a portal User sees the Customers they are linked to.
10. **`administrator` and `sales` may choose a subject.** Choosing is a capability, not the
    `administrator` role, so it survives the `app-leads` transition. An administrator may choose
    any Customer in the Portal and any subject in Ops. A sales User's Ops subjects are the Jobs of
    Customers they are account manager for.
11. **Choosing happens in a `SubjectWidget`** in the dashboard header. It names the current
    subject; the whole dashboard narrows to that one subject; the choice is remembered per app.
    A User with a single fixed subject is offered no choice.
12. **Work records stamp the session User.** Whoever performs the work is logged, whatever the
    subject (backlog: "Job work records stamp the session user"). Anyone who chose a Job may run
    it.
13. **Starting Job Work is an office feature.** It transitions the Job to `executing` and finalizes
    the manifest. It lives in `front/app/shell/` so that Admin uses it now and `app-leads` later.
    Ops runs only Jobs already started.

## Reasoning trail

- **UI shaping versus RLS was a false choice.** The AI Architect first asked whether rules would be
  enforced in RLS or applied only in the UI. The CA's position: a UX that adapts to the session
  User's roles is ordinary practice, and RLS enforces the same rules. Both, not either.
- **`architecture-front.md` §9.1.2 was traced to its origin** (`be0010c`, 2026-03-14): it keeps
  authorization decided in one place, the database. The model keeps that intent; the UX adapts to
  rules it never enforces.
- **Route guards by role were proposed and rejected.** The AI Architect noted that a sales User in
  Admin can reach `/users` by URL. That is by design: everyone an app admits is trusted equally, so
  a route guard protects nothing.
- **Linking oneself was corrected to choosing a subject.** The AI Architect proposed that staff use
  Ops and the Portal by linking themselves through the real relationships. The CA's intent is that
  `administrator` and `sales` choose a subject without being linked.
- **Separating basis Workflows from job clones in RLS is unnecessary** while sales Users hold
  `administrator`: the office needs one check.

## Documentation the productions amend

- **`architecture-front.md`:** §6 (the app suite's users become its admitted roles), §9.1.2 (the
  only authorization check in the UX layer), §9.3.2 (app entry at login), §9.4 (where the session
  User's roles live), §10.3 (`SubjectWidget` and per-role widgets).
- **`architecture-back.md` §4.3:** the RLS pattern. Its example keys on `auth.jwt() ->> 'role'`,
  which in Supabase is the Postgres role, and roles live in `users.roles`.
- **`architecture-core.md` §5.5:** its example policy names a `job_logs` table and a
  `created_by_id` column that the schema does not have, and its name does not follow
  `CONVENTIONS.md` §11.8.
- **`domain-model.md` §3.5:** User is "role membership, and application access"; the model derives
  application access from roles.

## Open

- How roles shape each app's dashboard seed: a seed per role, or widgets that declare a required
  capability.
- Who performs onsite assessment and job planning.
- The `SubjectWidget`'s detailed design, including Ops: whether choosing selects a Job or a crew
  member's Jobs.

_End of Brief_
