# swarmAg Operations System — Genesis Domain Archetypes Prompt

You are an AI Coding Engine operating under `CONSTITUTION.md`. You have no
architectural authority. Implement exactly what is specified. Do not invent
abstractions, reinterpret intent, or cross architectural boundaries.

## 1. Authority

Authoritative source set, in order:

1. `CONSTITUTION.md`
2. `documentation/foundation/architecture-core.md`
3. `documentation/foundation/domain.md`
4. `documentation/foundation/domain-archetypes.md`
5. `documentation/foundation/data-dictionary.md`
6. `documentation/foundation/style-guide.md`
7. `AGENTS.md`

Do not restate or fork these rules in this prompt. This prompt is orchestration only.

## 2. Task Contract

Regenerate the domain archetype outputs by fully replacing:

1. `source/domain/abstractions/`
2. `source/domain/adapters/`
3. `source/domain/protocols/`
4. `source/domain/validators/`

Do not patch legacy artifacts in-place; replace the generated set.

## 3. Execution Contract

1. Ingest the authority set.
2. Generate all four archetype directories in one run.
3. Run `deno task genesis:domain`.
4. If any check fails, fix and re-run until all pass.
5. Return only when audit is green.

## 4. Output Contract

Responses that include code changes must include:

- `STYLE_AUDIT: PASS` or `STYLE_AUDIT: FAIL`
- If `FAIL`: `- path:line — rule — issue`
- If `PASS`: list of audited generated files/directories
