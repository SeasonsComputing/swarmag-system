# Documentation Authority Chain — Brief

**Pending draft, not dispatched.** Recorded 2026-10-08 from a CA + AI Architect session, after the
AI Coding Engine noted, while preparing the workbench list layout production, that "Architecture
Core's authority table differs from the constitution's precedence order; the constitution
governs." The AI Architect verified the note and found the drift reaches four more documents.

## What the repository holds

**Constitution §1** (2.1, published 2026-08-18) sets the order of precedence, which "No tool,
human, or AI may override":

```text
Correctness
  → This Constitution
    → Domain Model Documents
      → Architecture Documents
        → UX and Design-Language Documents
          → Style Guides & Conventions
            → Agent Instructions
              → Code Examples
```

**`architecture-core.md` §1.1 Authority Chain** states "Authority decreases from top to bottom" over
a different order: Constitution, Architecture Core, Domain Model, Domain Data Dictionary, Domain
Archetypes, UX Design Language, Conventions, Architecture Backend, Architecture UX, Architecture
DevOps. It contradicts the constitution twice:

1. Architecture Core ranks above the Domain Model; the constitution ranks domain documents above
   architecture documents.
2. `CONVENTIONS.md` and the UX design language rank above `architecture-back.md`,
   `architecture-front.md`, and `architecture-devops.md`; the constitution ranks every
   architecture document above both.

It also omits Correctness, agent instructions, code examples, `domain-seed-data.md`, and four of the
five UX documents (`ux-design-archetypes.md`, `ux-components-guide.md`,
`ux-components-guide-lite.md`, `ux-components-internals.md`).

**History.** Since 2026-06-30 (`27444e3`) the table has changed only by file renames:
`architecture-ux.md` to `architecture-front.md` (`cdc6ebb`, 2026-07-19) and STYLE-GUIDE to
CONVENTIONS (`ca77878`, 2026-09-15). Constitution 2.1 reordered and expanded
the chain on 2026-08-18, and the table was not reconciled.

**Citations.** `architecture-back.md`, `architecture-front.md`, `architecture-devops.md`, and
`domain-archetypes.md` each cite, in their own §1.1, `architecture-core.md §1.1` as the "Canonical
Authority Chain" that "Defines global documentation precedence for the system". A reader following
the documents reaches the stale order first.

## Proposal

1. **`architecture-core.md` §1.1 stops ordering documents.** It names Constitution §1 as the sole
   authority for precedence, and maps each of the constitution's tiers to its files. The
   constitution names kinds of document, not files; the map is what §1.1 still adds. A restated
   order would drift again, as this one did.

   - **Domain Model Documents:** `domain-model.md`, `domain-data-dictionary.md`,
     `domain-archetypes.md`, `domain-seed-data.md`.
   - **Architecture Documents:** `architecture-core.md`, `architecture-back.md`,
     `architecture-front.md`, `architecture-devops.md`.
   - **UX and Design-Language Documents:** `ux-design-language.md`, `ux-design-archetypes.md`,
     `ux-components-guide.md`, `ux-components-guide-lite.md`, `ux-components-internals.md`.
   - **Style Guides & Conventions:** `CONVENTIONS.md`.
   - **Agent Instructions:** `AGENTS.md`.

2. **The four citing documents point at Constitution §1** as the authority, keeping their own row
   for the document's place.

## Open

1. **Order within a tier.** The current table ranks domain documents among themselves (model,
   then dictionary, then archetypes) and architecture documents likewise. The constitution is
   silent within a tier. Does the map keep an internal order, or are conflicts within a tier
   escalated to the CA?
2. **`EFFORT.md`** is a governance file with no tier in Constitution §1. Placing it would amend the
   constitution, which no AI agent may edit without authorization. Flagged, not proposed.
3. **`architecture-core.md` §1.2 Scope Boundary** and the matching §1.2 tables in the citing
   documents were not audited for the same drift.

## Production scope

Operating mode: **Foundation** (foundational documentation). Documentation only: `architecture-core.md`
§1.1, and §1.1 of `architecture-back.md`, `architecture-front.md`, `architecture-devops.md`, and
`domain-archetypes.md`.

**Out of scope:** any change to `CONSTITUTION.md`, `AGENTS.md`, `CONVENTIONS.md`, or `EFFORT.md`.

_End of Brief_
