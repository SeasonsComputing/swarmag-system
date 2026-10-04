# Users Form Scope & User State — Brief

**Active.** Written 2026-10-03 by the AI Architect from a CA + AA session. Two amendments follow
the original steps; read them first.

- **Phase 1 (Steps 1–4, as amended by the ACE review): produced 2026-10-03** and independently
  verified by the AI Architect on 2026-10-04, and passed the CA's Admin walkthrough on 2026-10-04.
- **Phase 2 (the scope promotion to `core/`): produced 2026-10-04** and independently verified by
  the AI Architect the same day. The CA's Admin walkthrough is pending.

**Operating mode: Foundation.** The work changes a shared declaration shape in `front/api/` and the
text of `architecture-core.md` §5.2.6 and `architecture-front.md` §§7.4, 10.1.6.

## What triggered it

`scopes.Users.detail` is not a scope.

A scope is the one declaration that owns a form's write surface: its fields, its draft, and its
create and update projections (`architecture-core.md` §5.2.6, `architecture-front.md` §7.4).
`scopes.Customers.detail` is one. `scopes.Users.detail` is only the fields:

```ts
Users: {
  detail: [
    UserAdapter.displayName,
    …
    UserAdapter.status
  ] as const
}
```

Everything else is rebuilt by hand downstream:

| A scope owns      | Users rebuilds it in                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------ |
| Draft type        | `UserDraft = Omit<ScopedUpdate<User, UserDetailKeys>, 'id'>` (`user-step-detail.tsx`)            |
| Key set           | `(typeof scopes.Users.detail)[number]['key']`, in `user-step-detail.tsx` and `users-api-test.ts` |
| Update projection | `{ id: user.id, ...draft }`, with an explicit `update<UserDetailKeys>` (`user-manager.tsx`)      |
| Create projection | `api.Users.create(draft)`, the raw draft (`user-manager.tsx`)                                    |

This is the original smell that opened the effort on 2026-09-22, and it is the layer-6 finding of
the 2026-10-03 amendment to `effort/completed/2026-10-02-update-scopes-brief.md`: the form starts
over, hand-declaring what its declaration should own. That amendment fixed layer 6 for Customers
only. Its record that Users "may adopt `makeFormScope` later, without an adapter" was the deferred
half of the fix, not a ruling that a field tuple is a scope.

The second topic rides with it. The CA asked whether User state should move out of
`user-step-detail.tsx` into `user-state.ts`, mirroring `customer-state.ts`. Done alone, that move
would only shuffle the hand-built pieces between files. With a real scope, `user-state.ts` becomes
the exact mirror of `customer-state.ts`, with `UserDraft = DraftOf<…>`.

## Settled — do not revisit

- **Users is the outlier.** Every User write is a transaction across `users` and Supabase Auth
  through edge functions. Users stays on `DirectUpdateContract`; the client does not translate.
  Adapted and Direct are never collapsed (08-31 design; 10-02 brief, "History").
- **Archetype:** Collection-Detail ⇄ Index-Detail, one step (`user-step-detail`); the workbench
  owns the draft and the commit; contextual dirty checks.
- **The scope's field set is unchanged:** the seven fields of `scopes.Users.detail`. `avatarUrl`
  stays excluded.
- **Notes stay a text area** until the Notes Editor (roadmap §4). The text area flattens notes to
  one note, keeping the first note's `createdAt`.
- **`customer-state.ts` is a per-draft state factory,** not an `architecture-front.md` §8.3
  reactive store. §8.3 does not apply to either state file.

## Decisions

1. **`Users.detail` becomes a real scope, without an adapter, distinct from the Adapted scope by
   type.** An unused `adapter` member on a Direct scope is rejected: it would imply a translation
   the client does not perform.
2. **Two declaration shapes, one built on the other** (`front/api/make-form-scope.ts`):
   - `FormScope<T, K>`: `toCreate(draft)` and `toUpdate(id, draft)`. What every form has, and all
     a Direct client needs.
   - `AdaptedFormScope<T, K> = FormScope<T, K> & { adapter: ScopedUpdateAdapter<T, K> }`.
   - `makeFormScope({ fields, defaults })` returns `FormScope<T, K>`.
   - `makeAdaptedFormScope({ fields, defaults })` returns `AdaptedFormScope<T, K>`, composed from
     `makeFormScope` and `makeScopedUpdate`.
   - `FormDraft` and `DraftOf` are unchanged. `DraftOf` infers from `toCreate`, which both shapes
     carry.
3. **Naming (AA's call, delegated by the CA).** The base takes the unqualified name because Direct
   adds nothing to it; Adapted adds the translation, mirroring `AdaptedUpdateContract`.
4. **Declarations** (`front/api/form-scopes.ts`):
   - `Customers.detail` switches to `makeAdaptedFormScope`. Rename only; no behaviour change.
   - `Users.detail` becomes `makeFormScope({ fields: [the seven fields], defaults: {} })`. Every
     required User attribute is in scope; the only optional one, `avatarUrl`, is out of scope, so
     the defaults are empty.
5. **Users call sites** become `api.Users.create(scope.toCreate(draft))` and
   `api.Users.update(scope.toUpdate(user.id, draft))`. The explicit type argument and
   `UserDetailKeys` are deleted.
6. **`users/user-state.ts`** mirrors `customer-state.ts`:
   - `UserDraft = DraftOf<typeof scopes.Users.detail>`;
   - `userDraft(state)`, a free projection, as `customerDraft(state)` is;
   - `UserState`, an explicit Accessor/Setter type, as `CustomerState` is;
   - `createUserState(user)`, which returns signals only.
7. **The note timestamp:** `UserState` carries `noteCreatedAt: When` as a plain constant, fixed at
   creation from the first note's `createdAt`, else `when()`. The projection stays pure over state.
   This exists only because of the notes text area and leaves with it. `nextNotes`' redundant
   `existingNotes` branch is dropped; `noteCreatedAt` already covers it.
8. **`new Date().toISOString()` becomes `when()`.** The current line is a CONVENTIONS §3.3
   violation (re-implementing a `@core/std` utility). No guard catches it; whether to add one is a
   guard-strategy decision and is not part of this brief.
9. **The minimal test-configuration fix rides along** (CA, 2026-10-03), so that
   `users-api-test.ts` can exercise this change and its avatar-preservation case can run for the
   first time. See Step 0.

## Proof: Direct inference without the type argument

A type probe on 2026-10-03, against the real `User`, `UserAdapter`, `ScopedUpdate`, and
`DirectUpdateContract`, with a base `makeFormScope` declared without an adapter (`deno check` under
the repository `deno.jsonc`):

| # | Claim                                                                             | Result                         |
| - | --------------------------------------------------------------------------------- | ------------------------------ |
| 1 | `api.Users.update(scope.toUpdate(user.id, draft))` compiles with no type argument | pass                           |
| 2 | `api.Users.create(scope.toCreate(draft))` compiles with `defaults: {}`            | pass                           |
| 3 | `DraftOf<typeof scope>` is exactly the seven scope keys                           | pass                           |
| 4 | `avatarUrl` in the draft is rejected                                              | pass (`@ts-expect-error` held) |
| 5 | A default naming an in-scope key is rejected                                      | pass (`@ts-expect-error` held) |
| 6 | The `K` that `update` infers from `toUpdate`'s result equals `keyof UserDraft`    | pass                           |
| — | Control: today's `update({ id, ...draft })` without a type argument               | TS2345, `avatarUrl` missing    |

The control reproduces the 10-02 production's TS2345 at `user-manager.tsx:51`: a spread object
literal widens `K` to every User key. A typed `ScopedUpdate<User, K>` carries `K` through. Step 2
turns the probe into a permanent type test.

## Documentation (lands first)

Documentation leads code (CONSTITUTION §8). Proposed text:

**`architecture-core.md` §5.2.6**, the two declaration bullets become:

> - A form declares its fields and create defaults through
>   `makeFormScope({ fields: [XAdapter.field, …], defaults })`. The declaration owns the form's
>   draft and its create and update projections, `toCreate(draft)` and `toUpdate(id, draft)`.
> - A form whose client translates (Adapted) declares through `makeAdaptedFormScope`, which adds
>   the scoped adapter as `adapter`. Its client accepts
>   `update(scope.adapter, scope.toUpdate(id, draft))`.
> - A form whose client does not translate (Direct; today only Users) declares through
>   `makeFormScope`. Its client accepts `update(scope.toUpdate(id, draft))`; `K` is inferred
>   from the projection.

**`architecture-front.md` §7.4:**

- The export list names `makeFormScope`, `makeAdaptedFormScope`, `FormScope`, `AdaptedFormScope`,
  `FormDraft`, and `DraftOf`.
- "The declaration exposes `adapter`, `toCreate(draft)`, and `toUpdate(id, draft)`" becomes: every
  declaration exposes `toCreate` and `toUpdate`; an Adapted declaration also exposes `adapter`.
- "The existing scoped adapter translates the projected update" becomes: for an Adapted
  declaration, the scoped adapter translates the projected update; a Direct client receives the
  projection untranslated.

**`architecture-front.md` §10.1.6:**

- The `UserManager` bullet becomes: `UserManager` returns the single `user-step-detail` step;
  `user-state.ts` owns the state, `UserDraft`, and the `userDraft(state)` projection.
- "Customer Detail declares … in `front/api/form-scopes.ts`" names `makeAdaptedFormScope`.
- Lines 773–774, "Users retains its Direct update contract and explicit field tuple in the same
  housing object; it does not adopt the form-scope maker in this production", is production
  narration. It becomes a plain statement: Users declares `scopes.Users.detail` through
  `makeFormScope` and writes through the Direct update contract.

## Production steps

### Step 0 — Test configuration (probe first)

`source/tests/config/test-config.ts` registers only `SUPABASE_RDBMS_URL`, `SUPABASE_PUBLIC_KEY`,
and `SUPABASE_CLIENT_MODE`. `front/api/api.ts` re-exports `AppState`, whose module constructs
`new Preferences('AppStateStore')` at load and needs `LOCAL_DB_NAME` registered in `Config`
(backlog: "The shared test configuration cannot bootstrap `api`").

1. **Probe:** register `LOCAL_DB_NAME` and import `@front/api/api.ts` under Deno. Confirm the
   import completes and touches no IndexedDB API at load.
2. **If the probe passes:** keep the registration (with its environment key) as the fix.
3. **If it fails** for any reason beyond the missing key: stop and report. The backlog entry's
   design question (should a test runtime load browser-backed stores through `api` at all) is out
   of scope.

Note that `deno task test` globs every `*-test.ts`, so `users-api-test.ts` failing at bootstrap
fails the whole task today.

### Step 1 — Documentation

The text above. Checks: `deno task fmt`.

### Step 2 — The form-scope maker

- `front/api/make-form-scope.ts`: `FormScope`, `AdaptedFormScope`, `makeFormScope`,
  `makeAdaptedFormScope`; header PUBLIC updated.
- `front/api/form-scopes.ts`: `Customers.detail` through `makeAdaptedFormScope`; `Users.detail`
  through `makeFormScope`. The header's "Users retains its Direct update field tuple" becomes a
  plain statement.
- `source/tests/cases/make-form-scope-test.ts`:
  - tests that read `scope.adapter` move to `makeAdaptedFormScope`;
  - projection and constraint tests run for the base maker;
  - add: a base scope has no `adapter` member (`@ts-expect-error`);
  - add: the probe's Direct-inference claims (1, 3, 6), using a declared
    `DirectUpdateContract<User>` so no live client is needed.

### Step 3 — Users

- **New `users/user-state.ts`:** `UserDraft`, `userDraft`, `UserState`, `createUserState`, and the
  private `noteContent` helper (Decisions 6–8). Functional-file header per CONVENTIONS §6.2.
- **`users/user-step-detail.tsx`:** renders only. Takes `state: UserState`. `UserDetailKeys`,
  `UserDraft`, `createUserState`, and `noteContent` leave. Header updated (its current PUBLIC
  block is also misaligned).
- **`users/user-manager.tsx`:** imports from `./user-state.ts`;
  `create: draft => api.Users.create(scope.toCreate(draft))`;
  `update: (user, draft) => api.Users.update(scope.toUpdate(user.id, draft))`;
  `detail` returns `draft: () => userDraft(state)`. Header gains PURPOSE and PUBLIC, as
  `customer-manager.tsx` has.

### Step 4 — Users API test

- `source/tests/cases/users-api-test.ts`: the update goes through
  `scopes.Users.detail.toUpdate(created.id, …)`; the local `UserDetailKeys` is deleted.
- Create keeps its raw `UserCreate` input with `avatarUrl` set. The avatar-preservation case
  depends on a stored avatar, which the detail scope's `toCreate` cannot supply.

## Files

| File                                                | Change                                                 |
| --------------------------------------------------- | ------------------------------------------------------ |
| `documentation/architecture/architecture-core.md`   | §5.2.6 declaration bullets                             |
| `documentation/architecture/architecture-front.md`  | §7.4; §10.1.6                                          |
| `source/tests/config/test-config.ts`                | Register `LOCAL_DB_NAME` (Step 0, if the probe passes) |
| `source/front/api/make-form-scope.ts`               | Base and Adapted scope types and makers                |
| `source/front/api/form-scopes.ts`                   | Customers → Adapted maker; Users → real scope          |
| `source/tests/cases/make-form-scope-test.ts`        | Both makers; Direct-inference type tests               |
| `source/front/app-admin/users/user-state.ts`        | New                                                    |
| `source/front/app-admin/users/user-step-detail.tsx` | Render only                                            |
| `source/front/app-admin/users/user-manager.tsx`     | Scope projections; imports; header                     |
| `source/tests/cases/users-api-test.ts`              | Scope projection; local key type deleted               |

Any environment file Step 0 needs is named in the Step 0 report before it is changed.

## Out of scope

- `source/core/` and `source/domain/`, including `api-contract.ts` and `makeScopedUpdate`.
- `front/api/api.ts` and `make-auth-users.ts`.
- Customer behaviour, `customer-state.ts`, `customer-api-test.ts`, and Onboarding.
- The Notes Editor, note factories (`newCustomerNote`, `cloneNote`), and any change to how User
  notes are edited.
- Promoting the maker out of `front/api/`.
- A guard for `@core/std` re-implementations.
- The test-configuration design question (browser-backed stores in a test runtime).

## Checks

- `deno task check`, `deno task fmt`, and the guards (`source/devops/guards/`).
- `deno task test`. After Step 0, it includes `users-api-test.ts`, which needs stage credentials;
  report whether they were available and whether the live case ran.
- `STYLE_AUDIT` per `AGENTS.md` §2.2.

## Verification

- The type tests in `make-form-scope-test.ts` carry the Direct-inference claims permanently.
- `users-api-test.ts`, where stage credentials allow, covers create, scoped update, avatar
  preservation, delete, and list.
- The CA's live walkthrough in Admin: User Manager New, edit, and Save; notes text round-trips with
  its timestamp kept; Customer Manager Save unchanged.
- The AA independently re-derives the report against the diff and the check output (EFFORT §6).

## Escalation boundaries

Stop and report if:

- Step 0's probe fails for any reason beyond the missing key;
- inference fails in the real code where the probe passed;
- any change reaches `core/`, `domain/`, a contract, or `api.ts`;
- a Customer test or call site needs more than the maker rename.

## Amendment — 2026-10-03 — ACE review: live Users coverage dropped

The AI Coding Engine reviewed this brief statically (no probes or tests run) and found the design
coherent with the code. It raised three points. The AI Architect verified the first against the
code; the CA decided all three.

### 1. The live Users test needs an authenticated administrator

`users-api-test.ts` never signs in, and no file under `source/tests/` establishes a session.
Every User write passes `UserOrchestra.authorizeAdmin`
(`back/supabase-edge/orchestration/user-orchestra.ts`), which verifies the caller and requires an
active domain row with the `administrator` role. Sign-in is passwordless OTP only, so a test
cannot obtain that session the way a person does; it would need its own route (an
admin-generated link, or a dedicated test identity on stage). Stage is the only environment, so
that is an authorization-boundary decision of its own, not a ride-along.

Decision 9 bought the test-configuration fix for its verification value: letting
`users-api-test.ts` exercise this change and run the avatar-preservation case. Registering
`LOCAL_DB_NAME` supplies neither. The test would move from failing at bootstrap to failing at
authorization, and `deno task test` would stay red either way.

**Decision (CA): drop live Users coverage from this effort.**

- **Superseded:** Decision 9, Step 0, the `test-config.ts` row in Files and its environment-file
  note, Step 0's escalation boundary, and the live-test lines in Checks and Verification.
- **Step 4 stands.** `users-api-test.ts` still moves to the scope projection, so it type-checks
  against the new declaration. It does not run.
- **Checks:** `deno task test` still globs `users-api-test.ts`, which fails at bootstrap. Report
  that failure as pre-existing and known; every other test must pass.
- **Verification** rests on the permanent type tests (below) and the CA's live walkthrough in
  Admin.
- **The backlog entry** "The shared test configuration cannot bootstrap `api`" records the second
  blocker: the missing authenticated administrator identity.

### 2. Declared contracts stay out of executed code

Step 2's Direct-inference tests use a declared `DirectUpdateContract<User>`. A `declare` compiles
to nothing, so a call against it inside a `Deno.test` body throws `ReferenceError` at runtime.
Those assertions go inside an uncalled function: `deno test` type-checks the file before running
it, so the claims are enforced, and nothing executes the declared client.

### 3. All six probe claims become permanent

Step 2 named claims 1, 3, and 6. Claims 2, 4, and 5 join them: create compatibility with
`defaults: {}`, rejection of `avatarUrl` in the draft, and rejection of a default naming an
in-scope User key. The Customer tests cover the same constraints, but not the Users declaration
this brief introduces.

## Amendment — 2026-10-04 — Phase 2: promote the scope maker to `core/` as `makeScope`

### What changed

Phase 1 produced, and the AI Architect verified against the diff and fresh check runs:

- `deno task check` (guards, types, lint) and `deno task fmt:check` exit 0;
- 56 of 56 tests pass outside `users-api-test.ts`, which fails at bootstrap as known;
- the six Direct-inference claims hold as permanent type tests.

Reviewing the result, the CA judged `make-form-scope.ts` reference-implementation quality and
proposed promoting it to `core/`. The AI Architect reached the same conclusion independently.

### Why now

The 2026-10-03 amendment to `effort/completed/2026-10-02-update-scopes-brief.md` held the maker in
`front/api/` under "prove at the higher layer first": promotion "after Assets and Chemicals prove
it". The risk that guarded against was fixing the shape in `core/` before a second consumer tested
it.

- **Users was that second consumer, and it changed the shape.** The base/Adapted split exists
  because of it. A promotion on 10-03 would have locked the wrong shape into `core/`.
- **Assets and Chemicals are Adapted, like Customers,** so they are unlikely to teach the shape
  anything new.
- **Before §5, not after.** Roadmap §5 Mechanical Productions copies the reference
  implementations. Promoting first means every copy imports the maker from its permanent home;
  promoting after means re-pointing every copy.
- **It is already `core/`-clean.** It imports only `@core/std` types and `makeScopedUpdate`,
  `FieldAdapter`, and `ScopedUpdateAdapter` from `@core/stdx`, nothing from `front/`, `ux/`, or
  `domain/`.

### Naming: drop "form"

`core/` is to become a portable Seasons library, and "form" is UI vocabulary naming the maker's
first consumer, not what it declares. What it declares is a scope: the attributes owned, the
create defaults, and the create and update projections. The word is already used at every layer:

- the housing object is `scopes`;
- `core/` already has `ScopedUpdate<T, K>`, `makeScopedUpdate`, and `ScopedUpdateAdapter`;
- `architecture-core.md` §5.2.6 states its rules about "every declared scope";
- the 10-03 amendment's first name for the draft was `ScopeDraft`.

`Write` was considered as the replacement qualifier and not taken. `makeAttributeScope` was the
precise alternative; it was not taken because bare `Scope` reads clearly beside `ScopedUpdate`
and inside `scopes.X.y`.

| Phase 1                  | Phase 2                 |
| ------------------------ | ----------------------- |
| `makeFormScope`          | `makeScope`             |
| `makeAdaptedFormScope`   | `makeAdaptedScope`      |
| `FormScope<T, K>`        | `Scope<T, K>`           |
| `AdaptedFormScope<T, K>` | `AdaptedScope<T, K>`    |
| `FormDraft<T, K>`        | `ScopeDraft<T, K>`      |
| `DraftOf<S>`             | `DraftOf<S>`, unchanged |

### Decisions

1. **Placement:** `source/core/std/make-scope.ts`, beside `make-adapter.ts`, exported through the
   existing `@core/stdx` barrel. This extends a listed barrel; it adds none (CONVENTIONS §3.2).
2. **Names:** the table above. Behaviour, constraints, and projection semantics are unchanged.
3. **`front/api/form-scopes.ts` keeps its name and the `scopes` housing object.** It is the front
   layer's declaration seam, and its declarations are made by forms.
4. **The test file follows the module:** `make-form-scope-test.ts` becomes `make-scope-test.ts`.

### Steps

1. **Documentation first.**
   - `architecture-core.md` §5.2.6: the maker names.
   - `architecture-front.md` §7.4: the module is `@core/stdx` (`core/std/make-scope.ts`), with the
     new names. The sentence "The maker stays in `front/api/` until further consumers justify a
     separately authorized promotion" is removed.
   - `architecture-front.md` §10.1.6: the maker names in the Customer and Users statements.
2. **Move and rename.**
   - `source/front/api/make-form-scope.ts` → `source/core/std/make-scope.ts`, with the new names
     and its header updated.
   - `source/core/std/stdx.ts`: export it; the barrel's header names scopes.
3. **Consumers:** `front/api/form-scopes.ts`, `customers/customer-state.ts`, `users/user-state.ts`,
   `tests/cases/customer-api-test.ts`, and the renamed `tests/cases/make-scope-test.ts`. Imports
   come from `@core/stdx`.

### Files

| File                                                 | Change                                 |
| ---------------------------------------------------- | -------------------------------------- |
| `documentation/architecture/architecture-core.md`    | §5.2.6 names                           |
| `documentation/architecture/architecture-front.md`   | §7.4 module and names; §10.1.6 names   |
| `source/front/api/make-form-scope.ts`                | Deleted (moved)                        |
| `source/core/std/make-scope.ts`                      | New (moved, renamed)                   |
| `source/core/std/stdx.ts`                            | Export; header                         |
| `source/front/api/form-scopes.ts`                    | Import and names                       |
| `source/front/app-admin/customers/customer-state.ts` | `DraftOf` import                       |
| `source/front/app-admin/users/user-state.ts`         | `DraftOf` import                       |
| `source/tests/cases/customer-api-test.ts`            | `DraftOf` import                       |
| `source/tests/cases/make-form-scope-test.ts`         | Renamed to `make-scope-test.ts`; names |

### Out of scope

- Any change to behaviour, constraints, or the projection semantics.
- `CONVENTIONS.md`. Whether the conventions name `makeScope` beside `makeAdapter` (§8.6) belongs
  to the core-reconciliation brief, which inventories `core/` exports; this promotion gives that
  inventory one export already in its final place.
- Renaming `form-scopes.ts` or the `scopes` housing object.
- Everything Phase 1 excluded.

### Checks and verification

- `deno task check`, `deno task fmt:check`, and `deno task test`, reported as Phase 1 reported
  them (the `users-api-test.ts` bootstrap failure is known).
- No residual `FormScope`, `makeFormScope`, `FormDraft`, or `make-form-scope` reference in
  `source/` or `documentation/`.
- `STYLE_AUDIT` per `AGENTS.md` §2.2.
- The AA re-derives the report against the diff and the check output (EFFORT §6).
- The CA's Admin walkthrough of Phase 2: User Manager New, edit, and Save; notes text round-trips
  with its timestamp kept; Customer Manager Save unchanged.

### Escalation boundaries

Stop and report if:

- any guard objects to `make-scope.ts` in `core/std/` or to the `stdx` export;
- a consumer needs more than an import and name change;
- any change reaches `domain/`, a contract, or `api.ts`.

_End of Brief_
