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

## Guards

### `guard:css` does not verify that a referenced token resolves

**Observed:** 2026-08-06 — second occurrence.

`guard:css` forbids raw literals but never checks that a `var(--sa-*)` reference is
actually declared. An unresolvable custom property is not an error: the browser drops
the whole declaration silently, so the rule simply does not apply and nothing reports it.
Thirteen guards and a passing `deno task check` see nothing.

Two specimens so far. The first produced square site tiles for weeks. The second was
found by hand on 2026-08-06 and fixed the same day: `ui.css` referenced
`--sa-control-ring-error` where the declared token is `--sa-control-shadow-error`, so
checkbox and radio error states rendered their border with no ring.

The check is mechanical: collect every `var(--sa-*)` reference across the CSS files and
assert each is declared in `tokens.css`, `roles.css`, `themes.css` or `icons.css`.

One trap for whoever builds it: `--sa-icon` is declared in `icons.css` and is a glyph
binding rather than a provider token, so a guard that scans only the three provider files
reports it as undefined. It is legitimate and must be included.

_End of Backlog_
