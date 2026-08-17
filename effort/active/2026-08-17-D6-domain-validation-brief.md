# Domain Validation at CRUD Boundaries — Production Brief

## What triggered this

The system now has generated domain validators and active CRUD consumers. The
next gap is that CRUD provider makers currently accept adapters but do not accept
domain protocol validators.

That means a create/update payload can reach a persistence provider with only
TypeScript compile-time confidence and adapter translation. This is not enough at
the boundary. Domain validators exist specifically to validate protocol payloads
at system boundaries.

The immediate design question was whether validation belongs while a form is
building an object, once at save, or both. The answer is both, but not the same
validation.

## Current boundary

Domain validators live under:

- `source/domain/validators/`

They validate protocol payloads:

- `validate{Topic}Create(input)`
- `validate{Topic}Update(input)`

They return `ExpectResult` from `@core/std`: `null` when valid, otherwise a
message string.

CRUD provider makers currently accept adapter parameters:

- `makeCrudSupabaseClient`
- `makeCrudIndexedDbClient`
- `makeCrudHttpClient`

Adapters map between domain/protocol shape and provider storage/transport shape.
They do not validate, and they must not become validators.

## Principle

Adapters translate. Validators judge.

Any maker that produces a CRUD provider is a candidate for validator parameters,
just as it is already a candidate for adapter parameters.

The maker remains generic. Domain-specific wiring happens at the composition
layer, not inside core. Core may depend on the validator function shape because
`ExpectResult`, `CreateFromInstantiable`, and `UpdateFromInstantiable` are core
types. Core must not import `@domain/validators`.

## Two validation timings

### Form/build-time validation

Form/build-time validation is UX-facing and progressive.

It answers:

- can the user continue?
- what field should show feedback?
- what local state is incomplete?

It may be partial, interactive, staged, and context-sensitive. It exists to make
the form usable. It is not persistence authority.

### Save/boundary validation

Save/boundary validation is domain protocol validation.

It answers:

- is this create/update payload valid domain input?

It runs immediately before a CRUD provider mutates storage or crosses a transport
boundary. It is a hard failure. It must run even if the form already validated
the fields.

## Recommended production

Introduce a CRUD validator specification in core, shaped around protocol
payloads:

```ts
type CrudValidatorSpecification<T extends Instantiable> = {
  validateCreate: (input: CreateFromInstantiable<T>) => ExpectResult
  validateUpdate: (input: UpdateFromInstantiable<T>) => ExpectResult
}
```

The exact type name is an implementation detail, but the shape is not:

- validate create payload before provider create;
- validate update payload before provider update;
- throw `ApiError` with HTTP-like status `422` when invalid;
- do not validate `get`, `delete`, or `list` beyond their existing argument
  normalization/contracts unless a concrete invalid-input case is discovered.

Expected composition:

```ts
Customers: makeCrudSupabaseClient<Customer>({
  table: 'customers',
  adapter: CustomerAdapter,
  validateCreate: validateCustomerCreate,
  validateUpdate: validateCustomerUpdate
})
```

The same pattern should apply to plain CRUD providers regardless of backing
store:

- Supabase RDBMS CRUD
- IndexedDB CRUD
- HTTP CRUD

For HTTP CRUD, client-side validation is still only early feedback. Server or
edge handlers that receive untrusted HTTP input must validate again before
performing authoritative work.

## `makeAuthUsers`

`makeAuthUsers` is a composed CRUD wrapper rather than a plain direct provider.
Its create/update operations delegate to privileged edge functions. It should not
be treated as exempt.

The preferred behavior is:

- validate user create/update payloads before invoking the edge bus-rule client;
- edge function validation remains authoritative before privileged work.

That gives fast UX/API feedback without trusting the browser or composed client
as the security boundary.

## Files likely in scope

In:

- `source/core/client/make-supabase-client.ts`
- `source/core/client/make-indexeddb-client.ts`
- `source/core/client/make-http-client.ts`
- `source/front/api/api.ts`
- `source/front/api/make-auth-users.ts`

Likely also in, depending on current API composition:

- any `source/front/api/*` file composing CRUD providers
- tests under `source/tests/` for CRUD provider behavior

Out:

- validator generation rules
- generated domain validator content unless a validator bug is discovered
- domain abstractions
- domain adapters
- domain protocols
- schema and migrations
- RLS policy changes
- form-field UX validation redesign
- guard changes, unless an existing guard is wrong and the Chief Architect
  expands scope

## Implementation notes

The provider maker should fail before translating and sending a mutation:

1. run `validateCreate(input)` / `validateUpdate(input)`;
2. if the result is not `null`, throw `ApiError` with status `422`;
3. only then call `instantiable`, `adapter.fromDomain`, `fetch`, IndexedDB, or
   Supabase.

Do not make validators optional for newly updated provider specifications. If a
CRUD provider has no validator, that absence should be an explicit composition
decision surfaced by the type system, not an accidental omission.

Do not import domain validators from core. The dependency direction is:

```text
front/back composition → domain validators → core std
front/back composition → core CRUD makers
core CRUD makers       → core validator callback shape
```

## Checks

Run:

```sh
deno task fmt
deno task check
deno task test
```

If the work touches Supabase edge functions or shims, also run the relevant edge
script:

```sh
deno task edge-deploy
```

For local-only validation before deployment, `deno task edge-sync` may be used to
confirm generated edge manifests and shared imports.

## Escalation

Stop and report if the production appears to require:

- changing domain validator semantics away from `ExpectResult`;
- changing generated domain protocol shapes;
- adding domain imports to core;
- making adapters responsible for validation;
- changing schema, migrations, or RLS;
- redesigning form validation;
- changing guard rules;
- weakening provider validation to optional because composition sites are
  incomplete.

_End of Brief_
