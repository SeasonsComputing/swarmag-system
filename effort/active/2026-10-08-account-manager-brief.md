# Account Manager & User Picker — Brief

**Active.** Recorded 2026-10-08 from a CA + AI Architect session, while reconciling roadmap §1
after the Notes Editor milestone shipped. The same session's portal design was split out to
`effort/pending/2026-10-08-customer-portal-brief.md`. Chosen 2026-10-08 to be built before roadmap
§5. Reviewed 2026-10-10/11 by the CA and AI Architect and refreshed 2026-10-13 (see Design
history); a prerequisite brief is pending, and it awaits AI Coding Engine review and the
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
  holding other roles remain fetchable.
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
   with a deleted indication (2026-10-13); see Dependencies.**
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
    id, the User refreshes at the next session preparation.

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

- **`effort/active/2026-10-13-soft-deleted-references-brief.md`** ships first: a reference
  resolves its soft-deleted target, `get` fetches deleted records, and consumers indicate a deleted
  target. Decision 7 rests on it.
- **`effort/completed/2026-10-11-list-query-brief.md`** shipped first (closed 2026-10-13):
  declared queries, `build`, `listAll`, and `queries.Users.byRole` in `front/api/queries.ts`; it
  renamed `form-scopes.ts` to `scopes.ts`, where decision 10's scope lives.
- **The account manager gains access meaning.** A sales User's Ops subjects are the Jobs of
  Customers they are account manager for (access model brief, decision 10). Nothing in this
  production depends on it.

## Documentation the production amends

- **`architecture-front.md` §2, its `shell/` footnote, and §10.1.3:** list `user-picker` beside
  `notes-editor`, and `session-user` beside `session-coordinator.ts`.
- **`architecture-front.md` §9.3.1–§9.3.2:** the application supplies `SessionUser` behind
  `SessionUserContract`; step 8 holds the eligible User in `SessionUser` instead of discarding it,
  and "The prepared user ID is private coordinator state, not a domain-user cache" is withdrawn.
- **`architecture-front.md` §10.1.5:** reconciled with decision 4, which places the shared
  `UserPicker` in `app/shell/` before a second app consumes it.
- **`architecture-front.md` §10.1.6:** the Customer scope covers account-manager assignment, and
  its create defaults are `{}`.

## Operating mode

**Foundation:** the production amends governing architecture and introduces a shared picker
contract and the session user contract. It does not extend into the access model.

## Verification

By the CA in the app:

- The picker lists only active Users holding a listed role, except a current account manager who
  no longer qualifies, who still appears (decision 7).
- Options order by display name, including Users sharing a name.
- More than one page of eligible Users all appear.
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
  `effort/active/2026-10-13-soft-deleted-references-brief.md`, now a prerequisite: soft delete
  keeps a record so references survive, yet every read hid it.
- **2026-10-13: Open 1 resolved as decision 11.** Keeping only the prepared id was a holdover
  from the shell/app split, when the coordinator's side could not hold a domain User; nothing in
  the architecture's dependencies prevents it now. Two other homes were weighed: a session-user
  Query State module, which outlives sign-out unless purged, and a keyed store in `SessionState`,
  which is generic but invites a grab bag. The contract and proxy won: they follow
  `SessionCoordinatorContract`'s own idiom, live and die with the session, and are typed by
  construction. The contract ships now, ahead of its first `ux/` consumer, to fix its shape.

_End of Brief_
