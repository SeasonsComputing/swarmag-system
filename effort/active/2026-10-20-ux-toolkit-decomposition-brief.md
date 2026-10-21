# UX Toolkit Decomposition — Brief

**Active.** Recorded 2026-10-20 by the CA and AI Architect, from backlog B-3 "`architecture-front.md`
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
