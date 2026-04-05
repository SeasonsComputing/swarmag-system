# swarmAg Operations System — AI Agent Protocol

## 1. Session Context

Every AI session begins by ingesting the following project assets. Ingest in order, then inform the Chief Architect and wait for tasks:

1. `CONSTITUTION.md`
2. `documentation/*.md`
3. `source/core/**/*.ts`
4. `source/domain/**/*.ts`

## 2. Mandatory Style-Guide Enforcement (Blocking)

For every code-generation or regeneration task in this repository, `documentation/style-guide.md` is a hard gate.

### 2.1 Non-negotiable rule

Treat any style-guide violation as a correctness failure. Do not proceed while violations exist.

### 2.2 Required workflow (every turn)

1. Confirm Session Context ingestion is complete before work begins.
2. For any production/regeneration task, execute the single authoritative production contract for that task (for example, `documentation/genesis-domain-archetypes.md` for domain archetype genesis).
3. Run the matching verification task for that production contract before reporting completion (for example, `deno task check:domain-genesis` for domain archetype genesis; otherwise run the relevant guard/check task set).
4. If any violation is found:
   - Report `STYLE_AUDIT: FAIL`
   - List violations with file and line
   - Fix them
   - Re-run audit
5. Only report completion when `STYLE_AUDIT: PASS`.

### 2.3 Blocking checks

- Enforce `documentation/style-guide.md` exactly as written.
- Treat `source/devops/guards/*.ts` as the executable enforcement layer for style and architecture checks.
- Do not duplicate style or archetype rules in AGENTS or prompts; reference foundation docs and guards only.
- If foundation rules change, update guards/tasks; do not fork rules into operational prompt docs.

### 2.4 Output contract (must be present in responses with code changes)

- `STYLE_AUDIT: PASS` or `STYLE_AUDIT: FAIL`
- If `FAIL`: violations list (`- path:line — rule — issue`)
- If `PASS`: brief confirmation of audited files

### 2.5 Sequenced generation rule

Do not request approval to continue when a generation phase fails checks. Fix and re-run to green first.
