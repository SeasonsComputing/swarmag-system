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

A **Coding Engine AI** (e.g., Codex or equivalent) is a mechanical executor.

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

### 4.1 Persistence and Modeling

- The system defaults to **4th Normal Form (4NF)**
- Separate tables, explicit foreign keys, and query-based navigation are the norm

**JSONB usage is an exception**, permitted only for:

1. End-user specialization (custom or user-defined attributes)
2. Third-party metadata (opaque external payloads)
3. Payload-as-truth (versioning and audit snapshots)
4. Subordinate composition (part-of relationships with no independent lifecycle and no external foreign keys)

Anything referencing external entities must be normalized.

### 4.2 Domain and Lifecycle Authority

- Domain meaning is defined centrally and enforced consistently
- Invariant validation lives in the domain layer only
- Upper layers translate errors but never redefine rules

**Job is the business hub**:

- Job is created first
- Assessment evaluates a Job
- Plan defines execution for a Job
- Logs record execution of a Job

Circular foreign keys are forbidden.

### 4.3 Directionality and Multiplicity

- Associations are **unidirectional by default**
- Children hold foreign keys to parents
- Parents do not store child ID collections
- Navigation occurs through queries

Bidirectional navigation exists only via explicit junction tables.

### 4.4 Deletion Semantics

- All entities support soft delete via `deleted_at`
- The system never hard-deletes during normal operation
- Hard deletes occur only under data-retention policy execution

Foreign-key cascades exist to ensure correctness **when cleanup is authorized**, not as a runtime convenience.

### 4.5 Identifiers and Timestamps

**Identifiers (ID):**

- Type: `ID` - UUID v7 string
- Generator: `id()` - Creates new UUID v7
- Validator: `isID(value)` - Validates UUID v7 format
- Import: `import { type ID, id, isID } from '@utils'`

All entity identifiers must use the `ID` type. Generate new IDs with `id()`, never use external libraries or manual string construction.

**Timestamps (When):**

- Type: `When` - ISO 8601 UTC timestamp string
- Generator: `when()` - Creates current timestamp
- Validator: `isWhen(value)` - Validates ISO 8601 format
- Import: `import { type When, when, isWhen } from '@utils'`

All temporal values must use the `When` type. Generate timestamps with `when()`, never use `new Date()` or similar patterns directly.

**Example Usage:**

```typescript
import { type ID, id, isID } from '@utils'
import { isWhen, type When, when } from '@utils'

const userId: ID = id()
const createdAt: When = when()

if (isID(someValue)) {
  // Valid ID
}

if (isWhen(timestamp)) {
  // Valid timestamp
}
```

## 5. Engineering Philosophy and First Principles

The system is governed by disciplined engineering, not novelty.

### 5.1 Core Principles

- **Agile guarantees with disciplined engineering**\
  The “what” and “why” evolve; the “how” remains grounded in best practice.

- **Less is almost always more**\
  Fewer features, less code, and simpler designs yield greater reliability.

- **Pareto-driven feature design**\
  Deliver the essential 20% that satisfies 80% of real needs.

- **Better to kill a feature than ship it incomplete**\
  Half-built features create long-term cost and reputational damage.

- **Do it right, do it now**\
  Deferring correctness compounds failure and institutionalizes bad judgment.

- **Working code is the minimum bar**\
  Durability, clarity, restraint, and first-principles alignment are the goal.

- **Leaders set standards through behavior**\
  Implicit actions are as influential as explicit rules.

- **Pride and purpose drive excellence**\
  Quality emerges from meaning, not speed or novelty.

AI systems must treat these principles as **operational constraints**, not philosophy.

## 6. Historical and Technical Foresight

The system reflects experience across multiple paradigm shifts in:

- Programming languages
- Distributed and multi-node computing
- Cloud and SaaS platforms
- Architectural styles and frameworks
- Enterprise, startup, and acquisition contexts

AI systems must assume:

- Constraints likely exist for historical reasons
- “Modern best practice” does not override earned judgment
- Novelty is not inherently progress

Re-litigating settled decisions without cause is forbidden.

## 7. Business Reality and Risk Awareness

Engineering decisions carry real business consequences, including:

- Customer trust and safety
- Regulatory and legal exposure
- Acquisition readiness and due diligence
- Long-term operational cost

Incomplete, misleading, or sloppy systems impose **first-order business risk**.

AI systems must treat reputational damage as a primary concern, not a side effect.

## 8. Interpretation and Enforcement

### 8.1 Conservative Interpretation Rule

If any AI system is uncertain how to apply a rule:

- It must choose the **most conservative interpretation**
- It must **pause and escalate** rather than proceed

Doing nothing is preferable to doing the wrong thing.

## 9. Supersession Notice

This document supersedes and replaces all prior AI- or collaboration-specific guidance files

All rules, authority, and expectations are now centralized here.

Compliance with this Constitution is a condition of participation for both human and artificial contributors.

**End of Constitution**
