# Account Manager & User Picker — Brief

**Active, not yet dispatched.** Recorded 2026-10-08 from a CA + AI Architect session, while
reconciling roadmap §1 after the Notes Editor milestone shipped. The same session's portal design
was split out to `effort/pending/2026-10-08-customer-portal-brief.md`. Chosen 2026-10-08 to be
built before roadmap §5; it awaits AI Coding Engine review and the production gate.

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
  it; nothing sets it.
- **`USER_ROLES`:** `administrator`, `sales`, `operations`, `customer`.

## Decisions (CA, 2026-10-08)

1. **A shared User picker.** One single-select control that chooses a User and defaults to the
   session user where a person names themself. **The roles it lists are a parameter** set by each
   use: the account manager lists `sales`; job crew lists `operations`. It serves the account manager now;
   the assessor and planner reuse it (backlog: "Assessor and planner are chosen with the User
   picker").
2. **The account manager** is a User picker field on the Customer Detail step, with Name and Status
   and above the account notes. Onboarding and Customer Manager share that step, so it is set
   during Onboarding, defaulting to the session user, and changeable in Customer Manager.
   `CustomerAdapter.accountManagerId` joins `scopes.Customers.detail`. A Customer has one account
   manager, as the domain holds. The picker lists `sales` Users.
3. **Built before roadmap §5,** while the Customer code is fresh. It does not block closing §1,
   whose open item is portal users.

## Out of scope

Portal users and the Customer Portal (`effort/pending/2026-10-08-customer-portal-brief.md`); the
assessor, planner, and job work records (backlog entries under Job).

_End of Brief_
