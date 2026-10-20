# File Header Conformance — Brief

**Active.** Chosen 2026-10-19 for roadmap §5 Mechanical Productions; rides along since 2026-10-20:
copied files carry their headers, so the reference implementations conform before they are
replicated. Worked by the CA and AI Architect directly from 2026-10-20, without an AI Coding
Engine review cycle. Recorded 2026-10-09 from an AI Coding Engine audit, converted to a brief by
the AI Architect at the CA's direction. The audit records findings only and authorized no repairs.

## What triggered it

The CA is preparing the repository for outside review. File headers are among the first things a
reviewer reads, and CONVENTIONS §6.3 holds that "a stale header is worse than no header". The CA
asked the AI Coding Engine to audit header conformance across `source/core`, `source/domain`,
`source/front`, `source/back`, and `source/ux`.

## The governing rules

CONVENTIONS §5.1 (exported type comments, the 80-character box) and §6 (file headers, PUBLIC,
header rules). §6 was rewritten on 2026-10-20 from Decisions 1–5 below. CONVENTIONS 1.1 carries
every CONVENTIONS change of this roadmap §5 window, so its amendment record is finished when the
window closes.

## Scope

Product code: `source/core`, `source/domain`, `source/front`, `source/back`, and `source/ux`.
`source/devops/` and `source/tests/` follow the same rules (Decision 3); their conformance is
deferred to `effort/pending/2026-08-23-devops-style-error-handling-brief.md` (2026-10-20).

## Status (2026-10-20)

| Category                         | Audit 2026-10-09 | Now                                                      |
| -------------------------------- | ---------------: | -------------------------------------------------------- |
| Missing file-header comment      |                7 | Done: level 1 boxes (`bb484ce`)                          |
| Missing required header sections |                8 | 6 open; `shell.ts` and `ui-helpers.ts` conform (level 3) |
| Misaligned header box            |                2 | Done 2026-10-09                                          |
| Incomplete PUBLIC inventory      |               42 | 39 open; three resolved (below)                          |
| JSDoc file header (Decision 2)   |              ~44 | 15 in product code                                       |
| Uncommented exported type (§5.1) |                — | 2 open: `Adapter<T>` (`make-adapter.ts`), `IndexedDb`    |

The JSDoc headers in product code: `core/std/std.ts`, `core/std/stdx.ts`,
`back/supabase-edge/config/supabase-config.ts`, `back/supabase-edge/config/build-meta.ts`, the four
`front/app-*/app.tsx`, `front/app/views/job-views.ts`, `front/app/widgets/widget-registry.ts`,
`front/config/ux-config.ts`, `front/api/queries.ts`, `ux/ui/css/css.tsx`,
`ux/ui/components/ui.ts`, and `ux/shell/dashboard/dashboard-contract.ts`.

## Findings (audit, 2026-10-09)

Recorded as found. Spec files with a file-header JSDoc were not treated as functional files.

### Missing file-header comment (7)

**Done 2026-10-20** (`bb484ce`): level 1 boxes. They are used only by packaging or the runtime, so
they stop at level 1 (Decision 4).

```text
source/front/app-admin/sw.js
source/front/app-admin/vite.config.ts
source/front/app-customer/sw.js
source/front/app-customer/vite.config.ts
source/front/app-ops/sw.js
source/front/app-ops/vite.config.ts
source/front/app-style-guide/vite.config.ts
```

### Missing required header sections (8)

Missing PURPOSE and PUBLIC:

```text
source/front/app-style-guide/style-guide.tsx
source/ux/shell/panel/panel-container.tsx
source/ux/shell/panel/panel-form.tsx
source/ux/shell/panel/panel-header.tsx
source/ux/shell/panel/panel-list.tsx
```

Missing PUBLIC (`shell.ts` and `ui-helpers.ts` conform at level 3: named groups replace PUBLIC):

```text
source/ux/shell/panel/panel-stepflow.tsx
source/ux/shell/runtime/shell.ts
source/ux/ui/components/ui-helpers.ts
```

### Misaligned header box (2)

**Fixed 2026-10-09, outside this brief, at the CA's direction.** A scan of every box header in
`source/` found 21 nonconforming boxes: these two, ten more misaligned (nine `devops/scripts`,
`user-manager.css`), and nine aligned but 79 characters wide (`core/api`, `core/cli`,
`wrap-http-handler.ts`, `roles.css`, `tokens.css`). All 21 were normalized to the 80-character box;
only padding and border length changed.

- `source/core/db/indexeddb.ts`: a body line is 81 characters against 80-character borders, also
  over the §5.1 limit.
- `source/ux/shell/runtime/shell-metadata.ts`: body lines are 80 characters against 79-character
  borders.

### Incomplete PUBLIC inventory (42)

Headers that omit one or more exported symbols. Core API Dissolution relocated
`source/core/api/api-contract.ts` to `source/core/std/api-contracts.ts`; the audit paths are
retained.

Resolved:

- `source/core/api/api-contract.ts`: its header at `api-contracts.ts` now lists every export.
- `source/core/cli/make-supabase-client.ts`: resolved 2026-10-11 by the list-query production
  (`effort/completed/2026-10-11-list-query-brief.md`, production review correction 4).
- `source/core/std/wrap-http-handler.ts`: resolved 2026-10-20. The `HEADER_*` constants gained an
  HTTP HEADER NAMES group; its first group was retitled from PUBLIC to HTTP PRIMITIVES. Its
  descriptions on `→` lines beneath each entry are the level 3 standard, not a defect.

Open:

```text
source/domain/protocols/workflow-protocol.ts
source/front/app-style-guide/style-guide-fixtures.ts
source/ux/shell/dashboard/dashboard-state.ts
source/ux/shell/runtime/app-state.ts
source/ux/shell/runtime/auth-guard.tsx
source/ux/shell/runtime/session-state.ts
source/ux/shell/workbench/abstraction-manager.tsx
source/ux/ui/components/ui-accordion.tsx
source/ux/ui/components/ui-action-button.tsx
source/ux/ui/components/ui-alert.tsx
source/ux/ui/components/ui-avatar.tsx
source/ux/ui/components/ui-badge.tsx
source/ux/ui/components/ui-button.tsx
source/ux/ui/components/ui-card.tsx
source/ux/ui/components/ui-checkbox.tsx
source/ux/ui/components/ui-collection-cursor.tsx
source/ux/ui/components/ui-dialog.tsx
source/ux/ui/components/ui-field.tsx
source/ux/ui/components/ui-fieldset.tsx
source/ux/ui/components/ui-footer.tsx
source/ux/ui/components/ui-form-actions.tsx
source/ux/ui/components/ui-input.tsx
source/ux/ui/components/ui-layout.tsx
source/ux/ui/components/ui-list.tsx
source/ux/ui/components/ui-multi-select.tsx
source/ux/ui/components/ui-popover.tsx
source/ux/ui/components/ui-progress.tsx
source/ux/ui/components/ui-radio-group.tsx
source/ux/ui/components/ui-separator.tsx
source/ux/ui/components/ui-single-select.tsx
source/ux/ui/components/ui-skeleton.tsx
source/ux/ui/components/ui-spinner.tsx
source/ux/ui/components/ui-table.tsx
source/ux/ui/components/ui-tabs.tsx
source/ux/ui/components/ui-text-area.tsx
source/ux/ui/components/ui-toggle-group.tsx
source/ux/ui/components/ui-toggle.tsx
source/ux/ui/components/ui-tooltip.tsx
source/ux/widgets/helm-widget.tsx
```

## Approach (CA, 2026-10-09)

A finding is resolved either by correcting the file or by augmenting CONVENTIONS where the rule
itself is unclear or wrong. CONVENTIONS should describe how headers are actually written: the CA has
bent headers to quiet mechanical checks that did not match his practice. Decision 4 is such a
rewrite, and clears two findings. Decision 2 adds work instead: the files using the JSDoc form gain
boxes. A rule does not invalidate what is there today, except broken headers.

The misaligned boxes, the obsolete entries, and the incomplete PUBLIC inventories (Decision 1) are
defects to correct in the file.

## Decisions (CA, 2026-10-09; revised 2026-10-20)

1. **PUBLIC lists every exported symbol, props types included.** A UI component's public interface
   includes its properties, so its props type belongs in PUBLIC, with its properties listed as
   members (Decision 5). Most incomplete inventories are therefore corrected in the file.
2. **Every file header is a box header.** The CA's long-standing style; the file-header JSDoc form
   is retired. Configuration and service-worker files (`vite.config.ts`, `sw.js`) take a box too.
3. **`devops/` and `tests/` conform like product code.** The tooling allowances agreed 2026-09-24
   concern how tooling runs (direct runtime APIs, a local `lib/` barrel), not how it reads, so none
   exempts headers. Guards and scripts take box, PURPOSE, and PUBLIC; test fixtures the same;
   test cases export nothing and stop at level 1. Their conformance, and stating the rules in
   `architecture-devops.md`, are deferred to the devops brief (Scope).
4. **Headers are written in expanding levels,** in a fixed order: box, then PURPOSE, then PUBLIC
   or its groups, then any further sections.
   - **Level 1, every file:** a box with a title and a one-line description. Test cases and files
     used only by packaging or the runtime stop here.
   - **Level 2, every file another module imports:** PURPOSE and PUBLIC, PUBLIC listing every
     export (Decision 1). A small component such as `panel-container.tsx` is imported, so it takes
     both.
   - **Level 3, complex files:** named groups replace the PUBLIC heading, and named sections may
     follow them as the material warrants (examples, design principles, flows).
     `@core/std/wrap-http-handler.ts` is the reference; in this repository `shell.ts` (SHELL
     COMPOSITION, ROUTE GRAMMAR, ROUTE CONTENT, ROUTE FACTORY) and `ui-helpers.ts` (CONTROL
     SEMANTICS, TEXT CONVERSION) also conform.

   The re-audit also looks for headers bent to satisfy the old checks, and restores their natural
   form under these levels.
5. **Every container lists its members as a tree, and every entry is a name and a brief
   description.**
   - A container, whether of operations (`UiText`, `Routes`, a class) or of data (`UiTableProps`),
     lists its public members beneath it with `├` and `└`, aligned with the other entries.
   - A type built by intersection lists its own members and one line naming what it extends (for
     example `& JSX.HTMLAttributes<HTMLTableElement>`), never the inherited members.
   - Explanation that a description cannot carry goes in a doc comment on the member.

   ```text
   UiText               Text conversions for control values and display text.
   ├ optional           Blank text to undefined.
   ├ number             Text to number.
   ├ label              kebab-case to display text.
   ├ untitled           Blank value to a consumer-supplied label.
   └ from               Number to text.
   ```
6. **A header guard enforces Decisions 1–5.** It checks box alignment and the 80-character limit,
   the level each file requires, the section order, PUBLIC (or its groups) naming every export,
   and each container's tree naming exactly its own members. With member trees, the guard is what
   keeps headers from drifting from their types. It lands last, after the repair, so its first run
   is green, and covers product code; `devops/` and `tests/` join when the devops brief lands. The
   backlog entry "No guard enforces conformity to established conventions" covers the general
   case; this guard is one instance of it.
7. **`core/std`'s function modules name their families.** Within the mechanical header cleanup
   allowed in frozen `core/`, PUBLIC is split into named groups (Decision 4, level 3) so each
   module reads as a cohesive family:
   - **`validators.ts`:** PREDICATES (`is*`), EXPECTATIONS (`expect*`), NORMALIZERS (`to*`),
     RESULT (`notValid`, `expectValid`).
   - **`relations.ts`:** GUARDS (`isComposition*`), ACCESSORS (`demandOne`, `optionalOne`).

## Production scope (sketch)

Done: CONVENTIONS §5.1 and §6 (version 1.1), the seven level 1 headers, and the
`wrap-http-handler.ts` header.

Remaining, product code only: re-audit against CONVENTIONS 1.1, then bring each file into
conformance. Add PURPOSE and PUBLIC where required, complete PUBLIC inventories (props types
included, with member trees), convert the 15 JSDoc headers to boxes, and comment the two exported
types. Comment-only: no code changes. Last, the header guard (Decision 6), added to
`deno task check`. Checks: `deno task check`, `deno task fmt:check`, `deno task test`, and
`STYLE_AUDIT`.

## Design history

- **Props in PUBLIC.** First recorded as one line per props type, with properties documented only
  on the type, to avoid a second copy that drifts. The CA judged that inconsistent with listing the
  members of operation containers: the header is the quick glance, and a component's props are
  what a consumer glances for. Drift moved from a policy to the guard (Decision 6), and entries
  became name and phrase only (Decision 5).
- **Level 2 is for imported files (2026-10-20).** First written as "every file that exports
  something". The `vite.config.ts` files have a default export but are read only by packaging, so
  the CA placed them at level 1; level 2 now names files another module imports.
- **`wrap-http-handler.ts` is the level 3 standard (2026-10-20).** First listed as a defect for
  descriptions on the line after each symbol, and Decision 5 first held entries to "a name and a
  phrase, not a sentence", leaving types and signatures to the IDE. The CA judged the header
  objectively outstanding: CONVENTIONS now describes it, entries are a name and a brief description,
  and named groups replace the PUBLIC heading at level 3.
- **One CONVENTIONS version for the window (2026-10-20).** This brief first planned its own
  CONVENTIONS amendment. The rewrite landed with the CONVENTIONS reconciliation and Containers in
  CONVENTIONS under a single version, 1.1, for this roadmap §5 window.
- **`devops/` and `tests/` deferred (2026-10-20).** This brief first carried their header work,
  taken over from the devops brief on 2026-10-09; it has returned there.

_End of Brief_
