/**
 * Customer API update-scope tests using the real client and an in-memory HTTP transport.
 */

import { Config } from '@core/cfg/config.ts'
import { Supabase } from '@core/db/supabase.ts'
import type { Dictionary } from '@core/std'
import type { DraftOf } from '@core/stdx'
import type { Customer } from '@domain/abstractions/customer.ts'
import { CustomerAdapter } from '@domain/adapters/customer-adapter.ts'
import { scopes } from '@front/api/form-scopes.ts'
import { assertEquals } from '@std/assert'
import { createClient } from '@supabase/client'
import { blueMesaRanchCustomer } from '@tests/fixtures/customer-samples.ts'

Config.init({
  get: key => key === 'LOCAL_DB_NAME' ? 'customer-api-test' : undefined,
  fail: message => {
    throw new Error(message)
  }
}, ['LOCAL_DB_NAME'])
const { api } = await import('@front/api/api.ts')

Deno.test('Customer API creates from detail fields and declared defaults', async () => {
  await withCustomer(async customer => {
    const draft = { ...detailDraft(customer), line2: undefined }
    const richerDraft = {
      ...draft,
      accountManagerId: customer.accountManagerId,
      notes: customer.notes,
      id: customer.id
    }
    const created = await api.Customers.create(scope.toCreate(richerDraft))
    assertEquals(detailDraft(created), draft)
    assertEquals(created.accountManagerId, undefined)
    assertEquals(created.notes, draft.notes)
    assertEquals(created.id === customer.id, false)
  })
})

Deno.test('Customer API detail scope writes all declared fields in one update', async () => {
  await withCustomer(async customer => {
    const input = {
      ...detailDraft(customer),
      name: 'Updated ranch',
      status: 'inactive' as const,
      primaryContact: [{ ...customer.primaryContact[0], displayName: 'New contact' }],
      line1: '100 Main Street',
      line2: 'Unit 4',
      city: 'Austin',
      state: 'TX',
      postalCode: '78701',
      country: 'US',
      sites: [{ ...customer.sites[0], label: 'Updated site' }]
    }
    const updated = await api.Customers.update(scope.adapter, scope.toUpdate(customer.id, input))
    assertEquals(detailDraft(updated), input)
    assertEquals(await api.Customers.get(customer.id), updated)
  })
})

Deno.test('Customer API detail scope preserves excluded account-manager assignment', async () => {
  await withCustomer(async customer => {
    const input = { ...detailDraft(customer), accountManagerId: null }
    const updated = await api.Customers.update(scope.adapter, scope.toUpdate(customer.id, input))
    assertEquals(updated.accountManagerId, customer.accountManagerId)
    assertEquals(updated.notes, customer.notes)
    assertEquals(updated.createdAt, customer.createdAt)
  })
})

Deno.test('Customer API detail scope replaces and clears account notes', async () => {
  await withCustomer(async customer => {
    const notes = [{
      ...customer.notes[0],
      content: 'Customer-facing account update.',
      visibility: 'shared' as const
    }]
    const updated = await api.Customers.update(
      scope.adapter,
      scope.toUpdate(customer.id, { ...detailDraft(customer), notes })
    )
    assertEquals(updated.notes, notes)
    assertEquals(updated.accountManagerId, customer.accountManagerId)
    const cleared = await api.Customers.update(
      scope.adapter,
      scope.toUpdate(customer.id, { ...detailDraft(updated), notes: [] })
    )
    assertEquals(cleared.notes, [])
    assertEquals((await api.Customers.get(customer.id)).notes, [])
  })
})

Deno.test('Customer API detail scope clears optional address and contact values', async () => {
  await withCustomer(async customer => {
    const { email: _email, ...contact } = customer.primaryContact[0]
    const updated = await api.Customers.update(
      scope.adapter,
      scope.toUpdate(customer.id, {
        ...detailDraft(customer),
        line2: undefined,
        primaryContact: [contact]
      })
    )
    assertEquals(updated.line2, undefined)
    assertEquals(updated.primaryContact[0].email, undefined)
    assertEquals(updated.primaryContact[0].phoneNumber, customer.primaryContact[0].phoneNumber)
    const fetched = await api.Customers.get(customer.id)
    assertEquals(fetched.line2, undefined)
    assertEquals(fetched.primaryContact[0].email, undefined)
  })
})

const scope = scopes.Customers.detail

const detailDraft = (customer: Customer): DraftOf<typeof scope> => ({
  primaryContact: customer.primaryContact,
  name: customer.name,
  status: customer.status,
  line1: customer.line1,
  line2: customer.line2,
  city: customer.city,
  state: customer.state,
  postalCode: customer.postalCode,
  country: customer.country,
  sites: customer.sites,
  notes: customer.notes
})

// Exercise the public composed API, validators, SDK, and adapters without a live database.
const withCustomer = async (run: (customer: Customer) => Promise<void>): Promise<void> => {
  const customer: Customer = {
    ...structuredClone(blueMesaRanchCustomer),
    line2: 'Suite 2',
    notes: [{
      content: 'Account history must survive editing.',
      createdAt: blueMesaRanchCustomer.createdAt,
      attachments: [],
      visibility: 'internal'
    }]
  }
  let record = CustomerAdapter.fromDomain(customer)
  const original = Supabase.client
  const client = createClient('http://customer-api.invalid', 'test-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        const request = new Request(input, init)
        const url = new URL(request.url)
        assertEquals(url.pathname, '/rest/v1/customers')
        if (request.method === 'POST') {
          record = await request.json() as Dictionary
          assertEquals('account_manager_id' in record, false)
          assertEquals('line2' in record, false)
          assertEquals(record.notes, CustomerAdapter.fromDomain(customer).notes)
        } else {
          assertEquals(url.searchParams.get('id'), `eq.${customer.id}`)
          assertEquals(url.searchParams.get('deleted_at'), 'is.null')
          if (request.method === 'PATCH') {
            const patch = await request.json() as Dictionary
            assertEquals('account_manager_id' in patch, false)
            assertEquals('notes' in patch, true)
            record = { ...record, ...patch }
          } else assertEquals(request.method, 'GET')
        }
        return Response.json(record)
      }
    }
  })
  Supabase.client = () => client
  try {
    await run(customer)
  } finally {
    Supabase.client = original
  }
}
