# swarmAg Operations System — AI Agent Protocol

**MANDATORY: THIS FILE MAY NOT BE EDITED BY ANY AI AGENT WITHOUT EXPLICIT CONSENT FROM THE CHIEF ARCHITECT!**

## 1. Session Context

Every AI session begins by ingesting the following project assets. Ingest in order, then inform the Chief Architect and wait for tasks:

1. `CONSTITUTION.md`
2. `documentation/domain-model.md`
3. `documentation/architecture-core.md`
4. `documentation/style-guide.md`
5. `source/domain/abstractions/*`
6. `source/core/**/*`

**For UX-focused sessions, additionally ingest in order:**

1. `documentation/architecture-ux.md`
2. `documentation/ux-design-language.md`
3. `source/ux/common/assets/css/*`
4. `source/ux/common/components/**/*`
5. `source/ux/common/stores/*`
6. `source/ux/common/views/*`
7. `source/ux/api/*`

**For all other sessions:**

Report that the session has minimal context (constitution, domain model abstractions and core architecture) and advise the Chief Architect to provide additional context prior to initiating any productions.

## 2. Mandatory Style-Guide Enforcement (Blocking)

For every code-generation or regeneration task in this repository, `documentation/style-guide.md` is a hard gate.

### 2.1 Non-negotiable rule

Treat any style-guide violation as a correctness failure. Do not proceed while violations exist.

### 2.2 Required workflow (Every turn)

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

Do not request approval to continue when a generation phase fails checks. Fix and re-run to green first.

### 2.5 Preproduction Approval (Mandatory)

Before producing or modifying any artifact, identify the intended task scope and report it to the
Chief Architect. Do not begin artifact production until the Chief Architect explicitly approves that
scope.

### 2.6 Token Usage Efficiency

During reasoning operations an AI should delegate non-reasoning tasks to a free-of-cost subagent whenever possible.
When the reasoning agent delegates to a free-subagent, it should seek parallelism by employing multiple subagents simultaneously if appropriate.

If no free-subagent is available, the AI should ask the Chief Architect for permission to perform the task itself.
