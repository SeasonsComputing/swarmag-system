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
(`effort/completed/2026-07-14-user-create-hang-handoff.md` session).

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
(`effort/completed/2026-07-16-user-manager-ux-rework.md`).

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

## Lead abstraction — inbound pipeline automation

**Parked:** 2026-07-19 (CA executive decision during Phase 3 design)

The sales pipeline truly begins before the prospect: leads arrive via
voicemail, text, and email, and a rep transforms them into prospects for
return calls. The domain has no Lead entity — today this is deliberately
manual: the rep checks the three inboxes three times a day and runs the
onboarding wizard when a lead has enough substance (an email address,
since User requires one and provisions auth).

**CA verdict:** love the idea — automate it, measure it, track it — all
excellent features. Not now.

**Picking this up should look like:** Foundation domain addition — `Lead`
(source: voicemail|text|email, captured contact fragments, service
interest, status: new|contacted|converted|dead), auth-free, cheap to
create, converting into User + prospect Customer via the onboarding
wizard's stage 1 ("from lead"). Then the features the entity unlocks:
inbox integration/automation, pipeline measurement (lead→prospect
conversion, response latency), a Leads widget on the sales dashboard, and
retiring the auth-identity-at-genesis wrinkle (leads carry no login).

## Customers query API — status filter & ordering

**Parked:** 2026-07-21 (CA, during B0 close)

`api.Customers.list` is pagination-only (`limit`/`cursor`) and scoped to
active rows by RLS. It cannot filter by domain `status` (`prospect` vs
`active`) or order by `created_at`. M1 does not need it — the COW never lists
customers (D17 stage 1 is pure contact capture). The real consumers are
downstream: the prospect hub (D15 — "prospect list with time-since-creation")
and story 1.2's sales widget, both arriving with the assessment flow.

**CA verdict:** the query surface lives in the shared `ApiCrudContract` /
`ListOptions` (`core/api`) plus the PostgREST translation (`core/client`), so
it is a core-layer contract evolution, not a Customers-local add. Its shape is
a deliberate architectural decision the CA intends to design directly, in
keeping with the framework-free, minimal-dependency house standard — deferred
until the hub milestone provides a real consumer to pin requirements.

**Picking this up should look like:** a Foundation pass on the core query
contract, designed against the hub as first consumer — not an ad-hoc filter
bolted onto the topic client.

## Table header gradient seams at fractional column widths

**Parked:** 2026-07-22 (CA, during the panel decomposition)

Vertical lines appear between columns in a table's header row at certain widths.
They are not borders — no table cell declares an inline border anywhere, verified
by inspection. `[data-ui='table-head']` carries `background: var(--sa-table-bg-head)`
(`--sa-gradient-brand`, a 135° gradient), and that gradient is painted **per
cell** rather than once across the row group. When a column boundary lands on a
whole pixel the seam is invisible; when it lands mid-pixel it renders as a line.
Reproduced in the style guide by forcing fractional cell widths — boundaries at
`.797`, `.5`, `.609` all seam; integer boundaries do not.

Surfaced when the manager's columns moved from `2fr 1fr` to `1.7fr 1.3fr`, which
was the CA's requested 30% wider editor. That change did not cause the defect —
`2fr 1fr` happened to produce integer cell widths at common viewport sizes, so
the artifact was latent, not new.

**Why parked:** every obvious fix collides with a deliberate decision already
documented at `ui.css:554–558`. `border-collapse: separate` is load-bearing for
the sticky header (in the collapsed model, cell borders belong to the table and
stay behind when the head sticks), and the head's `clip-path` exists because
neither `overflow: clip` on the table nor `border-radius` rounds a row group.
Moving the gradient to the table, to the row, or to the cells each breaks one of
those. It is cosmetic, width-dependent, and predates this session.

**Picking this up should look like:** Foundation Mode — it is `ui.css`, the
design-language layer. Start from the sticky-header construction as a whole
rather than patching the gradient onto the current one; the constraint set
(sticky head + rounded top corners + continuous gradient + separate borders) may
want a different structure rather than a fix. Do not "solve" it by choosing `fr`
values that happen to yield integer widths — that is luck, not a fix, and it
silently breaks at the next container size.

## ActionWidget header/body variants

**Parked:** 2026-07-22 (CA, during dashboard action-widget responsive work)

The header ActionWidget should eventually contain only universal application
commands — for example Support, About, and Logout. This keeps the shared header
compact and makes its existing wrapped-lane icon treatment appropriate across
all applications.

Application-specific navigation should instead use a separate ActionWidget
instance in the dashboard body, with a body-oriented variant and visible labels.
Admin would move links such as Users and Onboarding there; Ops would use its own
app-specific instance when it has applicable links. Customer deliberately has no
such body widget when it has no app-specific navigation.

**Why parked:** The current header behavior is stable enough, while the body
variant needs an intentional shared-widget contract and seed-composition design.
It should not be introduced as an incidental rearrangement of current links.

**Picking this up should look like:** Foundation Mode. Define the ActionWidget
header/body variant contract, each variant's responsive presentation, and the
app dashboard seed compositions together. Then move Admin-only header actions
to the body instance and add the corresponding Ops composition only when it has
real app-specific destinations.
