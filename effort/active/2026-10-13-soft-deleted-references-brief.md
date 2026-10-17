# Soft-Deleted References — Brief

**Active; prerequisite to `effort/active/2026-10-08-account-manager-brief.md`.** Recorded
2026-10-13 from a CA + AI Architect session, while resolving the account manager brief's AI Coding
Engine review.

## What triggered it

The account manager brief's decision 7 always shows a Customer's current account manager. When that
User is soft-deleted, nothing can read them: the picker's `api.Users.get` fails, the id matches no
option, and the field shows unassigned while the Customer still holds the id. The field
misrepresents the record.

The failure is not the account manager's. Soft delete keeps a record so that what references it
survives, yet every read hides it, so any reference whose target is soft-deleted holds an id
nothing can resolve.

## What the repository holds

- **`architecture-core.md` §3.2.5:** all life-cycle entities support soft delete through
  `deletedAt`; hard deletes occur only under a data retention policy.
- **`architecture-core.md` §10.1.6:** "Queries filter `WHERE deleted_at IS NULL`", stated for all
  reads.
- **`architecture-back.md` §4.6:** the `users` RLS grants `SELECT` to authenticated users on
  non-deleted rows.
- **`domain/schema/schema.sql`** (generated from the domain model): 18 `SELECT` policies use
  `deleted_at IS NULL`; the rest use `true`. **Amended 2026-10-13, see Amendment 7.**
- **`core/cli/make-supabase-client.ts`:** `get` filters `deleted_at` (line 112), as do `update`
  (130), `delete` (145), and `list` (156).
- **`core/cli/make-indexeddb-client.ts`:** `get` (line 86) already returns deleted records, though
  its doc comment says "non-deleted"; `list` filters them. The two stores disagree today.
- **`front/app/shell/session-coordinator.ts`:** loads the session User through `api.Users.get` and
  checks `status` only.
- **`tests/cases/users-api-test.ts`:** asserts that `get` of a deleted User throws.
- **Edge orchestration** (`user-orchestra.ts`) filters deleted rows on its own reads and writes,
  through the service role; `user_has_access` filters them too.
- **The facet precedent** (`domain-data-dictionary.md` §4.5): a retired facet stays readable and
  still resolves the label of existing references.
- **Nothing in the architecture** says how a reference to a soft-deleted record resolves.

## Decisions (CA, 2026-10-13)

1. **A reference resolves its target when the target is soft-deleted.** A reference is a
   single-target association (`AssociationOne` or `AssociationOptional`) declared
   `ON DELETE RESTRICT`: a record pointing at an independent record, to any target, not only a
   User. Out of scope:
   - **Ownership** (`ON DELETE CASCADE`): a child belongs to its owner, is reached through it, and
     goes with it, so it never shows a deleted owner. **Amended 2026-10-13, see Amendment 3.**
     Cardinality is not the test:
     `jobs.customer_id` is 1:M from the Customer's side, yet a Job references its Customer, and is
     in scope.
   - **Junctions** (`AssociationJunction`): relation rows without life-cycle fields, hard-deleted
     only.
2. **The label comes from the target.** The association stays an id; the deleted record remains
   readable as a reference target, and `get` fetches it with `deletedAt` set. Lists continue to
   exclude deleted records. New references come from lists, which exclude deleted records.
3. **Consumers indicate a deleted target,** showing its label and that it is deleted.

## Obligations

1. **Deleted records are read, never acted on.** `update` and `delete` keep refusing deleted rows.
   **Amended 2026-10-13, see Amendment 2.**
2. **A successful `get` is not a liveness check.** A caller that needs a live record checks
   `deletedAt`; `SessionCoordinator` rejects a deleted User.

## Production scope

Operating mode: **Foundation** (`core/`, `domain/`, RLS, governing architecture).

**The architecture amendments land first,** as their own production; the code productions follow
them.

| Where                                    | Change                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| `architecture-core.md` §3.2.5, §10.1.6   | Reference rule (decision 1); filter rule narrows to lists; anonymization.    |
| `architecture-back.md` §4.6              | The `users` `SELECT` grant covers deleted rows.                              |
| `core/cli/make-supabase-client.ts`       | `get` drops its `deleted_at` filter; `list`, `update`, `delete` keep theirs. |
| `core/cli/make-indexeddb-client.ts`      | `get`'s doc comment corrected; the code already conforms. **See A2.**        |
| `domain/schema/schema.sql`               | The 18 `SELECT` policies admit deleted rows; regenerated. **See A7.**        |
| `back/migrations/`                       | A migration carrying the policy change to stage. **See A6.**                 |
| `front/app/shell/session-coordinator.ts` | A User with `deletedAt` set is ineligible.                                   |
| `tests/cases/users-api-test.ts`          | `get` of a deleted User returns it with `deletedAt` set.                     |

**Anonymization** in `architecture-core.md`: designs do not preclude anonymizing personal data;
it lives on its record, and references carry ids, never copies.

**Unchanged:** edge orchestration and `user_has_access`, whose filters guard write and
authorization paths. **Consumers** adopt the deleted indication as they are built; the User picker
is the first (account manager brief, decision 7).

## Note

Anonymization of deleted people is deferred until operations expand beyond Texas. The reference
rule keeps it possible: the label comes from the target, so anonymizing a record updates every
reference to it.

## Checks

`deno task check`, `deno task fmt:check`, and `deno task test`; `STYLE_AUDIT`. The CA verifies on
stage that a deleted User is fetched by id with `deletedAt` set and does not appear in lists.
**Amended 2026-10-13, see Amendment 5.**

## Amendments — 2026-10-13 — After AI Coding Engine review

1. **`CONVENTIONS.md` §10.10 conflicts with decision 2.** It requires that "RLS `SELECT` policies
   must filter soft-deleted rows". The CA authorizes a targeted gate override for that rule, for
   this production only, at the CA's discretion. `CONVENTIONS.md` itself is not edited here: the
   reconciliation is carried by `effort/pending/2026-10-03-core-reconciliation-brief.md`
   (amendment 2026-10-13).
2. **IndexedDB does not refuse writes to deleted records.** `make-indexeddb-client.ts` `update`
   (line 106) and `delete` (line 123) check only that the record exists: updating a deleted record
   succeeds, and deleting it again overwrites `deleted_at`. Both refuse a deleted record, as the
   Supabase client does. `delete` also reports its failures as `'Read Failure'`; it is corrected.
   The table row's "the code already conforms" is withdrawn.
3. **The ownership exclusion rests on reach, not cascade.** `ON DELETE CASCADE` governs physical
   deletion; soft-deleting an owner does not touch its children. Ownership is out of scope because
   a child is reached through its owner. No cascading soft delete or owner-based visibility exists
   or is implied.
4. **RLS governs who may read; the API governs liveness.** With the deletion predicate removed,
   deleted rows are selectable by any authorized caller, including queries outside the API client.
   That lists exclude deleted records is an API contract, not a database guarantee.
5. **Checks cover the full contract,** in both stores: a deleted target is read by id with
   `deletedAt` set; `update` and `delete` of a deleted record are refused; lists exclude deleted
   records. `SessionCoordinator` rejects an otherwise active User whose `deletedAt` is set. The
   Users test no longer sets the User inactive before deleting it (`users-api-test.ts` line 48),
   so the `deletedAt` check is distinguished from the status check.
6. **No migration; tests written but not runnable** (CA, at the production scope gate).
   - `schema.sql` alone carries the policy change, and stage is reset by a genesis run. No file is
     added to `back/migrations/`; the table row is withdrawn.
   - `session-coordinator-test.ts` is written, and the `users-api-test.ts` changes are made, but
     neither can run until the shared test configuration can bootstrap `api` (backlog: "The
     shared test configuration cannot bootstrap `api`"). Until then the CA verifies on stage that
     an otherwise active User whose `deletedAt` is set is rejected, and that a deleted User is
     fetched by id and excluded from lists.
7. **17 `SELECT` policies, not 18.** The AI Architect miscounted: 17 policies used
   `deleted_at IS NULL` (16 plain, plus `users`' `TO authenticated`). The production changed all 17,
   as the AI Coding Engine reported.

## Design history

- **Label from the referrer was weighed and rejected.** Capturing a label on each association
  keeps reads off deleted rows, but changes every topic's data dictionary, copies personal data
  into every referring record, and goes stale for a live reference. A captured value suits
  log-like records, which remains a per-field choice.
- **Soft delete as "created by mistake"** (the facet rule, applied to Users, with referenced
  records undeletable) was raised and set aside: it answers one abstraction, not the idiom every
  association needs.
- **Soft-delete restriction** (refusing to soft-delete a referenced target, by analogy with
  `ON DELETE RESTRICT`) was set aside for the same reason.

_End of Brief_
