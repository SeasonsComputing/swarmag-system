# Containers in CONVENTIONS — Brief

**Closed 2026-10-20.** CONVENTIONS 1.1 states the preference (§1) and gains §8 Types and
Containers. Chosen 2026-10-20 to ride along with roadmap §5 beside file header conformance:
both write CONVENTIONS in the same window. Recorded 2026-10-09 from a CA + AI Architect session, while settling
file-header conventions (`effort/completed/2026-10-09-file-header-conformance-brief.md`).

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
   (`effort/completed/2026-10-09-file-header-conformance-brief.md`, Decision 7).

## Open, resolved 2026-10-20

1. **Prescriptive guidance enforced by review.** CONVENTIONS §1: some conventions are preferences,
   applied with judgment and held by review; departing from one with a stated reason is not a
   violation. AGENTS needs no edit.
2. **The section's content.** §8 Types and Containers: §8.1 Primitives and ADTs and §8.2 Type vs.
   interface, both moved out of §2; §8.3 Containers, the forms with `core/` examples and sample
   code. The old §8 to §13 became §9 to §14.
3. **The census.** Dropped: the section's examples come from `core/`, and no refactoring is planned.
4. **Domain.** Dropped: domain artifacts already take container forms (maker-produced adapters,
   validator modules, types), and genesis follows CONVENTIONS.

## Production

CA and AI Architect, 2026-10-20: CONVENTIONS 1.1, committed with live references renumbered.
Checks: `deno task fmt:check` and `deno task check`, green.

## Design history

- **Framing `core/` and `domain/`.** The AI Architect first proposed stating that `core/std`
  predates the preference and is not its model. The CA rejected framing any namespace as an
  exception, whether as too cool for the rules or as broken design: a cohesive module is a
  container form, and the preference is applied with judgment.

_End of Brief_
