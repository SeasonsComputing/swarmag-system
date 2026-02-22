# Domain Package Regeneration Prompt

## Mission

Generate the complete `source/domain/` package from scratch. Do not read or reference any
existing files under `source/domain/`. The authoritative sources are:

- `documentation/foundation/domain.md` — domain model, data dictionary, rules
- `documentation/foundation/style-guide.md` — file format, naming, code tone
- `documentation/foundation/architecture-core.md` — structural law, import discipline, layering
- `CONSTITUTION.md` — governing law; overrides all else in conflict

---

## File Format — Non-Negotiable

**All files in `source/domain/` use Spec Style per `style-guide.md §4.1`.**

This applies to all four archetypes without exception: abstractions, adapters, validators,
protocols. No box headers. No dash-rules. No section dividers. No PURPOSE blocks.

Spec style means:

- Module-level JSDoc block at the top of every file
- Single-sentence `/** */` on every exported type, function, and constant where the name
  alone is insufficient
- Nothing else

---

## Naming — Non-Negotiable

| Symbol class               | Convention      | Example                          |
| -------------------------- | --------------- | -------------------------------- |
| Files                      | kebab-case      | `job-adapter.ts`                 |
| Types, aliases, unions     | PascalCase      | `JobStatus`, `AssetType`         |
| Functions, arrow functions | camelCase       | `toAsset`, `validateAssetCreate` |
| Global immutable constants | SCREAMING_SNAKE | `USER_ROLES`                     |

**Acronyms are words.** All words transform to their symbol class convention. No exceptions.
`Id` not `ID`. `isId` not `isID`. `Url` not `URL`. `Api` not `API`.

---

## Type vs Interface — Non-Negotiable

`type` for all domain abstractions, object shapes, aliases, and unions. Always.

`interface` is reserved exclusively for API contracts that something explicitly implements.
There are no such contracts in `source/domain/`. Therefore: zero `interface` declarations
in the domain package.

---

## Imports — Non-Negotiable

### From `@core-std`

```typescript
import type { Id, When, Dictionary } from "@core-std";
import { isId, isWhen } from "@core-std";
import { isNonEmptyString, isPositiveNumber } from "@core-std";
```

Do not reimplement `isId`, `isWhen`, `isNonEmptyString`, or `isPositiveNumber` locally.
Do not invent local equivalents. Import from `@core-std` and use directly.

### Cross-domain

```typescript
import type { Note } from "@domain/abstractions/common.ts";
```

Always use the full path alias. Never use relative imports across top-level namespaces.

---

## Abstraction Rules (`abstractions/`)

- One file per abstraction, named `{abstraction}.ts`
- Shared subordinate types (`Location`, `Note`, `Attachment`) live in `common.ts`
- Embedded subordinate types use variadic tuple notation:
  - `[Type?, ...Type[]]` — zero or more
  - `[Type, ...Type[]]` — one or more
  - `[Type]` — exactly one
- All lifecycled abstractions expose `deletedAt?: When`
- Exceptions: append-only log entries and pure junction types (no `deletedAt`)
- JSON-serializable only; no methods on domain objects

---

## Adapter Rules (`adapters/`)

- Two functions per abstraction: `toAbstraction(dict: Dictionary): Abstraction`
  and `fromAbstraction(abstraction: Abstraction): Dictionary`
- Map every field explicitly, column by column. No spread. No shortcuts.
- `snake_case` keys for database columns; `camelCase` for domain fields
- JSONB columns (notes, attachments, embedded arrays) map as objects — never
  `JSON.parse()` or `JSON.stringify()`. Supabase deserializes JSONB automatically.
- Fast-fail on missing required fields: throw `Error` with a descriptive message
- No payload-as-truth pattern. No `payload` field. No legacy fallback branches.
- No private helper functions invented inside the adapter file

---

## Validator Rules (`validators/`)

- One validate function per protocol input type
- Signature: `validateAbstractionCreate(input): string | null`
  and `validateAbstractionUpdate(input): string | null`
- Return an error message string on failure, `null` on success
- Use `isId`, `isWhen`, `isNonEmptyString`, `isPositiveNumber` from `@core-std`
- Do not invent local type guards — use canonical imports
- Validate at boundaries only; no re-validation inside domain logic
- If a protocol type exists, its validator must exist — complete the vertical slice

---

## Protocol Rules (`protocols/`)

- Input types for create and update operations only
- Naming: `AbstractionCreateInput`, `AbstractionUpdateInput`
- Partial shapes — only fields relevant to the operation
- Omit: `id`, `createdAt`, `updatedAt`, `deletedAt` from create inputs
- No domain logic; protocols are pure data shapes for transmission

---

## JobStatus — Updated Values

The `JobStatus` union has been redesigned. Use these values exactly. Do not use the old
values from any prior source.

```typescript
export type JobStatus =
  | "open"
  | "assessing"
  | "planning"
  | "preparing"
  | "executing"
  | "finalizing"
  | "closed"
  | "cancelled";
```

`closed` and `cancelled` are terminal states. All others are active present-tense states
describing what the job is currently doing. Do not use: `opened`, `assessed`, `planned`,
`inprogress`, `completed`, or any prior form.

---

## File Inventory

Generate all of the following files. Every abstraction gets all four archetypes.

### `source/domain/abstractions/`

- `common.ts` — `Location`, `Attachment`, `Note`
- `asset.ts` — `AssetType`, `AssetStatus`, `Asset`
- `chemical.ts` — `ChemicalUsage`, `ChemicalLabel`, `Chemical`
- `customer.ts` — `Contact`, `CustomerSite`, `Customer`
- `service.ts` — `ServiceCategory`, `Service`, `ServiceRequiredAssetType`
- `user.ts` — `USER_ROLES`, `UserRole`, `User`
- `workflow.ts` — `QuestionType`, `QuestionOption`, `Question`, `AnswerValue`, `Answer`, `Task`, `Workflow`
- `job.ts` — `JobStatus`, `Job`, `JobAssessment`, `JobWorkflow`, `JobPlanAssignment`, `JobPlanChemical`, `JobPlanAsset`, `JobPlan`, `JobWork`, `JobWorkLogEntry`

### `source/domain/adapters/`

- `asset-adapter.ts`
- `chemical-adapter.ts`
- `customer-adapter.ts`
- `service-adapter.ts`
- `user-adapter.ts`
- `workflow-adapter.ts`
- `job-adapter.ts`

### `source/domain/validators/`

- `asset-validator.ts`
- `chemical-validator.ts`
- `customer-validator.ts`
- `service-validator.ts`
- `user-validator.ts`
- `workflow-validator.ts`
- `job-validator.ts`

### `source/domain/protocols/`

- `asset-protocol.ts`
- `chemical-protocol.ts`
- `customer-protocol.ts`
- `service-protocol.ts`
- `user-protocol.ts`
- `workflow-protocol.ts`
- `job-protocol.ts`

---

## Domain Model Reference

Refer to `documentation/foundation/domain.md` Section 3 (Data Dictionary) for the complete
field-level specification of every abstraction. That document is the authoritative source
for field names, types, cardinality, and constraints.

Notable rules from `domain.md §2.9`:

- `Customer.contacts` is non-empty: `[Contact, ...Contact[]]`
- `Task.checklist` is non-empty: `[Question, ...Question[]]`
- `Workflow.tasks` is non-empty: `[Task, ...Task[]]`
- `JobAssessment.locations` is non-empty: `[Location, ...Location[]]`
- `JobWorkLogEntry` uses a discriminated union to structurally enforce that at least one of
  `answer` or `metadata` is present:

```typescript
export type JobWorkLogEntry = {
  id: Id;
  jobId: Id;
  userId: Id;
  createdAt: When;
} & (
  | { answer: Answer; metadata?: Dictionary }
  | { answer?: Answer; metadata: Dictionary }
);
```

- `JobWork.work` is immutable once created
- `Workflow` masters are read-only except for administrator role
