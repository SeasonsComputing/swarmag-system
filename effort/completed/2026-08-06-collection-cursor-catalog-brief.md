# UiCollectionCursor — Catalog Publication Brief

**Date:** 2026-08-06
**Mode:** Foundation
**Author:** Chief Architect (decisions); AI Architect (capture, brief)
**Milestone:** M1 Customer Onboarding — Phase 2, follow-on
**Predecessor:** `effort/active/2026-08-06-collection-cursor-brief.md` — the
control, its styles and the stage-3 rehost. Complete.

`UiCollectionCursor` shipped into the closed `ui` catalog but was not published
into the artifacts that catalog owes. Every other `Ui{Control}` appears in the
demonstration harness and in both component guides; this one appears in neither.
That is the work here.

**This brief changes no behaviour.** §1 renames one prop; nothing else touches the
control. If any task below appears to require a _behavioural_ change, stop and
escalate — it means the control and its documentation disagree, which is a design
question, not a documentation one.

## 1. Prerequisite — rename `children` to `renderItem`

**Do this first.** The guide entries in §4 and §5 document the prop, so renaming
afterwards means writing the documentation twice.

`UiCollectionCursor` takes a callable in its `children` slot. `children` is a noun
naming contents — a reader expects nodes and finds a function. An operation leads
with a verb, and `renderItem` sits with the vocabulary the API already uses:
`items`, `newItem`, `renderItem`.

It also makes the layers agree. `AbstractionManagerContract` already verb-names
its host-supplied rendering — `renderForm`, `renderListCells`. This makes `ui`
the same convention rather than a second one.

| File                                              | Change                             |
| ------------------------------------------------- | ---------------------------------- |
| `ux/ui/components/ui-collection-cursor.tsx`       | prop declaration and its call site |
| `app-admin/onboarding/onboarding-stage-sites.tsx` | the sole consumer                  |

The call shape changes with it — the render function moves from the children
position to a named prop:

```tsx
<UiCollectionCursor items={sites()} renderItem={(site, index) => <SiteForm … />} … />
```

The control accepts no children afterwards. **Behaviour does not change.** This is
a rename and a prop-position move, nothing else.

## 2. What `ui` placement owes

| Artifact                                       | State                     |
| ---------------------------------------------- | ------------------------- |
| `ux/ui/components/ui-collection-cursor.tsx`    | shipped                   |
| barrel export in `ui.ts`                       | shipped                   |
| `ux/ui/css/ui.css` selectors                   | shipped                   |
| `app-style-guide` harness section              | **owed**                  |
| `documentation/ux/ux-components-guide.md`      | **owed**                  |
| `documentation/ux/ux-components-guide-lite.md` | **owed**                  |
| `documentation/ux/ux-components-internals.md`  | **not required — see §6** |

## 3. Harness section — `app-style-guide`

Files: `source/front/app-style-guide/style-guide.tsx`, and
`style-guide-fixtures.ts` if sample data is added.

- add `UiCollectionCursor` to the `@front/ux/ui` import block
- demonstrate it inside an `SgSection`, following the existing pattern —
  `SgSection title='…'` renders the `<h2>`, and controls are demonstrated inside
  `UiFieldset` blocks with a legend naming the control
- place it with the form-composition controls, beside `UiFormActions` and
  `UiFieldset`, not with display controls

**This demo is stateful, unlike most in the harness.** The control is value-in /
value-out, so the section needs a local signal holding the sample collection and
a handler for `onItemsChange`. Keep the sample small and inert — two or three
items of a local shape declared in `style-guide-fixtures.ts`. **Do not import a
domain type.** The harness demonstrates the control, and the control knows no
domain; importing `CustomerSite` or `Note` would assert a coupling that does not
exist.

Exercise the states a reader cannot infer from a screenshot:

- the empty body, reachable by deleting the last item
- nav disabled at one item
- pips, and the `N of M` readout above eight

The last one needs nine or more items to be reachable. A second, larger sample
is acceptable if one demo cannot show both readouts.

Harness-local styling, if any, is `data-app` in `style-guide.css`. Do not add
component styling — that belongs to `ui.css` and is already there.

## 4. Full guide — `ux-components-guide.md`

Follow the established entry shape exactly, as used by §3.16 `UiActionButton` and
§5.6 `UiFieldset`:

- **Use When** — one short paragraph
- **Props** — table of prop, type, required, default, description
- **Emitted Attributes** — the `data-ui` values the control renders
- **Example** — a `tsx` block

Place it by category with the form-composition controls. Numbering is mechanical;
keep the document's existing scheme and update any cross-references the insertion
disturbs.

One point the entry must carry, because a consumer cannot discover it from the
prop list and it fails silently:

- **`items` is never mutated in place.** The control emits the next array through
  `onItemsChange`; a host that mutates and re-passes the same reference will not
  update.

`renderItem` needs no such note once §1 is done — the name carries it.

## 5. Lite guide — `ux-components-guide-lite.md`

Two additions:

- a row in the **Component-First Rule** table (§2.2): `UiCollectionCursor` versus
  _ad hoc list-plus-capture-form_. This one earns its place — the pattern it
  replaces is precisely what onboarding stage 3 was, and the table exists to stop
  that being rebuilt by hand.
- a short entry in the same category the full guide uses, matching the lite
  register: what it is for, in two or three sentences, no prop table

## 6. Internals — not required

`ux-components-internals.md` catalogs **component-specified tokens**, which live
in `themes.css`. `UiCollectionCursor` introduced none: its fourteen referenced
tokens are all existing foundation and role tokens, verified 2026-08-06.
`themes.css` was not modified by the predecessor production.

**Do not invent component-specified tokens to justify an entry.** If a genuine
theming need appears, that is a design question — escalate.

## 7. Out of scope

- the control's behaviour, its styles, and the stage-3 layout — complete under
  the predecessor brief. §1's rename is the only permitted touch of those files
- job-sites layout — in design, not settled
- any change to `themes.css`, `roles.css` or `tokens.css`
- `documentation/architecture/**`, `AGENTS.md`, `CONSTITUTION.md`,
  `STYLE-GUIDE.md`
- `source/domain/**`, `source/core/**`, `source/back/**`,
  `source/devops/guards/**`

## 8. Checks

```bash
deno task fmt && deno task check
```

`check` chains `check:guards` (thirteen guards), `check:types` and `check:lint`.
`STYLE-GUIDE.md` is a hard gate.

Note that `guard:tokens` prohibits documentation from restating a token's value
beside its name — name tokens, never their values.

**No automated UI coverage exists.** The harness section is visual by nature, so
behavioural verification is the Chief Architect's browser. Report checks green
and appearance unverified.

**Delegates are read-only on git.** No commits, no branches, no reverts.

_End of Brief_
