# Abstraction Manager Correction — Session Handoff

**Date:** 2026-08-05
**Mode:** Foundation
**Milestone:** M1 Customer Onboarding — foundation phase
**Brief:** `effort/active/2026-08-05-abstraction-manager-brief.md`
**Prior handoff:** `effort/active/2026-08-04-m1-resume-handoff.md`

## What happened

Testing User Manager exposed that `AbstractionManager` renders the manager chrome
but does not own the manager's lifecycle. The session was spent diagnosing that,
settling the corrected ownership boundary, and writing the production brief. No
source code changed.

## What shipped

**`effort/active/2026-08-05-abstraction-manager-brief.md`** — Phase 1 production
instruction. Closed: no open decisions in it. Not yet executed.

**`a71222e`** — `documentation/genesis/genesis-ux-dashboard.md` renamed and moved
to `effort/completed/2026-06-22-dashboard-inception.md`. It was an archived first
draft being mis-ingested as authoritative. Committed by CA. `git log --follow`
traces history back to its creation on 2026-06-22.

**Reference cleanup** — the `genesis-ux-dashboard.md` row removed from
`README.md` §1.2; the dead `ActionWidget` bullet removed from the 2026-08-04
handoff. Zero references remain. Both uncommitted.

## The correction, settled

Save, New, Cancel and everything following them are manager commands. The
specialization supplies domain parts only.

**Boundary — three participants**

| Participant        | Owns                                                                                                                                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Host props         | workbench close/cancel, as a required prop on the manager                                                                                                                                                                                     |
| AbstractionManager | selected subject, editor mode, Save command, create-vs-update branch, pending and error state, success feedback and its clearing policy, validation banner, refresh timing, post-save editor state, epoch semantics, action-success lifecycle |
| Provider           | list projection, loading, columns, cells, form field rendering, create/update operations, `refresh()` implementation                                                                                                                          |
| Editor instance    | field signals, validation rings, `validate()` and draft projection via a per-instance handle                                                                                                                                                  |

**Save policy** — create success composes feedback from the created result,
refreshes, opens a fresh New editor. Update success refreshes, sets the selected
subject to the returned persisted object, re-seeds the editor, remains on the
record. Policy is expressed as **editor state, never navigation**, because
"return to list" means different things at wide and collapsed widths.

**Feedback** — split by source: rings belong to the editor instance, every banner
belongs to the manager. Create-success feedback survives typing in the fresh New
form because it describes a record that is not the subject on screen.

Full detail, including the stale-handle hazard and the focus-jump consequence of
re-seeding through an epoch bump, is in the brief. Do not re-derive it.

## Resume agenda

1. **Phase 1 — execute the brief.** One consumer today (`user-manager.tsx`);
   that window closes as soon as a second manager exists.
2. **Phase 2 — embedded list editor, then Job sites rehost.** Blocked on a CA
   design decision: what _initial_, _new_, _delete_, _post-new_ and _post-delete_
   actually do. This is the milestone path.
3. **Phase 3 — dirty/pristine primitive.** Does not exist anywhere in
   `source/front` today. Designed once, against two settled consumers — the
   manager's fifth feedback-clearing rule and the list editor.

Ordering agreed: foundation first, in that sequence.

## Also settled this session, unscheduled

**Embedded list editor is chrome only.** A specialized form-actions row — nav
pair, position readout, lifecycle pair — holding no state; the host owns `items`
and `cursor`. Consequence: no frame, therefore no nested-fieldset problem,
therefore the window mechanism is not a prerequisite for notes-inside-a-site.
Cost to keep visible: two lists on screen means two cursors, and the nav controls
must read unambiguously as belonging to one of them.

**`front/app` layer.** `ux` is the general-purpose library; `app` holds
swarmAg-specific material — `components` (login, logout, about, notes), `stores`
(jobs), `views` (jobs), `assets`, `widgets` (domain widgets). `ux` keeps `shell`,
`ui`, `stores` (app, session, dashboard) and `widgets` (helm, brand, support,
theme). The widget catalog splits chrome from domain; `app-admin` imports both
registries, joins them, hands the collection to `bootstrap`.

Layering is downward-only: `app-{product} → app → ux → domain/core`. Shared app
features use `data-app`; no new dataset key is needed. This supersedes the
`ux/screens` intermediate step rather than sitting beside it.

**The judgment rule for moving code down a layer:** access is free, validation is
not. Everything above could already reach it, so moving down buys one definition
and costs a wider re-validation on every future change. Move down when a thing is
_settled_, not merely when it is _shared_.

## Open

- **Fieldset redundancy is CLOSED** — it was about proper use, not the component.
  Renaming the contact stage fixed it. Do not reopen it.
- **`ux` / `app` refactor** — agreed in shape, unscheduled.
- **Session close-out procedure** — CA has a concern about it; parked for a
  dedicated discussion.
- **Undefined-token guard** — `guard:css` never checks that a referenced token
  exists. Still unbuilt.

## Standing protocol

Independent CA go per production; the CA concludes topic conversation with a
scope or production directive, not the agent. Delegates are haiku and git
read-only. Final behavioural verification is the CA's authenticated browser — no
automated UI coverage exists. **Claude never commits.**

Checks are `deno task fmt && deno task check`; `check` chains all thirteen
guards, types and lint. `guard:leaf` sees the filesystem rather than the index,
so stray `.DS_Store` files turn it red while remaining gitignored.

## Note on session seeding

The CA seeds the session with the document he chooses. An agent should not scan
`effort/` and build its own theory of the work — that behaviour is the origin of
repeated process relitigation, and it happened at the start of this session.

_End of Handoff_
