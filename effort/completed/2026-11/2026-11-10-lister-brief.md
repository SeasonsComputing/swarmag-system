# Lister — Brief

**Completed 2026-11-10.** Shipped in `b980b19`, with the records in `9668a2c` and `44f48af`. An
enabler of roadmap M-6, ahead of its fourth feature, the
Field Binder (`effort/active/2026-11-04-field-binder-brief.md`), whose viewer is the first
workbench that presents a Collection to read. Foundation mode: it changes `ux/`, locked since
2026-10-21, and the CA authorized that crossing in conversation on 2026-11-10 (EFFORT §8).

## What triggered it

The Field Binder's viewer lists the device's copy of the binder and opens a document when its row
is activated. It is a workbench, framed and sized as one, but no stock workbench presents a
Collection alone: `Manager` always draws New, always opens an Item's Detail on activation, and above
its threshold always draws a Detail panel beside the Collection.

## Structural changes

All in `source/ux/shell/workbench/`:

| Change   | File                                                                          |
| -------- | ----------------------------------------------------------------------------- |
| New      | `lister.tsx`, `lister.css` _[revised: see "After production review", item 1]_ |
| New      | `collection-contract.ts`, `collection-table.tsx`, shared by both              |
| Modified | `manager-contract.ts`, `ManagerContract` extends `CollectionContract`         |
| Modified | `manager.tsx`, its Collection rendered through `collection-table.tsx`         |

## Decisions

_[Renamed by the amendment "After AI Coding Engine review", item 1: the component `Index` is
`Lister`, in `lister.tsx`.]_

1. **`Lister` is a standalone list,** the Index archetype: a Collection with no Detail beside it,
   whose Items are activated. `Manager`'s list is the same table in both its forms (UX design
   archetypes §3.2). The consumer decides what activation means (UX design archetypes §3.1): the
   Field Binder's viewer opens a document.

   ```ts
   /** Provider contract for a Collection: its projection and its loading. */
   export interface CollectionContract<T extends Instance> {
     formTitle: string
     entityLabel: string
     listColumns: CollectionListColumn<T>[]
     list: () => T[]
     isListLoading: () => boolean
     listError: () => unknown
     refresh: () => void | Promise<void>
   }

   /** Props for a workbench that presents a standalone list. */
   export type ListerProps<T extends Instance> = {
     onCancel: () => void
     provider: CollectionContract<T>
     activate: (item: T) => void | Promise<void>
   }

   export const Lister = <T extends Instance>(props: ListerProps<T>): UiComponent
   ```

   Activation is a prop, as `onCancel` is, so the contract stays the Collection alone and a Manager
   can extend it: a Manager's activation is its own, opening the Detail.

2. **`ManagerContract` extends `CollectionContract`,** keeping its own members: `itemLabel`,
   `create`, `update`, `actions`, `collectionActions`, and `detail`. The column type moves with
   the Collection, and the Manager's name holds stable, as `AbstractionListColumn` did:

   ```ts
   export interface ManagerContract<T extends Instance, Draft> extends CollectionContract<T> { … }
   export type ManagerListColumn<T extends Instance> = CollectionListColumn<T>
   ```

   No Manager consumer changes.

3. _[Extended by the amendment "After AI Coding Engine review", item 3.]_ **One Collection, two
   workbenches.** `collection-table.tsx` renders the Collection both use: its heading, its columns
   and rows, and its loading, error, and empty states. `Manager` adds New, its collection actions,
   and its Item actions; `Lister` adds nothing. A Collection behaves identically wherever it
   appears (UX design archetypes §3.5).
4. **One panel, framed as a workbench.** `Lister` renders its Collection as the container's `main`,
   with no aside and no threshold swap. It is routed by `Routes.workbench`, so it is sized and
   framed as every workbench is. Its header holds the title and **Close**.
5. **Activation runs under a pending lock,** as a Manager's actions do: one at a time, and a failure
   shows in the Collection, as a collection action's does.
6. _[Extended by the amendment "After AI Coding Engine review", item 2; revised by the amendment
   "After production review", item 1.]_ **The DOM hooks and
   styles are the Lister's:** `data-shell='lister-*'`, styled by `lister.css` beside `lister.tsx`.
   The rules the Collection shares move from `manager.css` with it.

## Production scope

| Where                                                   | Change                               |
| ------------------------------------------------------- | ------------------------------------ |
| `ux/shell/workbench/lister.tsx`, `lister.css`           | `Lister` and its styles (new)        |
| `ux/shell/workbench/collection-*.ts(x)`                 | The shared Collection (new)          |
| `ux/shell/workbench/manager.tsx`, `manager-contract.ts` | The Collection rendered and extended |
| `ux/shell/workbench/manager.css`                        | The shared rules moved out           |

**Unchanged:** the six managers and their providers, every Manager behavior, `core/`, `domain/`,
the Field Binder (which consumes `Lister` in its own production).

## Checks

`deno task check`, `deno task fmt:check`, `deno task test` (the two environment-dependent files
excluded); `STYLE_AUDIT`. The CA verifies in Admin that every manager behaves as before: open, New,
Save, delete, and the collapse below the threshold. `Lister` is verified by its first consumer, the
Field Binder's viewer.

## Records

The AI Architect writes these before production:

- `CONVENTIONS.md` §17: `Lister` beside `Manager`, both over `CollectionContract`. A governance
  change, committed separately.
- _[Extended by the amendment "After AI Coding Engine review", item 4.]_
  `ux-design-archetypes.md` §6: a supporting library row for presenting a Collection to read and
  activate, realized by `Lister`.
- `architecture-front.md` §10.1.5 and `README.md`: the workbench names.

## Open

1. _[Closed by the amendment "After AI Coding Engine review", item 1.]_ **The file name
   `index.tsx`.** By JavaScript habit an `index` file is a barrel, and §3.2 of CONVENTIONS allows
   none. The name matches the archetype and `manager.tsx`, but may mislead a reader or a guard.

## Amendment — 2026-11-10 — After AI Coding Engine review

1. **The component is `Lister`, in `lister.tsx`.** No rule forbids `index.tsx`: CONVENTIONS §3.2
   governs barrel aliases, not file names. The cost is practical: editors and tools treat an
   `index` file as a directory's entry, and readers from elsewhere in the language may too. The
   archetype stays Index; the component that realizes it is named for what it does, as `Manager`
   realizes Collection-Detail. The brief was `2026-11-10-index-brief.md`.
2. **The last-column width rule is the Manager's** (decision 6). `manager.css` narrows a row's last
   cell to fit its Actions column; the shared Collection's styles carry no such rule, so a Lister's
   last data column keeps its width. Each workbench loads the Collection's styles on its own.
3. **The extraction preserves the Manager whole** (decision 3): its loading and error
   presentation, its Item actions' event handling, its pending locks, and its editor lifecycle.
4. **The archetypes record grows** (Records): beside the new row in §6, the sentence "Both
   workbenches host Steps" changes, as `Lister` hosts none.

## Amendment — 2026-11-10 — After production review

1. **The shared Collection's styles are its own** (decision 6, Structural changes). Decision 6
   moved the shared rules into `lister.css`, so production gave the Manager's Collection a
   `data-shell='lister-list'` hook and `collection-table.tsx` imports `lister.css`: a Manager
   carries a Lister's name. The rules go beside the component they style: `collection-table.css`,
   imported by `collection-table.tsx`, with the hook `data-shell='collection-table'`. The
   Manager's last-column rule targets that hook inside `[data-shell='manager']`. `lister.css`
   holds nothing of the Lister's own, so it is removed.

## Closure (2026-11-10)

Production by the AI Coding Engine in two rounds, the second after the amendment "After production
review"; committed in `b980b19`. The AI Architect verified the diff against the brief: the
Collection drawn by `collection-table.tsx` for both workbenches, `ManagerContract` extending
`CollectionContract` with no consumer changed, the Manager's Item actions and pending locks
unchanged, and the shared styles beside the table. The AI Architect re-ran the checks: guards,
types, lint, formatting, and 201 tests, the two environment-dependent files excluded;
`STYLE_AUDIT: PASS`. The CA closed it.

Settled at closure:

- **`Lister` on screen:** the Field Binder's viewer is its first consumer, and its acceptance
  verifies it (`effort/active/2026-11-04-field-binder-brief.md`).
