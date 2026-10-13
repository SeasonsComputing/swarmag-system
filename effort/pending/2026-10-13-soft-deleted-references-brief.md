# Soft-Deleted References — Brief

**Pending; prerequisite to `effort/active/2026-10-08-account-manager-brief.md`.** Recorded
2026-10-13 from a CA + AI Architect session, while resolving the account manager brief's AI Coding
Engine review.

## What triggered it

The account manager brief's decision 7 always shows a Customer's current account manager. When that
User is soft-deleted, nothing can read them: the picker's `api.Users.get` fails, the id matches no
option, and the field shows unassigned while the Customer still holds the id. The field
misrepresents the record.

The failure is not the account manager's. Soft delete keeps a record so that what references it
survives, yet every read hides it, so any association whose target is soft-deleted holds an id
nothing can resolve.

## What the repository holds

- **`architecture-core.md` §3.2.5:** all life-cycle entities support soft delete through
  `deletedAt`; hard deletes occur only under a data retention policy.
- **`architecture-core.md` §10.1.6:** "Queries filter `WHERE deleted_at IS NULL`", stated for all
  reads.
- **`architecture-back.md` §4.6:** the `users` RLS grants `SELECT` to authenticated users on
  non-deleted rows.
- **`domain/schema/schema.sql`** (generated from the domain model): 18 `SELECT` policies use
  `deleted_at IS NULL`; the rest use `true`.
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

1. **An association resolves its target when the target is soft-deleted.** This holds for every
   association, not only those to a User.
2. **The label comes from the target.** The association stays an id; the deleted record remains
   readable as a reference target, and `get` fetches it with `deletedAt` set. Lists continue to
   exclude deleted records.
3. **Consumers indicate a deleted target,** showing its label and that it is deleted.

## Obligations

1. **Deleted records are read, never acted on.** `update` and `delete` keep refusing deleted rows.
2. **No new reference to a deleted target.** An existing reference is kept; a new one is refused.
3. **A successful `get` is not a liveness check.** A caller that needs a live record checks
   `deletedAt`; `SessionCoordinator` rejects a deleted User.

## Production scope

Operating mode: **Foundation** (`core/`, `domain/`, RLS, governing architecture).

| Where                                    | Change                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| `core/cli/make-supabase-client.ts`       | `get` drops its `deleted_at` filter; `list`, `update`, `delete` keep theirs. |
| `core/cli/make-indexeddb-client.ts`      | `get`'s doc comment corrected; the code already conforms.                    |
| `domain/schema/schema.sql`               | The 18 `SELECT` policies admit deleted rows; regenerated from the model.     |
| `back/migrations/`                       | A migration carrying the policy change to stage.                             |
| `front/app/shell/session-coordinator.ts` | A User with `deletedAt` set is ineligible.                                   |
| `tests/cases/users-api-test.ts`          | `get` of a deleted User returns it with `deletedAt` set.                     |
| `architecture-core.md` §3.2.5, §10.1.6   | The filter rule narrows to lists; references resolve deleted targets.        |
| `architecture-back.md` §4.6              | The `users` `SELECT` grant covers deleted rows.                              |

**Unchanged:** edge orchestration and `user_has_access`, whose filters guard write and
authorization paths. **Consumers** adopt the deleted indication as they are built; the User picker
is the first (account manager brief, decision 7).

## Open

1. **Where a new reference to a deleted target is refused** (obligation 2): validation at ingress,
   the database, or both.
2. **Anonymization of deleted people.** With deleted records readable, a deleted User's personal
   data stays visible to authenticated readers; anonymizing it would keep the reference and replace
   the personal fields. Whether it belongs to this brief or stays deferred.

## Checks

`deno task check`, `deno task fmt:check`, and `deno task test`; `STYLE_AUDIT`. The CA verifies on
stage that a deleted User is fetched by id with `deletedAt` set and does not appear in lists.

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
