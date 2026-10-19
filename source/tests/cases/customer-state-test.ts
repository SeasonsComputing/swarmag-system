/** Customer drafts isolate source, accepted collections, and projected results. */

import { createCustomerState, customerDraft } from '@front/app-admin/customers/customer-state.ts'
import { UserProvider } from '@front/app/shell/user-provider.ts'
import { assertEquals, assertNotStrictEquals } from '@std/assert'
import { blueMesaRanchCustomer } from '@tests/fixtures/customer-samples.ts'
import { operationsUserSample, salesUserSample } from '@tests/fixtures/user-samples.ts'

Deno.test('Customer draft isolates source sites and every projected nested collection', () => {
  const customer = structuredClone(blueMesaRanchCustomer)
  const state = createCustomerState(customer)
  const originalCity = customer.sites[0].location[0].city
  customer.sites[0].location[0].city = 'Source edit'
  assertEquals(state.sites()[0].location[0].city, originalCity)
  const projected = customerDraft(state)
  projected.sites[0].location[0].city = 'Projection edit'
  projected.primaryContact[0].displayName = 'Projection contact'
  assertNotStrictEquals(projected.sites, state.sites())
  assertEquals(state.sites()[0].location[0].city, originalCity)
  assertEquals(state.sites().length, 2)
  assertEquals(state.displayName(), customer.primaryContact[0].displayName)
  state.updateLocation(0, location => ({ ...location, city: 'Draft edit' }))
  assertEquals(customer.sites[0].location[0].city, 'Source edit')
  assertEquals(projected.sites[0].location[0].city, 'Projection edit')
})

Deno.test('Customer draft copies accepted notes, added sites, and replaced sites', () => {
  const state = createCustomerState()
  const notes = [{
    content: 'Accepted note',
    visibility: 'internal' as const,
    attachments: [],
    createdAt: '2026-10-08T12:00:00Z'
  }]
  state.setNotes(notes)
  notes[0].content = 'Source edit'
  assertEquals(state.notes()[0].content, 'Accepted note')
  const projected = customerDraft(state)
  projected.notes[0].content = 'Projection edit'
  assertEquals(state.notes()[0].content, 'Accepted note')
  const site = structuredClone(blueMesaRanchCustomer.sites[0])
  site.notes = structuredClone(notes)
  state.addSite(site)
  site.location[0].city = 'Changed add input'
  site.notes[0].content = 'Changed add note'
  assertEquals(state.sites()[0].location[0].city, blueMesaRanchCustomer.sites[0].location[0].city)
  assertEquals(state.sites()[0].notes[0].content, 'Source edit')
  state.setSite(0, site)
  site.location[0].city = 'Changed replacement input'
  site.notes[0].content = 'Changed replacement note'
  assertEquals(state.sites()[0].location[0].city, 'Changed add input')
  assertEquals(state.sites()[0].notes[0].content, 'Changed add note')
})

Deno.test('Customer creation defaults once from an eligible prepared User before the baseline', () => {
  try {
    UserProvider.set(salesUserSample)
    const state = createCustomerState()
    const baseline = JSON.stringify(customerDraft(state))
    assertEquals(state.accountManagerId(), salesUserSample.id)
    assertEquals(state.storedAccountManagerId, undefined)
    assertEquals(JSON.stringify(customerDraft(state)), baseline)
    state.setAccountManagerId(undefined)
    assertEquals(customerDraft(state).accountManagerId, undefined)
    assertEquals(state.accountManagerId(), undefined)
    assertEquals(JSON.stringify(customerDraft(state)) === baseline, false)
    UserProvider.set(operationsUserSample)
    assertEquals(createCustomerState().accountManagerId(), undefined)
  } finally {
    UserProvider.clear()
  }
})

Deno.test('Existing Customer retains stored assignment independently of the editable draft', () => {
  try {
    UserProvider.set(salesUserSample)
    const customer = { ...blueMesaRanchCustomer, accountManagerId: operationsUserSample.id }
    const state = createCustomerState(customer)
    assertEquals(state.accountManagerId(), operationsUserSample.id)
    state.setAccountManagerId(salesUserSample.id)
    assertEquals(customerDraft(state).accountManagerId, salesUserSample.id)
    state.setAccountManagerId(undefined)
    assertEquals(customerDraft(state).accountManagerId, undefined)
    assertEquals(state.storedAccountManagerId, operationsUserSample.id)
    assertEquals(customer.accountManagerId, operationsUserSample.id)
    assertEquals(
      createCustomerState({ ...customer, accountManagerId: undefined }).accountManagerId(),
      undefined
    )
  } finally {
    UserProvider.clear()
  }
})
