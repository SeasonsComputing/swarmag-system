# Genesis Prompt -- Execution Model

## Purpose

Clarify the genesis workflow and the separation of concerns between orchestration contracts and generation logic.

## Two Artifacts, Two Roles

### 1) `documentation/genesis-domain-archetypes.md`

- Role: **orchestration contract** for AI sessions.
- Use: at the start of a new chat.
- Defines: authority docs to ingest, required outputs (archetypes + schema), and pass/fail reporting contracts.
- Covers: both domain archetype generation (Phase I & II) and schema generation (Phase III).

### 2) `source/devops/genesis/generate-domain.ts` _(aspirational — not yet built)_

- Role: **deterministic generation engine**.
- Goal: produce domain archetype files mechanically from authority sources.
- When built, the AI prompt becomes purely orchestration; the script becomes the generator.

## Execution Flow (Current)

1. Start a new chat and provide `genesis-domain-archetypes.md` as the session prompt.
2. The AI executes both phases: archetype generation then schema generation.
3. The AI runs `deno task genesis:domain` and all schema validation steps.
4. The AI reports `STYLE_AUDIT` and `SCHEMA_AUDIT` results.

## Rule of Separation

- Prompt files contain **policy and workflow**, not generation logic.
- Generator scripts (when they exist) contain **generation logic**, not governance prose.
