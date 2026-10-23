/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Scope tests                                                                  ║
║ Verify inference, constraints, and create and update projections.            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Scope inference, constraints, and create/update projection tests.
*/

import { id } from '@core/std'
import type { CreateFromInstantiable, Dictionary, FromInstantiable, Id, ScopedUpdate } from '@core/std'
import type { CrudBaseContract, DirectUpdateContract } from '@core/stdx'
import { makeAdaptedScope, makeScope } from '@core/stdx'
import type { DraftOf } from '@core/stdx'
import type { Customer } from '@domain/abstractions/customer.ts'
import type { User } from '@domain/abstractions/user.ts'
import { CustomerAdapter } from '@domain/adapters/customer-adapter.ts'
import { UserAdapter } from '@domain/adapters/user-adapter.ts'
import { scopes } from '@front/api/scopes.ts'
import { assertEquals } from '@std/assert'
import { CustomerSamples } from '@tests/fixtures/customer-samples.ts'

/** Customer detail fields shared by both scopes. */
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
/** Direct scope over the detail fields. */
const Scope = makeScope({
  fields: DETAIL_FIELDS,
  defaults: { accountManagerId: undefined, notes: [] }
})
/** Adapted scope over the same fields. */
const AdaptedScope = makeAdaptedScope({
  fields: DETAIL_FIELDS,
  defaults: { accountManagerId: undefined, notes: [] }
})
/** Draft type the scopes accept. */
type Draft = DraftOf<typeof Scope>
/** Compile-time type equality. */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true
  : false

// Detail draft built from the sample Customer.
const detailDraft = (): Draft => ({
  primaryContact: CustomerSamples.blueMesaRanch.primaryContact,
  name: CustomerSamples.blueMesaRanch.name,
  status: CustomerSamples.blueMesaRanch.status,
  line1: CustomerSamples.blueMesaRanch.line1,
  city: CustomerSamples.blueMesaRanch.city,
  state: CustomerSamples.blueMesaRanch.state,
  postalCode: CustomerSamples.blueMesaRanch.postalCode,
  country: CustomerSamples.blueMesaRanch.country,
  sites: CustomerSamples.blueMesaRanch.sites
})

Deno.test('makeScope infers the exact draft and create protocol without type arguments', () => {
  const exactDraft: Equal<
    Draft,
    Pick<FromInstantiable<Customer>, (typeof DETAIL_FIELDS)[number]['key']>
  > = true
  const exactCreate: Equal<ReturnType<typeof Scope.toCreate>, CreateFromInstantiable<Customer>> = true
  assertEquals(exactDraft, true)
  assertEquals(exactCreate, true)
  // @ts-expect-error Direct form scopes have no scoped adapter.
  const adapter = Scope.adapter
  assertEquals(adapter, undefined)
})

Deno.test('makeAdaptedScope adds translation without changing projections', () => {
  const draft = detailDraft()
  const exactDraft: Equal<DraftOf<typeof AdaptedScope>, Draft> = true
  assertEquals(exactDraft, true)
  assertEquals(AdaptedScope.toCreate(draft), Scope.toCreate(draft))
  assertEquals(
    AdaptedScope.toUpdate(CustomerSamples.blueMesaRanch.id, draft),
    Scope.toUpdate(CustomerSamples.blueMesaRanch.id, draft)
  )
  const overlap = { accountManagerId: undefined, notes: [], name: 'Unowned default' }
  // @ts-expect-error Adapted declarations retain the base's disjoint-default constraint.
  makeAdaptedScope({ fields: DETAIL_FIELDS, defaults: overlap })
})

Deno.test('makeScope compiler constraints reject missing and overlapping attributes', () => {
  const draft = detailDraft()
  // @ts-expect-error The fresh draft cannot include excluded notes.
  const excluded: Draft = { ...draft, notes: [] }
  const { name: _name, ...withoutName } = draft
  // @ts-expect-error The required scoped name cannot be absent.
  const missing: Draft = withoutName
  const defaults = { accountManagerId: undefined, notes: [] }
  const overlap = { ...defaults, name: 'Unowned default' }
  const undefinedOverlap = { ...defaults, line2: undefined }
  const lifecycle = { ...defaults, id: CustomerSamples.blueMesaRanch.id }
  const createdAt = { ...defaults, createdAt: CustomerSamples.blueMesaRanch.createdAt }
  const updatedAt = { ...defaults, updatedAt: CustomerSamples.blueMesaRanch.updatedAt }
  const deletedAt = { ...defaults, deletedAt: undefined }
  const unknownKey = { ...defaults, unrelated: 'Unowned default' }
  // @ts-expect-error Scoped defaults are rejected even through a variable.
  makeScope({ fields: DETAIL_FIELDS, defaults: overlap })
  // @ts-expect-error An explicitly undefined scoped default still overlaps.
  makeScope({ fields: DETAIL_FIELDS, defaults: undefinedOverlap })
  // @ts-expect-error Lifecycle id is not a create default.
  makeScope({ fields: DETAIL_FIELDS, defaults: lifecycle })
  // @ts-expect-error Lifecycle createdAt is not a create default.
  makeScope({ fields: DETAIL_FIELDS, defaults: createdAt })
  // @ts-expect-error Lifecycle updatedAt is not a create default.
  makeScope({ fields: DETAIL_FIELDS, defaults: updatedAt })
  // @ts-expect-error Lifecycle deletedAt is not a create default.
  makeScope({ fields: DETAIL_FIELDS, defaults: deletedAt })
  // @ts-expect-error Unknown defaults are rejected even through a variable.
  makeScope({ fields: DETAIL_FIELDS, defaults: unknownKey })
  const missingDefaults = { accountManagerId: undefined }
  // @ts-expect-error Required excluded notes must be defaulted.
  makeScope({ fields: DETAIL_FIELDS, defaults: missingDefaults })
  const wrongDefaults = { accountManagerId: undefined, notes: 'Wrong domain shape' }
  // @ts-expect-error Defaults must retain the domain attribute's value type.
  makeScope({ fields: DETAIL_FIELDS, defaults: wrongDefaults })
  assertEquals(excluded.name, draft.name)
  assertEquals('name' in missing, false)
})

Deno.test('toCreate selects draft fields and preserves defaults against richer variables', () => {
  const draft = detailDraft()
  const richerDraft = {
    ...draft,
    notes: [{
      content: 'Must not override declared defaults',
      createdAt: CustomerSamples.blueMesaRanch.createdAt,
      attachments: [],
      visibility: 'internal' as const
    }],
    accountManagerId: CustomerSamples.blueMesaRanch.accountManagerId,
    id: CustomerSamples.blueMesaRanch.id,
    createdAt: CustomerSamples.blueMesaRanch.createdAt,
    unrelated: 'Must not be emitted'
  }
  const created = Scope.toCreate(richerDraft)
  assertEquals(created, { accountManagerId: undefined, notes: [], ...draft, line2: undefined })
  assertEquals('id' in created, false)
  assertEquals('createdAt' in created, false)
  assertEquals('unrelated' in created, false)
  assertEquals(Object.values(created).some(value => value === null), false)
})

Deno.test('toUpdate clears omitted and undefined scoped values without leaking other fields', () => {
  const draft = detailDraft()
  const richerDraft = { ...draft, notes: [], id: 'Wrong id', unrelated: 'Must not be emitted' }
  const omitted = Scope.toUpdate(CustomerSamples.blueMesaRanch.id, richerDraft)
  const explicit = Scope.toUpdate(CustomerSamples.blueMesaRanch.id, { ...draft, line2: undefined })
  assertEquals(omitted, { id: CustomerSamples.blueMesaRanch.id, ...draft, line2: null })
  assertEquals(explicit, omitted)
  assertEquals('notes' in omitted, false)
  assertEquals('unrelated' in omitted, false)
  assertEquals(AdaptedScope.adapter.fromDomain(omitted).line2, null)
})

Deno.test('scope projections preserve present values and whole compositions', () => {
  const draft = { ...detailDraft(), name: '', line2: 'Suite 2', sites: [] }
  const created = Scope.toCreate(draft)
  const updated = Scope.toUpdate(CustomerSamples.blueMesaRanch.id, draft)
  assertEquals(created.name, '')
  assertEquals(updated.name, '')
  assertEquals(created.line2, 'Suite 2')
  assertEquals(updated.line2, 'Suite 2')
  assertEquals(created.sites, [])
  assertEquals(updated.sites, [])
  assertEquals(created.primaryContact, draft.primaryContact)
  assertEquals(updated.primaryContact, draft.primaryContact)
  assertEquals(AdaptedScope.adapter.fromDomain(updated).primary_contact, [{
    display_name: draft.primaryContact[0].displayName,
    phone_number: draft.primaryContact[0].phoneNumber,
    preferred_channel: draft.primaryContact[0].preferredChannel,
    email: draft.primaryContact[0].email
  }])
})

Deno.test('Id | undefined admits null in ScopedUpdate and clears through the form adapter', () => {
  const draft = detailDraft()
  const assignmentScope = makeAdaptedScope({
    fields: [CustomerAdapter.accountManagerId],
    defaults: { ...draft, notes: [] }
  })
  const expected: ScopedUpdate<Customer, 'accountManagerId'> = {
    id: CustomerSamples.blueMesaRanch.id,
    accountManagerId: null
  }
  const cleared = assignmentScope.toUpdate(CustomerSamples.blueMesaRanch.id, {
    accountManagerId: undefined
  })
  assertEquals(cleared, expected)
  assertEquals(assignmentScope.adapter.fromDomain(cleared), { account_manager_id: null })
  const assigned = assignmentScope.toUpdate(CustomerSamples.blueMesaRanch.id, {
    accountManagerId: CustomerSamples.blueMesaRanch.id
  })
  assertEquals(assigned.accountManagerId, CustomerSamples.blueMesaRanch.id)
  const created = assignmentScope.toCreate({ accountManagerId: undefined })
  assertEquals(created.accountManagerId, undefined)
  assertEquals(Object.values(created).some(value => value === null), false)
  // @ts-expect-error The required name value does not admit a null clear.
  const invalid: ScopedUpdate<Customer, 'name'> = { id: CustomerSamples.blueMesaRanch.id, name: null }
  assertEquals((invalid as Dictionary).name, null)
})

Deno.test('User projections exclude avatarUrl even when a richer draft carries it', () => {
  const draft: DraftOf<typeof scopes.Users.detail> = {
    displayName: 'Ada Lovelace',
    primaryEmail: 'ada@example.com',
    phoneNumber: '+1-325-555-0100',
    preferredChannel: 'email',
    notes: [],
    roles: ['administrator'],
    status: 'active'
  }
  const userId = id()
  const richerDraft = { ...draft, avatarUrl: 'https://example.com/ada.png' }
  const created = scopes.Users.detail.toCreate(richerDraft)
  const updated = scopes.Users.detail.toUpdate(userId, richerDraft)
  assertEquals(created, draft)
  assertEquals(updated, { id: userId, ...draft })
  assertEquals('avatarUrl' in created, false)
  assertEquals('avatarUrl' in updated, false)
  assertEquals('adapter' in scopes.Users.detail, false)
})

/** Declared direct-update client, for type assertions only. */
declare const directUsers: DirectUpdateContract<User>
/** Declared create client, for type assertions only. */
declare const userCreates: CrudBaseContract<User>

// Assert the Users detail scope's inferred draft and client types.
// Type assertions only: the declared clients have no runtime implementation.
function checkUserInference(draft: DraftOf<typeof scopes.Users.detail>, id: Id): void {
  const Scope = scopes.Users.detail
  type UserDraft = DraftOf<typeof Scope>
  const exactKeys: Equal<
    keyof UserDraft,
    'displayName' | 'primaryEmail' | 'phoneNumber' | 'preferredChannel' | 'notes' | 'roles' | 'status'
  > = true
  const updated: Promise<User> = directUsers.update(Scope.toUpdate(id, draft))
  const created: Promise<User> = userCreates.create(Scope.toCreate(draft))
  // @ts-expect-error User drafts exclude avatarUrl.
  const avatarDraft: UserDraft = { ...draft, avatarUrl: 'https://example.com/ada.png' }
  const overlap = { displayName: 'Unowned default' }
  makeScope({
    fields: [
      UserAdapter.displayName,
      UserAdapter.primaryEmail,
      UserAdapter.phoneNumber,
      UserAdapter.preferredChannel,
      UserAdapter.notes,
      UserAdapter.roles,
      UserAdapter.status
    ],
    // @ts-expect-error An in-scope User field cannot also be defaulted.
    defaults: overlap
  })

  const inferKeys = <K extends keyof FromInstantiable<User>>(source: ScopedUpdate<User, K>): K => {
    directUsers.update(source)
    return null as unknown as K
  }
  const inferred = inferKeys(Scope.toUpdate(id, draft))
  const exactInference: Equal<typeof inferred, keyof UserDraft> = true
  const exactCreate: Equal<ReturnType<typeof Scope.toCreate>, CreateFromInstantiable<User>> = true
  const exactDraft: Equal<UserDraft, Pick<FromInstantiable<User>, keyof UserDraft>> = true
  void [exactKeys, updated, created, avatarDraft, exactInference, exactCreate, exactDraft]
}

void checkUserInference
