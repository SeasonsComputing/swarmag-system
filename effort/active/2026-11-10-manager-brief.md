# Manager — Brief

**Active, 2026-11-10; for the AI Coding Engine's review.** An enabler of roadmap M-6, ahead of its
fourth feature, the Field Binder (`effort/active/2026-11-04-field-binder-brief.md`), whose workbench
is the first Collection-Detail manager over items that are not domain records. Foundation mode: it
changes `ux/`, locked since 2026-10-21, and the CA authorized that crossing in conversation on
2026-11-10 (EFFORT §8).

## What triggered it

The Field Binder's workbench is a Collection-Detail surface: its entries are a set, each opened into
a Detail, with New, confirmed removal, and the swap to Index-Detail below the container threshold.
`AbstractionManager` already does all of that, and writing the workbench by hand would copy it. But
`AbstractionManager` admits only domain records (`T extends Instantiable`), though the only field it
reads is `id`; and it offers actions on an Item, none on the Collection, where "Add from chemicals"
belongs. Its name says the same thing: the component manages any identified items, and "abstraction"
narrows it to the domain's.

## Structural changes

All in `source/ux/shell/workbench/`:

| Change  | File                                                                   |
| ------- | ---------------------------------------------------------------------- |
| New     | `manager.tsx`, `manager-contract.ts`, `manager.css`                    |
| Removed | `abstraction-manager.css`, its rules moved to `manager.css`            |
| Renamed | `use-abstraction-form-feedback.ts` → `use-form-feedback.ts`            |
| Renamed | `use-abstraction-form-keyboard.ts` → `use-form-keyboard.ts`            |
| Renamed | `use-abstraction-form-validation.ts` → `use-form-validation.ts`        |
| Kept    | `abstraction-manager.tsx`, `abstraction-manager-contract.ts`, narrowed |

## Decisions

1. **`Manager` is the Collection-Detail manager,** today's `AbstractionManager` renamed, over any
   identified items: `T extends Instance`. Its behavior does not change.

   ```ts
   export interface ManagerContract<T extends Instance, Draft> {
     formTitle: string
     entityLabel: string
     listColumns: ManagerListColumn<T>[]
     list: () => T[]
     isListLoading: () => boolean
     listError: () => unknown
     itemLabel?: (item: T) => string
     refresh: () => void | Promise<void>
     create: (draft: Draft) => T | Promise<T>
     update: (item: T, draft: Draft) => T | Promise<T>
     actions: ManagerAction<T>[]
     collectionActions?: ManagerCollectionAction[]
     detail: (item: T | null) => ManagerDetail<Draft>
   }

   export const Manager = <T extends Instance, Draft>(props: ManagerProps<T, Draft>): UiComponent
   ```

2. **Collection actions** act on the whole Collection and sit beside New, in the same form:

   ```ts
   /** An action on the whole Collection, presented beside New. */
   export type ManagerCollectionAction = {
     name: string
     label: string
     icon: string
     handler: () => void | Promise<void>
   }
   ```

   The field is optional; a manager without it presents New alone, as every manager does today.

3. **`AbstractionManager` is a Manager of domain records.** Its files keep their symbols, narrowed
   to `Instantiable`, and its component renders `<Manager {...props} />`. No consumer changes.

   ```ts
   // abstraction-manager-contract.ts
   export type AbstractionManagerContract<T extends Instantiable, Draft> = ManagerContract<T, Draft>
   export type AbstractionAction<T extends Instantiable> = ManagerAction<T>
   export type AbstractionDetail<Draft> = ManagerDetail<Draft>
   export type AbstractionListColumn<T extends Instantiable> = ManagerListColumn<T>

   // abstraction-manager.tsx
   export const AbstractionManager = <T extends Instantiable, Draft>(
     props: AbstractionManagerProps<T, Draft>
   ): UiComponent => <Manager {...props} />
   ```

   Today it adds nothing to the base; it holds the symbols stable and names the domain-record case,
   where a specialization for domain records would go.

4. **The DOM hooks and styles are the Manager's:** `data-shell='abstraction-manager-*'` become
   `data-shell='manager-*'`, styled by `manager.css` beside `manager.tsx`. No other stylesheet
   targets them.

5. **The form hooks lose "abstraction",** being the Wizard's and the steps' as much as a manager's:
   `useAbstractionFormFeedback`, `useAbstractionFormKeyboard`, and `useAbstractionFormValidation`
   become `useFormFeedback`, `useFormKeyboard`, and `useFormValidation`, and
   `AbstractionFieldRules` and `AbstractionFormValidation` become `FormFieldRules` and
   `FormValidation`, their files renamed with them. `FORM_FEEDBACK_MESSAGE` and `focusFirstField`
   keep their names. Their importers change their imports and nothing else.

## Production scope

| Where                                                   | Change                                        |
| ------------------------------------------------------- | --------------------------------------------- |
| `ux/shell/workbench/manager.tsx`, `manager-contract.ts` | `Manager` and its contract (new)              |
| `ux/shell/workbench/manager.css`                        | The manager's styles, moved and renamed (new) |
| `ux/shell/workbench/abstraction-manager*.ts(x)`         | Narrowed to the base                          |
| `ux/shell/workbench/use-form-*.ts`                      | The renamed form hooks                        |
| `ux/shell/workbench/wizard.tsx`                         | Imports of the renamed hooks                  |
| `front/app-admin/**/*-step-*.tsx` (eight steps)         | Imports of the renamed hooks                  |

**Unchanged:** the six managers and their providers, every Manager behavior, `core/`, `domain/`,
the Field Binder (which consumes `Manager` in its own production).

## Checks

`deno task check`, `deno task fmt:check`, `deno task test` (the two environment-dependent files
excluded); `STYLE_AUDIT`. A test covers `collectionActions` presented beside New. The CA verifies in
Admin that every manager behaves as before: open, New, Save, delete, and the collapse below the
threshold.

## Records

The AI Architect writes these before production:

- `CONVENTIONS.md` §17.1 and §17.2: `Manager` and `AbstractionManager` as its domain-record
  specialization, and collection actions. A governance change, committed separately.
- `ux-design-archetypes.md` §3.2 and §6: the supporting library's row names `Manager`.
- `architecture-front.md` §10.1.5 and `README.md`: the workbench names.
