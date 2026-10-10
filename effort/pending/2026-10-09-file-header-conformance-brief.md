# File Header Conformance — Brief

**Backlog, not dispatched.** Recorded 2026-10-09 from an AI Coding Engine audit, converted to a
brief by the AI Architect at the CA's direction. The audit records findings only and authorized no
repairs.

## What triggered it

The CA is preparing the repository for outside review. File headers are among the first things a
reviewer reads, and CONVENTIONS §6.3 holds that "a stale header is worse than no header". The CA
asked the AI Coding Engine to audit header conformance across `source/core`, `source/domain`,
`source/front`, `source/back`, and `source/ux`.

## The governing rules

- **CONVENTIONS §6.1 Spec files:** a file-header JSDoc.
- **CONVENTIONS §6.2 Functional files** ("where behavior matters and the public surface benefits
  from a documented contract"): a box header, then a PURPOSE subsection, then a PUBLIC subsection
  enumerating each exported symbol with its description on the same line. Box lines are of equal
  length, so the sides meet the corners.
- **CONVENTIONS §6.3:** subsection layout, and headers stay current.
- **CONVENTIONS §5.1:** the comment box is at most 80 characters.

## Findings (audit, 2026-10-09)

59 files violate, by primary category. Spec files with a file-header JSDoc were not treated as
functional files.

| Primary category                 | Files |
| -------------------------------- | ----: |
| Missing file-header comment      |     7 |
| Missing required header sections |     8 |
| Misaligned header box            |     2 |
| Incomplete PUBLIC inventory      |    42 |
| Total unique files               |    59 |

### Missing file-header comment (7)

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

Missing PUBLIC (`shell.ts` and `ui-helpers.ts` are conformant under Decision 4; they split PUBLIC
into named groups):

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

Headers that omit one or more exported symbols:

```text
source/core/api/api-contract.ts
source/core/cli/make-supabase-client.ts
source/core/std/wrap-http-handler.ts
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

Also, in files counted above:

- `source/core/cli/make-supabase-client.ts` lists obsolete `RpcSupabaseSpecification` and
  `EdgeSupabaseSpecification`.
- `source/core/std/wrap-http-handler.ts` places several symbol descriptions on the line after the
  symbol.

## Approach (CA, 2026-10-09)

A finding is resolved either by correcting the file or by augmenting CONVENTIONS where the rule
itself is unclear or wrong. CONVENTIONS should describe how headers are actually written: the CA has
bent headers to quiet mechanical checks that did not match his practice. Decision 4 is such a
rewrite, and clears two findings. Decision 2 adds work instead: the files using the JSDoc form gain
boxes.

The misaligned boxes, the obsolete entries, the descriptions on the wrong line, and the incomplete
PUBLIC inventories (Decision 1) are defects to correct in the file.

## Decisions (CA, 2026-10-09)

1. **PUBLIC lists every exported symbol, props types included.** A UI component's public interface
   includes its properties, so its props type belongs in PUBLIC, with its properties listed as
   members (Decision 5). Most of the 42 incomplete inventories are therefore corrected in the
   file.
2. **Every file header is a box header.** The CA's long-standing style; the §6.1 file-header JSDoc
   form is retired. About 44 files use it today and were outside the audit: `source/tests` (19),
   `source/devops` (11), `source/front` entry points and config (7), and six in `source/core/std`,
   `source/back`, and `source/ux`. Configuration and service-worker files (`vite.config.ts`,
   `sw.js`) take a box too. `source/devops/` follows `architecture-devops.md`'s conventions (the
   CONVENTIONS subset plus allowances), so the rule is stated there as well.
3. **`devops/` and `tests/` conform like product code.** The tooling allowances agreed 2026-09-24
   concern how tooling runs (direct runtime APIs, a local `lib/` barrel), not how it reads, so none
   exempts headers. The guards are functional files by any reading (2,285 lines; `guard-css.ts`
   alone about 600, with no header at all) and the repository's most distinctive quality
   assurance: executable conventions that a reviewer will open. Tests are read to judge rigor, and
   their headers say what a suite covers and how.
   - **Guards and scripts:** box, PURPOSE, and PUBLIC.
   - **Test fixtures:** box, PURPOSE, and PUBLIC; they export samples through `samples.ts`.
   - **Test cases:** box with title and one-line description; they export nothing, so PUBLIC
     would be empty.

   This brief does the `devops/` header work; the pending devops brief
   (`effort/pending/2026-08-23-devops-style-error-handling-brief.md`) is amended to say so.
4. **Headers are written in expanding levels,** in a fixed order: box, then PURPOSE, then PUBLIC
   or its groups, then any further sections.
   - **Level 1, every file:** a box with a title and a one-line description. Test cases stop here.
   - **Level 2, every file that exports something:** PURPOSE and PUBLIC, PUBLIC listing every
     export (Decision 1). The test is mechanical: a small component such as `panel-container.tsx`
     exports one, so it takes both.
   - **Level 3, complex files:** `shell.ts` is the reference: the old rule flagged it as missing
     PUBLIC for grouping its public surface. PUBLIC may be split
     into named groups for a large surface
     (`shell.ts`: ROUTE GRAMMAR, ROUTE FACTORY, ROUTE CONTENT; `ui-helpers.ts`: CONTROL SEMANTICS,
     TEXT CONVERSION), and named sections may follow PUBLIC as the material warrants (examples,
     design principles, error handling, flows). In source today, 175 headers carry PURPOSE and 172
     PUBLIC; about a dozen further section names appear in one file each.

   The re-audit also looks for headers bent to satisfy the old checks, and restores their natural
   form under these levels.
5. **Every container lists its members as a tree, and every entry is a name and a phrase.**
   - A container, whether of operations (`UiText`, `Routes`, a class) or of data (`UiTableProps`),
     lists its public members beneath it with `├` and `└`, aligned with the other entries.
   - Each entry, symbol or member, is its name and a phrase, not a sentence. Types, signatures, and
     values are left to the IDE; the header is the quick glance.
   - A type built by intersection lists its own members and one line naming what it extends (for
     example `& JSX.HTMLAttributes<HTMLTableElement>`), never the inherited members.
   - Explanation that a phrase cannot carry goes in a doc comment on the member.

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
   is green. The backlog entry "No guard enforces conformity to established conventions" covers the
   general case; this guard is one instance of it.
7. **`core/std`'s function modules name their families.** Within the mechanical header cleanup
   allowed in frozen `core/`, PUBLIC is split into named groups (Decision 4, level 3) so each
   module reads as a cohesive family:
   - **`validators.ts`:** PREDICATES (`is*`), EXPECTATIONS (`expect*`), NORMALIZERS (`to*`),
     RESULT (`notValid`, `expectValid`).
   - **`relations.ts`:** GUARDS (`isComposition*`), ACCESSORS (`demandOne`, `optionalOne`).

## Open

1. **Operating mode.** Comment-only edits, but across `core/` and `ux/`, both under strict
   scrutiny.

Decisions 1–5 interpret CONVENTIONS, a governance file; writing them into its text needs the CA's
authorization.

## Production scope (sketch)

First, the CONVENTIONS amendment rewriting §6 as Decisions 1–5, with the same rules in
`architecture-devops.md` (governance file: committed with the governance-gate bypass), then a
re-audit against it. Then bring each remaining file into conformance with the rules as settled: add missing
headers, add PURPOSE and PUBLIC where required, complete PUBLIC inventories (props types included, with member trees), remove obsolete
entries, realign the two boxes, and move descriptions onto their symbol's line. Comment-only:
no code changes. Last, the header guard (Decision 6), added to `deno task check`. Checks: `deno task check`, `deno task fmt:check`, `deno task test`, and
`STYLE_AUDIT`.

## Design history

- **Props in PUBLIC.** First recorded as one line per props type, with properties documented only
  on the type, to avoid a second copy that drifts. The CA judged that inconsistent with listing the
  members of operation containers: the header is the quick glance, and a component's props are
  what a consumer glances for. Drift moved from a policy to the guard (Open 1), and entries became
  name and phrase only, leaving types to the IDE (Decision 5).

_End of Brief_
