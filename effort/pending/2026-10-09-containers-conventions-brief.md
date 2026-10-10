# Containers in CONVENTIONS — Brief

**Backlog, not dispatched.** Recorded 2026-10-09 from a CA + AI Architect session, while settling
file-header conventions (`effort/pending/2026-10-09-file-header-conformance-brief.md`).

## What triggered it

The header work turned on containers: PUBLIC groups, and member trees for `UiText` and `Routes`.
The CA observed that CONVENTIONS describes his approach poorly. It treats type versus interface in
passing, with no dedicated section, and says nothing about classes or module singletons. The CA
works from object-oriented analysis and design: encapsulation in named containers runs through his
design, architecture, and complexity mitigation. Early in the project he deferred to AI on current
technique, and the AI Coding Engine produced free-floating functions in numerous places he would
have encapsulated in a container.

## What the repository holds

The CA's model is visible where he wrote or corrected the code:

- **Module singletons** (const-as-class, PascalCase): `AppState`, `SessionState`,
  `DashboardState`, `Routes`, `UiText`, `HttpCodes`.
- **Contracts as interfaces, implemented by classes:** `SessionCoordinatorContract` and
  `AppSessionCoordinator`; `AbstractionManagerContract`.
- **Classes:** `AppSessionCoordinator`; the runtime providers behind `Config`.
- **Makers:** `makeAdapter`, `makeScope`, `makeCrudSupabaseClient`, functions that produce
  containers.

CONVENTIONS §4.2 names "const-as-class" (`HttpCodes`) and the type/interface distinction appears
elsewhere, but no section states when to use each, or when a free function is the right form.

## Decisions (CA, 2026-10-09)

1. **CONVENTIONS gains a containers section,** covering classes, module singletons, contract
   interfaces versus types, makers, and when a free function fits.
2. **It is written as a preference, applied with judgment.** In a tone a team, including
   engineers early in their careers, can take up without feeling policed. Where it makes sense, the
   CA suggests, requires, or rewrites; it is enforced by review, not by a guard.
3. **A cohesive module is a container too.** Encapsulation has moved to namespace directories and
   modules in many architectures, and classes still exist beside them. The preference names the
   forms: a class, a module singleton, or a cohesive, well-named module in its namespace. So no
   namespace is written up as an exception. `core/` is frozen apart from mechanical header cleanup
   and is code newcomers read; its `core/std` modules (`validators.ts`, `relations.ts`) are
   cohesive families of functions, and their headers name those families
   (`effort/pending/2026-10-09-file-header-conformance-brief.md`, Decision 7).

## Open

1. **Prescriptive guidance enforced by review.** CONVENTIONS already holds rules no guard can check
   ("Documentation intensity follows implementation complexity", "Headers stay current"). The CA
   holds that CONVENTIONS should allow prescriptive guidance that is not guard-enforced. AGENTS §3.1
   treats any CONVENTIONS violation as a correctness failure, so CONVENTIONS should name the
   category: guidance enforced by review, which the AI Coding Engine follows by default and departs
   from only with a stated reason. How it is marked in the text is open; both edits are governance
   edits.
2. **The section's content:** when a class, when a module singleton, when an interface versus a
   type (the substitutability test already used for Contract versus Context naming), and when a
   free function is right (a maker; a pure primitive).
3. **The census.** Exported free functions outside `core/`, grouped by module, showing where a
   container would own them. It informs the section's examples and identifies candidates for
   later, separately authorized refactoring; the census changes no code.
4. **Domain.** `domain/` is regenerated from genesis prompts that follow `domain-archetypes.md`, so
   any container preference for domain artifacts is stated there, not by hand edits.

## Production scope (sketch)

The census first, then the CONVENTIONS section (governance file: committed with the governance-gate
bypass), with the preference marking from Open 1. No code changes.

## Design history

- **Framing `core/` and `domain/`.** The AI Architect first proposed stating that `core/std`
  predates the preference and is not its model. The CA rejected framing any namespace as an
  exception, whether as too cool for the rules or as broken design: a cohesive module is a
  container form, and the preference is applied with judgment.

_End of Brief_
