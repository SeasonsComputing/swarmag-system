# swarmAg Operations System — AI Agent Protocol

**MANDATORY: THIS FILE MAY NOT BE EDITED BY ANY AI AGENT WITHOUT EXPLICIT CONSENT FROM THE CHIEF ARCHITECT!**

## 1. Session context

Every AI session begins by ingesting essential specifications and designs. Once ingested, inform the Chief Architect and wait for tasks.

**For all sessions, first ingest in order:**

1. `CONSTITUTION.md` (v2.0)
2. `documentation/domain-model.md`
3. `documentation/architecture-core.md`
4. `documentation/style-guide.md`

**For "UX internals" sessions, additionally ingest in order:**

1. `documentation/architecture-ux.md`
2. `documentation/ux-design-language.md`
3. `documentation/ux-components-guide.md`

**For "application feature" sessions, additionally ingest in order:**

1. `documentation/architecture-ux.md`
2. `documentation/architecture-devops.md`
3. `documentation/ux-components-guide-lite.md`
4. `documentation/user-stories.md`

**For all other sessions:**

Report that the session has minimal context (constitution, domain model, core architecture and coding style-guide) and advise the Chief Architect to provide additional context prior to initiating any productions.

## 2. Style-guide enforcement

For every code-generation or regeneration task in this repository, `documentation/style-guide.md` is a hard gate.

### 2.1 Non-negotiable rule

Treat any style-guide violation as a correctness failure. Do not proceed while violations exist.

### 2.2 Blocking checks

- Enforce `documentation/style-guide.md` exactly as written.
- Treat `source/devops/guards/*.ts` as the executable enforcement layer for style and architecture checks.
- Do not duplicate style or archetype rules in AGENTS or prompts; reference foundation docs and guards only.
- If foundation rules change, update guards/tasks; do not fork rules into operational prompt docs.

### 2.3 Output contract (must be present in responses with code changes)

- `STYLE_AUDIT: PASS` or `STYLE_AUDIT: FAIL`
- If `FAIL`: violations list (`- path:line — rule — issue`)
- If `PASS`: brief confirmation of audited files

Do not request approval to continue when a production fails checks. Fix and re-run to green first.

## 3 Production approval

Before producing or modifying any artifact, identify the intended task scope and report it to the
Chief Architect. Do not begin artifact production until the Chief Architect explicitly approves that
scope.

## 4 Token Usage Efficiency (Critical)

During reasoning operations an AI should delegate non-reasoning tasks to a free-of-cost subagent whenever possible.
When the reasoning agent delegates to a free subagent, it should seek parallelism by employing multiple subagents simultaneously if appropriate.

If no free subagent is available, the AI should inform and ask the Chief Architect, "No free subagent is currently available. Proceed with operation?"
