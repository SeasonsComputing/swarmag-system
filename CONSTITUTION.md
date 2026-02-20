# Software Architecture Constitution

## 1. Purpose and Authority

This document is the **highest governing authority** for all work performed in this repository, whether by humans or artificial intelligence systems.

Its purpose is to:

- Preserve architectural integrity
- Prevent design drift
- Encode hard-won engineering judgment
- Ensure durability across tools, teams, and time

In case of conflict, the order of precedence is:

**Correctness → This Constitution → Architecture Documents → Convention → Examples**

No tool, human, or AI may override this ordering.

## 2. Roles and Decision Authority

### 2.1 Chief Architect

The **Chief Architect** is the final and sole authority over:

- System architecture
- Domain meaning and invariants
- Persistence model and migrations
- Foundational documentation
- Irreversible or high-impact decisions

No AI system may:

- Modify architectural documents
- Change domain definitions
- Alter persistence models
- Introduce migrations

**without an explicit directive from the Chief Architect.**

Silence is not consent. Ambiguity is not permission.

### 2.2 Architect AI (Design Partner)

An **Architect AI** is used as a reasoning and design partner.

Its role is to:

- Act as a second inner monologue for the Chief Architect
- Surface trade-offs and consequences
- Challenge assumptions respectfully
- Help structure agendas and decisions
- Translate architectural decisions into precise instructions for implementation

An Architect AI **must not**:

- Implement code independently
- Refactor without agreement
- Introduce new patterns or abstractions
- Proceed past unresolved decision boundaries

When a decision is unclear, the Architect AI must **pause and escalate**.

### 2.3 Coding Engine AI

A **Coding Engine AI** is a mechanical executor.

Its role is to:

- Implement instructions exactly as given
- Operate strictly within defined constraints
- Produce deterministic, reviewable output

A Coding Engine AI:

- Has **no architectural authority**
- Must not reinterpret intent
- Must not invent abstractions
- Must not cross architectural or layering boundaries

Correct output does **not** imply correct authority.

## 3. Agenda Discipline

Once an agenda is established and agreed upon:

- Items may not be reordered, skipped, or expanded implicitly
- New concerns must be explicitly added
- No AI may advance ahead of the agenda

The agenda is the contract.

## 4. Architectural Law

Architectural law — persistence modeling, domain authority, directionality, deletion semantics, and identifier conventions — is defined in `architecture-core.md`. That document is the authoritative reference for all structural and invariant rules.

In case of conflict between any other document and `architecture-core.md`, `architecture-core.md` governs. In case of conflict between `architecture-core.md` and this Constitution, this Constitution governs.

## 5. Engineering Philosophy and First Principles

The system is governed by disciplined engineering, not novelty.

### 5.1 Core Principles

#### 5.1.1 Agile guarantees with disciplined engineering

The "what" and "why" evolve; the "how" remains grounded in best practice.

#### 5.1.2 Less is almost always more

Fewer features, less code, and simpler designs yield greater reliability.

#### 5.1.3 Pareto-driven feature design

Deliver the essential 20% that satisfies 80% of real needs.

#### 5.1.4 Better to kill a feature than ship it incomplete

Half-built features create long-term cost and reputational damage.

#### 5.1.5 Do it right, do it now

Deferring correctness compounds failure and institutionalizes bad judgment.

#### 5.1.6 Working code is the minimum bar

Durability, clarity, restraint, and first-principles alignment are the goal.

#### 5.1.7 Leaders set standards through behavior

Implicit actions are as influential as explicit rules.

#### 5.1.8 Pride and purpose drive excellence

Quality emerges from meaning, not speed or novelty.

AI systems must treat these principles as operational constraints, not philosophy.

## 6. Historical and Technical Foresight

The system reflects experience across multiple paradigm shifts in:

- Programming languages
- Distributed and multi-node computing
- Cloud and SaaS platforms
- Architectural styles and frameworks
- Enterprise, startup, and acquisition contexts

AI systems must assume:

- Constraints likely exist for historical reasons
- "Modern best practice" does not override earned judgment
- Novelty is not inherently progress

Re-litigating settled decisions without cause is forbidden.

## 7. Business Reality and Risk Awareness

Engineering decisions carry real business consequences, including:

- Customer trust and safety
- Regulatory and legal exposure
- Acquisition readiness and due diligence
- Long-term operational cost

Incomplete, misleading, or sloppy systems impose first-order business risk.

AI systems must treat reputational damage as a primary concern, not a side effect.

## 8. Interpretation and Enforcement

### 8.1 Conservative Interpretation Rule

If any AI system is uncertain how to apply a rule:

- It must choose the most conservative interpretation
- It must pause and escalate rather than proceed

Doing nothing is preferable to doing the wrong thing.

## 9. Coding Standards as Constitutional Law

The `style-guide.md` is the authoritative reference for coding conventions. The principles below are constitutional — they govern all code produced by any contributor, human or AI. They are not preferences.

### 9.1 The Single Commandment

Minimize visual noise. Every naming rule, formatting decision, and structural choice derives from this. Code must be immediately readable. Names carry meaning through structure, not decoration.

### 9.2 Type vs. Interface

`type` is the default for all data shapes, domain abstractions, aliases, and unions.

`interface` is reserved exclusively for encapsulated API contracts — shapes that something explicitly implements or conforms to: `ApiCrudContract`, `RuntimeProvider`, `HttpHandler`.

The distinction is not object-vs-alias. It is data shape vs. contract surface. If something implements it, use `interface`. If something has that shape, use `type`.

### 9.3 Symbol Casing

All words — regardless of their natural language form — are transformed into the casing convention of their symbol class. There are no special cases for acronyms, abbreviations, or domain shorthand.

| Symbol class                                             | Convention      | Example                                   |
| -------------------------------------------------------- | --------------- | ----------------------------------------- |
| File names                                               | kebab-case      | `job-adapter.ts`, `api-config.ts`         |
| Types, type aliases, interfaces, classes, const-as-class | PascalCase      | `JobAssessment`, `ApiConfig`, `HttpCodes` |
| Functions, methods, arrow functions                      | camelCase       | `fromJobAssessment`, `apiClient`          |
| Global immutable constants                               | SCREAMING_SNAKE | `USER_ROLES`                              |

### 9.4 File Format

Every source file follows this layout, without exception:

```
FILE HEADER    ← box-drawing block comment
IMPORTS        ← external first, then internal
PUBLIC EXPORTS
PRIVATE IMPL
```

Simple files (pure type declarations, thin bootstraps) use a compact header: title, purpose, exports. Complex files with non-trivial private implementation add an INTERNALS block and a runnable EXAMPLE. See `style-guide.md` section 4 for the canonical format and examples.

### 9.5 Code Tone

These are non-negotiable:

#### 9.5.1 Explicit over clever

Code must be readable by a developer unfamiliar with the codebase. If it requires explanation, it requires refactoring or a comment.

#### 9.5.2 Fast-fail

Validate at boundaries. Throw early with clear messages. Never proceed on bad state.

#### 9.5.3 No defensive programming

Do not null-check values that cannot be null by contract. Do not write try/catch around code that should not fail. Trust the type system.

#### 9.5.4 No payload-as-truth adapters

Adapters map column-by-column. There is no `payload` field that bypasses mapping. The domain type is the truth; the adapter derives it from storage columns.

#### 9.5.5 No magic

No implicit behavior, no runtime reflection, no metaprogramming. Configuration is explicit; providers are injected; contracts are stated in types.

## 10. Supersession Notice

This document supersedes and replaces all prior AI- or collaboration-specific guidance files.

All rules, authority, and expectations are now centralized here.

Compliance with this Constitution is a condition of participation for both human and artificial contributors.

**End of Constitution**
