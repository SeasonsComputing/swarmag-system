# M1 Closing Reconciliation — Verification Discipline Applied to the Session Itself

**Status:** Decided and produced in the same sitting. Captures a multi-day drift-and-recovery,
per EFFORT.md §4 ("a decision that took several turns to reach is worth being able to see
again, including the turns that were wrong").

## What happened

A Group D live E2E verification pass (create a real prospect through the onboarding wizard on
a freshly genesis'd stage) surfaced four small findings and one large tangent. The tangent — a
multi-day exploration of a "Hub" UX archetype, prompted by discovering there is no way to edit
an already-created Customer — was genuinely valuable (it independently re-derived the shape of
`JobHub`, an already-shipped type, before either party knew to look for it) but consumed enough
of the session that ordinary housekeeping never happened. CA's own words: "we didn't do house
keeping because we went down the Hub rabbit hole."

CA asked for a formal scan of the session against the repo to check whether anything got
dropped — not trusting recollection, re-deriving from the actual transcript. That scan found:

- Group D's own checklist in `effort/active/2026-07-20-wizard-onboarding-tasks.md` was still
  100% unchecked despite the substance being mostly done.
- Stage was running a build two commits behind HEAD, missing a bug fix that pass itself found.
- The no-Customer-edit-surface finding had no durable record — buried inside Hub design memory,
  entangled with an unresolved architecture conversation.
- `project_onboarding_milestone.md` was six days stale.
- **A genuinely older, separate drop**: a 2026-08-29 task — "update `ux-design-archetypes.md`
  with the Index-Detail/Decomposition-Sequence reusable principles" — was explicitly tracked as
  pending across at least one prior context compaction, then silently stopped being carried
  forward at the next one. It survived inside a brief that later closed and moved to
  `effort/completed/`, which is exactly where nobody would look again.

## Decisions made reconciling the 2026-08-29 debt

**`architecture-core.md` §5.2.6 named Customer Onboarding Wizard and User Manager by name as
"reference implementations," with a "stamp these out" narrative.** CA's ruling: remove this
outright, not relocate it. Two reasons, both about voice, not content:

1. **Present-tense, greenfield language.** Governing docs describe the system as it is, not as
   a comparison to what came before or a preview of what's next. "X is the reference
   implementation for Y" is inherently a claim relative to a history; a pattern book has no
   history to be relative to.
2. **A pattern book should stand on its own.** `ux-design-archetypes.md` §1.2 already states the
   generic principle — "the supporting library is the machinery that implements the common
   cases... so feature work writes only what is genuinely particular to it," plus the Pareto
   framing — without naming a single swarmAg feature. Citing Customer/User as _proof_ the
   principle works belongs in a brief (a narrative document, by nature historical) or in memory,
   never in the doc the principle itself lives in. Once several Managers and Wizards exist, the
   citation would need updating forever; the generic statement never does.

**Net effect: `ux-design-archetypes.md` needed no edit at all.** The 2026-08-29 debt closes by
judgment — the doc already said the needed thing, generically, before the task was ever created.
What actually needed to move was narrower than either original ask implied:

- `architecture-core.md` §5.2.6 keeps only the contract mechanism (adapters translate, validators
  judge, write-scope declared not inferred) — the two Onboarding/User-Manager-naming sentences
  are deleted, not replaced.
- The one genuinely generic rule buried in that same removed material — "a form declares its own
  update scope as part of its design" — moves to `architecture-front.md` §9.6.1, alongside the
  other state-management rules it belongs with structurally.

## Other decisions this session, recorded here so they have a home

- **`job-views.ts`'s `JobHub` type is missing a `work?: JobWork` field** relative to the
  three-phase (assessment/plan/runner) model CA described. Deliberately left alone — "we'll burn
  that bridge when we get to it."
- **Customer Onboarding's real Finish boundary extends through Initial Job Assessment**
  (service selection, initial templates), not Sites. The three built stages are a near-term
  slice of a four-stage design, not a complete surface. Backlogged, not designed here.
- **Hub widget is the primary approach, not a coin flip.** CA wants to prove the vision before
  falling back to a hierarchical left-nav command panel, which stays the named, ready
  alternative if Hub doesn't earn its keep.

## Closing

Group D closes with this session's actual outcome (imperfect live pass, four named findings,
one fixed) — see `effort/completed/2026-07-20-wizard-onboarding-tasks.md` and
`project_onboarding_milestone.md`. Three new backlog entries carry the undone work forward:
Customer Manager, Onboarding's Initial Job Assessment stage, and the Hub widget itself.

_End of Brief_
