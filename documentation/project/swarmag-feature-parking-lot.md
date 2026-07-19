# swarmAg Feature Parking Lot

Living document. Each entry is something real, identified in the course of
other work, that is explicitly **not** being actioned right now — deferred on
purpose, not forgotten. Do not resolve an entry as a drive-by fix in an
unrelated session; it needs its own scoped conversation (see each entry's
mode/scope note).

Format per entry: date identified, source, what it is, why it's parked, and
what "picking it up" should look like.

---

## PII retention on soft-deleted users

**Identified:** 2026-07-14, during Edge Functions Remediation verification
(`documentation/project/2026-07-14-user-create-hang-handoff.md` session).

**What it is:** `UserOrchestra.delete()`
(`source/back/supabase-edge/orchestration/user-orchestra.ts`) soft-deletes a
user by setting `deleted_at`/`updated_at` only. It never scrubs
`primary_email`, `phone_number`, `display_name`, or `notes` — full PII stays
queryable in `public.users` indefinitely, distinguished only by a timestamp
flag. Auth identity revocation (`deleteAuthUser`) is clean and complete; the
domain-row PII retention is not. Confirmed live by querying a just-"deleted"
test user and getting their email back in plaintext.

**Why parked:** This is a real GDPR (Art. 17 right to erasure) / CCPA
exposure question if the business has EU or California users, but it's a
legal/policy decision as much as a code change — retention windows, what
counts as a formal erasure request versus a routine admin "delete" click, DPA
obligations — not something to resolve inside an unrelated bug-fix or feature
session. Needs its own scoped conversation with explicit sign-off.

**Picking this up should look like:** Likely Foundation Mode (touches domain
meaning / data lifecycle), starting with a decision on: (1) whether "delete"
and "erase" should be distinct operations in the UI/API, (2) what retention
window (if any) applies before PII is scrubbed, (3) whether anonymization
replaces PII fields in place or the row is fully removed once referential
integrity no longer requires it.

---

## Equipment/Asset naming convention review

**Identified:** ~2026-05-08, during UX foundational work (session
`2a7c772d-99ba-45e3-b6bb-c7909ba5a1f3`). _Stale — re-verify current state of
`source/domain/abstractions/` before acting; this note is over two months
old._

**What it is:** Audit `Asset` (and equipment-adjacent abstractions — drone,
vehicle, battery, attachment) in `source/domain/abstractions/` for whether
identity is a structured, human-memorable call sign (e.g. `Raven-2`,
`Falcon-B`) or a free-form display string, whether `name` fields are
typed/constrained, and whether fleet identity, subsystem identity, and
maintenance identity are expressed as distinct concepts or collapsed into one.

**Why parked:** Explicitly deferred until after UX foundational work
completed. Naming is an interface — in field operations (radios, checklists,
dispatch, telemetry, crew coordination under pressure) ambiguous identifiers
create real friction. The model to study: military aviation tail
numbers/call signs, railroads, telecom — domains that solved shared mental
state under operational load.

**Picking this up should look like:** An audit producing proposed domain
model changes for CA review. Do not modify domain abstractions directly
without an explicit go — this is Foundation Mode territory (domain meaning).

---

## Eject should ban, not delete, the Auth identity

**Identified:** 2026-07-16, during the User Manager UX rework
(`documentation/project/2026-07-16-user-manager-ux-rework.md`).

**What it is:** `UserOrchestra.eject()`
(`source/back/supabase-edge/orchestration/user-orchestra.ts`) currently calls
the same `deleteAuthUser` (`auth.admin.deleteUser`) as `delete()` — fully
removing the Supabase Auth identity. Per D5 in the edge-functions
remediation design doc, this makes reactivation genuinely impossible: setting
the domain row's `status` back to `active` doesn't restore an Auth identity,
because there's nothing left to restore. The correct model is closer to a
ban: `auth.admin.updateUserById(id, { ban_duration: '<long>' })` blocks future
logins/token refreshes while preserving the identity, so reinstatement is
just unbanning — no need to ever recreate an Auth user or worry about the
`auth.users.id = public.users.id` invariant.

**Why parked:** This changes eject's actual mechanism, not just a bug fix —
it reopens D4/D5's reasoning. One real unknown needs verifying before
committing to the design: whether an already-issued, not-yet-expired access
token stops working immediately on ban, or only fails on its next refresh —
that determines whether "log the user out" needs anything beyond the ban
itself (e.g. an explicit session-revocation call).

**Picking this up should look like:** Foundation Mode (reopens D4/D5).
Verify Supabase's current ban-vs-active-token behavior first, then decide
whether eject and a future explicit reinstate both live in `user-orchestra.ts`
as symmetric operations, and whether the editor's status toggle should be
disabled/warned against for ejected users until reinstatement is real.

## AbstractionManager list/editor collapse animation

**Parked:** 2026-07-18 (CA, during Phase 1 validation review)

On narrow screens the manager collapses between the entity list and the
editor form, and the CA judged the interaction model itself correct for both
"New User" and back-to-list. The transition is currently an instant swap; the
CA has repeatedly noted it wants a real animation (list slides/fades to
editor and back) so the mode change reads as movement rather than a repaint.

**Picking this up should look like:** small Feature/Foundation pass on
`abstraction-manager.css` (+ possibly a `data-ui-state` hook in
`abstraction-manager.tsx`) adding a reduced-motion-respecting transition
between list and editor presentation. Any future wizard step transitions
should share the same motion language.
