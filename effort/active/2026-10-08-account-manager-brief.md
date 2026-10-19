# Account Manager & User Picker — Brief

**Active.** Recorded 2026-10-08 from a CA + AI Architect session, while reconciling roadmap §1
after the Notes Editor milestone shipped. The same session's portal design was split out to
`effort/pending/2026-10-08-customer-portal-brief.md`. Chosen 2026-10-08 to be built before roadmap
§5. Reviewed 2026-10-10/11 by the CA and AI Architect and refreshed 2026-10-13 (see Design
history); its prerequisite shipped 2026-10-18, and it awaits AI Coding Engine review and the
production gate.

## What triggered it

Roadmap §1's open item, additional-contact assignment, led the CA to describe how people are named
on records. The account manager belongs with the Customers work and is useful as soon as it ships;
portal users belong with the Customer Portal.

## The workflow (CA, 2026-10-08)

1. A back-office person monitors the inbound lead channels, prunes them, and hands a sales rep a
   list.
2. The sales rep calls the lead and launches Onboarding, setting themself as the account manager.
3. If the account's sales rep changes, Customer Manager is used to change the account manager.

The same pattern holds wherever a person is named on a record: **the person creating it sets
themself, so the default is the session user**, changeable through a picker.

## What the repository holds

- **`Customer.accountManagerId`:** `AssociationOptional<User>`. `scopes.Customers.detail` excludes
  it and declares `{ accountManagerId: undefined }` as its create default; nothing sets it.
- **`USER_ROLES`:** `administrator`, `sales`, `operations`, `customer`.
- **`createCustomerState(customer)`** seeds both Onboarding and Customer Manager's New (with
  `null`) and Customer Manager's edit (with the opened Customer). Both Customer steps and the
  Manager take their discard-check baseline synchronously.
- **`UiSingleSelect`** sets `disallowEmptySelection` and ignores a null selection, so a chosen value
  cannot be cleared; a `value` matching no option renders the placeholder.
- **`api.Users.list`** takes a declared query, and `queries.Users.byRole` exists in
  `front/api/queries.ts`. A single `list` returns one page, 25 records by default (`DEFAULT_LIMIT`);
  `listAll` reads every page.
- **`api.Users.get`** excludes soft-deleted Users (`deleted_at` is null). Inactive Users and Users
  holding other roles remain fetchable. **Amended 2026-10-19, see Addendum 4.**
- **`SessionCoordinator`** (`front/app/shell/session-coordinator.ts`) loads the session User to
  check that it is active, then keeps only the user id: by its header, "only the prepared identity,
  not the domain User". The session holds no roles.
- **`architecture-front.md`** states the exclusion and the create default in §10.1.6, lists
  `front/app/shell/`'s contents in §2, its footnote, and §10.1.3, and places a component in `app/`
  "when a second swarmAg app needs it — not before" (§10.1.5).

## Decisions

### CA, 2026-10-08

1. **A shared User picker.** One single-select control that chooses a User and defaults to the
   session user where a person names themself. **The roles it lists are a parameter** set by each
   use: the account manager lists `sales`; job crew lists `operations`. It serves the account
   manager now; the assessor and planner reuse it (backlog: "Assessor and planner are chosen with
   the User picker").
2. **The account manager** is a User picker field on the Customer Detail step, with Name and Status
   and above the account notes. Onboarding and Customer Manager share that step, so it is set
   during Onboarding, defaulting to the session user, and changeable in Customer Manager.
   `CustomerAdapter.accountManagerId` joins `scopes.Customers.detail`. A Customer has one account
   manager, as the domain holds. The picker lists `sales` Users.
3. **Built before roadmap §5,** while the Customer code is fresh. It does not block closing §1,
   whose open item is portal users.

### CA, 2026-10-10/11

4. **`UserPicker` lives in `front/app/shell/user-picker.tsx`.** It is shared, as `NotesEditor` is,
   so it sits in `app/shell` although its first consumers are in `app-admin`.
5. **The default applies only on create.** Onboarding and Customer Manager's New default to the
   session user **if they hold a listed role**; otherwise the field starts unset. An existing
   Customer opens with its stored value, and an unset one stays unset: it is never filled
   automatically, which would assign silently and register a change with the discard check. The
   session user and their roles come from `SessionUser` (decision 11).
6. **None is selectable,** mapping to `undefined`; an update writes `null` through the existing
   explicit-null protocol. The picker supplies it as its own option, so `UiSingleSelect` does not
   change.
7. **The current value is always shown.** The options are active Users holding a listed role, plus
   the record's current account manager when they no longer qualify, so the field shows who
   actually manages the account and can move it. **A soft-deleted current account manager is shown
   with a deleted indication (2026-10-13); see Dependencies.** **Amended 2026-10-19, see
   Addendum 3.**
8. **One picker for everyone in Admin** for release 1. Within an app its roles are trusted equally,
   and sales Users also hold `administrator`
   (`effort/pending/2026-10-10-access-model-brief.md`, decisions 2 and 6). Finer rules by role
   wait for `app-leads`, when sales Users leave the administrator role.
9. **The picker issues its own query,** built from the declaration in `front/api/queries.ts`
   (`effort/completed/2026-10-11-list-query-brief.md`, decision 14), and reads every page:

   ```ts
   const query = queries.Users.byRole.build({
     where: { roles: { hasAny: listedRoles }, status: { eq: 'active' } }
   })
   Array.fromAsync(listAll(api.Users, query))
   ```

   - `queries.Users.byRole` declares `roles` and `status` as filters and `displayName` as its
     order, so options list alphabetically. The picker offers no search box.
   - The picker loads through TanStack Query.
   - `listedRoles` is the picker's roles parameter, a non-empty tuple (list-query decision 18): the
     account manager passes `['sales']`.
   - A current account manager who no longer qualifies is fetched by id (`api.Users.get`) and
     added to the options (decision 7).
   - There is no shared user cache: a `useUsers` Query State module is added when a surface first
     needs user names resolved from ids. User Manager is unchanged.
10. **`scopes.Customers.detail` gains `CustomerAdapter.accountManagerId`** and its create defaults
    become `{}`, since an attribute is never both in scope and defaulted (`architecture-core.md`
    §5.2.6).

### CA, 2026-10-13

11. **The signed-in User is held for the session.** `SessionCoordinator` already loads the session
    User and discards it, keeping only the id; it now hands the User to a session user provider.
    The create default (decision 5) reads it synchronously when the create draft is built, so the
    default never registers with the discard check; existing drafts bypass the default. Like the
    id, the User refreshes at the next session preparation. **Amended 2026-10-19, see Addendums 1,
    4, and 5.**

    - **`ux/shell/runtime/shell.ts`** declares the contract beside `SessionCoordinatorContract`,
      with domain-free roles, and lists it in the header's PUBLIC:

      ```ts
      /** Application-owned signed-in user, held for the session's lifetime. */
      export interface SessionUserContract {
        id(): Id | null
        roles(): readonly string[]
      }
      ```

    - **`front/app/shell/session-user.ts`** (new) is the swarmAg provider: a proxy over the domain
      User, reactive through a signal, set and cleared only by the coordinator.
      `idWithAnyRole` carries the pattern that a person naming themself on a record defaults to
      the session user when they hold a listed role; the assessor and planner reuse it:

      ```ts
      /** swarmAg signed-in user: the domain User behind the shell's user contract. */
      class AppSessionUser implements SessionUserContract {
        readonly #user = createSignal<User | null>(null)

        /** Signed-in user id, or null when signed out. */
        id(): Id | null {
          return this.#user[0]()?.id ?? null
        }

        /** Signed-in user's roles; empty when signed out. */
        roles(): readonly string[] {
          return this.#user[0]()?.roles ?? []
        }

        /** Signed-in domain User, or null when signed out. */
        user(): User | null {
          return this.#user[0]()
        }

        /** Signed-in user's id when they hold any of the roles; otherwise undefined. */
        idWithAnyRole(roles: readonly UserRole[]): Id | undefined {
          const user = this.#user[0]()
          return user?.roles.some(role => roles.includes(role)) ? user.id : undefined
        }

        /** Hold the prepared User for the session; only the coordinator calls it. */
        set(user: User): void {
          this.#user[1](user)
        }

        /** Release the User on sign-out or identity change. */
        clear(): void {
          this.#user[1](null)
        }
      }

      /** Shared suite signed-in user. */
      export const SessionUser = new AppSessionUser()
      ```

    - **`front/app/shell/session-coordinator.ts`:** `#preparedUserId` is removed. `clear()` calls
      `SessionUser.clear()`; the prepared check reads `SessionUser.id() === session.userId`; an
      eligible User is held with `SessionUser.set(user)` before `setReady()`. The export drops its
      superfluous annotation: `export const SessionCoordinator = new AppSessionCoordinator()`;
      `implements SessionCoordinatorContract` already checks the class.
    - **The account manager's create default:**
      `const accountManagerId = SessionUser.idWithAnyRole(listedRoles)`.
    - Nothing in `ux/` consumes `SessionUserContract` yet; the access model's role gate on app
      entry is its first consumer.

## Dependencies

- **`effort/completed/2026-10-13-soft-deleted-references-brief.md`** shipped first (closed
  2026-10-18): a reference resolves its soft-deleted target, `get` fetches deleted records, and consumers indicate a deleted
  target. Decision 7 rests on it.
- **`effort/completed/2026-10-11-list-query-brief.md`** shipped first (closed 2026-10-13):
  declared queries, `build`, `listAll`, and `queries.Users.byRole` in `front/api/queries.ts`; it
  renamed `form-scopes.ts` to `scopes.ts`, where decision 10's scope lives.
- **The account manager gains access meaning.** A sales User's Ops subjects are the Jobs of
  Customers they are account manager for (access model brief, decision 10). Nothing in this
  production depends on it.

## Documentation the production amends

**Amended 2026-10-19, see Addendums 1 and 5.**

- **`architecture-front.md` §2, its `shell/` footnote, and §10.1.3:** list `user-picker` beside
  `notes-editor`, and `session-user` beside `session-coordinator.ts`.
- **`architecture-front.md` §9.3.1–§9.3.2:** the application supplies `SessionUser` behind
  `SessionUserContract`; step 8 holds the eligible User in `SessionUser` instead of discarding it,
  and "The prepared user ID is private coordinator state, not a domain-user cache" is withdrawn.
- **Amended 2026-10-19, see Addendum 7.** **`architecture-front.md` §10.1.5:** reconciled with
  decision 4, which places the shared `UserPicker` in `app/shell/` before a second app consumes
  it.
- **`architecture-front.md` §10.1.6:** the Customer scope covers account-manager assignment, and
  its create defaults are `{}`.

## Operating mode

**Foundation:** the production amends governing architecture and introduces a shared picker
contract and the session user contract. It does not extend into the access model.

## Verification

**Amended 2026-10-19, see Addendums 1, 2, and 4.**

By the CA in the app:

- The picker lists only active Users holding a listed role, except a current account manager who
  no longer qualifies, who still appears (decision 7).
- Options order by display name, including Users sharing a name.
- More than one page of eligible Users all appear. **Withdrawn 2026-10-19, see Addendum 4.**
- Both create hosts, Onboarding and Customer Manager's New: a session user holding a listed role is
  the default; one who does not leaves the field unset.
- An untouched New draft passes the discard check.
- An explicit None survives the step remounting.
- Assigning and clearing the account manager each hold after save and reopen.
- Loading and failure states show in the field.
- A soft-deleted account manager shows with a deleted indication.

**Deferred:** the list-query production's remaining Postgres checks need a surface that pages or
searches through a query, which the picker does not: search containing `%`, `_`, quotes, commas,
and parentheses matches literally; descending order holds across pages; a cursor reused after a
filter change fails with `ApiError` 400. They run with the first such surface.

## Out of scope

Portal users and the Customer Portal (`effort/pending/2026-10-08-customer-portal-brief.md`); the
assessor, planner, and job work records (backlog entries under Job); finer picker rules by role;
a shared user cache.

## Addendums — 2026-10-19 — CA+AA review of AI Coding Engine findings

The AI Coding Engine reviewed the brief for production on 2026-10-18 and raised four findings. The
CA and AI Architect resolved them as follows.

1. **No authenticated route renders before session preparation completes** (decision 11).
   **Amended 2026-10-19, see Addendum 5.** `AuthGuard` renders authenticated content once
   `isAuthenticated` is set, before the coordinator has loaded the User and called `setReady()`. A
   direct reload into Onboarding can therefore build its create draft with no `SessionUser`, and the
   default (decision 5) stays unset; applying it afterward would undo decisions 5 and 6. Readiness
   gates rendering instead, for every authenticated route in every app.

   - **`ux/shell/runtime/session-state.ts`:** `SessionState` owns the meaning of its flags and
     answers two questions, added to `SessionStateContract`:

     ```ts
     export interface SessionStateContract {
       // existing members unchanged
       /** Signed in and prepared: authenticated content may render. */
       isPrepared: () => boolean
       /** Resolution finished with no session: the login route applies. */
       isSignedOut: () => boolean
     }
     ```

     ```ts
     /** Signed in and prepared: authenticated content may render. */
     const isSessionPrepared = (): boolean =>
       !sessionStore.isLoading && sessionStore.isAuthenticated && sessionStore.isDataReady

     /** Resolution finished with no session: the login route applies. */
     const isSessionSignedOut = (): boolean => !sessionStore.isLoading && !sessionStore.isAuthenticated
     ```

   - **`ux/shell/runtime/auth-guard.tsx`** asks them; the redundant inner `Show` goes. Between
     authenticated and prepared nothing renders, as nothing renders while `isLoading` holds today.
     `clear()` resets `isDataReady`, so sign-out still routes to `/login`. An inactive or deleted
     User is signed out before any authenticated content renders:

     ```tsx
     <Switch>
       <Match when={SessionState.isSignedOut()}>
         <ShellReplace to='/login' />
       </Match>
       <Match when={SessionState.isPrepared()}>{props.children}</Match>
     </Switch>
     ```

   - **The session preparation policy,** stated once in `architecture-core.md` and referenced
     elsewhere: applications prepare a session before authenticated content renders. Admin and the
     Customer Portal prepare online only. Ops prepares offline from the last User prepared online,
     kept on the device, because crews work where coverage is worst and a reload without signal is
     routine (sleep, OS eviction of a backgrounded PWA, battery). Eligibility is re-checked at the
     next online preparation; RLS and the edge functions remain the boundary, since log upload
     meets the live record. This production gates on online preparation; Ops' offline path is
     built with the job runner (roadmap §8).
   - **Documentation, first and stated once:**
     - `architecture-core.md` §9 Field Execution Guarantees gains a Session preparation section
       with the policy: §9 guarantees a job executes offline but not how the application starts
       offline. §10.1.5 Offline is first-class gains one invariant bullet.
     - `architecture-front.md` §9.3 keeps the mechanics only (`AuthGuard` on
       `SessionState.isPrepared()`, `SessionUser`, the preparation steps) and references core §9
       for the policy.
     - `architecture-front.md` §7.3.3 Offline Capability restates core §9's deep clone and log
       upload; it becomes a reference.
     - `architecture-back.md` §4.6's "session preparation rejects a deleted User" restates core
       §3.2.5; it becomes a reference.
   - **Verification:** with User loading deliberately delayed, a direct reload into Onboarding
     renders nothing until prepared, then defaults the account manager for a session user holding
     a listed role.

2. **Tests and checks are named in scope.**
   - `source/tests/cases/customer-api-test.ts`: its assertions that `account_manager_id` is
     excluded from create and update reverse under decision 10, with the draft helper. Its fake
     transport asserts `deleted_at=is.null` on every non-POST request; `get` no longer sends it
     (`effort/completed/2026-10-13-soft-deleted-references-brief.md`), so the assertion applies to
     `PATCH` only. Three of its five tests fail on `main` until then.
   - `session-coordinator-test.ts` covers holding the User before readiness, and clearing it on
     sign-out and on identity change. It is written now and runs once
     `effort/active/2026-10-13-stage-test-authorization-brief.md` ships, as `users-api-test.ts`
     does.
   - Checks: `deno task check`, `deno task fmt:check`, and `deno task test`, passing except the
     two tests awaiting stage test authorization; `STYLE_AUDIT`.

3. **Amended 2026-10-19, see Addendum 6.** **The picker's options are fixed when the editor opens**
   (decision 7): qualifying Users, plus the stored account manager when they no longer qualify.
   They stay the same for the whole edit,
   so reselecting the stored account manager restores the saved value; it is not a new reference.
   The next open rebuilds them from what is then stored.

4. **Repository facts.**
   - `api.Users.get` returns the User if it exists.
   - Decision 11's removal of the coordinator export's annotation is already done
     (`export const SessionCoordinator = new AppSessionCoordinator()`); nothing remains for it.
   - The Verification check "More than one page of eligible Users all appear" is withdrawn. The
     picker reads every eligible User through `listAll`, which `core/` already tests; paging in the
     interface is not addressed (backlog: "Managers load only the first page of their
     Collection").

5. **The session user, as settled on 2026-10-14** (decision 11). The CA designed a contract in
   `ux/shell/runtime` and a proxy provider in `front/app/shell`, held by the session, with the
   keyed store's benefits but not its grab bag. Decision 11 recorded a sketch that departed from
   it; this restores the design.

   - **`ux/shell/runtime/session-contracts.ts`** (new) holds the session contracts an application
     supplies: `SessionCoordinatorContract`, moved unchanged from `shell.ts`, and
     `SessionUserContract`. Both are deferred encapsulation, each application supplying exactly one
     implementation (`effort/pending/2026-10-03-core-reconciliation-brief.md`, amendment
     2026-10-19). `SessionStateContract` stays in `session-state.ts`: `ux/` implements it itself,
     so it is not deferred encapsulation. Only application-supplied session contracts belong here:

     ```ts
     /** Application-supplied signed-in user, held by the session for its lifetime. */
     export interface SessionUserContract {
       id(): Id | null
       roles(): readonly string[]
     }
     ```

   - **`ux/shell/runtime/shell.ts`** keeps its name and imports `SessionCoordinatorContract` from
     `session-contracts.ts` for `ShellApplication`; its header subtitle drops "Contracts and" and
     its PUBLIC loses the moved contract. Importers of the moved contract follow it.
   - **`front/app/shell/user-provider.ts`** (new): `UserProvider`, the swarmAg proxy over the
     domain User, `implements SessionUserContract`, with decision 11's `user()`, `idWithAnyRole`,
     `set`, and `clear`, and exported as its concrete type: `export const UserProvider = new
     AppUserProvider()`.
   - **The session holds the user** (`ux/shell/runtime/session-state.ts`). `SessionStore` gains
     `user: SessionUserContract | null`; `setReady(user: SessionUserContract)` sets it with
     `isDataReady`, and `clear()` drops it. `ux/` reads the signed-in user from the session;
     `ShellApplication` gains no field. `isPrepared()` (Addendum 1) therefore holds exactly when the
     session has its user.
   - **The coordinator:** `#preparedUserId` is removed; the prepared check reads
     `UserProvider.id() === session.userId`; an eligible User is held with `UserProvider.set(user)`
     and handed over with `api.SessionState.setReady(UserProvider)`; `clear()` calls
     `UserProvider.clear()` before `api.SessionState.clear()`.
   - **The create default:** `const accountManagerId = UserProvider.idWithAnyRole(listedRoles)`.
   - **Withdrawn from decision 11:** the contract in `shell.ts`; the names `SessionUser`,
     `AppSessionUser`, and `session-user.ts`; "Nothing in `ux/` consumes `SessionUserContract`
     yet".
   - **Documentation:** where the Documentation section and Addendum 1 name `session-user` or
     `SessionUser`, read `user-provider` and `UserProvider`; `architecture-front.md` §9.3.1, which
     names `shell.ts` as the coordinator contract's home, names `session-contracts.ts`, and §9.3
     describes the session holding the user.

6. **The rule behind Addendum 3, and how the picker loads** (decision 7, decision 9). The AI
   Coding Engine's production scope proposed freezing the options with an editor-scoped query: a
   per-editor key, `staleTime: Infinity`, refetch disabled, and the query removed on close. That
   is a new pattern, and the rule does not need it. Addendum 3's fixed list was a mechanism for a
   rule that holds by construction once the options are built from the stored value.

   - **The rule:** the stored account manager remains an option for the whole edit; the eligible
     Users are live. Nobody else who no longer qualifies is offered. A refetch mid-edit can only
     add a newly eligible User or drop one who stopped qualifying; neither breaks the rule.
   - **Eligible Users:** one app-wide query over `queries.Users.byRole` through `listAll`, with an
     exported key in the existing `*_QUERY_KEY` idiom and default TanStack Query behavior.
   - **The stored account manager, when they no longer qualify:** `api.Users.get(storedId)` under
     its own query, keyed by that id.
   - **The picker composes the two at render:** the eligible Users, plus the stored account
     manager when absent, ordered by display name. It takes the **stored** assignment separately
     from the draft value: the options follow the stored value, the selection follows the draft.
   - **None:** selecting it sets the draft `accountManagerId` to `undefined`; the update projection
     writes `null` (decision 6).
   - **Not needed for this rule:** an editor-instance key, per-editor query lifetime or removal, disabled
     refetches, and changes to `customer-steps.tsx` for them.

7. **`architecture-front.md` §10.1.5 is placement strategy, not a rule** (CA, at CA+AA review of
   the production). Reconciling the old rule with decision 4 led the AI Coding Engine to coin
   "explicitly designated suite components"; the CA judged the section a strategy whose framing as
   a rule had delayed placement decisions repeatedly. The CA approved this text, which replaces
   §10.1.5 in full and was applied directly:

   > #### 10.1.5 Placement
   >
   > Place a component in the tier that matches its intended reach. Application-specific work
   > belongs in `app-{name}/`; work meant for the swarmAg suite belongs in `app/`; only what is
   > useful outside swarmAg entirely belongs in `ux/`. Placement is a design decision made with
   > the component, and a component moves when its reach changes. Prefer the narrower tier when
   > reach is uncertain: widening later costs a move, and generalizing early costs an abstraction
   > nobody needed.

## Design history

- **2026-10-08:** decisions 1–3 recorded.
- **2026-10-10/11 review:** the AI Architect raised six gaps: picker placement, the default
  against the role filter, when the default applies, clearing and inactive Users, how the picker
  loads Users, and the documentation the scope change implies. They resolved as decisions 4–10.
- **Finer rules by role were proposed and deferred.** The CA proposed that on create a sales User
  may set only themself or None while an administrator chooses from the full list, and that only
  an administrator may delete a Customer. Examining them led to the access model brief, under which
  the two office roles are trusted equally until `app-leads`; the rules wait for it.
- **2026-10-11:** decision 9 rewritten to the list-query call shape (`build` producing a
  `Query<T>`, `hasAny`, a non-empty roles tuple) as that brief's design settled.
- **A shared `useUsers` cache was proposed and rejected for now.** With declared queries the
  server filters by role, so a cache's remaining value is resolving names from ids, which no
  surface needs yet.
- **2026-10-13:** the list-query brief closed; its Postgres checks moved here as Verification.
- **2026-10-13 AI Coding Engine review** (thread restarted): found the conflict between decision 4
  and §10.1.5, the missing session roles, the deleted account manager, and single-page loading;
  asked for wider acceptance checks, the inherited Postgres checks named as deferred, the
  repository facts refreshed, and Foundation mode. Decision 4 stands, and §10.1.5 is reconciled
  with it; decision 9 now reads every page; the rest became Open 1, Verification, and Operating
  mode. The deleted account manager led to
  `effort/completed/2026-10-13-soft-deleted-references-brief.md`, now a prerequisite: soft delete
  keeps a record so references survive, yet every read hid it.
- **2026-10-13: Open 1 resolved as decision 11.** Keeping only the prepared id was a holdover
  from the shell/app split, when the coordinator's side could not hold a domain User; nothing in
  the architecture's dependencies prevents it now. Two other homes were weighed: a session-user
  Query State module, which outlives sign-out unless purged, and a keyed store in `SessionState`,
  which is generic but invites a grab bag. The contract and proxy won: they follow
  `SessionCoordinatorContract`'s own idiom, live and die with the session, and are typed by
  construction. The contract ships now, ahead of its first `ux/` consumer, to fix its shape.
- **2026-10-19: an editor-scoped query was proposed and not needed.** The AI Coding Engine
  proposed holding the picker's options fixed with an editor-scoped query: a per-editor key,
  `staleTime: Infinity`, and removal on close. The design is sound, but the rule holds once the
  options are built from the stored value, so the existing app-wide query idiom serves
  (Addendum 6).

_End of Brief_
