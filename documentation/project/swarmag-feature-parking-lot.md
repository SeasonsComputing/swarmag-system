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
