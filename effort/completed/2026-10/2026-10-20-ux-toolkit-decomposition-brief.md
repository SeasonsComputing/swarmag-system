# UX Toolkit Decomposition — Brief

**Closed 2026-10-20.** `architecture-front.md`'s toolkit material is decomposed by rank, and front
keeps swarmAg's composition. Recorded 2026-10-20 by the CA and AI Architect, from backlog B-3 "`architecture-front.md`
mixes the portable `ux/` toolkit with swarmAg's `front/`". Follows
`effort/completed/2026-10-20-architecture-system-cut-brief.md` and rides along with roadmap M-5.

## Decisions (CA, 2026-10-20)

1. **`ux/` is a Seasons Computing library, like `core/`.** Its construction guidance belongs in CONVENTIONS, and
   its file headers are the reference. No architecture document lives in `documentation/ux/`.
2. **`architecture-front.md`'s toolkit material decomposes by rank:**
   - design meaning (which surface, its vocabulary) to `ux-design-archetypes.md`;
   - how to use a `ux/ui` control to `ux-components-guide.md`;
   - how to build with `ux/shell` to CONVENTIONS, one or two chapters that build the archetypes
     and point up to them;
   - a toolkit guarantee to the `ux/` module headers.
3. **`architecture-front.md` keeps swarmAg's composition** of the toolkit: the app suite, the
   `api` namespace, the `app/` tier, and swarmAg's halves of the split sections.
4. **`ux-design-archetypes.md` §6 Supporting Library** is classified with it, as the bridge between
   meaning and construction.
5. **Method:** classify the whole by rank, the CA reviews, then cut and move; when in doubt, leave
   it.

## Placements: `architecture-front.md` and archetypes §6 (reviewed by the CA, 2026-10-20)

Destinations: **A** `ux-design-archetypes.md`, **G** `ux-components-guide.md`, **C** new `ux/shell`
chapters in CONVENTIONS, **H** the `ux/` module headers, **F** stays in `architecture-front.md`.

The archetypes document is a pattern language: it owns the vocabulary, and every other document
uses its terms and points back, never restating a pattern. The CONVENTIONS chapters are organized
by the archetype each builds.

| Section                              | Placement                                                                                                                                                                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8.3 Reactive Store Module Pattern    | C                                                                                                                                                                                                                                   |
| 8.4 Query State Pattern              | C, with a generic `useCountries` sample in place of swarmAg's `facets-state`                                                                                                                                                        |
| 9.1 shell structure                  | generic composition (`bootstrap`, `AuthGuard`, `Dashboard`, makers taking branded parameters) to C; the app tier and each `Application` stay F                                                                                      |
| 9.1.1 UX metaphors                   | F, as a one-line pointer to A §6                                                                                                                                                                                                    |
| 9.1.2 Auth guard                     | F: a swarmAg guarantee                                                                                                                                                                                                              |
| 9.1.3 dashboard as navigation        | A, as Chassis-Part                                                                                                                                                                                                                  |
| 9.2 routing                          | C; app roots importing the app-tier maker stay F                                                                                                                                                                                    |
| 9.3 authentication                   | method table cut (the `auth-contract` header); contracts and bootstrap to C, their guarantees to H; `AuthGuard` behavior to H; swarmAg's coordinator, `UserProvider`, OTP flow, and logout wrapper stay F; generic `logout` to H    |
| 9.4 session state                    | field and intent tables cut (the `session-state` header); `isPrepared`/`isSignedOut` meaning to H; "UX imports its own stores, never `front/api`" to C; re-exports stay F                                                           |
| 9.5.2 app preferences                | `AppState` to C; per-app keys stay F                                                                                                                                                                                                |
| 9.6 state management                 | mechanism per concern to C; swarmAg locations stay F; draft copying to H, "drafts stay plain and cloneable" to C                                                                                                                    |
| 10.1.1, 10.1.2 `ux/` trees           | C                                                                                                                                                                                                                                   |
| 10.1.3–10.1.5 `app/` tier, placement | F                                                                                                                                                                                                                                   |
| 10.1.6 library                       | building a Sequence, Manager, or Wizard to C; detailed behavior to H; the header already follows A §§3.3, 4.2; non-dismissible `UiDialog` to G; workbench vocabulary to A; `{topic}-step-{name}.tsx` to CONVENTIONS §4 in A's terms |
| 10.1.6 features                      | F: `NotesEditor`, Customer, Onboarding, User, scopes, `UserPicker`                                                                                                                                                                  |
| 10.2 build composition               | F                                                                                                                                                                                                                                   |
| 10.3 dashboard                       | the pattern to A as Chassis-Part; geometry stays with `ux-design-language.md` and the CSS; seed contract, `DashboardState`, the registry, and the closed shell to C; per-app JSON stays F                                           |
| 10.4, 11, 12                         | F                                                                                                                                                                                                                                   |
| archetypes §6                        | stays A: design governance; the CONVENTIONS chapters point to it                                                                                                                                                                    |

## Closure (2026-10-20)

Production by the CA and AI Architect: the `ux/shell` header semantics (`a49278e`); CONVENTIONS §16
UX Shell, §17 Building UX Patterns, and §4.2 step naming (`732603b`); the archetypes additions, the
`architecture-front.md` cut, and the references (`f2a1b94`). A sentence-level check restored six
statements before review. Nothing is deferred; B-3 is removed from the backlog.

## Checks

`deno task fmt:check` and `deno task check` after each change; every moved statement is accounted
for sentence by sentence; every reference resolves.

## B-3 entry text, folded in

> `source/ux/` is the portable toolkit, intended as a Seasons Computing library; `source/front/` is swarmAg's
> own composition. `architecture-front.md` documents both in one file, and several sections pair a
> generic mechanism with swarmAg's implementation of it: §9.3 Authentication
> (`SessionCoordinatorContract` and `logout` beside `AuthSupabaseClient`, the coordinator, and
> Login), §9.4 Session State, and §10.1.6 Workbench steps (the `panel/` and `workbench/` library
> beside the Customer, User, and Onboarding features). The toolkit's architecture should travel with
> the toolkit.
>
> The fix is a `ux` architecture document in `documentation/ux/`, taking the generic material:
> §8.3 Reactive Store Module Pattern, §9.1–§9.2 shell structure and routing, the generic halves of
> §9.3 and §9.4, §9.5.2 Application Preferences, §10.3 Dashboard Layout Contract, and the library
> half of §10.1.6. `architecture-front.md` keeps the API namespace and form scopes (§7), the `app/`
> tier and its rules, swarmAg's halves of the split sections, and §11. Two placements need a
> decision when the split is made: §8.4 Query State Pattern, generic as a pattern but swarmAg in its
> example, and §10.1.6, divided down the middle.

Superseded by Decision 1: its "`ux` architecture document in `documentation/ux/`" is not built.

_End of Brief_
