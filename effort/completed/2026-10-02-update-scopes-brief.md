# Update Scopes & Manager Typing — Backlog Brief

**CLOSED 2026-10-03.** Shipped in `d654096`. Reviewed by the Chief Architect, independently
verified by the AI Architect against the code, checks, and tests, and live-verified by the CA in
the running app. The effort grew past its original two defects: the 2026-10-03 amendments added
the form-scope abstraction (`makeFormScope`, `DraftOf`, `front/api/form-scopes.ts`) and restored
`ScopedUpdate`'s value-based nullability.

Known gap, recorded rather than repaired: the Users API test's avatar-preservation case has not
executed. The shared test configuration cannot bootstrap `api` (backlog: "The shared test
configuration cannot bootstrap `api`"), and no UI can set an avatar, so no live check covers that
property.

Originally: this brief corrects two type-level defects in the reference implementations (User
Manager, Customer Manager). Both must land before roadmap §5 Mechanical Productions, which copies
the reference implementations.

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

## Amendment — 2026-10-02 Foundation production

CA authorized the documentation table except the roadmap, the file-level plan, and exactly one
`core/` edit: removal of `PinnedUpdateContract` and its PUBLIC entry. History remains unchanged.
CA subsequently directed resumption at step 3 and authorized detail-scope wording in the Customer
test helper and titles.

- Documentation completed first: core architecture §§5.2.1, 5.2.5, and 5.2.6 describe Direct Users
  updates and both explicit adapter-metadata scope declarations; front architecture §§7.2 and
  10.1.6 describe the generic Users update and `scopes.Customers.detail` seam.
- Step 2 completed: created `source/front/api/update-scopes.ts` with `scopes.Customers.detail`
  and the seven-field `scopes.Users.detail` tuple; deleted `api-update-scopes.ts`; moved the
  Customer Manager and Customer API test imports/calls onto the new detail scope. The test
  import moved with the module deletion to preserve type-checking. Step 2 checks passed.
- Step 3 applied: Users composes `DirectUpdateContract<User>` with generic `K`; deleted
  `AllUserKeys`; the detail draft derives from `scopes.Users.detail` and no longer supplies
  `avatarUrl`.
- Step 3 initially passed formatting and guards but failed type checking at
  `source/front/app-admin/users/user-manager.tsx:51` (TS2345): the generic call inferred the full
  User key constraint and required `avatarUrl`. CA explicitly approved adding that existing file
  to the production scope. `UserDetailKeys` is now exported by the detail step and supplied as
  `api.Users.update<UserDetailKeys>(...)`. Step 3 checks passed after this repair.
- Step 4 completed: deleted only `PinnedUpdateContract` and its PUBLIC entry from
  `source/core/api/api-contract.ts`. No other core or domain file changed. Checks passed.
- Step 5 completed: changed the Manager contract, action, confirmation, props, pending-action,
  and component generic bounds to `Instantiable` in the two authorized workbench files.
  Checks passed.
- Step 6 completed: the Customer test uses `detailUpdate` and detail-scope test titles. The
  Users test derives detail keys from `scopes.Users.detail`, explicitly supplies those keys to
  the update call, omits `avatarUrl` from the write, and adds a named preservation subcase that
  checks both the returned User and a fresh stored read.

### Verification and output contract

- Operating mode: Foundation.
- Created: `source/front/api/update-scopes.ts`.
- Deleted: `source/front/api/api-update-scopes.ts`.
- Modified: `documentation/architecture/architecture-core.md`,
  `documentation/architecture/architecture-front.md`, this brief,
  `source/core/api/api-contract.ts`, `source/front/api/make-auth-users.ts`,
  `source/front/app-admin/customers/customer-manager.tsx`,
  `source/front/app-admin/users/user-step-detail.tsx`,
  `source/front/app-admin/users/user-manager.tsx`,
  `source/ux/shell/workbench/abstraction-manager-contract.ts`,
  `source/ux/shell/workbench/abstraction-manager.tsx`,
  `source/tests/cases/customer-api-test.ts`, and `source/tests/cases/users-api-test.ts`.
- Checks: `deno task check` (guards, types, lint) and `deno task fmt:check` passed after steps
  2–6. Step 3 was rerun after the approved repair. `git diff --check` passed.
- Customer API verification:
  `deno test --allow-env --allow-net --allow-read source/tests/cases/customer-api-test.ts`:
  **3 passed, 0 failed**, using the existing in-memory HTTP transport.
- Users API verification:
  `deno test --allow-env --allow-net --allow-read source/tests/cases/users-api-test.ts`:
  type check passed, but runtime bootstrap exited before any test ran because
  `SUPABASE_RDBMS_URL`, `SUPABASE_PUBLIC_KEY`, and `SUPABASE_CLIENT_MODE` are unavailable.
  The live edge path and avatar preservation assertions remain unverified at runtime.
- Failures fixed: step 3 TS2345 through the CA-approved explicit detail-key argument;
  the stale `avatarUrl` pass-through and whole-record draft coupling removed.
- Failures remaining: Users live-test environment unavailable; no outstanding source failure
  identified.
- `STYLE_AUDIT: PASS` — audited the new scope module and all changed TypeScript/TSX files for
  imports, type bounds, explicit field declarations, exported-type comments, current headers,
  and formatting. Other core contracts and protocols remain unchanged.
- Explicitly not done: roadmap slot (CA/AA-owned), backend or domain changes, avatar form,
  Notes Editor, pagination, additional-contact assignment, deployment, or changes to completed
  efforts. History and Decisions were compared with HEAD and are unchanged.
- Closure pending: CA review and independent verification, plus live User Manager Save/avatar
  preservation, Customer Manager Save through all three steps, Onboarding creation, and the
  live Users API test. No free-of-cost subagent was identified in this session; independent
  verification has not been represented as complete.

## Amendment — 2026-10-03 — Layer 6: the form-scope abstraction (design explored, not authorized)

The AI Architect independently verified the 2026-10-02 production; the record above is
accurate. The CA then took up a smell the production left: `scopes` holds two kinds of value
(a `makeScopedUpdate` adapter for Customers, a bare field tuple for Users). That led to a
larger finding. This amendment records the design explored and the reasoning, including the
wrong turns, as EFFORT §4 requires. **It authorizes no production.**

### Where the problem lives

Trace one Customer update through every layer:

1. Domain metadata (`CustomerAdapter`).
2. The declaration (`scopes.Customers.detail`).
3. The contract (`AdaptedUpdateContract`).
4. The client (`makeCrudSupabaseClient.update`).
5. The composition (`api.Customers`).

Layers 1–5 flow from one source, and the CA judged them sound greenfield architecture. Layer 6,
the form, starts over. It hand-declares its field set (`CustomerDraft = Pick<Customer, …>`)
in domain shape, disconnected from its own declaration. That leaves three capabilities with no
owner, each solved by hand where it is used:

- **Absent → clear on update.** `customer-manager.tsx` writes `line2: draft.line2 ?? null`.
  `ScopedUpdate` types an optional in-scope field as `T | null | undefined`, so forgetting the
  patch compiles, and the field silently can no longer be cleared.
- **Create defaults for out-of-scope attributes.** `{ accountManagerId: undefined, notes: [] }`
  is written in both the Customer Manager and Onboarding's commit.
- **The draft type,** which restates the scope.

**Layer 6 is missing an abstraction, and the shared capability that comes with one.** Fixing
the seam itself is a symptom correction. Three such fixes were considered and set aside:

- an update-shaped draft;
- having the `core/` translator treat in-scope `undefined` as clear;
- making Users adopt `makeScopedUpdate` ("option A").

**Why `ScopeDraft` alone does not fix it.** Create and update are two protocols:

- An optional attribute on create is present or absent; on update it is set, cleared (`null`),
  or left alone (absent).
- Create covers the whole abstraction; update covers exactly the scope.

`ScopeDraft` types only the update side. A type probe on 2026-10-03 showed that it needs the
abstraction passed explicitly: `ScopeDraft<Customer, typeof scope>`. `ScopedUpdateAdapter<T, K>`
mentions `T` only inside `Pick<AdapterPatch<T>, K>`, where `T` cannot be inferred back out.

**Why the 80% path decides.** Every abstraction still to be built (Assets, Chemicals, Jobs,
Services, Workflows, and the IndexedDB `JobsLocal`) takes the Customer path. Users, with its
two-store transaction, is the outlier. Keep it in mind, but do not let it shape the common
case. The two kinds of value in `scopes` are a consequence of that outlier, not a design flaw,
and they are accepted.

### The design

Each form declares its scope once, and the declaration owns the form's whole write surface:

```ts
// front/api/update-scopes.ts — maker name not yet chosen
Customers: {
  detail: makeFormScope<Customer>({
    fields: [CustomerAdapter.primaryContact, CustomerAdapter.name, …, CustomerAdapter.sites],
    defaults: { accountManagerId: undefined, notes: [] }
  })
}
```

| It provides                                                            | Replaces                                                                  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `fields`: the attribute set, bound to adapter metadata                 | `makeScopedUpdate([...])`, still exposed as `adapter` for Adapted clients |
| The draft type, derived: domain-shaped, exactly the scope's attributes | The hand-declared `Pick<Customer, …>`                                     |
| `toUpdate(id, draft)`: an absent optional in-scope attribute → `null`  | The `?? null` patches                                                     |
| `toCreate(draft)`: the draft plus `defaults`                           | The duplicated create defaults                                            |

The call sites become:

```ts
create: draft => api.Customers.create(scope.toCreate(draft)),
update: (customer, draft) => api.Customers.update(scope.adapter, scope.toUpdate(customer.id, draft))
// Onboarding: commit: () => api.Customers.create(scope.toCreate(customerDraft(state)))
```

### Rules decided with the CA (2026-10-03)

1. **The unit of a scope is the attribute, and an attribute is written atomically, whatever its
   type or cardinality.**
   - An embedded composition (`CompositionOne`/`Optional`/`Many`/`Positive`) is owned and
     written whole, never addressed in part. That follows from the domain: compositions have
     no independent life-cycle and are not referenced independently (domain-model §3.3.1,
     §3.6). It also matches persistence (one JSONB column) and adapters (one `FieldAdapter` per
     attribute).
   - Clearing inside a composition is simply part of the new value. Compositions are always
     arrays, never absent, so `toUpdate`'s null rule never reaches one.
   - Two surfaces owning the same attribute can overwrite each other's edits, under the same
     rule for every attribute type.
2. **`defaults` covers exactly the out-of-scope attributes that create requires.** An attribute
   cannot be both in scope and defaulted; that is enforced by type.
3. **Newly introduced derived attributes** (calculated, never edited in the UI) **are optional
   by default.** Existing forms never notice them.
   - If one must be required, the migration backfills existing rows.
   - Every declaration that creates the abstraction then gains a default, which the compiler
     enforces. The change lands in `defaults`, not `fields`: the form still doesn't own the
     attribute.

### What it leaves alone

- **`core/` and `domain/`.** The maker composes `makeScopedUpdate` and the existing protocol
  types. Under "prove at the higher layer first" it lives in `front/api/`. Promotion to
  `core/stdx` is its own decision, after Assets and Chemicals prove it.
- **Layers 1–5.**
- **The Abstraction Manager contract.** One `Draft` serving both create and update becomes
  correct once the declaration absorbs the two protocols.
- **Customer state, the `customerDraft(state)` projection, and the nested editors.**
- **Users.** It stays the outlier and can adopt the declaration later, without an adapter.

### Superseded by this amendment

The 2026-10-02 production stays in the working tree as the first half of this effort. It is not
committed separately. Layer 6 replaces the following parts of it:

- **Decision 1:** the declarations file is `front/api/form-scopes.ts`, not `update-scopes.ts`.
  The housing object stays `scopes`.
- **Decision 3, translating clients:** `scopes.Customers.detail` is declared with
  `makeFormScope`, not `makeScopedUpdate`. `makeFormScope` still exposes the
  `ScopedUpdateAdapter` as `adapter`.
- **Decision 4, the Customer call sites:**
  - `toUpdate` replaces `line2: draft.line2 ?? null`.
  - `toCreate` replaces `{ accountManagerId: undefined, notes: [] }` in the Customer Manager
    and in Onboarding's commit.
- **The hand-declared `CustomerDraft`:** it becomes `DraftOf<typeof scopes.Customers.detail>`.
- **The declaration text in `architecture-core.md` §5.2.6.**
- **The scope import in `customer-api-test.ts`.**

Everything else in the 2026-10-02 production stands:

- `PinnedUpdateContract` is deleted.
- `AllUserKeys` and the `avatarUrl` pass-through are gone.
- Users stays on Direct with its declared tuple scope (decisions 5–6). Users is the accepted
  outlier, and may adopt `makeFormScope` later without an adapter.
- The Users test and its avatar-preservation case stay.
- `architecture-core.md` §5.2.1, §5.2.5, and the three rules in §5.2.6 stay, as does
  `architecture-front.md` §7.2.

### Settled 2026-10-03

- **Name:** `makeFormScope` (CA).
- **Files (CA):**
  - `front/api/make-form-scope.ts` holds `makeFormScope`, `FormScope`, `FormDraft`, and
    `DraftOf`. They promote to `core/stdx` together, if and when they earn it.
  - The declarations file is renamed from `update-scopes.ts` to `front/api/form-scopes.ts`,
    matching the maker, because it now declares create values too. The housing object stays
    `scopes`.
  - The production renames the file and updates both references:
    `architecture-core.md` §5.2.6 and `architecture-front.md` §10.1.6.
- **Rules 1–3 go into `architecture-core.md` §5.2.6 now** (CA). They move to CONVENTIONS through
  `effort/active/2026-10-03-core-reconciliation-brief.md`, because CONVENTIONS is locked.
  Written into §5.2.6 the same day.
- **The draft type infers from the declaration.** Verified by an AI Architect prototype run
  against the repo's real `CustomerAdapter`, `Customer`, and `@core/std` types. Type-check and
  runtime tests passed.
  - `makeFormScope({ fields, defaults })` infers `T` and `K` from the field adapters, exactly as
    `makeScopedUpdate` does. No type arguments are needed.
  - `FormScope<T, K>` names the draft directly in `toCreate`'s parameter, so
    `DraftOf<typeof scope>` infers it. `ScopeDraft` could not, because `ScopedUpdateAdapter`
    hides `T`.
  - The compiler enforces four constraints, each proven by an `@ts-expect-error` case:
    - an out-of-scope attribute is not in the draft;
    - a required in-scope attribute must be present;
    - an in-scope attribute cannot be defaulted;
    - a required out-of-scope attribute (`notes`) must be defaulted.
- **The runtime projections work, and `toUpdate` needs no optionality metadata.**
  - `toUpdate` turns every absent in-scope attribute into `null`. A required attribute is never
    absent by type, so only optional ones are ever affected.
  - `toUpdate` emits nothing outside the scope, and the scope's adapter translates its `null`
    into a cleared column.
  - `toCreate` merges the defaults and emits no `null`.
- **Where `customerDraft(state)` meets the derived type:** in `customer-state.ts`. The
  projection stays; only its return type changes, to
  `CustomerDraft = DraftOf<typeof scopes.Customers.detail>`. That imports the `front/api` seam,
  as `user-step-detail.tsx` already does. The projection's domain-shaped output type-checks
  unchanged: `line2: undefined`, and the composition's optional `email` omitted.
- **For production:**
  - The prototype's internal record must use `Dictionary` (CONVENTIONS §8.1), not
    `Record<PropertyKey, unknown>`.
  - `DraftOf` is confirmed by the CA.

**Rough size:**

- one generic maker of about 40 lines, with tests for `toCreate` and `toUpdate`;
- the Customer declaration and three call sites;
- the two draft types;
- `architecture-core.md` §5.2.6 and a layer-6 section in `architecture-front.md`.

## Amendment — 2026-10-03 — Revised Layer 6 Foundation production

CA authorized the revised Layer 6 scope after an independent probe against the repository's real
Customer adapter and protocol types. This amendment corrects three overclaims in the earlier
2026-10-03 design record, which remains above as history:

1. **Defaults "enforced by type":** `Omit<CreateFromInstantiable<T>, K>` alone only rejected
   overlapping fresh literals through excess-property checks; overlapping variables compiled.
   The maker's generic constraint must reject overlapping variables, lifecycle and unknown keys,
   and explicitly `undefined` scoped defaults, while retaining inference without type arguments.
2. **Spread `toCreate`:** merging `{ ...defaults, ...draft }` let structurally compatible draft
   variables override defaults or introduce unowned and lifecycle fields. Production constructs
   create payloads from the declared defaults plus selected scope fields and never spreads the
   draft. Update continues to select its fields.
3. **"A required attribute is never absent by type":** a required property may admit `undefined`,
   as `accountManagerId: AssociationOptional<User>` does. The value-based clearing rule applies
   regardless of syntactic property optionality. The prior return-type cast hid a mismatch.

CA explicitly authorized one additional core file, `source/core/std/protocols.ts`: restore
`ScopedUpdate` to the value-based rule
`undefined extends FromInstantiable<T>[P] ? FromInstantiable<T>[P] | null : FromInstantiable<T>[P]`
and delete the dead `OptionalKey` helper. No other new core or domain edit is authorized. The
08-31 transcript records no reason for the shipped key-based rule; AA's separate repo-copy
verification found types/lint clean and 11 Customer API/adapter tests passing.

Production order: architecture documentation first; maker and named core repair with focused
regressions; declaration rename and consumers together; API verification; this amendment's
production report. New regression file: `source/tests/cases/make-form-scope-test.ts`, matching
`make-adapter-test.ts`.

The original production remains in place. Users retains its tuple and Direct path, changing only
the declaration import path in the detail step and API test. Customer state behavior, nested
editors, Manager contracts, backend, domain, and all other core implementations are unchanged.
Roadmap/backlog placement, CONVENTIONS reconciliation, and promotion to `core/stdx` are out of
scope. CA review, independent verification, and the specified live checks remain closure gates.

### Production report (AGENTS §2.2)

- **Mode:** Foundation.
- **Created:** `source/front/api/make-form-scope.ts` and
  `source/tests/cases/make-form-scope-test.ts`.
- **Renamed:** `source/front/api/update-scopes.ts` to `source/front/api/form-scopes.ts`.
  The earlier step 2 had already replaced `api-update-scopes.ts`, declared the Customer detail
  fields, and moved Customers onto the scoped adapter. That production was retained; this
  amendment adds the inferred draft and create/update projections to its declaration.
- **Modified:** `documentation/architecture/architecture-core.md`,
  `documentation/architecture/architecture-front.md`, `source/core/std/protocols.ts`,
  `source/front/app-admin/customers/customer-state.ts`,
  `source/front/app-admin/customers/customer-manager.tsx`,
  `source/front/app-admin/onboarding/onboarding-wizard.tsx`,
  `source/front/app-admin/users/user-step-detail.tsx`,
  `source/tests/cases/customer-api-test.ts`, `source/tests/cases/users-api-test.ts`, and this brief.
- **Deleted:** the old `update-scopes.ts` path through the rename; no additional deletion.
- **Results:** Customer Manager and Onboarding use `toCreate`; Customer Manager uses `toUpdate`
  and the declared adapter. `CustomerDraft` derives through `DraftOf`. Users retains its Direct
  tuple and receives only the import-path changes. `ScopedUpdate` follows the authorized
  value-based nullability rule; `OptionalKey` is removed.
- **Checks:** `deno task check` and `deno task fmt:check` passed after the maker/core step and
  after declaration/consumer integration, and again after the API regression extension.
  The combined Customer API, form-scope, and adapter suite passed **18 tests, 0 failures**
  (4 Customer API, 6 form-scope, 8 adapter). `git diff --check` passed.
- **Failures fixed:** overlapping defaults variables and explicitly undefined scoped defaults
  are rejected by the maker constraint; richer drafts cannot override defaults or leak fields
  into create payloads. Required `Id | undefined` attributes accept and translate null clears.
  A provisional regression assertion's type error was corrected within the test scope.
- **Failures remaining:** the Users live test was attempted with stage public configuration
  supplied to its process. It exited before running any test:
  `Config property not registered: LOCAL_DB_NAME`. Its shared bootstrap registers only the
  three Supabase properties; changing that bootstrap exceeds the approved import-only scope.
  No live write occurred. Browser verification of User Save/avatar preservation, Customer
  Manager Save, and Onboarding create remains outstanding.
- **Explicitly not done:** unrelated working-tree changes, other core/domain edits, bootstrap
  repair, roadmap/backlog edits, CONVENTIONS reconciliation, promotion, deployment, and live
  browser verification. The original History and prior design record remain intact.
- **Questions/escalations:** Users bootstrap repair needs separate scope. CA review and
  independent verification of this revised production remain required for closure; AA's earlier
  repo-copy checks are not verification of this completed Layer 6 implementation.
  The existing protocol-header violation below also needs authorization beyond the named
  `ScopedUpdate`/`OptionalKey` edit; no header repair was made.
- **STYLE_AUDIT: FAIL:** audited the maker, declaration, named protocol patch, changed Customer
  consumers, Users import changes, and API/form-scope tests against CONVENTIONS. The changed code
  conforms, but the manual whole-file audit found this pre-existing violation, also present in
  HEAD and not caught by the automated guards:
  - `source/core/std/protocols.ts:4` — CONVENTIONS §5.1 — comment-box line is 81 characters;
    maximum is 80. This remains a production gate failure pending the narrowly scoped repair.

### Follow-up production — 2026-10-03 — AA review

CA authorized one follow-up pass under the same Foundation scope. AA identified two comment-box
alignment issues, misplaced maker mechanics in core architecture, form/client subject wording,
an undefined layer reference, Customer-specific material in the generic section, and a value
import used only in a type query.

- **Mode:** Foundation. No files created, renamed, or deleted in this pass.
- **Modified:** `documentation/architecture/architecture-core.md`,
  `documentation/architecture/architecture-front.md`, `source/front/api/make-form-scope.ts`,
  `source/front/app-admin/customers/customer-state.ts`, and this brief.
- **Results:** core §5.2.6 retains declaration and nullability rules, the three scope rules,
  defines the layer chain once, and points to front §7.4 for maker mechanics. The capability
  bullets now describe the form through its client; "still" is removed. Front §7.4 is generic;
  the Customer integration and Users exception are documented in §10.1.6. `customer-state.ts`
  imports `scopes` with `import type`.
- **Header verification:** `make-form-scope.ts:4` was padded from 79 to 80 characters.
  `form-scopes.ts:3` already measured 80 in the working tree at this pass; no further padding
  was needed. Both files' box lines now measure exactly 80. The earlier audit missed the maker
  line's alignment discrepancy; this follow-up corrects that audit.
- **Checks:** the Customer API, form-scope, and adapter suite passed **18 tests, 0 failures**.
  Final `deno task check`, `deno task fmt:check`, and `git diff --check` passed. Manual checks
  confirmed all box lines in both form-scope modules are 80 characters and History is unchanged.
- **Explicitly not done:** core-header repair, Users bootstrap repair, live verification,
  unrelated working-tree changes, or any scope expansion. History remains unchanged.
- **STYLE_AUDIT: FAIL:** the follow-up source changes conform; the prior whole-file violation
  remains: `source/core/std/protocols.ts:4` — CONVENTIONS §5.1 — box line is 81 characters,
  maximum 80. Its repair remains outside the named core authorization.
- **Remaining failures and escalations:** the protocol header and Users bootstrap issue from
  the preceding report remain open. CA review, independent verification, and live checks remain
  closure gates.

_End of Backlog Brief_
