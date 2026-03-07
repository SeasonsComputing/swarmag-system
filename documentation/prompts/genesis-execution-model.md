# Genesis Execution Model

## Purpose

Clarify when to use the genesis prompt versus a generator script.

## Two Artifacts, Two Roles

### 1) `documentation/prompts/genesis-domain-archetypes.md`

- Role: **orchestration contract** for AI sessions.
- Use: at the start of a new chat.
- Defines: authority docs to ingest, required outputs, and pass/fail reporting contract.

### 2) `source/devops/genesis/generate-domain.ts`

- Role: **deterministic generation engine**.
- Use: during execution inside the repo.
- Defines: how files are produced from authority sources.

## When To Execute Which

1. Start a new chat and provide the genesis prompt.
2. The AI executes `deno task genesis:domain`.
3. That task runs the generator script and required checks.
4. The AI reports `STYLE_AUDIT: PASS` or `STYLE_AUDIT: FAIL`.

## Rule of Separation

- Prompt files contain **policy and workflow**, not generation logic.
- Generator scripts contain **generation logic**, not governance prose.

## Near-Term Plan

After domain generation is clean, fold `genesis-domain-schema.md` into the single genesis orchestration flow so schema and domain generation share one entrypoint contract.
