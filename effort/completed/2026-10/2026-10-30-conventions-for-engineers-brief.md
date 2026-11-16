# Conventions for Engineers — Brief

**Completed 2026-10-30.** CONVENTIONS 1.9 rewrote §13 (`32d41c7`), and 1.10–1.12 rewrote §17.1,
§17.4, §17.5, §16.1, §16.4, §10.1, and §10.6 (`ebd986b`), each for the engineer who arrives with a
need; the CA reviewed them and closed the brief. Nothing is deferred. Recorded 2026-10-30 from a CA

- AI Architect session, while reviewing the document store production, and chosen from the backlog
  (B-38) the same day; B-38 is removed with this closure.

## What triggered it

The CA reviewed CONVENTIONS §13 and asked whether an engineer who needs local storage would find
enough there to choose and use it. The chapter named its parts (`IndexedDb`, a maker that
registers its store, `Preferences`, the database name) but answered none of an engineer's
questions: which tool to use, what happens to the data, and what happens when a store's shape
changes. It was written for a compiler, a list of symbols and constraints, not for an engineer
with a need. Version 1.9 rewrote it.

## The standard

A section serves the engineer who arrives with a need:

- **It opens with the need,** and says when to reach for what it describes, before naming
  symbols.
- **It says why** a rule exists where the reason is not obvious.
- **It shows one example** of the common use.
- **Symbols follow purpose;** the module headers keep the full account.

§17.2 Collection-Detail and the rewritten §13 are the models; §11 Runtime Configuration, §12
Services, §10.5 Queries, §15 Error Handling, §19 DevOps and Guards, and §9's type shapes already
meet it.

## The sections

Worst first:

1. **§17.4 Index-Detail at depth: `DrillDown`.** Four component and context names in two
   sentences, with no example and no statement of the problem it solves.
2. **§16.4 Session and §16.1 Composition.** Contract names in sequence: an engineer starting an
   application learns what exists, not what to write first.
3. **§17.5 the dashboard and §17.1 Steps and sequences.** Rules about symbols without an example.
4. **§10.6 API clients.** "Adapted", "direct", and "scoped adapter" come before when to want
   which.
5. **§10.1 Makers.** A definition ("it creates code") without why an engineer reaches for one.

## Constraints

- CONVENTIONS is a Seasons Computing document, used across repositories: it cites `core/` and
  `ux/` but never this system's code, paths, or records, and its examples are neutral.
- It is locked; the CA opens it for each rewrite, and each is a version in its amendment record.
- A rewrite changes how a section reads, never what it requires. A new or changed rule is its own
  CA decision.
- One section at a time, each reviewed by the CA.

## Production — 2026-10-30

Written by the AI Architect at the CA's direction, all five at once, for the CA to review a chapter
at a time; one version per chapter.

- **1.10, chapter 17:** §17.1 Steps and sequences, §17.4 `DrillDown`, §17.5 the dashboard.
- **1.11, chapter 16:** §16.1 Composition, §16.4 Session.
- **1.12, chapter 10:** §10.1 Makers, §10.6 API clients.

Each section now opens with when to reach for it, says what its parts do, and shows one neutral
example; every rule it held is kept. One rule became explicit that was only implicit in the code:
a Step has one `DrillDown`, however deep the nesting (§17.4).

**Reviewed:** by the CA, 2026-10-30, including §17.4's one-host-per-Step rule.
