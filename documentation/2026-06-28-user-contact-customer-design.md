# User / Contact / Customer — Domain Refactor Design

**Date:** 2026-06-28
**Mode:** Foundation
**Status:** Approved — pending implementation plan

---

## 1. Problem Statement

The current domain has a structural defect: `Contact` is an embedded value object (`object` type, JSONB-serialized within `Customer`) that represents a **person** — but the system requires all application access to go through OTP authentication and RLS, both of which are anchored to `User`. A Contact who is not a User cannot authenticate or be targeted by RLS policies.

Additionally, `Customer` is semantically an **Account** (a business entity), and the `Contact` abstraction conflates two separate concerns: (1) identity fields that belong on `User`, and (2) relationship metadata that belongs on the association between a Customer and a User.

---

## 2. Design Decisions

### 2.1 Auth / Domain User Boundary

There is one domain `User`. Supabase represents that User across two backend structures:
`auth.users` is the authentication principal and security anchor; `public.users` is the domain user
record queried and related by the application. They intentionally share the same
application-supplied UUID v7. This boundary belongs in `architecture-back.md`, while the
solution-space field inventory belongs in `domain-data-dictionary.md`.

### 2.2 `Contact` is an Association Class

`Contact` is not a value object belonging to `Customer`. It is an **association class** — a relationship between `Customer` (account) and `User` (identity) that has no attributes of its own once identity fields are correctly assigned. It maps to a **pure-key Junction** in the domain archetype system.

### 2.3 Identity Fields Belong on `User`

`Contact.name`, `email`, and `phone` are identity fields duplicated from `User`. They are removed from `Contact`. `User` is already the authoritative source.

### 2.4 `preferredChannel` Belongs on `User`

Communication channel preference is a person attribute, not a relationship attribute. `CONTACT_PREFERRED_CHANNELS` and `ContactPreferredChannel` migrate to `user.ts`. `User` gains `preferredChannel`.

### 2.5 `notes` Belong on `User`

Notes are observations about a person, not about the relationship between a person and an account. `User` gains `notes: CompositionMany<Note>`.

### 2.6 Primary Contact as a FK on `Customer`

`Contact.isPrimary` (a boolean flag with no structural enforcement) is replaced by `Customer.primaryContactId: AssociationOne<User>` — a required FK. This enforces exactly-one primary contact structurally, guarantees a contactable and app-accessible user for every Customer, and satisfies the business requirement that every Customer account has a User who can access the customer dashboard.

The existing `customers_contacts_non_empty_check` constraint is superseded by this FK — `NOT NULL` on `primary_contact_id` is the enforcement.

### 2.7 `Contact` Abstraction is Removed

With all attributes relocated, `Contact` as a named domain abstraction with its own adapter, validator, guard, and const-enum ceases to exist. It is replaced by `CustomerContact` — a pure-key Junction with no state.

### 2.8 `USER_ROLES` Gains `'customer'`

A user who accesses the customer-facing application has the `customer` role. User roles model
application access and membership; crew assignment roles model the planned function a user performs
on a job crew. `job_plan_assignments.role` therefore uses `JobPlanAssignmentRole`, not `UserRole`.

---

## 3. Revised Object Model

### 3.1 `User`

```
User (Instantiable)
  roles:            CompositionPositive<UserRole>     — gains 'customer'
  displayName:      string
  primaryEmail:     string                             — unique
  phoneNumber:      string
  preferredChannel: ContactPreferredChannel            — migrated from Contact
  notes:            CompositionMany<Note>              — new
  avatarUrl?:       string
  status:           UserStatus
```

`UserRole` gains `'customer'`. `CONTACT_PREFERRED_CHANNELS` and `ContactPreferredChannel` migrate from `customer.ts` to `user.ts`.

### 3.2 `CustomerContact` (replaces `Contact`)

```
CustomerContact (Junction)
  customerId: AssociationJunction<Customer>
  userId:     AssociationJunction<User>
```

Pure-key junction. Composite PK `(customer_id, user_id)`. No state attributes. Hard-delete only. Protocol: create only (whole type).

### 3.3 `Customer`

```
Customer (Instantiable)
  accountManagerId:   AssociationOptional<User>
  primaryContactId:   AssociationOne<User>             — new; replaces contacts.isPrimary
  sites:              CompositionMany<CustomerSite>
  notes:              CompositionMany<Note>
  name:               string
  status:             CustomerStatus
  line1:              string
  line2?:             string
  city:               string
  state:              string
  postalCode:         string
  country:            string
```

`contacts: CompositionPositive<Contact>` is removed.

---

## 4. Creation Order

The refactor eliminates the prior creation-order ambiguity:

1. Create `User` (auth identity established, UUID fixed)
2. Create `Customer` with `primaryContactId` referencing that `User`
3. Create additional `CustomerContact` junction records as needed

Each step has what it needs. No circular dependency.

---

## 5. Affected Artifacts

### 5.1 Domain Abstractions

| File                                     | Change                                                                                                                                                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `source/domain/abstractions/user.ts`     | Add `'customer'` to `USER_ROLES`; migrate `CONTACT_PREFERRED_CHANNELS` / `ContactPreferredChannel` here; add `preferredChannel` and `notes` to `User`                                           |
| `source/domain/abstractions/customer.ts` | Remove `Contact`, `CONTACT_PREFERRED_CHANNELS`, `ContactPreferredChannel`; remove `contacts` from `Customer`; add `primaryContactId: AssociationOne<User>`; add `CustomerContact` Junction type |

### 5.2 Domain Protocols

| File                                           | Change                                                               |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `source/domain/protocols/user-protocol.ts`     | Derived `UserCreate` / `UserUpdate` reflect the updated `User` shape |
| `source/domain/protocols/customer-protocol.ts` | Reflect `Customer` field changes; add `CustomerContactCreate`        |

### 5.3 Domain Validators

| File                                             | Change                                                                                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `source/domain/validators/user-validator.ts`     | Add `preferredChannel` and `notes` validation                                                                                                                       |
| `source/domain/validators/customer-validator.ts` | Remove `isContact` guard and contact validation; remove `CONTACT_PREFERRED_CHANNELS` import; add `primaryContactId` validation; add `validateCustomerContactCreate` |

### 5.4 Domain Adapters

| File                                         | Change                                                                                                          |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `source/domain/adapters/user-adapter.ts`     | Add `preferredChannel` and `notes` mappings                                                                     |
| `source/domain/adapters/customer-adapter.ts` | Remove `ContactAdapter` and delegation; remove `contacts`; add `primaryContactId`; add `CustomerContactAdapter` |

### 5.5 Documentation

| File                                      | Change                                                                                                                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `documentation/domain-model.md`           | Update User and Customer descriptions; replace Contact with CustomerContact Junction                                                                                                                          |
| `documentation/architecture-back.md`      | Document the Auth / Domain User Boundary and shared app-supplied UUID v7 invariant                                                                                                                            |
| `documentation/domain-data-dictionary.md` | Update §9 Users (new fields, new role, ContactPreferredChannel migrated here); update §7 Customers (remove Contact entry, add CustomerContact Junction, update Customer relations); remove §7.1 Contact entry |

### 5.6 Schema

| File                              | Change                                                                                                                                                                                                                                                                                    |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `source/domain/schema/schema.sql` | Genesis rewrite: `users` gains `preferred_channel`, `notes` columns; `customers` drops `contacts` JSONB column and constraints, gains `primary_contact_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT`; new `customer_contacts` junction table added; `DROP TABLE` list updated |

### 5.7 Tests and Fixtures

| File                                        | Change                                                                        |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| `source/tests/fixtures/user-samples.ts`     | Add `preferredChannel` and `notes` to User samples                            |
| `source/tests/fixtures/customer-samples.ts` | Remove contact samples; add `primaryContactId`; add `CustomerContact` samples |
| `source/tests/fixtures/samples.ts`          | Update if contact fixtures referenced here                                    |

---

## 6. Constraints and Invariants

- `job_plan_assignments.role` uses `JobPlanAssignmentRole`: `'crew-lead'`, `'pilot'`, `'visual-observer'`, `'applicator'`, `'equipment-operator'`, and `'technician'`.
- `public.users.id = auth.users.id` is a backend auth/domain boundary invariant, not a domain-model abstraction.
- `Customer.primaryContactId NOT NULL` replaces `customers_contacts_non_empty_check` as the structural guarantee that every Customer has a reachable, app-accessible contact.
- `CustomerContact` has no soft-delete — a contact relationship is hard-deleted when removed.

---

## 7. Out of Scope

- RLS policy updates for the customer-facing application — deferred to the customer app milestone
- Customer onboarding wizard UX — next milestone after domain and backend are complete
- `CustomerSite` — unchanged by this refactor
