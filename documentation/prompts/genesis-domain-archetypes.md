# swarmAg Operations System — Genesis Domain Archetypes Prompt

You are an AI Coding Engine operating under `CONSTITUTION.md`. You have no
architectural authority. Implement exactly what is specified. Do not invent
abstractions, reinterpret intent, or cross architectural boundaries.

## 1. Authority

Source documents of authority:

- `CONSTITUTION.md`
- `architecture-core.md`
- `domain.md`
- `domain-archetypes.md`
- `data-dictionary.md`
- `style-guide.md`

You MUST ingest all of these files before assessing the task. If any conflict
or ambiguity is detected, pause and escalate before generating files.

## 2. Task

Generate the domain-layer archetypes from scratch. Remove all existing files in these directories and fully replace them. Do not patch existing files.

Follow this execution order, and pause for approval after each archetype before continuing. Items 2–4 depend on item 1:

1. `source/domain/abstractions/`
2. `source/domain/adapters/`
3. `source/domain/protocols/`
4. `source/domain/validators/`

## 3. Implementation Rules

All implementation rules are defined in `domain-archetypes.md` and `style-guide.md`. Apply them in
full. The table below is cross-reference only.

| Concern                   | Spec reference                     |
| ------------------------- | ---------------------------------- |
| Abstractions              | `domain-archetypes.md` section 3   |
| Adapters                  | `domain-archetypes.md` section 4   |
| Protocols                 | `domain-archetypes.md` section 5   |
| Validators                | `domain-archetypes.md` section 6   |
| Shared composition guards | `domain-archetypes.md` section 6.5 |
| Import aliases            | `style-guide.md` section 3         |
| Naming                    | `style-guide.md` section 4         |
| File format               | `style-guide.md` section 6         |

## 4. Type Rules and Checks

- No `any` — use `unknown` at boundaries.
- TypeScript strict mode — `deno task check` must pass.
