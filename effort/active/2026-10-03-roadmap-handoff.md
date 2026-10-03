# Roadmap to Mechanical Productions — Handoff

**Session-end snapshot, 2026-10-03.** This closes the thread "Customer Manager, workbench steps & form
scopes (09-22 → 10-03)". The next thread resumes from this record, not from that thread's memory.

## Where the plan stands

On 2026-09-30 the CA approved a plan to reach roadmap §5 Mechanical Productions by way of the Notes
Editor and a reusable tags component. Its phases now stand as follows.

| Phase                                                                 | State                                                                                                                                                          |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — Close §3 Customer Manager; capture the update-scope work          | **Done.** `effort/completed/2026-09-22-customer-manager-brief.md` closed 09-30. `effort/completed/2026-10-02-update-scopes-brief.md` closed 10-03 (`d654096`). |
| 1 — Tags: freeform or controlled, and where `TagsField` lives         | **Not started.** A CA + AA conversation, settled in the Phase 2 brief.                                                                                         |
| 2 — Notes Editor brief                                                | **Not written.**                                                                                                                                               |
| 3 — Notes Editor production                                           | Waits on Phase 2.                                                                                                                                              |
| 4 — Milestone verification, §4 then §1; additional-contact assignment | Open decision, below.                                                                                                                                          |

## Next topic: Users

Before Phase 1, the CA asked to discuss Users. Nothing has been discussed yet. Read first:

- **Why Users is the outlier:** every User write is a transaction across the `users` table and
  Supabase Auth. That requirement built the edge foundation. The 10-02 brief's History section
  records it.
- **Where Users stands now:** on `DirectUpdateContract`, with a field-tuple scope in
  `scopes.Users.detail`. It may adopt `makeFormScope` later, without an adapter (`architecture-core.md`
  §5.2.6, `architecture-front.md` §7.4).
- **User state:** should the state object in user-step-detail be refactored into user-state.ts
  consistent with customer manager?

## Inputs for Phase 1 and Phase 2

- **Roadmap §4** gives the Notes Editor's placement (`front/app/shell/`, workbench-only) and its three
  capabilities, each landing with the milestone that needs it: tags now, attachments with §5,
  device media with §7.
- **Undecided, gating scope:** are tags freeform (`Note.tags` is `string[]`) or drawn from a
  controlled set? Controlled fits `UiMultiSelect`; freeform needs a control the catalog lacks.
  `TagsField` in `ux/ui` would be Foundation and design-language work.
- **The Notes Editor replaces:**
  - the local `NoteEditor` inside `customer-step-sites.tsx`;
  - User Manager's notes text area, which flattens notes into a single note.
- **It rides with:** the backlog entry "Customer Manager cannot edit account-level notes", which
  adds `CustomerAdapter.notes` to `scopes.Customers.detail` and removes `notes` from its create
  defaults.
- **Form scopes** are the pattern any new form follows. The rules are in `architecture-core.md`
  §5.2.6; the maker is described in `architecture-front.md` §7.4.

## Open decisions

- **Additional-contact assignment:** build it before §5, or move it to a later milestone (EFFORT §7).
  Until then it blocks closing the §1 Users & Customers slice.
- **Phase 1 tags,** as above.

## Effort records

**Active briefs:**

- `2026-10-03-core-reconciliation-brief.md` — backlog. It reconciles `core/`, `architecture-core.md`,
  and CONVENTIONS; the three scope rules move to CONVENTIONS through it.
- `2026-08-23-devops-style-error-handling-brief.md` — backlog.
- `2026-08-16-ui-control-state-normalization-brief.md` — backlog.

**Backlog entries added in the closing thread:**

- "Customer Manager cannot edit account-level notes"
- "`core/`, `architecture-core.md`, and `CONVENTIONS.md` have never been reconciled"
- "The shared test configuration cannot bootstrap `api`"
- "Managers load only the first page of their Collection"
- "`app-style-guide` belongs in `ux/`, not `front/`" — now unblocked

**Uncommitted at handoff:**

- the closing move of the update-scopes brief;
- the test-configuration backlog entry;
- the reconciliation brief's path fix;
- this handoff.

## Working practices established

- **The CA opens work with a seed** (Mode / Context / Invariants, then "Prepare and enter decorum").
  The AA ingests, reports ready, and waits. The AA does not originate production scopes for ACE; a
  brief is the hand-off artifact.
- **Changes to `core/` and `domain/` are strict scrutiny.** Recover why the code is shaped the way
  it is (completed briefs, transcript search) before proposing a change.
- **Within one thread, a new session does not re-ingest invariants** unless the thread has been
  compacted since; after a compaction, re-ingest and say so. **One effort per thread**, with
  handoffs between threads.
- **Fix root causes, not symptoms.** The layer-6 finding came from asking what abstraction was
  missing, not which seam to patch.
- **The CA commits;** the AA never does.

## Suggested seed for the next thread

```
Mode: Exploration
Context: effort/active/2026-10-03-roadmap-handoff.md — Users
Invariants: AGENTS.md

Prepare and enter decorum
```

_End of Handoff_
