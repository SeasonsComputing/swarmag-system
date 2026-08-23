# DevOps Style Conformance & Shared Error Handling — Backlog Brief

**Backlog, not dispatched.** Captured at the close of a session that investigated
a recurring phantom-directory bug (empty directories reappearing at the exact
path of files retired by past refactors — `runtime-provider.ts`,
`common-protocol.ts`, `supabase-import-map.json`, months apart). The mechanism
was never pinned down — git itself, every in-repo `Deno.mkdir` call, and cloud
sync were all ruled out by direct inspection; what's left is outside this
session's visibility (editor/LSP/agent-tooling state) and would need live
instrumentation (`fs_usage`) to catch definitively.

That investigation surfaced the real, actionable finding: `source/devops/`
carries none of the discipline `domain/` and `front/` get. STYLE-GUIDE §1
claims to be authoritative "throughout the codebase," but nothing checks that
claim against devops — there is no `guard-devops-style.ts` the way
`guard-domain-style.ts` exists for domain.

## What's actually true about devops today (verified, not assumed)

- 11 of 12 TypeScript devops scripts already use the box-header/PURPOSE/PUBLIC
  convention (`edge-sync.ts` is the one outlier).
- Zero raw `Record<string,...>` or `Set<...>` outside `@core/std` — the
  primitive-type discipline (STYLE-GUIDE §8.1) is already followed.
- `dprint`'s excludes are just binary/vendor assets — formatting already
  applies repo-wide, devops included.
- The real, concentrated gap is STYLE-GUIDE §9 ("Never swallow errors
  silently... log and throw, or throw without logging"): **15+ bare
  `catch {}` / `.catch(() => {})` blocks across 8 of the 12 scripts**, every
  one discarding the error's type entirely.
- `source/tests/` has zero instances of this pattern today (checked). No live
  need there — see the `tests/lib` note below.

## Two principles agreed this session — proposed for STYLE-GUIDE, not this repo alone

CA's framing: STYLE-GUIDE and CONSTITUTION are meant to travel across every
project CA has authority over, past and future (a standing docs/src/tests/devops
top-level namespace pattern, soon adding `effort/`). CONSTITUTION.md already
achieves this — it contains zero swarmAg-specific content today. STYLE-GUIDE
isn't there yet (§10-11 are Postgres/Supabase schema conventions with
swarmAg's literal domain topics baked into section ordering) — that's a
separate, larger, later problem, not in scope here. These two principles
belong in STYLE-GUIDE now, worded at the portable altitude, not the
project-specific one:

**1. Tooling namespaces get looser runtime-API constraints than product
namespaces.** `devops` and `tests` each run in one fixed, known host
environment (the CLI / test runner) and were never trying to be portable
across deployment targets the way product code is — so they may call their
host runtime's native API directly, unabstracted. This is the general form of
"use `Deno.*` directly in devops scripts"; "Deno" is just this project's
current instantiation of "host runtime." **Concrete consequence found tonight:
§8.5 currently reads as universal** ("Never access `Deno.env` or
`import.meta.env` directly. Always go through `Config.get()`.") — that rule is
scoped to product namespaces (front/back/domain) and needs the tooling
carve-out written in explicitly; it was never meant to bind devops/tests, but
says nothing today to that effect.

**2. A non-product, tooling-shaped namespace may have its own local,
topic-free utility layer as a barrel — independently, with no lateral
dependency edge to its peers.** This is not the same move as the domain/
validator-registry idea rejected earlier tonight — that was rejected because
it would be _topic-aggregation_ (crossing every business-topic namespace at
once, incompatible with domain's genesis-regenerability and per-topic
isolation). `devops/lib` is _topic-free utility_, structurally identical in
kind to `@core/std` — nothing in it belongs to any one script's concern.
`guard-architecture.ts`'s `ALLOWED_DEPS` graph has zero lateral edges anywhere
today (every relationship flows toward `core`/`external`); this principle
doesn't add one. If a helper is ever needed by both `devops` and `tests`, it
promotes to `@core/std`/`@core/stdx` (the shared ancestor both already reach),
not a new devops↔tests edge.

`tests/lib` is pre-authorized by this same principle, for whenever tests
accumulates real duplication — **not built now**, since there's nothing to put
in it today (zero repeated custom pattern found; `source/tests/cases/` is 4
files using plain `@std/assert`). Building it empty would repeat the
`make-validator.ts` mistake — a lib with no content isn't a forward
declaration, it's a placeholder waiting for a justification that doesn't exist
yet.

## Devops error-handling: two shapes, not one

Surveyed, not invented — the repetition sorts cleanly into two distinct
helpers. Do not force them into one shape.

**Best-effort cleanup** — try an operation; an expected failure means "already
in the state I wanted," anything else is worth surfacing. CA's sketch:

```ts
try {
  ...
} catch (error) {
  if (isFileError(error, ['not-exists'])) return
  console.error(...)
  throw error
}
```

Should key on Deno's own typed error classes (`Deno.errors.NotFound`, etc.),
not an invented string-tag vocabulary — nothing in these scripts uses any
runtime-abstraction layer, they call `Deno.*` directly throughout, so a string
tag would be the one indirection in the file for no portability benefit.
Direct matches: `edge-sync.ts:98`, and two sites in `smoke-ux.ts`'s `stop()`
(`child.kill()`, `Deno.remove(userDataDir)` — that method already hand-writes
the intent as comments, `// already stopped`, `// ignore process shutdown
races`, because there's no shared vocabulary to say it once).

**Existence-check-as-boolean** — try a read/stat, turn failure into
`false`/`undefined`/a fallback. Sites: `gen-id-seeds.ts:fileExists`,
`db-genesis.ts` (×2), `smoke-ux.ts`'s candidate-path probe,
`db-genesis-verify.ts`/`validate-secrets.ts` read-with-fallback.

One open question not settled: one file (`devops/lib/fs-errors.ts`) or two,
given the two shapes. Small enough for one; may want splitting if more
accretes.

## Full retrofit surface (8 of 12 TS devops scripts)

`edge-sync.ts` (1 site + missing header), `gen-id-seeds.ts` (1),
`db-genesis.ts` (3), `db-genesis-verify.ts` (1), `list-netlify-targets.ts` (2),
`list-supabase-targets.ts` (2), `validate-secrets.ts` (1), `smoke-ux.ts` (6+).
`.sh` scripts are out of scope — STYLE-GUIDE governs TypeScript, not shell.

## Sequencing (CONSTITUTION §8 — documentation leads code)

1. Update `STYLE-GUIDE.md` with the two principles above, and the §8.5
   tooling-namespace carve-out.
2. Update `architecture-devops.md` to describe the `devops/lib` layer as
   target structure (matching how `architecture-front.md` already documents
   unbuilt directories as normative target, not drift). **Whoever drafts
   this needs explicit authorization — foundational documentation is CA's
   call**, not something ACE/AA assumes by default.
3. Build `source/devops/lib/` to match — the two helpers above.
4. Add the `@devops/lib` barrel entry to STYLE-GUIDE §3.2's table
   (`source/devops/lib/lib.ts`, same form as `@core/std`).
5. Retrofit the 8 scripts listed above against the new helpers.
6. Add `guard-devops-style.ts` (mirroring `guard-domain-style.ts`) **last**,
   after the retrofit — not right after the doc. A guard added before the
   retrofit sits red for the whole retrofit window, which caused real
   friction earlier this same session with `guard:leaf`. First run should be
   green.

## Checks

`deno task fmt`, `deno task check`, `deno task test` after each of steps 3, 5,
and 6.

_End of Backlog Brief_
