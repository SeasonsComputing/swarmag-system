/**
 * Form-scope inference, constraints, and create/update projection tests.
 */

import type { CreateFromInstantiable, Dictionary, FromInstantiable, ScopedUpdate } from '@core/std'
import type { Customer } from '@domain/abstractions/customer.ts'
import { CustomerAdapter } from '@domain/adapters/customer-adapter.ts'
import { makeFormScope } from '@front/api/make-form-scope.ts'
import type { DraftOf } from '@front/api/make-form-scope.ts'
import { assertEquals } from '@std/assert'
import { blueMesaRanchCustomer } from '@tests/fixtures/customer-samples.ts'

const DETAIL_FIELDS = [
  CustomerAdapter.primaryContact,
  CustomerAdapter.name,
  CustomerAdapter.status,
  CustomerAdapter.line1,
  CustomerAdapter.line2,
  CustomerAdapter.city,
  CustomerAdapter.state,
  CustomerAdapter.postalCode,
  CustomerAdapter.country,
  CustomerAdapter.sites
] as const
const scope = makeFormScope({
  fields: DETAIL_FIELDS,
  defaults: { accountManagerId: undefined, notes: [] }
})
type Draft = DraftOf<typeof scope>
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true
  : false

const detailDraft = (): Draft => ({
  primaryContact: blueMesaRanchCustomer.primaryContact,
  name: blueMesaRanchCustomer.name,
  status: blueMesaRanchCustomer.status,
  line1: blueMesaRanchCustomer.line1,
  city: blueMesaRanchCustomer.city,
  state: blueMesaRanchCustomer.state,
  postalCode: blueMesaRanchCustomer.postalCode,
  country: blueMesaRanchCustomer.country,
  sites: blueMesaRanchCustomer.sites
})

Deno.test('makeFormScope infers the exact draft and create protocol without type arguments', () => {
  const exactDraft: Equal<
    Draft,
    Pick<FromInstantiable<Customer>, (typeof DETAIL_FIELDS)[number]['key']>
  > = true
  const exactCreate: Equal<ReturnType<typeof scope.toCreate>, CreateFromInstantiable<Customer>> = true
  assertEquals(exactDraft, true)
  assertEquals(exactCreate, true)
})

Deno.test('makeFormScope compiler constraints reject missing and overlapping attributes', () => {
  const draft = detailDraft()
  // @ts-expect-error The fresh draft cannot include excluded notes.
  const excluded: Draft = { ...draft, notes: [] }
  const { name: _name, ...withoutName } = draft
  // @ts-expect-error The required scoped name cannot be absent.
  const missing: Draft = withoutName
  const defaults = { accountManagerId: undefined, notes: [] }
  const overlap = { ...defaults, name: 'Unowned default' }
  const undefinedOverlap = { ...defaults, line2: undefined }
  const lifecycle = { ...defaults, id: blueMesaRanchCustomer.id }
  const createdAt = { ...defaults, createdAt: blueMesaRanchCustomer.createdAt }
  const updatedAt = { ...defaults, updatedAt: blueMesaRanchCustomer.updatedAt }
  const deletedAt = { ...defaults, deletedAt: undefined }
  const unknownKey = { ...defaults, unrelated: 'Unowned default' }
  // @ts-expect-error Scoped defaults are rejected even through a variable.
  makeFormScope({ fields: DETAIL_FIELDS, defaults: overlap })
  // @ts-expect-error An explicitly undefined scoped default still overlaps.
  makeFormScope({ fields: DETAIL_FIELDS, defaults: undefinedOverlap })
  // @ts-expect-error Lifecycle id is not a create default.
  makeFormScope({ fields: DETAIL_FIELDS, defaults: lifecycle })
  // @ts-expect-error Lifecycle createdAt is not a create default.
  makeFormScope({ fields: DETAIL_FIELDS, defaults: createdAt })
  // @ts-expect-error Lifecycle updatedAt is not a create default.
  makeFormScope({ fields: DETAIL_FIELDS, defaults: updatedAt })
  // @ts-expect-error Lifecycle deletedAt is not a create default.
  makeFormScope({ fields: DETAIL_FIELDS, defaults: deletedAt })
  // @ts-expect-error Unknown defaults are rejected even through a variable.
  makeFormScope({ fields: DETAIL_FIELDS, defaults: unknownKey })
  const missingDefaults = { accountManagerId: undefined }
  // @ts-expect-error Required excluded notes must be defaulted.
  makeFormScope({ fields: DETAIL_FIELDS, defaults: missingDefaults })
  const wrongDefaults = { accountManagerId: undefined, notes: 'Wrong domain shape' }
  // @ts-expect-error Defaults must retain the domain attribute's value type.
  makeFormScope({ fields: DETAIL_FIELDS, defaults: wrongDefaults })
  assertEquals(excluded.name, draft.name)
  assertEquals('name' in missing, false)
})

Deno.test('toCreate selects draft fields and preserves defaults against richer variables', () => {
  const draft = detailDraft()
  const richerDraft = {
    ...draft,
    notes: [{
      content: 'Must not override declared defaults',
      createdAt: blueMesaRanchCustomer.createdAt,
      attachments: [],
      tags: [],
      visibility: 'internal' as const
    }],
    accountManagerId: blueMesaRanchCustomer.accountManagerId,
    id: blueMesaRanchCustomer.id,
    createdAt: blueMesaRanchCustomer.createdAt,
    unrelated: 'Must not be emitted'
  }
  const created = scope.toCreate(richerDraft)
  assertEquals(created, { accountManagerId: undefined, notes: [], ...draft, line2: undefined })
  assertEquals('id' in created, false)
  assertEquals('createdAt' in created, false)
  assertEquals('unrelated' in created, false)
  assertEquals(Object.values(created).some(value => value === null), false)
})

Deno.test('toUpdate clears omitted and undefined scoped values without leaking other fields', () => {
  const draft = detailDraft()
  const richerDraft = { ...draft, notes: [], id: 'Wrong id', unrelated: 'Must not be emitted' }
  const omitted = scope.toUpdate(blueMesaRanchCustomer.id, richerDraft)
  const explicit = scope.toUpdate(blueMesaRanchCustomer.id, { ...draft, line2: undefined })
  assertEquals(omitted, { id: blueMesaRanchCustomer.id, ...draft, line2: null })
  assertEquals(explicit, omitted)
  assertEquals('notes' in omitted, false)
  assertEquals('unrelated' in omitted, false)
  assertEquals(scope.adapter.fromDomain(omitted).line2, null)
})

Deno.test('form-scope projections preserve present values and whole compositions', () => {
  const draft = { ...detailDraft(), name: '', line2: 'Suite 2', sites: [] }
  const created = scope.toCreate(draft)
  const updated = scope.toUpdate(blueMesaRanchCustomer.id, draft)
  assertEquals(created.name, '')
  assertEquals(updated.name, '')
  assertEquals(created.line2, 'Suite 2')
  assertEquals(updated.line2, 'Suite 2')
  assertEquals(created.sites, [])
  assertEquals(updated.sites, [])
  assertEquals(created.primaryContact, draft.primaryContact)
  assertEquals(updated.primaryContact, draft.primaryContact)
  assertEquals(scope.adapter.fromDomain(updated).primary_contact, [{
    display_name: draft.primaryContact[0].displayName,
    phone_number: draft.primaryContact[0].phoneNumber,
    preferred_channel: draft.primaryContact[0].preferredChannel,
    email: draft.primaryContact[0].email
  }])
})

Deno.test('Id | undefined admits null in ScopedUpdate and clears through the form adapter', () => {
  const draft = detailDraft()
  const assignmentScope = makeFormScope({
    fields: [CustomerAdapter.accountManagerId],
    defaults: { ...draft, notes: [] }
  })
  const expected: ScopedUpdate<Customer, 'accountManagerId'> = {
    id: blueMesaRanchCustomer.id,
    accountManagerId: null
  }
  const cleared = assignmentScope.toUpdate(blueMesaRanchCustomer.id, { accountManagerId: undefined })
  assertEquals(cleared, expected)
  assertEquals(assignmentScope.adapter.fromDomain(cleared), { account_manager_id: null })
  const assigned = assignmentScope.toUpdate(blueMesaRanchCustomer.id, {
    accountManagerId: blueMesaRanchCustomer.id
  })
  assertEquals(assigned.accountManagerId, blueMesaRanchCustomer.id)
  const created = assignmentScope.toCreate({ accountManagerId: undefined })
  assertEquals(created.accountManagerId, undefined)
  assertEquals(Object.values(created).some(value => value === null), false)
  // @ts-expect-error The required name value does not admit a null clear.
  const invalid: ScopedUpdate<Customer, 'name'> = { id: blueMesaRanchCustomer.id, name: null }
  assertEquals((invalid as Dictionary).name, null)
})
