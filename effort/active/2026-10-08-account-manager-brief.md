# Account Manager & User Picker — Brief

**Active, not yet dispatched.** Recorded 2026-10-08 from a CA + AI Architect session, while
reconciling roadmap §1 after the Notes Editor milestone shipped. The same session's portal design
was split out to `effort/pending/2026-10-08-customer-portal-brief.md`. Chosen 2026-10-08 to be
built before roadmap §5. Reviewed 2026-10-10/11 by the CA and AI Architect (see Design history); it
awaits AI Coding Engine review and the production gate.

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
  `null`) and Customer Manager's edit (with the opened Customer).
- **`UiSingleSelect`** sets `disallowEmptySelection` and ignores a null selection, so a chosen value
  cannot be cleared; a `value` matching no option renders the placeholder.
- **`api.Users.list`** takes only `limit` and `cursor`; it cannot filter by role or status.
- **`architecture-front.md`** states the exclusion and the create default in §10.1.6 and lists
  `front/app/shell/`'s contents in §2, its footnote, and §10.1.3.

## Decisions

### CA, 2026-10-08

1. **A shared User picker.** One single-select control that chooses a User and defaults to the
   session user where a person names themself. **The roles it lists are a parameter** set by each
   use: the account manager lists `sales`; job crew lists `operations`. It serves the account
   manager now; the assessor and planner reuse it (backlog: "Assessor and planner are chosen with the User
   picker").
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
   automatically, which would assign silently and register a change with the discard check.
6. **None is selectable,** mapping to `undefined`; an update writes `null` through the existing
   explicit-null protocol. The picker supplies it as its own option, so `UiSingleSelect` does not
   change.
7. **The current value is always shown.** The options are active Users holding a listed role, plus
   the record's current account manager when they no longer qualify, so the field shows who
   actually manages the account and can move it.
8. **One picker for everyone in Admin** for release 1. Within an app its roles are trusted equally,
   and sales Users also hold `administrator`
   (`effort/pending/2026-10-10-access-model-brief.md`, decisions 2 and 6). Finer rules by role
   wait for `app-leads`, when sales Users leave the administrator role.
9. **The picker issues its own query** through `queries.Users.byRole` (`roles` has some of the
   listed roles, `status` is active), plus the current account manager by id when needed. There is
   no shared user cache: a `useUsers` Query State module is added when a surface first needs
   user names resolved from ids. User Manager is unchanged.
10. **`scopes.Customers.detail` gains `CustomerAdapter.accountManagerId`** and its create defaults
    become `{}`, since an attribute is never both in scope and defaulted (`architecture-core.md`
    §5.2.6).

## Dependencies

- **`effort/active/2026-10-11-list-query-brief.md`** ships first: decision 9 needs declared
  queries, and that brief renames `form-scopes.ts` to `scopes.ts`.
- **The account manager gains access meaning.** A sales User's Ops subjects are the Jobs of
  Customers they are account manager for (access model brief, decision 10). Nothing in this
  production depends on it.

## Documentation the production amends

- **`architecture-front.md` §2, its `shell/` footnote, and §10.1.3:** list `user-picker` beside
  `notes-editor`.
- **`architecture-front.md` §10.1.6:** the Customer scope covers account-manager assignment, and
  its create defaults are `{}`.

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
- **A shared `useUsers` cache was proposed and rejected for now.** With declared queries the
  server filters by role, so a cache's remaining value is resolving names from ids, which no
  surface needs yet.

_End of Brief_
