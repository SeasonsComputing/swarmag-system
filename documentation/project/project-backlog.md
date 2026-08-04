# Backlog

Near-term work, scoped but not scheduled. Distinct from
`documentation/project/project-feature-parking-lot.md`, which holds ideas deferred
indefinitely pending a decision. Items here are accepted defects or gaps awaiting a slot.

## Shell / Auth

### Login needs an "Already have a code?" action

**Observed:** 2026-08-04

The login flow requests a one-time code and then advances to code entry. A user who
already holds a code — from an earlier request, a reload, or navigating away — has no way
back to the verify step without requesting a new one.

Requesting again is rate limited: `supabase/auth/stage.jsonc` sets
`smtp_max_frequency: 60` and `rate_limit_email_sent: 60`, so a user in this state waits a
minute for a code they already have.

Needs an affordance on the request step that jumps straight to code entry for an already
issued code.

### A stale session survives genesis and is not ejected

**Observed:** 2026-08-04

Supabase persists the session in `localStorage`, so a browser holding a session keeps it
after a genesis run wipes `auth.users`. The signed-in user is left holding a token for a
principal that no longer exists, and the app does not detect this or return them to login.

The session is structurally valid — correct signature, unexpired — so detection has to key
on the principal being unresolvable rather than on token validity. Related: genesis became
total on 2026-08-04, so this state is now reachable every time the database is regenerated
rather than only when auth happened to be cleared by hand.

## Design questions

### When does a fieldset earn its legend

**Raised:** 2026-08-04 (CA) — to be discussed alongside the effort-doc reconciliation.

The case in question is narrow: **a form panel containing exactly one fieldset, whose
legend repeats the panel title.** A panel titled "Primary contact" wrapping a lone fieldset
titled "Primary Contact" states the same thing twice, one line apart.

Not in question: multiple fieldsets partitioning a panel, or a single fieldset whose legend
names something the panel title does not.

What to settle is what that case should collapse to, and whether it generalizes into a
rule. It also bears on the no-nested-fieldsets position taken the same day.

Bears on the composition-editor design, which proposes a fieldset specialization as its
frame.

_End of Backlog_
