# swarmAg Operations System — AI Agent Protocol (2.0)

**MANDATORY: THIS FILE MAY NOT BE EDITED BY ANY AI AGENT WITHOUT EXPLICIT CONSENT FROM THE CHIEF ARCHITECT!**

## 1. Operating Session

Operating sessions are characterized by seeding the session content, declaring the operating mode, and assigning the session to an AI agent.

### 1.1 Session Context

Session context is scoped by the category of work to be done. This allows the AI agent to focus on the relevant context for the task at hand.

**Prerequisite Ingestion**

Every session begins with `CONSTITUTION.md` (v2.0). All dialog and production must remain within its invariants, constraints, and authority boundaries.

**Topic Context Ingestion**

Topic context combines the base context with any declared or observed topic context. Ingest applicable documents in the listed order before production.

| Context              | Documents                                                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base                 | 1. `documentation/domain/domain-model.md`<br>2. `documentation/architecture/architecture-core.md`<br>3. `STYLE-GUIDE.md`                                                                                   |
| Domain internals     | 1. `documentation/domain/domain-seed-data.md`<br>2. `documentation/domain/domain-data-dictionary.md`<br>3. `documentation/domain/domain-archetypes.md`                                                     |
| UX internals         | 1. `documentation/architecture/architecture-ux.md`<br>2. `documentation/ux/ux-design-language.md`<br>3. `documentation/ux/ux-components-guide.md`                                                          |
| Application features | 1. `documentation/architecture/architecture-ux.md`<br>2. `documentation/architecture/architecture-devops.md`<br>3. `documentation/ux/ux-components-guide-lite.md`<br>4. `documentation/ux/user-stories.md` |
| DevOps               | 1. `documentation/architecture/architecture-back.md`<br>2. `documentation/architecture/architecture-ux.md`<br>3. `documentation/architecture/architecture-devops.md`                                       |

**For all other sessions:**

Report that the session has minimal context (constitution, domain model, core architecture and coding style-guide) and advise the Chief Architect to provide additional context prior to initiating any productions.

### 1.2 Operating Mode

At the start of each task, classify the session by operating mode using `CONSTITUTION.md` as the authority and this protocol as the operating checklist. Reclassify before any production request if the task scope changes. When the mode is unclear, choose the more conservative mode and escalate to the Chief Architect.

| Mode        | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exploration | Use for reading, inspection, analysis, planning, comparison, option generation, and scope drafting. Do not create, modify, move, delete, generate, regenerate, or materially transform project assets in Exploration Mode. If exploration identifies a production need, report the proposed operating mode, scope, risks, and checks, then wait for authorization.                                                                                                                                                                                  |
| Foundation  | Use when work touches or implies changes to architecture, domain meaning, persistence, migrations, shared contracts, security or authorization boundaries, design-language foundations, guard strategy, DevOps structure, cross-application boundaries, or foundational documentation. Foundation Mode requires Chief Architect decision, explicit production scope, authorization before production, verification after production, and Chief Architect review. Do not convert a foundation concern into a feature or repair task for convenience. |
| Feature     | Use for additive end-user capability inside established architecture and approved patterns. Feature Mode still requires production authorization before asset modification. If feature work reveals a need to change architecture, domain meaning, persistence, shared contracts, design-language foundations, guard rules, or cross-application boundaries, stop and escalate to Foundation Mode.                                                                                                                                                  |
| Repair      | Use for test, guard, build, type, or runtime failures. The failure authorizes investigation only. Before mutation, identify the failure, cause, repair scope, affected files, and relevant checks, then receive Chief Architect authorization. Fix only within the approved repair scope and re-run the relevant checks. If the repair requires unrelated refactoring or broader architectural change, stop and escalate.                                                                                                                           |

## 2. Session Productions

### 2.1 Production Gate

Production is any action that creates, modifies, moves, deletes, generates, regenerates, or materially transforms project assets.

Before producing or modifying any artifact or asset, identify the intended task scope and report it to the Chief Architect.

Before production begins, state:

- Operating mode
- Goal
- Intended scope
- Files or directories expected to change
- Files or directories explicitly out of scope
- Constraints
- Checks or guards to run
- Escalation boundaries
- Known risks or ambiguities

Do not begin production until the Chief Architect approves the scope.

### 2.2 Output Contract

After production, report:

- Operating mode used
- Files created
- Files modified
- Files deleted
- Checks or guards run
- Results
- Failures fixed
- Failures remaining
- Work explicitly not done
- Questions or escalations

For code-generation or regeneration tasks, include:

- `STYLE_AUDIT: PASS` or `STYLE_AUDIT: FAIL`
- If `FAIL`: violations list (`- path:line — rule — issue`)
- If `PASS`: brief confirmation of audited files

## 3. Style-guide Conformance

For every production task in this repository, `STYLE-GUIDE.md` is a hard gate.

### 3.1 Non-negotiable Rule

Treat any style-guide violation as a correctness failure. Do not proceed while violations exist.

### 3.2 Block checks

- Enforce `STYLE-GUIDE.md` exactly as written.
- Treat `source/devops/guards/*.ts` as the executable enforcement layer for style and architecture checks.
- If foundation rules change, update guards/tasks; do not fork rules into operational prompt docs.

Do not request approval to continue when a production fails checks that can be fixed within the approved scope. Fix in-scope failures and re-run to green first. If a failure requires expanded scope, stop and escalate.

## 4. Subagent Delegation

For every task AI should decompose and delegate to a free-of-cost subagent where appropriate. Agent is authorized to delegate to a free subagent.

When the reasoning agent delegates to a free subagent, it should seek parallelism by employing multiple subagents simultaneously if appropriate.

If no free subagent is available, the AI should inform the Chief Architect.
