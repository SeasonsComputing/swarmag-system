# Update Scopes & Manager Typing — Backlog Brief

**Backlog, not dispatched.** This brief corrects two type-level defects in the reference
implementations (User Manager, Customer Manager). Both must land before roadmap §5 Mechanical
Productions, which copies the reference implementations.

The work was surfaced in two places:

- the Chief Architect's 2026-09-25 review of the Customer Manager production;
- a CA + AI Architect session on 2026-10-02, which recovered the history recorded below
  before deciding anything.

Every point is decided. Nothing is open.

## What triggered it

```ts
type AllUserKeys = Extract<keyof typeof UserAdapter, keyof FromInstantiable<User>>

export type AuthUsersContract =
  & CrudBaseContract<User>
  & PinnedUpdateContract<User, AllUserKeys>
  & CrudListContract<User>
  & { eject(id: Id): Promise<User>; hasAccess(email: string): Promise<boolean> }
```

`AllUserKeys` derives "every User field" from the adapter's object keys. That makes the User form
depend on the abstraction's full shape, which is the coupling the scoped-update design was built to
prevent. Two consequences are visible today:

- **The form writes a field it doesn't own.** `ScopedUpdate` requires every in-scope field, so the
  User step must supply `avatarUrl`, which it never edits. The draft passes `user?.avatarUrl`
  through (`user-step-detail.tsx`), and `UserDraft` omits `avatarUrl` and then adds it back.
  - Each Save rewrites the stored avatar with the value the form opened with.
  - That is the 08-29 incident class: a form writing a stale value into a column it doesn't own.
- **Every new User field breaks the form.** Adding a column to `User` grows `AllUserKeys`, and the
  User step stops compiling until it adds another pass-through.

## The principle

Scoped updates let an abstraction and its forms evolve without the CRUD API changing:

- a new form declares its own scope;
- a new field stays outside every existing scope;
- an existing form keeps working without knowing the new field exists.

They also keep "clear this attribute" (`null`) distinct from "leave it alone" (absent).

A form owns its scope and must declare it (08-30 standing SOP). A scope always names the form's
fields explicitly, and it binds them through adapter field metadata (`UserAdapter.displayName`).
This is the reason `makeAdapter` was made field-addressable. A scope never derives "every key".

## History — why the three update contracts exist (do not re-litigate)

The update contracts were decomposed deliberately on 2026-08-31. The record is in
`effort/completed/2026-08-29-scoped-update-adapter-brief.md`, in the amendments dated 2026-08-31,
and in the CA session "Customer Onboarding look and feel". The CA proposed the decomposition:
make the source contracts smarter, in place of `Omit`-and-override.

| Contract                | Records the distinction                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `AdaptedUpdateContract` | The client knows it targets a DB-oriented store, so it translates. Supabase and IndexedDB. |
| `DirectUpdateContract`  | The client speaks abstractions and does not translate. `K` is chosen per call.             |
| `PinnedUpdateContract`  | One scope, fixed at the interface. Created for Users only.                                 |

**`DirectUpdateContract` stays.** It was created for HTTP. The CA observed: "The HTTP client maker
does not know whether the end point is DB or Abstraction oriented." That ambiguity was removed by
declaring the HTTP client abstraction-oriented. A signature must not imply a translation
capability the client lacks.

**Pinned was a sound guarantee in the wrong place, and it retires.**

- It protected "the User form sends every field". When it was created, the User form's scope was
  taken to be the whole record, and only one User form existed.
- Its premise fails twice:
  - The form does not own the whole record; `avatarUrl` is the counterexample.
  - Pinning puts the form's scope into the API's type, so a second User form would force an API
    change. Preventing that kind of change is the purpose of scoped updates.
- The guarantee itself survives, where it belongs: each form's declared scope types its draft.

**Why Users is special, and why that does not affect scope.** Every User write is a transaction
across the `users` table and Supabase Auth. That requirement built the edge foundation: the
shims, `UserOrchestra` and its compensation, the flat functions layout, and two credentials (the
client's to reach the edge, the service role's to reach the database). `makeAuthUsers` is the
client end of that path.

The requirement constrains the write path, not how many forms may write a User.
`UserOrchestra.update` already accepts any subset of fields. It re-reads the old email and syncs
Auth only when `primaryEmail` is present.

## Decisions

1. **One housing object.**
   - `front/api/update-scopes.ts` exports `scopes`, keyed the way `api` is keyed: `Users` and
     `Customers` today, `Assets` and `Chemicals` in §5.
   - It replaces `front/api/api-update-scopes.ts` and `CustomerUpdateScopes`.
   - It stays a seam parallel to `api.ts`, as decided on 2026-08-31.
2. **Scope names.**
   - `detail` names a Manager Detail's write surface, which is the primary scope. This mirrors
     step naming, where `detail` names the primary or only step.
   - Each additional form's scope is named for the field set it covers, for example
     `scopes.Users.avatar` or `scopes.Assets.status`.
3. **How a scope is declared, by client family.** Both forms bind to adapter metadata:
   - **Translating clients** (Adapted): `makeScopedUpdate([XAdapter.field, …])`, passed to
     `update(scope, source)`, unchanged.
   - **Non-translating clients** (Direct): a field tuple, `[XAdapter.field, …] as const`, after
     CONVENTIONS §8.2's tuple-plus-derived-type shape. Its keys are
     `(typeof scopes.X.name)[number]['key']`. Each `XAdapter.field` is a `FieldAdapter` whose
     `key` is its literal; this was verified in a type-check probe on 2026-10-02. The form's draft
     is `ScopedUpdate<T, thoseKeys>`.
4. **Customers.**
   - `scopes.Customers.detail` is `makeScopedUpdate` over exactly the current `manager` field set:
     primary contact, name, status, `line1`, `line2`, city, state, postal code, country, and
     sites.
   - Account-manager assignment and account-level notes stay excluded.
   - The `manager`, `address`, and `sites` scopes are removed. `address` and `sites` existed for
     commit-per-step, when separate steps each wrote a slice of one Customer. That multi-writer
     shape is what made the 08-29 stale-`sites` incident possible. The Customer Detail now
     commits once at Save, from one draft, so `sites` belongs inside `detail`.
5. **Users.**
   - `AuthUsersContract` becomes:

     ```ts
     CrudBaseContract<User> & DirectUpdateContract<User> & CrudListContract<User>
       & { eject; hasAccess }
     ```

   - `scopes.Users.detail` is
     `[UserAdapter.displayName, UserAdapter.primaryEmail, UserAdapter.phoneNumber, UserAdapter.preferredChannel, UserAdapter.notes, UserAdapter.roles, UserAdapter.status] as const`.
     There is no `avatarUrl`.
   - `UserDraft` becomes `Omit<ScopedUpdate<User, UserDetailKeys>, 'id'>`. The `avatarUrl`
     pass-through and the omit-and-re-add disappear.
   - `AllUserKeys` is deleted.
   - `notes` stays in scope. The form still flattens a text area into one note until the Notes
     Editor (roadmap §4) replaces it.
6. **Accepted trade-off.** With Direct, `K` is inferred per call, so an undeclared call such as
   `api.Users.update({ id, roles })` compiles. That is the protection Pinned was created for. It
   is the same guarantee level the HTTP client already accepts, and the 08-30 SOP requires every
   form to declare its scope.
7. **`PinnedUpdateContract` is removed from `core/api/api-contract.ts`.** It had one consumer,
   Users, and the history above shows it was created for Users alone. Dead code is deleted
   (`architecture-core.md` §11.3).
8. **A second User form, if one is ever built,** adds its own entry under `scopes.Users` and its
   own draft type. The API does not change.
9. **Abstraction Manager typing.**
   - These declarations change from `T extends Instance` to `T extends Instantiable`:
     - `AbstractionManagerContract`, `AbstractionAction`, and `AbstractionActionConfirmation` in
       `ux/shell/workbench/abstraction-manager-contract.ts`;
     - `AbstractionManagerProps` and `PendingAction` in
       `ux/shell/workbench/abstraction-manager.tsx`.
   - History: the `Instance` bound comes from the 06-22 UX genesis prompt
     (`documentation/ux-genesis-dashboard.md` §5.2, since deleted). It was written as
     `AbstractionFormContract<T extends Instance>`, a contract with no CRUD (`list`, a row
     renderer, `renderForm`), which needed only identity.
   - The Manager later gained create, update, actions, and soft Delete. Those operations are
     defined over `Instantiable` (`ApiCrudContract<T extends Instantiable>`), and soft Delete
     relies on its `deletedAt`. No reason for keeping `Instance` was ever recorded.
   - Abstraction Managers provide CRUD to `Instantiable`s.

## Documentation leads code

| Document                            | Change                                                                                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `architecture-core.md` §5.2.1       | Remove the `PinnedUpdateContract` clause. Users joins the abstraction-oriented case under `DirectUpdateContract`: no client-side translation, `K` per call.     |
| `architecture-core.md` §5.2.5       | "adapter-translated, direct, or pinned-scope" becomes "adapter-translated or direct".                                                                           |
| `architecture-core.md` §5.2.6       | State the declaration rule: a scope names its fields explicitly through adapter metadata and never derives every key; give both declaration forms (decision 3). |
| `architecture-front.md` §7.2        | `api.Users.update(input: UserUpdate)` becomes `update<K>(source: ScopedUpdate<User, K>)`.                                                                       |
| `architecture-front.md` §10.1.6     | `front/api/api-update-scopes.ts` becomes `front/api/update-scopes.ts`, and the "combined Manager update scope" becomes `scopes.Customers.detail`.               |
| `effort/project/project-roadmap.md` | Slot this brief before §5 Mechanical Productions.                                                                                                               |

The searches on 2026-10-02 found the following documents correct as they stand:

- `architecture-back.md`: the `user-update` edge function takes `UserUpdate`.
- `domain-archetypes.md`: the `UserUpdate` protocol.

The edge and domain protocols already accept any subset. Nothing in the governance documents,
UX documents, or genesis prompts mentions these contracts. `effort/completed/` is immutable and
keeps its historical names.

## File-level plan

| File                                                                                   | Change                                                                                                                                |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `source/front/api/update-scopes.ts`                                                    | New: `scopes`, with `Customers.detail` and `Users.detail`                                                                             |
| `source/front/api/api-update-scopes.ts`                                                | Deleted                                                                                                                               |
| `source/front/api/make-auth-users.ts`                                                  | `AuthUsersContract` composes `DirectUpdateContract<User>`; `AllUserKeys` is deleted; `update` becomes generic over `K`                |
| `source/core/api/api-contract.ts`                                                      | `PinnedUpdateContract` and its PUBLIC entry are removed                                                                               |
| `source/front/app-admin/customers/customer-manager.tsx`                                | `scopes.Customers.detail`                                                                                                             |
| `source/front/app-admin/users/user-step-detail.tsx`                                    | `UserDraft` derives from `scopes.Users.detail`; the `avatarUrl` pass-through is removed                                               |
| `source/ux/shell/workbench/abstraction-manager-contract.ts`, `abstraction-manager.tsx` | `Instance` becomes `Instantiable` (decision 9)                                                                                        |
| `source/tests/cases/customer-api-test.ts`                                              | Imports `scopes.Customers.detail`                                                                                                     |
| `source/tests/cases/users-api-test.ts`                                                 | Updates with the detail scope (no `avatarUrl`); add an excluded-field preservation case: a detail update leaves `avatarUrl` unchanged |

`core/` is a strict-scrutiny namespace. Production touches exactly one `core/` file, to delete
`PinnedUpdateContract`, and that edit is authorized here by name.

## Out of scope

- Any change to `AdaptedUpdateContract`, `DirectUpdateContract`, `ScopedUpdate`,
  `makeScopedUpdate`, or `ScopedUpdateAdapter`.
- Any change to the edge functions, `UserOrchestra`, or the domain protocols.
- An avatar field or form.
- The Notes Editor, which replaces the User notes text area later.
- Pagination and additional-contact assignment.

## Sequencing (CONSTITUTION §8 — documentation leads code)

1. Update the documents in the table above.
2. Create `update-scopes.ts`, and move Customers onto `scopes.Customers.detail`.
3. Move Users to Direct with `scopes.Users.detail`, removing `AllUserKeys` and the `avatarUrl`
   pass-through.
4. Remove `PinnedUpdateContract`.
5. Tighten the Abstraction Manager to `Instantiable`.
6. Update the tests.

## Checks

- `deno task check` (guards, type check, lint) and `deno task fmt:check` after each of steps 2–5.
- `customer-api-test.ts`, run as it is today.
- `users-api-test.ts`. It exercises the live edge path, so run it where its credentials are
  available.
- Live verification:
  - User Manager edits and saves a user, and the stored `avatarUrl` survives the save.
  - Customer Manager edits and saves through all three steps.
  - Onboarding still creates a Customer.

_End of Backlog Brief_
