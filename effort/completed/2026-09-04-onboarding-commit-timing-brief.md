# Onboarding Commit Timing — Sequence and Index-Detail Draft State

**CLOSED 2026-09-04.** Shipped, reviewed, and independently verified — including both
follow-on decisions in the amendment below (Save navigates up; drill-back warns on a real
dirty-check). Originally surfaced live-testing the fix for the "sites must be an array
composition" bug, same investigation but a different topic from the scoped-update-adapter
work it grew out of (that brief closed first). Two related but distinct problems in how the
onboarding wizard persists state, both traced to the same root cause: nothing in the wizard
or its nested Index-Detail panels distinguishes "the user is editing" from "the user is
done."

## The incidents that surfaced this

**1. Validation happens too far from the mistake to be useful.** `stageSites.canAdvance` now
gates Finish on `state.sites().every(isCustomerSite)` (shipped this session, closing the
original crash), but the failure still surfaces at the wizard's outermost level — the
generic "Correct the highlighted fields" banner — after the user has already drilled back out
of whichever Site or Note panel actually has the problem. Nothing is rendered there anymore to
highlight. The fix that shipped stops the crash; it does not fix the distance between the
error and the field.

**2. Cancel doesn't cancel what's already been written.** `wizard.tsx` wires the same callback
to both `onFinish` and `onCancel` — neither knows or cares whether a write already happened.
`stageCustomer.commit` fires a real `api.Customers.create(...)` the moment the user advances
past Customer address, before Sites is ever reached. Fill in Contact and Customer address,
then click **Cancel** instead of continuing — a real, permanent Customer row is left behind
with no sites, and the user who explicitly cancelled has no way to know it happened. There is
no structural reason the write has to happen there: `CustomerCreate` already carries `sites`
as a field, so a single `create()` at Finish, once, is fully supported by the existing type
shape. The two-stage write (create at Customer address, update at Sites) is very likely
incidental — built stage-by-stage, each stage's `commit` solving its own immediate need —
not a considered choice. It's also the direct ancestor of last night's `sites` data-loss bug:
keeping two separate write operations consistent with each other is exactly the class of
problem a single write at completion doesn't have.

## The design

Neither problem is really about validation or write count on its own — both are about **commit
timing**, and the fix is the same principle applied at two different levels of the same
surface: an archetype that stages editable content (a Sequence's Steps, an Index-Detail's
Items) does not itself decide when that content becomes real. That choice belongs to the
instance. This is now stated generally in `documentation/ux/ux-design-archetypes.md` §5.3
("Form State Management"), shipped this session — the two strategies named there,
**commit with progression** and **commit on completion**, are the vocabulary the rest of this
brief uses.

**Onboarding commits on completion, at both levels it uses:**

- **Sequence level.** `stageContact`, `stageCustomer`, and `stageSites` collapse from three
  independent commits into one: a single `api.Customers.create({ ...contact, ...address,
  sites: state.sites() })` fired once, at Finish. Nothing is written to Supabase before the
  user explicitly finishes. Cancel at any point before Finish leaves nothing behind, by
  construction — no rollback logic needed, because there is nothing to roll back.
- **Index-Detail level.** Each drilled panel (a Site, a Note) holds a **local draft** —
  seeded from the currently-committed value, edited locally, discarded on drill-back unless
  explicitly saved. `DrillDown`'s existing "up" control is drill-back's usual meaning
  everywhere else in the system (§3.3 of the archetypes doc); here it doubles as Cancel for
  whatever draft the panel was holding. A new **Save** action, right-justified, check-glyph —
  matching the visual language `Next`/`Finish` already use in the Sequence rail — commits the
  draft.

**Nested scope resolves itself if drafts commit into their parent's draft, not into shared
state directly.** A Note's Save writes into the Site's local draft, not into `OnboardingState`.
Only the Site's own Save writes into the real shared store (which itself, per the Sequence
rule above, is not yet the database — Finish is what makes any of it real). Cancelling the
Site discards everything under it, saved-looking Notes included, because none of it ever
reached anything but that one Site's own draft. This is the ordinary nested-transaction
shape — a child's commit is provisional until its parent also commits — and it needs no
special-casing once the drafts are structured this way.

**Save validates; it does not just persist.** A Save that writes an incomplete draft without
checking it just relocates the exact problem this brief exists to fix, one level shallower.
Save on a Site blocks (same treatment `canAdvance` already gives Finish) unless
`isCustomerSite` passes; Save on a Note blocks unless `isNote` passes. The domain validators
already do this work — `stageSites.canAdvance` already imports `isCustomerSite` directly from
`@domain/validators/customer-validator.ts` for exactly this reason — Save just needs to call
the same guard closer to where the user is looking.

**A newly-created Item is provisional until its own first Save.** Today `addSite()` writes
directly into the shared store the instant "New Site" is clicked, before anything is typed.
Under this design the row should still appear immediately in the list — the UI should keep
feeling live — but as an uncommitted draft that disappears entirely if the user backs out
without saving, not one that lingers half-filled forever.

## Decided

- **New brief, not an addendum to the scoped-update-adapter brief.** Different topic —
  write-scope (which fields) versus commit timing (when at all) — and that brief is already
  closed out.
- **Save is right-justified with a check glyph; drill-back doubles as Cancel.** Matches the
  Sequence rail's existing `Next`/`Finish` placement (§5.1 of the archetypes doc — form
  actions sit where the eye already is) rather than inventing a new convention.
- **Drafts nest by committing into the parent's draft, not the shared store.** Resolves the
  "does saving a Note survive cancelling its Site" question without a special case.
- **`DrillDown`/`CollectionPanel` currently have exactly one consumer** — this Sites stage.
  Verified by grep, not assumed. This is the moment to work out the draft/Save/Cancel contract
  concretely here, before either primitive is "shell infrastructure" other features build on
  top of and inherit whatever shape gets chosen first.
- **Duplicate-customer detection is explicitly out of scope**, parked separately in
  `effort/project/project-feature-parking-lot.md` ("Duplicate customer detection") — a
  different problem (no natural unique key for customer identity, unlike `users_primary_email_
  unique`) surfaced by the same investigation, not a data-integrity consequence of commit
  timing.

## Open question for production scoping

**Where does the Save/Cancel affordance actually live** — as a new capability `DrillDown`
itself grows (a header action slot, generalized for any future consumer), or kept local to
`onboarding-stage-sites.tsx` for now (the panel's own rendered content includes its own Save
control, using `DrillDown`'s existing drill-context as-is)? Given `DrillDown` has exactly one
consumer today, the narrower option — prove it here first, generalize later once a second
consumer exists to design against — matches the standing "prove at a higher layer before
promoting to foundation" principle from the HelmWidget retrospective. Leaning that way, but
this is a real fork the production-gate scope statement should settle explicitly, not infer.

## Sequencing (CONSTITUTION §8 — documentation leads code)

`ux-design-archetypes.md` §5.3 is shipped; the principle is documented ahead of the code that
will implement it, per house convention. Next step is a production-gate scope statement
covering: `onboarding.tsx` (collapse the three-stage commit into one at Finish),
`onboarding-state.ts` (local draft stores for Site/Note editing, nested commit-into-parent),
`onboarding-stage-sites.tsx` (Save/Cancel UI on `SiteEditor`/`NoteEditor`), and a decision on
the open question above before any of it is built.

## Amended (2026-09-04): shipped, reviewed, and two follow-on decisions

Production landed and was reviewed against this brief line by line, not taken on the
production report's word — traced the geolocation-lifecycle fix through the actual token
comparisons, confirmed the nested-draft-into-parent model by reading where each `onSave`
callback actually writes, ran the full check suite independently rather than trust the
report. All confirmed correct.

`deno task check:guards` was separately hitting `.DS_Store` noise on `guard:leaf` every
macOS session — genuinely unrelated to this brief, closed and then reopened in the same
sitting. First attempt chained a `clean:ds-store` sweep directly into `guard:leaf`'s own
task; ACE's review of the addendum scope caught that this makes an individual guard task
mutate before it checks, breaking the implicit contract every `guard:*`/`check:*` task in
`deno.jsonc` otherwise honors — a mutating operation there always gets an honest verb name
(`fmt`, `lock:update`, `gen:*`), never a `check`/`guard` name. Agreed, and reverted —
`deno.jsonc` is back to matching `HEAD` exactly. The real fix (mutation belongs at the
orchestration level, not inside an individual guard; `chk` vs. `check` may want to split
into a convenience-mutates alias versus a strict report-only one, the same question extends
to whether `fmt` — not just `fmt:check` — belongs in that convenience path) is parked as its
own devops decision, not resolved here. `.DS_Store` recurrence is back to `rmdir`-by-hand
until that decision gets made.

**The open question above resolved to a third option neither branch named.** Not "promote
into `DrillDown`" and not "stay fully local" — the actual fix was `WizardStage` gaining one
optional field, `trailingAction?: () => UiActionButtonProps | undefined`, the same shape as
the `commit`/`validate`/`canAdvance`/`feedback` optional-accessor pattern `WizardStage`/
`WizardContract` already used. `wizard.tsx`'s own `PanelForm` header already had an empty
`trailing` slot while drilled (`<Show when={!isDrilled()}>` renders nothing when drilled,
since Next/Finish don't apply there) — that's the seat Save needed, not a new capability on
`DrillDown`. `DrillDown`/`CollectionPanel` stayed untouched exactly as scoped; `Wizard`'s
contract did change, which is what the escalation boundary named as the stop-and-rescope
trigger. In practice this was authorized directly, in conversation, once the precedent
(`WizardContract.feedback`) was pointed out and the change sized correctly — not routed
back through a full ACE rescoping round-trip. `SiteEditor`/`NoteEditor` report their own
Save descriptor up through `onTrailingAction`, gated by the same `isActiveDraft()` token
check already verified correct for the geolocation fix, so a stale reporter can never
clobber a fresher one. Verified live: Site's Save and Note's Save correctly occupy the same
single header slot, one at a time, deferring to whichever is the innermost drilled panel.

**Two more decisions, discussed after the fact, not yet built:**

- **Save navigates up, at both levels.** Consistent with the Sequence rail's own
  `Next`/`Finish`, which already do "commit, then advance" as one click — Save doing the same
  at the Index-Detail level isn't a new convention. It also closes a real gap: today, saving
  an already-valid, unchanged draft produces no visible confirmation at all — navigating up
  is the confirmation, for free. The "want to keep adding notes right after saving the site"
  case isn't actually lossy under this design — a Note's own Save already commits into the
  Site's local draft before the Site's Save ever fires, so nothing added is at risk, only an
  extra re-drill if the user wants to keep going.
- **Up/Cancel warns on unsaved edits, gated by a real dirty-check** (draft vs. the original
  committed value, or vs. blank for a new item — not an unconditional prompt). This is the
  same principle the whole effort is built on, applied in the other direction: everything
  else here prevents _silent persistence_ of the wrong thing; this prevents _silent discard_
  of the right thing. `CollectionPanel.confirmRemove` already proves the confirmation-dialog
  pattern exists in this exact file for exactly this shape of "are you sure" — reuse it
  rather than a native `confirm()` or a new mechanism.

**Both shipped (2026-09-04, same sitting), verified against the actual code, not narration.**
`saveSite`/`saveNote` call `onReturnAfterSave()` only after a successful validated commit,
using the _raw_ drill-return control so a successful save never triggers its own discard
warning. `isDirty` compares a JSON fingerprint of the live draft against one taken from the
original seed at mount — blank factory shape for a new item, the cloned committed value for
an existing one — exactly the comparison specified above. `requestDrillReturn` gates on it:
clean drafts return immediately, dirty ones hold the control and open a `UiDialog`
("Discard unsaved changes?" / Cancel / Discard), reusing the primitive
`CollectionPanel.confirmRemove` is itself built on rather than inventing a parallel
mechanism. Full check suite (types, lint, fmt, all 13 guards) clean.

_End of Backlog Brief_
