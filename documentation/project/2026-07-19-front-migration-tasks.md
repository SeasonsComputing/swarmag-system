# Foundation — `front/` Migration Task List (Phase 2)

**Date:** 2026-07-19
**Mode:** Foundation
**Status:** ENUMERATED — awaiting CA Phase 0 decisions and production go.
**Source design:** `documentation/project/2026-07-18-foundation-game-plan-design.md` (§2)

One mechanical Foundation migration, no functional changes, landing as a
single commit. Mapping (CA-authored): `source/ux` → `source/front`;
`common` → `ux`; `components` → `ui`; inner `ui` → `components`.

Reference-surface survey (2026-07-19, at `03a7214`): 3 alias lines in
`deno.jsonc`; 4 app `vite.config.ts` alias maps; 12 devops scripts and
7 guards with `ux` paths; 18 documentation files; 3 references each in
`STYLE-GUIDE.md` and `AGENTS.md`; `CONSTITUTION.md` clean.

## Phase 0 — Decisions (CA)

- [x] Target tree + mapping approved (game plan §2, ratified 2026-07-18)
- [x] Consumer barrel aliases confirmed (CA 2026-07-19): `@front/` (root),
      `@front/api`, `@front/ux/ui`
- [x] Doc rename scope confirmed (CA 2026-07-19): `architecture-ux.md` →
      `architecture-front.md`; `documentation/ux/` folder and `ux-*` files
      keep their names, content patched
- [x] AGENTS.md edit consent granted (CA 2026-07-19), scoped to path
      references only
- [x] STYLE-GUIDE.md §3.1/§3.2 alias tables update approved
- [x] Production go order issued 2026-07-19 ("Go get it")

## Task Group A — Tree Migration (git mv)

- [x] `source/ux` → `source/front`
- [x] `source/front/common` → `source/front/ux`
- [x] `source/front/ux/components` → `source/front/ux/ui`
- [x] `source/front/ux/ui/ui` → `source/front/ux/ui/components`
- [x] Moves executed as `git mv` — commit diff shows renames

## Task Group B — Build Wiring

- [x] `deno.jsonc`: `@ux/` → `@front/`; barrels `@front/api`,
      `@front/ux/ui` → `source/front/ux/ui/components/ui.ts`
- [x] Four `vite.config.ts` alias maps rewritten (incl. backslash-escaped
      regex forms). Found + fixed in passing: app-style-guide carried a
      stale alias to a nonexistent `forms/` barrel — repathed to
      `@front/ux/ui/forms` (still dormant until a forms dir exists)
- [x] `.claude/launch.json` entries valid (task names unchanged)

## Task Group C — DevOps

- [x] 12 scripts under `source/devops/scripts/` repathed
- [x] 7 guards repathed; `guard-ux-state.ts` → `guard-front-state.ts`
      (file + task name `guard:front-state`); guard error-message prose
      (`@ux-api` hints) modernized to `@front/...`
- [x] Guard suite green against the new tree

## Task Group D — Source Import Rewrite

- [x] 234 tracked files swept; all `@ux/...` specifiers → `@front/...`;
      barrel imports → `@front/ux/ui`; relative `../../common/...` icon
      urls in `user-manager.css` → `../../ux/ui/icons/`
- [x] One rider fix forced by the move: deno lint's `jsx-curly-braces`
      began flagging the roles-comma `{', '}` under the new path — replaced
      with a conditional expression (same rendered output, dprint-safe)

## Task Group E — Documentation (delegated)

- [x] Living docs patched: architecture (3), ux guides (4), agent genesis
      docs (2); `documentation/project/` history left verbatim
- [x] `architecture-ux.md` → `architecture-front.md` (git mv) + content,
      title, and normative tree patched to the implemented structure —
      ACE's drift closed
- [x] `AGENTS.md` context tables patched (under explicit CA consent)
- [x] `STYLE-GUIDE.md` §3.1/§3.2 alias tables updated; `@front/ux/ui`
      barrel row added
- [x] Verified: zero `source/ux` / `@ux/` / `architecture-ux` hits across
      living docs

## Task Group F — Namespace Dependency Guard (delegated)

- [x] `guard-namespaces.ts` created following house guard pattern; wired
      as `guard:namespaces` into the `check:guards` chain
- [x] Rule 1 (Seasons seam): `front/ux/ui` imports only Solid/Kobalte/
      Chart.js/`@core/std(x)`/assets/relative — enforced
- [x] Rule 2: shared layers + `front/api` never import `@front/app-*` —
      enforced
- [x] Rule 3: no app-to-app imports — enforced
- [ ] Rule 4 (widgets must not import shell): **disabled with TODO(CA)** —
      current tree violates it: `front/ux/widgets/brand-widget.tsx` imports
      `@front/ux/shell/shell-metadata.ts`. CA decision needed: relocate
      shell-metadata (config?), accept the edge, or refactor the widget

## Incident — delegate git-restore collateral (recovered)

The docs delegate ran a git restore that reverted files beyond its scope:
the three Phase 1 project docs' close-out status blocks and the already-
swept `guard-architecture.ts` (whose old `/source/ux` paths made its checks
silently vacuous — it "passed" while checking nothing). All four recovered
and re-verified same session; `guard-architecture.ts` additionally got its
internal layer identifier renamed `ux` → `front` (`checkFrontImports`).
Lesson recorded: delegate prompts must forbid git write commands.

## Task Group G — Verification

- [x] `deno task check` green — all 12 guards incl. `guard:namespaces` +
      types + lint, 185 files
- [x] `deno task test` at baseline (25 pass; pre-existing
      `users-api-test.ts` env failure only)
- [x] `deno task fmt` applied throughout
- [x] Package builds green: app-admin (stage, `PACKAGE_VERIFY=PASS`),
      app-customer, app-ops
- [x] Live smoke (CA restarted server, agent drove CA browser): auth
      session intact, User Manager opens (5 users), autofocus on Name,
      4 required marks, sticky header active, Escape dismisses, zero
      console errors — full Phase 1 feature set verified on migrated tree
- [ ] Stage deploy at CA discretion (not required for the migration commit)

## Post-close

- [ ] Agent memory files updated to `front/` paths
- [ ] This ledger closed with the migration commit hash

---

_End of Task List_
