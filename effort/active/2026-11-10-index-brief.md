# Index — Brief

**Active, draft; recorded 2026-11-10.** An enabler of roadmap M-6, ahead of its fourth feature, the
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

| Change   | File                                                                  |
| -------- | --------------------------------------------------------------------- |
| New      | `index.tsx`, `index.css`                                              |
| New      | `collection-contract.ts`, `collection-table.tsx`, shared by both      |
| Modified | `manager-contract.ts`, `ManagerContract` extends `CollectionContract` |
| Modified | `manager.tsx`, its Collection rendered through `collection-table.tsx` |

## Decisions

1. **`Index` is a standalone list:** a Collection with no Detail beside it, whose Items are
   activated. `Manager`'s list is the same table in both its forms (UX design archetypes §3.2). The
   consumer decides what activation means (UX design archetypes §3.1): the Field Binder's viewer
   opens a document.

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
   export type IndexProps<T extends Instance> = {
     onCancel: () => void
     provider: CollectionContract<T>
     activate: (item: T) => void | Promise<void>
   }

   export const Index = <T extends Instance>(props: IndexProps<T>): UiComponent
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

3. **One Collection, two workbenches.** `collection-table.tsx` renders the Collection both use: its
   heading, its columns and rows, and its loading, error, and empty states. `Manager` adds New, its
   collection actions, and its Item actions; `Index` adds nothing. A Collection behaves identically
   wherever it appears (UX design archetypes §3.5).
4. **One panel, framed as a workbench.** `Index` renders its Collection as the container's `main`,
   with no aside and no threshold swap. It is routed by `Routes.workbench`, so it is sized and
   framed as every workbench is. Its header holds the title and **Close**.
5. **Activation runs under a pending lock,** as a Manager's actions do: one at a time, and a failure
   shows in the Collection, as a collection action's does.
6. **The DOM hooks and styles are the Index's:** `data-shell='index-*'`, styled by `index.css`
   beside `index.tsx`. The rules the Collection shares move from `manager.css` with it.

## Production scope

| Where                                                   | Change                               |
| ------------------------------------------------------- | ------------------------------------ |
| `ux/shell/workbench/index.tsx`, `index.css`             | `Index` and its styles (new)         |
| `ux/shell/workbench/collection-*.ts(x)`                 | The shared Collection (new)          |
| `ux/shell/workbench/manager.tsx`, `manager-contract.ts` | The Collection rendered and extended |
| `ux/shell/workbench/manager.css`                        | The shared rules moved out           |

**Unchanged:** the six managers and their providers, every Manager behavior, `core/`, `domain/`,
the Field Binder (which consumes `Index` in its own production).

## Checks

`deno task check`, `deno task fmt:check`, `deno task test` (the two environment-dependent files
excluded); `STYLE_AUDIT`. The CA verifies in Admin that every manager behaves as before: open, New,
Save, delete, and the collapse below the threshold. `Index` is verified by its first consumer, the
Field Binder's viewer.

## Records

The AI Architect writes these before production:

- `CONVENTIONS.md` §17: `Index` beside `Manager`, both over `CollectionContract`. A governance
  change, committed separately.
- `ux-design-archetypes.md` §6: a supporting library row for presenting a Collection to read and
  activate.
- `architecture-front.md` §10.1.5 and `README.md`: the workbench names.

## Open

1. **The file name `index.tsx`.** By JavaScript habit an `index` file is a barrel, and §3.2 of
   CONVENTIONS allows none. The name matches the archetype and `manager.tsx`, but may mislead a
   reader or a guard.
