![Seasons Computing logo](seasonscomputing-logo.png)

# Software Construction Conventions (1.1)

- Source: [CONVENTIONS.md](CONVENTIONS.md)
- Version: 1.1
- Published: 2026 October 20th
- Author: Ted V. Kremer

**MANDATORY: THIS FILE MAY NOT BE EDITED BY ANY AI AGENT WITHOUT PRIOR AUTHORIZATION**

## 1. Overview

The conventions for software construction at Seasons Computing: how code is written, the
practices it follows, and how to build with `core/`. The `core/` file headers are the reference;
this guide points to a module by its `@core/` alias for what it provides, and never repeats its
symbol list.

Code that conflicts with these conventions is wrong — not this document.

Some conventions are preferences, written as such and applied with judgment; review holds them,
not a guard. Departing from a preference with a stated reason is not a violation.

## 2. Language & Tooling

| Item     | Guideline                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------ |
| Runtime  | Deno with strict TypeScript (`deno task check`)                                                        |
| Encoding | UTF-8 (Unicode). Avoid non-ASCII only where required by a specific file format or external constraint. |

## 3. Imports

All cross-boundary imports use path aliases defined in `deno.jsonc`. Never use relative imports across top-level namespaces.

### 3.1 Primary top-level aliases

| Alias      | Resolves to      |
| ---------- | ---------------- |
| `@core/`   | `source/core/`   |
| `@domain/` | `source/domain/` |
| `@back/`   | `source/back/`   |
| `@front/`  | `source/front/`  |
| `@ux/`     | `source/ux/`     |
| `@devops/` | `source/devops/` |
| `@tests/`  | `source/tests/`  |

### 3.2 Barrel aliases

Barrels are an exception, not a tool. Import every module through its root namespace alias by direct file path — `@ux/shell/workbench/wizard.tsx` — never through a barrel. The table below is the complete inventory: if a module is not listed here, no barrel for it exists and none may be created. Adding one is a Foundation decision, not a tidying step. The sole barrel outside this table is `source/tests/fixtures/samples.ts` (§16).

| Alias        | Resolves to                     |
| ------------ | ------------------------------- |
| `@core/std`  | `source/core/std/std.ts`        |
| `@core/stdx` | `source/core/std/stdx.ts`       |
| `@ux/ui`     | `source/ux/ui/components/ui.ts` |
| `@ux/css`    | `source/ux/ui/css/css.tsx`      |

### 3.3 Import Rules

- All cross-file type references must use top-level `import type` declarations. Inline `import('...').TypeName` expressions in type positions are prohibited — every type used from another module must appear in the file's top-level import block.
- An import where every name is a type uses `import type`. An import that mixes values and more
  than one type name splits into a value import and an `import type` from the same module; one
  that mixes values and exactly one type name may keep it inline.
- A module never imports its own namespace through a barrel or an alias: it imports its siblings
  relatively (`./…`).
- `core/std` is closed. Its files import and re-export only relative modules within `core/std`,
  whether static or type imports, re-exports, side-effect imports, or literal dynamic imports; no
  aliases, other `core/` namespaces, higher layers, or third-party dependencies. Internal
  references use individual modules, avoiding cycles through the barrels. Consumers use
  `@core/std` for primitives and `@core/stdx` for contracts, makers, and wrappers.
- Do not re-implement utilities already provided by `@core/std`. Use the canonical form: `isId` not a local `isIdString`; `isWhen` not a local date-string guard; etc.

```typescript
// Every name is a type
import type { Dictionary, Id } from '@core/std'

// Values and one type may share an import
import { type JSX, splitProps } from '@solid-js'

// Values and several types split
import { makeAdapter } from '@core/stdx'
import type { Adapter, AdapterPatch } from '@core/stdx'

// A sibling in the same namespace, imported relatively
import { Preferences } from './preferences.ts'
```

## 4. Naming Conventions

### 4.1 The single commandment

Minimize visual noise. Every naming rule derives from this. Names must be immediately readable, carry no redundant weight, and signal meaning through structure rather than decoration.

### 4.2 Symbol classes

Each symbol class has one casing convention. All words — regardless of their natural language form — are transformed into the convention for their class. There are no special cases for acronyms, abbreviations, or domain shorthand. The symbol class determines the transformation.

| Symbol class                                               | Convention      | Example                              |
| ---------------------------------------------------------- | --------------- | ------------------------------------ |
| File names                                                 | kebab-case      | `cache-adapter.ts`, `api-config.ts`  |
| Types, type aliases, interfaces, classes, object constants | PascalCase      | `RetryPolicy`, `HttpCodes`, `UiText` |
| Functions, methods, arrow functions                        | camelCase       | `fromRetryPolicy`, `apiClient`       |
| Value constants: scalars and collections of values         | SCREAMING_SNAKE | `MAX_LIMIT`, `SHAPE_KINDS`           |
| SQL tables and columns                                     | snake_case      | `created_at`, `deleted_at`           |

An object constant is PascalCase whether it holds data (`HttpCodes`) or behavior (`UiText`),
exported or module-private. SCREAMING_SNAKE is for scalar values and collections of values,
const-enum tuples included (§9.2): a SCREAMING_SNAKE name reads as a value, or a tuple with a
derived type.

```typescript
/** Maximum list page size. */
export const MAX_LIMIT = 100

/** Supported shape kinds. */
export const SHAPE_KINDS = ['circle', 'rect', 'triangle'] as const

/** HTTP status codes by name. */
export const HttpCodes = { ok: 200, badRequest: 400, notFound: 404 } as const
```

### 4.3 The acronym corollary

Acronyms are not a special case — they are words, and words transform with their symbol class.

| Natural form | PascalCase | camelCase | kebab-case |
| ------------ | ---------- | --------- | ---------- |
| API          | `Api`      | `api`     | `api-`     |
| URL          | `Url`      | `url`     | `url-`     |
| ID           | `Id`       | `id`      | `id-`      |

## 5. Source Code Formatting

All TypeScript is formatted by `dprint` via `deno task fmt`. The formatter is authoritative — do not argue with it.

### 5.1 Rules

- **No semicolons** — statement terminators are omitted throughout
- **Single quotes** — string literals use `'...'` not `"..."`
- **Line length** — maximum length of any line is `105` characters.
- **Comment box length** — comment box maximum length is `80` characters
- **File order of symbols** — exported symbols are listed at the top of the file with non-exports below them, when possible.
- **Comment exported types** — every exported type has a comment; a const-enum pair or a group of related declarations may share one. Single-line if sufficient. Multi-line if warranted.

### 5.2 Single-line statements

Prefer single-line statements for simple, non-loop control flow and import statements when readability is preserved.

- Use multiline form when a statement exceeds max line length or when a single-line form reduces readability.
- Single-line `if`/guard-return is allowed only for one simple action.

Examples:

```typescript
export type Bar = Ding & Bat

if (!input) return null

let wingDings = { now: when() }

for (const item of items) process(item)
```

## 6. Source Code File Format

Documentation intensity follows implementation complexity. The code speaks first; commentary fills only what the code cannot.

### 6.1 File headers

Every file begins with a box header. Headers are written in expanding levels, in a fixed order:
box, then PURPOSE, then PUBLIC or its groups, then any further sections.

| Level | Applies to                        | Header                                                                        |
| ----- | --------------------------------- | ----------------------------------------------------------------------------- |
| 1     | Every file                        | A box with a title and a one-line description                                 |
| 2     | Every file another module imports | Level 1, then PURPOSE and PUBLIC                                              |
| 3     | Complex files                     | Level 2, with PUBLIC replaced by named groups; named sections may follow them |

Tooling and tests conform like product code. Test cases and files used only by packaging or the
runtime, such as build configurations and service workers, stop at level 1.

A level 2 header:

```typescript
/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User protocol validator                                                      ║
║ Boundary validation for user protocol payloads.                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for user topic abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateUserCreate(input)  Validate UserCreate payloads.
validateUserUpdate(input)  Validate UserUpdate payloads.
*/
```

At level 3, named groups replace the PUBLIC heading, and further sections may follow them:

```text
PURPOSE
───────────────────────────────────────────────────────────────────────────────
Route grammar, construction, and content for an application shell.

ROUTE GRAMMAR
───────────────────────────────────────────────────────────────────────────────
RouteKind     Kinds of route the shell resolves.

ROUTE FACTORY
───────────────────────────────────────────────────────────────────────────────
makeRoutes    Builds the route table from declarations.

DESIGN PRINCIPLES
───────────────────────────────────────────────────────────────────────────────
Routes are declared, never discovered.
```

`@core/std/wrap-http-handler.ts` is the level 3 reference: named groups followed by examples,
design principles, and the request-response flow.

### 6.2 PUBLIC

- PUBLIC, or its named groups, lists every exported symbol, props types included.
- Each entry, symbol or member, is its name and a brief description.
- A container, whether of operations (a namespace object, a class) or of data (a props type),
  lists its public members beneath it with `├` and `└`, aligned with the other entries.
- A tree lists what a reader can use; it is not a second rendering of the type.
- A type built by intersection lists its own members and one line naming what it extends, never
  the inherited members.
- Explanation that a phrase cannot carry goes in a doc comment on the member.

```text
UiText               Text conversions for control values and display text.
├ optional           Blank text to undefined.
├ number             Text to number.
├ label              kebab-case to display text.
├ untitled           Blank value to a consumer-supplied label.
└ from               Number to text.
```

### 6.3 Header rules

- Box lines are of equal length, so the sides meet the corners.
- Subsection header (e.g. PURPOSE, PUBLIC)
  - 1 blank line prior to subsection
  - Subsection heading in ALL CAPS
  - 1 max-length dash-rule after the header
- Headers stay current. A stale header is worse than no header.

### 6.4 Section header

Files with clear categories of declarations and functions divide the code body into sections, each with a section header. Consistent width, no variation:

```typescript
// ────────────────────────────────────────────────────────────────────────────
// {SECTION LABEL}
// ────────────────────────────────────────────────────────────────────────────
```

**A section label names subject matter, not visibility.** `export` already states visibility, and the `PUBLIC` block in the file header (§6.2) already inventories the exported symbols — a `PUBLIC`/`PRIVATE` body section therefore carries nothing the reader cannot see in the left margin. Label each section for what its code is _about_. Narrow with `PARENT: CHILD` when one file covers a subject at more than one level, and reserve a trailing `IMPLEMENTATION` for supporting machinery that serves every section above it.
**Example**

```typescript
// ONBOARDING: CUSTOMER SITES        the stage, and the editor for one site
// CUSTOMER SITE: NOTES              the editor for one note
// CUSTOMER SITE: TEXT INPUT FIELDS  the shared labelled-field component
// IMPLEMENTATION                    factories, label rules, helpers
```

**Other labels** where the file's categories warrant them:

- `INTERNALS`
- `PROTOCOLS`
- `VALIDATORS`
- `GUARDS`

### 6.5 Comment conventions

| Context            | Style                                                        |
| ------------------ | ------------------------------------------------------------ |
| Type declarations  | Single-line `/** */` — one sentence; multi-line if warranted |
| Exported functions | JSDoc with `@param` and `@returns` for non-obvious args      |
| Private helpers    | Inline `//` — only when intent isn't obvious from the code   |
| Dead comments      | Delete them. Version control exists.                         |

## 7. Code Tone

These are non-negotiable.

### 7.1 Explicit over clever

Code must be readable by a developer unfamiliar with the codebase. If it requires explanation, it requires refactoring or a comment.

### 7.2 Fast-fail

Validate at boundaries. Throw early with clear messages. Never proceed on bad state.

### 7.3 No defensive programming

Do not null-check values that cannot be null by contract. Do not write try/catch around code that should not fail. Trust the type system.

```typescript
// Fast-fail: validate at the boundary and stop on bad state
const error = validateQuestionCreate(input)
if (error) notValid(error)

// Defensive: re-checking what the contract already guarantees
const save = (question: Question) => {
  if (!question?.id) return // WRONG: a Question always has an id
}
```

### 7.4 No payload-as-truth adapters

Adapters map column-by-column. There is no `payload` field that bypasses mapping. The abstraction type is the truth; the adapter derives it from storage columns.

### 7.5 No redundant exports

Export only what callers need. Private helpers stay private.

### 7.6 No magic

No implicit behavior, no runtime reflection, no meta-programming. Its corollary is **explicit and
obvious**: configuration is explicit, providers are injected, contracts are stated in interfaces,
and structured data is typed. Makers conform to it: the specification is visible at the call
site, and the contract is stated (§10.1).

## 8. Types and Containers

### 8.1 Primitives and ADTs

The standard vocabulary comes from `@core/std`: primitives, containers, life-cycle shapes, and
relations. `Id` is a UUID v7 string, `When` an ISO 8601 UTC string, and so on. This catalog is
authoritative; consult it rather than re-deriving one of these locally.

Use types from `@core/std` instead of ad-hoc primitives and container generics.

| Prefer from `@core/std`   | Do not use                                                                 |
| ------------------------- | -------------------------------------------------------------------------- |
| `Dictionary<V = unknown>` | `Record<string, unknown>`                                                  |
| `StringDictionary`        | `Record<string, string>`                                                   |
| `StringSet`               | `Set<string>`                                                              |
| `Id`                      | raw `string` for identifiers                                               |
| `When`                    | raw `string` for ISO datetime                                              |
| `Instance`                | inline `{ id }` for objects needing stable identity only                   |
| `Instantiable`            | inline `{ id, createdAt, updatedAt, deletedAt? }` life-cycle shape         |
| `InstantiableOnly`        | inline `{ id, createdAt }` create-and-read-only life-cycle shape           |
| `CompositionOne<T>`       | ad-hoc tuple/array for exactly-one embedded composition                    |
| `CompositionOptional<T>`  | ad-hoc nullable/optional array for zero-or-one embedded composition        |
| `CompositionMany<T>`      | ad-hoc `T[]` where composition semantics are intended                      |
| `CompositionPositive<T>`  | ad-hoc non-empty array encodings (`[T, ...T[]]`) for composition semantics |
| `AssociationOne<T>`       | raw `Id` for required FK references                                        |
| `AssociationOptional<T>`  | raw `Id \| undefined` for optional FK references                           |
| `AssociationJunction<T>`  | raw `Id` in junction abstractions                                          |
| `ValidatorError`          | thrown by `notValid()`; generic `Error` for validation failures            |

- Import std primitives from `@core/std` only.
- Never declare `Record<string, unknown>`, `Record<string, string>`, or `Set<string>` outside `source/core/std/`.
- When narrowing unknown objects in guards, use `Dictionary` casts (`const x = v as Dictionary`) instead of `Record<string, unknown>`.
- Use `StringDictionary` for key/value string/string maps.

### 8.2 Type vs. interface

Use `type` for data shapes, abstractions, aliases, and unions. Use `interface` for encapsulated API
contracts that something explicitly implements. In the ambiguous case, decide on meta-type vs. data:
an `interface` is a meta-type whose behavior methods and attribute metadata are immutable
specification; an attribute whose value is a callback is a data shape.

### 8.3 Containers

Encapsulate behavior in a named container. This is a preference, applied with judgment (§1): when
you write a function, first ask which container owns it.

| Form             | Prefer it when                                                      | Example                            |
| ---------------- | ------------------------------------------------------------------- | ---------------------------------- |
| Module singleton | One set of state or operations for the whole runtime                | `UiText`                           |
| Class            | Instances, or a runtime-specific implementation of a contract       | `DenoProvider` (`RuntimeContract`) |
| Cohesive module  | A family of related functions sharing no state; the header names it | `@core/std/validators.ts`          |
| Maker            | An implementation produced from a declarative specification (§10.1) | `makeAdapter`                      |

```typescript
// Module singleton: one named set of operations for the runtime
const optional = (value: string): string | undefined => value.trim() ? value : undefined
const untitled = (value: string, fallback: string): string => value.trim() || fallback
const from = (value: number | undefined): string => value === undefined ? '' : value.toString()

export const UiText = { optional, untitled, from }

// Class: a runtime-specific implementation of a contract
export class DenoProvider implements RuntimeContract {
  get(key: string): string | undefined {
    return Deno.env.get(key)
  }
  fail(msg: string): never {
    console.error(msg)
    Deno.exit(1)
  }
}

// Cohesive module: a family of functions sharing no state; the header names it (PREDICATES)
export const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
export const isEmail = (value: unknown): value is string => …

// Maker: an implementation produced from a declarative specification
export const SelectOptionAdapter = makeAdapter<SelectOption>({
  value: ['value'],
  label: ['label']
})
```

A contract gets an interface (§8.2) when more than one implementation makes it substitutable, or
when a toolkit declares what an application must supply.

A free function is right for a pure primitive used across containers, and for a maker.

## 9. Domain Shapes

How domain abstractions are declared, carried across boundaries, and validated.

### 9.1 Abstractions

A domain abstraction is a named type built from `@core/std` (`instance.ts`, `relations.ts`). What
it means belongs to the domain model; this is how it is expressed.

- **Life cycle.** Intersect one life-cycle shape; never restate its fields. `Instance` is identity
  only. `InstantiableOnly` adds `createdAt`, for records created and never changed (append-only).
  `Instantiable` adds `updatedAt` and soft delete through `deletedAt`. The factories `instance`,
  `instantiableOnly`, and `instantiable` stamp the id and timestamps.
- **Composition.** A subordinate with no life cycle of its own is embedded: `CompositionOne`,
  `CompositionOptional`, `CompositionMany`, or `CompositionPositive`. It is an array at runtime,
  `[]` when empty and never null, and is written whole with its owner (§10.4).
- **Association.** A reference to another life-cycled abstraction is its `Id`, typed
  `AssociationOne<T>`, `AssociationOptional<T>`, or `AssociationJunction<T>`.

```typescript
/** A delivery site, composed into its account. */
export type Site = {
  label: string
  location: CompositionOne<Location>
}

/** A customer account. */
export type Account = Instantiable & {
  name: string
  ownerId: AssociationOne<User>
  managerId: AssociationOptional<User>
  sites: CompositionMany<Site>
}
```

### 9.2 `const-enum`

Any value set requiring runtime validation is expressed as a `const` tuple paired with a derived type alias.

```typescript
/** Supported shape kinds. */
export const SHAPE_KINDS = ['circle', 'rect', 'triangle'] as const
export type ShapeKind = (typeof SHAPE_KINDS)[number]
```

- Tuple named `SCREAMING_SNAKE`; derived type named `PascalCase`.
- Both exported from the same file — never redeclared elsewhere.
- Consumers import the tuple and use `.includes()` — never redeclare a local copy.

```typescript
// CORRECT
import { SHAPE_KINDS } from '@domain/abstractions/shape.ts'
SHAPE_KINDS.includes(input.kind as ShapeKind)

// WRONG — local redeclaration is a violation
const SHAPE_KINDS = ['circle', 'rect'] as const
```

### 9.3 `intersection-type`

When a type extends a base type with additional or narrowed fields, express as a named intersection.

```typescript
export type CircleShape = BaseShape & {
  kind: 'circle'
  radius: number
}
```

- Always a named export — anonymous intersections are a violation.
- The narrowed discriminator field must appear in the intersection body, not the base.
- Used as constituents of a `union-type`.

### 9.4 `union-type`

When a concept has structurally distinct variants sharing a discriminator field, express as a named base type, named intersection-type constituents, and a discriminated union.

```typescript
/** Common shape fields. */
export type BaseShape = {
  kind: ShapeKind
  color?: string
}

/** Circle — no dimensional fields other than radius. */
export type CircleShape = BaseShape & {
  kind: 'circle'
  radius: number
}

/** Rectangle — defined by width and height. */
export type RectShape = BaseShape & {
  kind: 'rect'
  width: number
  height: number
}

/** Discriminated union — boundary type used throughout the system. */
export type Shape = CircleShape | RectShape
```

- Base type holds shared fields only — no discriminator narrowing.
- Constituent types are named, exported intersection-types — they carry independent meaning.
- The union type is the boundary type used at all call sites.
- The discriminator field (`kind`) must be present in every constituent.
- No anonymous union arms.

**Type discrimination** — switch on the discriminator, exhaustive, no fall-through default:

```typescript
export const volume = (shape: Shape): number => {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2
    case 'rect':
      return shape.width * shape.height
  }
}
```

**Validator consumption** — same discriminator-switch pattern, branch-specific checks:

```typescript
export const validateShapeCreate = (input: ShapeCreate): ExpectResult => {
  const error = expectConstEnum(input.kind, 'kind', SHAPE_KINDS)
  if (error) return error
  switch (input.kind) {
    case 'circle':
      return expectPositiveNumber(input.radius, 'radius')
    case 'rect':
      return expectValid(
        expectPositiveNumber(input.width, 'width'),
        expectPositiveNumber(input.height, 'height')
      )
  }
}
```

### 9.5 Protocols

A protocol is the shape an abstraction takes crossing a boundary. Derive it from the abstraction
with `@core/std/protocols.ts` (`CreateFromInstantiable<T>`, `UpdateFromInstantiable<T>`,
`ScopedUpdate<T, K>`); never write one by hand. For a union, derive a protocol per variant and
union the results: a derived shape applied to the union itself collapses its variants.

```typescript
export type ScalarQuestionCreate = CreateFromInstantiable<ScalarQuestion>
export type SelectQuestionCreate = CreateFromInstantiable<SelectQuestion>
export type QuestionCreate = ScalarQuestionCreate | SelectQuestionCreate

// WRONG: applied to the union, the variants collapse
export type QuestionCreate = CreateFromInstantiable<Question>
```

### 9.6 Validators

Validate at boundaries, ingress and egress (§7.2). `@core/std/validators.ts` provides the families:
predicates (`is*`), expectations (`expect*`), normalizers (`to*`), and the result vocabulary.

- An expectation returns an `ExpectResult`: an error message, or `null` when valid. Compose them
  with `expectValid`, which returns the first error.
- `notValid` throws a `ValidatorError`; never throw a generic `Error` for a validation failure.
- A union validates with the same discriminator switch as its consumers (§9.4).

```typescript
/** Validate ProfileCreate payloads. */
export const validateProfileCreate = (input: ProfileCreate): ExpectResult =>
  expectValid(
    expectNonEmptyString(input.displayName, 'displayName'),
    expectEmail(input.email, 'email'),
    expectConstEnum(input.status, 'status', PROFILE_STATUSES),
    expectId(input.managerId, 'managerId', true) // optional
  )
```

## 10. Makers and Contracts

### 10.1 Makers

A maker takes a declarative, typed specification and returns an implementation conforming to a
stated contract, with no hidden behavior. It does not create an instance of an object; it creates
code. A maker is explicit and obvious (§7.6): the specification is visible at the call site, and
the contract is stated in an interface.

- A maker lives in `make-{concept}-{role}.ts`: the concept is its concrete binding (`supabase`,
  `indexeddb`), the role the contract it fulfils (`client`, `auth`).
- Service wrappers (`wrap*`) mirror makers at the inbound boundary (§12).

### 10.2 Contracts

A contract gets a file of its own in two cases:

- **Substitutability:** more than one implementation makes it substitutable, as the CRUD clients
  implement `@core/std/api-contracts.ts`.
- **Deferred encapsulation:** a toolkit declares what each application must supply, so the
  dependency runs one way. Such contracts share a file named by their subject. A contract the
  toolkit implements itself stays with its implementation.

A maker whose types only it produces keeps them in its own file (`make-adapter.ts`,
`make-scope.ts`). A branded type shares its producer's file, so only the producer can construct
it (`make-query.ts`).

```typescript
// Toolkit, notifier-contracts.ts: what each application must supply
export interface NotifierContract {
  notify(userId: Id, message: string): Promise<void>
}

// Application: its one implementation
export class EmailNotifier implements NotifierContract {
  async notify(userId: Id, message: string): Promise<void> { … }
}
```

### 10.3 Adapters

An adapter maps a domain abstraction to storage columns and back. Build it with `makeAdapter` from
`@core/std/make-adapter.ts`.

- Spread `InstantiableAdapt` (or `InstantiableOnlyAdapt`) for life-cycle columns; never restate them.
- `fromDomain` accepts `AdapterPatch<T>`, so full abstractions and partial updates are both valid.
- Delegate adapters handle nested composition objects and arrays.
- Adapters only serialize and deserialize shape: no business logic, no validation, no payload
  field that bypasses mapping (§7.4).

```typescript
/** Deserialize/Serialize SelectOption (Composition) */
export const SelectOptionAdapter = makeAdapter<SelectOption>({
  value: ['value'],
  label: ['label'],
  requiresNote: ['requires_note']
})

/** Deserialize/Serialize Question (Instantiable) */
export const QuestionAdapter = makeAdapter<Question>({
  ...InstantiableAdapt,
  type: ['type'],
  prompt: ['prompt'],
  options: ['options', SelectOptionAdapter]
})
```

### 10.4 Scopes

A scope declares the attributes one editing surface owns. Build it with `makeScope`, or with
`makeAdaptedScope` when the client translates through an adapter, from `@core/std/make-scope.ts`.
The scope owns its draft and its create and update projections.

- Every form declares its scope; never derive one from the keys of the abstraction.
- The unit of a scope is the attribute, written atomically whatever its type or cardinality. An
  embedded composition is written whole, never in part.
- Create values for attributes outside the scope are declared with it, as `defaults`. An
  attribute is never both in scope and defaulted.
- A newly introduced derived attribute is optional, so existing scopes need not know it.

```typescript
export const ProfileScope = makeScope({
  fields: [ProfileAdapter.displayName, ProfileAdapter.email],
  defaults: { status: 'active' }
})

await Profiles.create(ProfileScope.toCreate(draft))
await Profiles.update(ProfileScope.toUpdate(id, draft))
```

### 10.5 Queries

Declare a list query once with `makeQuery` from `@core/std/make-query.ts`: the adapter fields it
filters, searches, and orders by. Consumers build from the declaration and never touch adapters.
The query semantics (operators, search, order, cursors) are stated in its header.

```typescript
export const byRole = makeQuery({
  filter: [UserAdapter.roles, UserAdapter.status],
  search: [UserAdapter.displayName, UserAdapter.primaryEmail],
  order: [UserAdapter.displayName]
})

const query = byRole.build({ where: { status: { eq: 'active' } } })
const users = await Array.fromAsync(listAll(Users, query))
```

- `listAll` pages internally and yields records; stop iterating when you have enough.
- `listPageLimit` clamps a requested page size.

### 10.6 API clients

A client implements `ApiCrudContract` or `ApiBusRuleContract` (`@core/std/api-contracts.ts`) over
one store. Choose the maker by store; compose the clients once and consume the composition.

| Store     | CRUD maker                | Update                                   | Business-rule maker                                             |
| --------- | ------------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| Supabase  | `makeCrudSupabaseClient`  | Adapted: `update(scope.adapter, source)` | `makeBusRuleSupabaseRpcClient`, `makeBusRuleSupabaseEdgeClient` |
| IndexedDB | `makeCrudIndexedDbClient` | Adapted                                  | —                                                               |
| HTTP      | `makeCrudHttpClient`      | Direct: `update(source)`                 | `makeBusRuleHttpClient`                                         |

An adapted client translates through a scoped adapter; a direct client sends domain shape. The two
update forms fit how each store writes; never collapse them into one.

```typescript
const Questions = makeCrudSupabaseClient<Question>({ table: 'questions', adapter: QuestionAdapter })
const cloneJob = makeBusRuleHttpClient({ basePath: '/api/jobs/deep-clone' })
```

### 10.7 Authentication

`ApiAuthContract` (`@core/std/auth-contract.ts`) is passwordless OTP authentication with session
events. `AuthSupabaseClient` (`@core/cli/auth-supabase-client.ts`) implements it.

```typescript
await Auth.sendOtp(email)
const session = await Auth.verifyOtp(email, code)

const unsubscribe = Auth.onAuthStateChange(session => …)
```

## 11. Runtime Configuration

Configuration is one `Config` singleton (`@core/cfg/config.ts`) with a runtime provider injected
once per deployment package. Core defines the singleton; packages inject providers; dependencies
flow downward, so core never knows a provider.

- A provider implements `RuntimeContract` (`@core/cfg/runtime-contract.ts`) for one runtime:
  `DenoProvider`, `SupabaseProvider`, `NetlifyProvider`, `SolidProvider`.
- Each package has one config module: it calls `Config.init(provider, keys, aliases?)` and
  re-exports `Config`. Required keys fail fast at bootstrap.
- Aliases map logical names to platform keys once, so code reads `Config.get('API_URL')`, never
  a platform prefix such as `VITE_`.

```typescript
import { Config } from '@core/cfg/config.ts'
import { SolidProvider } from '@core/cfg/solid-provider.ts'

Config.init(new SolidProvider(), ['VITE_API_URL', 'VITE_LOCAL_DB_NAME'], {
  API_URL: 'VITE_API_URL',
  LOCAL_DB_NAME: 'VITE_LOCAL_DB_NAME'
})

export { Config }
```

- `Config.init()` is called once; a second call throws.
- `Config.get(name)` resolves an alias, then returns the value; it throws if uninitialized, the key
  is unregistered, or the value is missing. It never returns `undefined`.
- `Config.fail(msg)` throws `never`; use it for invariant violations.
- Code in a package imports its package's config module. Code that cannot know its package imports
  `@core/cfg/config.ts`.
- Never read `Deno.env` or `import.meta.env` directly; only providers do.

## 12. Services

A service is the inbound counterpart of a client: an operation exposed over HTTP. Write the
operation, then wrap it once.

- `wrapHttpHandler` (`@core/std/wrap-http-handler.ts`) adapts a typed handler to the Fetch
  `Request`/`Response` contract, with response builders (`toOk`, `toBadRequest`, `toInternalError`,
  and the rest). Its header is the full account.
- `wrapBusRuleHttpHandler` (`@core/svc/wrap-busrule-http-handler.ts`) wraps a business-rule
  operation, the server side of a business-rule client. Throw `HttpServiceError` for an expected
  failure with its status.
- `makeSupabaseEdgeAuth` (`@core/svc/make-supabase-edge-auth.ts`) verifies the caller and
  provides its clients. It is the platform handshake only: authorization stays with the caller.
- `wrapSupabaseShim` (`@core/svc/wrap-supabase-shim.ts`) is the `Deno.serve` entry, adding a
  timeout and logging of slow or failed invocations.

```typescript
type InviteParams = { email: string }
type InviteResult = { userId: Id }

export default wrapBusRuleHttpHandler<InviteParams, InviteResult, EdgeCallerContext>({
  context: request => edgeAuth.verifyCaller(request),
  handle: async ({ email }, caller) => {
    if (!isEmail(email)) throw new HttpServiceError(HttpCodes.badRequest, 'Invalid email')
    …
  }
})

// The function's entry file imports that handler
Deno.serve(wrapSupabaseShim(handler))
```

## 13. Local Persistence

Local data lives in the browser's IndexedDB, reached through clients.

- `IndexedDb` (`@core/db/indexeddb.ts`) owns the connection for the active local database and its
  registered stores. `makeCrudIndexedDbClient` registers its store; application code never
  touches `IndexedDb` directly.
- `Preferences` (`@core/cli/preferences.ts`) persists small key and value settings.
- The local database name comes from configuration (`LOCAL_DB_NAME`, §11).

```typescript
const prefs = new Preferences('AppStateStore')

await prefs.set('theme', 'dark')
const all = await prefs.state()
```

## 14. Remote Persistence

### 14.1 The Supabase client

`Supabase` (`@core/db/supabase.ts`) owns the RDBMS client for browser and edge contexts and maps
PostgREST errors to status codes. Only makers and services use it; application code reaches
remote data through clients (§10.6).

### 14.2 Schema

General schema authoring conventions for canonical DDL.

#### 14.2.1 Identifiers

- All table names, column names, constraint names, index names, and policy names use `snake_case`.
- Table names are plural nouns.
- No quoted identifiers.

#### 14.2.2 Column ordering

Columns within a table follow this order:

1. `id` (primary key, always first)
2. Foreign key columns (`*_id`)
3. Domain columns
4. Lifecycle columns (`created_at`, `updated_at`, `deleted_at`)

#### 14.2.3 Data types

| Domain type       | PostgreSQL type | Notes                                     |
| ----------------- | --------------- | ----------------------------------------- |
| `Id`              | `UUID`          | UUID v7; application-supplied, no default |
| `When`            | `TIMESTAMPTZ`   | Always timezone-aware; never `TIMESTAMP`  |
| `string`          | `TEXT`          | Never `VARCHAR(n)`                        |
| `number` (int)    | `INTEGER`       |                                           |
| `number` (float)  | `NUMERIC`       |                                           |
| `boolean`         | `BOOLEAN`       |                                           |
| `Composition*<T>` | `JSONB`         | Embedded subordinate; never normalized    |
| `const-enum`      | `TEXT`          | Constrained via named `CHECK`             |

#### 14.2.4 NOT NULL discipline

- Required columns are `NOT NULL`.
- Optional fields are nullable.
- `updated_at` is `NOT NULL DEFAULT now()`.
- `deleted_at` is nullable.
- Junction foreign keys are `NOT NULL`.

#### 14.2.5 CHECK constraints for const-enum columns

- Every const-enum-backed column has a named `CHECK` constraint.
- Constraint naming: `{table}_{column}_check`.

#### 14.2.6 Foreign key cascade policies

| Relationship type             | Policy               | Rationale                                         |
| ----------------------------- | -------------------- | ------------------------------------------------- |
| Ownership (parent owns child) | `ON DELETE CASCADE`  | Child has no meaning without parent               |
| Cross-entity reference        | `ON DELETE RESTRICT` | Prevent silent data loss across entity boundaries |

#### 14.2.7 Indexes

- Primary keys are indexed automatically.
- Add an explicit index on every foreign key column.
- Add explicit indexes for columns referenced by RLS `USING` clauses.
- Index naming: `{table}_{column}_idx`.

#### 14.2.8 Row Level Security

- Enable RLS on every table.
- Define policies immediately after each `CREATE TABLE` block.
- Policy naming: `"{table}_{operation}_{scope}"` (lowercase, double-quoted).
- Operation tokens: `select`, `insert`, `update`, `delete`.
- Junction tables: `SELECT`, `INSERT`, `DELETE` only — no `UPDATE` policy.
- `InstantiableOnly` (append-only) tables: `SELECT`, `INSERT` only — no `UPDATE`, no `DELETE` policy.

#### 14.2.9 JSONB columns

- JSONB is only for `Composition*<T>` subordinate compositions.
- Composition columns store arrays regardless of cardinality.
- Use `DEFAULT '[]'::jsonb` for `CompositionMany` and `CompositionPositive`.
- `CompositionOne` is required and has no empty-array default.

#### 14.2.10 Soft delete

- `Instantiable` tables use `deleted_at TIMESTAMPTZ`.
- Active rows are `deleted_at IS NULL`.
- RLS `SELECT` policies govern who may read; they do not filter soft-deleted rows. Lists
  exclude them in the client.
- `InstantiableOnly` tables have no `updated_at` or `deleted_at` columns.

#### 14.2.11 SQL comment and spacing conventions

Use this fixed-width section divider:

```sql
-- ──────────────────────────────────────────────────────────────────────────────────────
-- section_name
-- ──────────────────────────────────────────────────────────────────────────────────────
```

Spacing:

- One blank line between `CREATE TABLE` and `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
- One blank line between `ENABLE ROW LEVEL SECURITY` and first `CREATE POLICY`.
- One blank line between consecutive `CREATE POLICY` blocks.
- One blank line between consecutive `CREATE INDEX` blocks.

#### 14.2.12 Schema file header

Every `schema.sql` begins with:

```sql
-- =============================================================================
-- {Project} — Canonical Schema
-- {path to schema.sql}
--
-- Authoritative current-state DDL. Generated from domain model.
-- Do not edit manually — regenerate from domain model.
-- Includes canonical seed data known at schema time.
-- Migrations in {path to migrations} express deltas from this state.
-- =============================================================================
```

#### 14.2.13 Drop order

Emit `DROP TABLE IF EXISTS` for all domain tables in reverse dependency order at the top of the file, before any `CREATE TABLE` statements.

### 14.3 SQL DDL

SQL DDL ownership is split by artifact type:

- **Canonical schema DDL** defines the full current-state schema.
- **Migration DDL** defines forward-only deltas from one state to the next.

#### 14.3.1 Rules

- Keep canonical schema and migrations aligned; either artifact may be used to reconstruct expected runtime state.
- Canonical schema is idempotent and reproducible.
- Migrations are append-only and never rewritten after application in shared environments.
- A migration changes only what is required for that versioned step.
- Destructive changes must be explicit and reviewed (drop/rename/type narrowing/data rewrite).
- Data backfills in migrations must be deterministic and safe to rerun when possible.
- Constraint, index, and policy naming follows the schema naming conventions (§14.2).
- If canonical schema and migrations conflict, treat it as a release blocker until reconciled.

### 14.4 RPC functions

| Artifact       | Convention                                                            | Example       |
| -------------- | --------------------------------------------------------------------- | ------------- |
| Function name  | `{verb}_{noun}` snake_case                                            | `user_exists` |
| Parameter name | snake_case, `p_` prefix                                               | `p_email`     |
| Return columns | snake_case, named for the caller; table columns qualified in the body | `exists`      |

- Parameters are passed as a keyed object: `rpc('user_exists', { p_email: value })`.
- Scalar returns (`boolean`, `integer`, `text`) come back directly; record returns as objects.
- Every return surfaces through `ApiBusRuleContract<TParams, TResult>` (§10.6).

## 15. Error Handling

- Throw `Error` with an actionable message, for example `'Asset dictionary missing required field:
  id'`. A validation failure throws `ValidatorError` through `notValid` (§9.6).
- A client throws `ApiError`, with a status and optional detail, for every failure: makers map
  provider errors with `checkApiError` and `throwApiError`. Callers that handle failures test
  with `apiError(error)` and rethrow anything else.
- A service returns an unexpected failure through `toInternalError`, and an expected one by
  throwing `HttpServiceError` (§12).
- Never swallow errors silently.
- Never log and continue: log and throw, or throw without logging.
- Never expose stack traces or internal state in HTTP responses.

```typescript
try {
  await Profiles.update(ProfileScope.toUpdate(id, draft))
} catch (error) {
  if (!apiError(error)) throw error
  feedback.show((error as ApiError).message)
}
```

## 16. Testing Conventions

```text
source/tests/
  cases/                      <- test files: {abstraction}-api-test.ts
  fixtures/
    samples.ts                <- barrel export for all fixtures
    {abstraction}-samples.ts  <- named constants producing valid domain objects
    fixtures-test.ts          <- fixture integrity checks
```

- Test files live in `source/tests/cases/`, named `{abstraction}-api-test.ts`.
- `{abstraction}-samples.ts` — exports named constants and factory functions producing valid, realistic domain objects. These are the ground truth for tests.
- `fixtures-test.ts` — validates fixture integrity: Id format, required fields, association linkage. If a fixture fails here the domain types have drifted.
- Tests exercise the public contract of each layer, not implementation details.
- Each abstraction's adapter must have a round-trip test: `toAbstraction(fromAbstraction(obj))` round-trips cleanly.

## 17. Amendment Record

Each published version supersedes the one before it. Versions below 1.0 were never tracked as versions at the time — they are reconstructed retroactively from git, one per path rename, marking substantive content shifts within each era rather than the rename itself.

| Version | Published           | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1     | 2026 October 20th   | §6 rewritten. The spec-file JSDoc header is retired: every file begins with a box header, written in expanding levels, with level 2 for files another module imports (§6.1). PUBLIC, or its named groups, lists every export, props types included, and containers list their members as a tree (§6.2). Tooling and tests conform like product code.                                                                                                                |
| 1.0     | 2026 September 15th | Cross-references in this document and every document citing it (`AGENTS.md`, the architecture docs, the genesis prompts) caught up to the new name (commit `ca77878`), and it gained explicit metadata and this amendment record for the first time. The rename's rationale: the document covers more than style — §8.6/§8.7 adapter and maker shape, §12 testing are structural pattern conventions, not aesthetics — and the old name undersold its actual scope. |
| 0.7     | 2026 September 13th | Path renamed to `CONVENTIONS.md` (commit `5272c25`) with no content change of its own — bundled quietly into an unrelated commit, internal references still said "STYLE-GUIDE" for two more days.                                                                                                                                                                                                                                                                   |
| 0.6     | 2026 June 30th      | Its busiest era, and its first as a root-level, governance-tier document: barrel-import restrictions, the type/interface distinction, and the `core/cli`/`core/svc` namespace-length rule were all clarified here, alongside `@front/api` reconciliation and DevOps gap documentation.                                                                                                                                                                              |
| 0.5     | 2026 March 14th     | `makeAdapter` and the `std`/`stdx` split were documented, alongside runtime config guidance (`LOCAL_DB_NAME`) and union-type/validator protocol conventions.                                                                                                                                                                                                                                                                                                        |
| 0.4     | 2026 February 12th  | The `Id`/`isId` naming convention was established, `@core/std` container type aliases enforced, and `dprint` adopted as the authoritative formatter.                                                                                                                                                                                                                                                                                                                |
| 0.3     | 2026 January 5th    | Documentation and session-hygiene rules formalized, an AUTHORITY concept introduced, and the first enforcement guards (leaf layout) added as the domain reorganized into abstractions/validators/protocol.                                                                                                                                                                                                                                                          |
| 0.2     | 2025 December 10th  | Backend reorganized into `core/` with default-only handlers; the core API moved to serverless.                                                                                                                                                                                                                                                                                                                                                                      |
| 0.1     | 2025 December 9th   | Created as `STYLEGUIDE.md`, 82 lines — the third commit in the repository's entire history.                                                                                                                                                                                                                                                                                                                                                                         |

_End of Conventions Document_
