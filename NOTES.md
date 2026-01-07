# swarmAg System - Working Notes

Last updated: 2026-01-07

## 1. Purpose

- Working log and agent handoff context.
- Summaries of key conversations and decisions.
- Not canonical; authoritative docs are `README.md` and `docs/foundation/architecture.md`.

## 2. Conversation summary template

- YYYY-MM-DD: Short title or focus.
  - Context: 1-2 sentence summary of the problem or intent.
  - Decisions: bullet list of concrete choices made.
  - Actions taken: bullet list of changes applied (files or commands).
  - Follow-ups: bullet list of open questions or next steps.

This file summarizes the current baseline so it can be restored after tool resets.

## 3. Conversation summaries

- 2026-01-07: Doc hygiene and authority updates.

  | Item | Details |
  | ---- | ------- |
  | Notes | Reorganized `NOTES.md` to keep only the handoff sections and moved recent changes into the timeline. |
  | Architecture | Added local dev helpers, DBeaver connection details, and the migrations symlink note to `docs/foundation/architecture.md`. |
  | Authority | Moved collaboration preferences into `AUTHORITY.md` and added the "no multiple consecutive blank lines" rule. |
  | README | Removed the setup/collaboration sections and pointed to `AUTHORITY.md` for collaboration preferences. |

- 2026-01-06: Netlify adapter expansion and lint cleanup.

  | Item | Details |
  | ---- | ------- |
  | Netlify adapter | Expanded `source/serverless/lib/netlify.ts` with CORS, request parsing, size limits, header normalization, and standardized responses. |
  | API bindings | Added `isHttpMethod` and `payloadTooLarge` (413) to `source/serverless/lib/api-binding.ts`. |
  | Docs | Cleaned markdown lint warnings in `docs/history/tedvkremer-experience.md` (headings, labels, links). |
  | Follow-up | The most recent edit after the expansion was a small JSDoc addition. |

- 2026-01-06: Authority rules and session hygiene updates.

  | Item | Details |
  | ---- | ------- |
  | Authority | Created `AUTHORITY.md`, refined rules (class usage, conflict order, doc table/list preference, no new patterns), and added domain → API → apps sequencing. |
  | Docs | Added “Software Construction Sessions” prompt to `README.md` and switched the file ingest list to an ordered list. |
  | History | Rewrote recent commit messages via interactive rebase and force-pushed updated history. |

- 2026-01-05: Doc refactor alignment. We agreed the docs were strong but scattered, and that the system is best framed as four products (SDK, Admin, Ops, Customer) plus a platform/architecture layer. Decisions:
  - Keep `NOTES.md` as the agent handoff and institutional memory log; it should be comprehensive, not minimal, and include summaries of our conversations.
  - Retire `docs/orchestration.md` and move phase sequencing/roadmap into `README.md` (README is the "current state" entry point).
  - Keep `docs/foundation/architecture.md` as the master, stable architecture doc; it should avoid becoming a dumping ground and should change rarely.
  - `docs/foundation/domain.md` remains the canonical domain definition; `docs/foundation/architecture.md` should link to it rather than duplicate domain rules.
  - App briefs (`docs/applications/admin-web-app.md`, `docs/applications/ops-mobile-app.md`, `docs/applications/customer-portal.md`) remain product-specific and should not repeat platform/domain.
  - `docs/foundation/data-lists.md` stays as canonical catalogs, referenced by domain.
  - `NOTES.md` should reference canonical docs (`README.md`, `docs/foundation/architecture.md`) and capture any ongoing decisions or context for future agents.
  - The preferred doc layout is: `README.md` (start + roadmap), `docs/foundation/architecture.md` (platform + system + SDK conventions), `docs/foundation/domain.md` (domain rules), app briefs, `docs/foundation/style-guide.md`, `docs/foundation/data-lists.md`, `docs/applications/user-stories.md`, `NOTES.md` (working log).
  - Moved the historical seed prompt to `docs/history/swarmag-ops-meta-prompt.md` and marked it non-authoritative.
- 2026-01-05: Documentation structure refined into `docs/foundation/` and `docs/applications/`, with `docs/history/` for provenance. Updated all references and README summary accordingly.
- 2026-01-05: README trimmed to be a start-here entry point. Moved domain notes into `docs/foundation/domain.md`, added links from `docs/foundation/architecture.md` to domain and style guide, and kept only minimal quickstart commands in README.
- 2026-01-05: Moved setup/build/test instructions out of `README.md` into `docs/foundation/architecture.md` under a local development quickstart section. README now links to architecture for setup.
- 2026-01-05: Always number markdown sections and ensure markdown files are free of lint warnings (e.g., table alignment).
- 2026-01-05: Added markdownlint config and ignore list, fixed a bare URL and table alignment in `docs/history/swarmag-ops-meta-prompt.md`, and verified markdownlint passes.
- 2026-01-05: Moved API handler conventions and validation rules into `docs/foundation/architecture.md` section 6, and kept the API surface summary in `docs/foundation/domain.md` section 1.8.
