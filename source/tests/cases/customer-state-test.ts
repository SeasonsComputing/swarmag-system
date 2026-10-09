/** Customer drafts isolate source, accepted collections, and projected results. */

import { createCustomerState, customerDraft } from '@front/app-admin/customers/customer-state.ts'
import { assertEquals, assertNotStrictEquals } from '@std/assert'
import { blueMesaRanchCustomer } from '@tests/fixtures/customer-samples.ts'

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
