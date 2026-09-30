/**
 * Customer API update-scope tests using the real client and an in-memory HTTP transport.
 */

import { Config } from '@core/cfg/config.ts'
import { Supabase } from '@core/db/supabase.ts'
import type { Dictionary } from '@core/std'
import type { Customer } from '@domain/abstractions/customer.ts'
import { CustomerAdapter } from '@domain/adapters/customer-adapter.ts'
import { CustomerUpdateScopes } from '@front/api/api-update-scopes.ts'
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

Deno.test('Customer API writes all Manager fields in one scoped update', async () => {
  await withCustomer(async customer => {
    const input = {
      ...managerUpdate(customer),
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
    const updated = await api.Customers.update(CustomerUpdateScopes.manager, input)
    assertEquals(managerUpdate(updated), input)
    assertEquals(await api.Customers.get(customer.id), updated)
  })
})

Deno.test('Customer API Manager scope preserves excluded account fields', async () => {
  await withCustomer(async customer => {
    const input = { ...managerUpdate(customer), accountManagerId: null, notes: [] }
    const updated = await api.Customers.update(CustomerUpdateScopes.manager, input)
    assertEquals(updated.accountManagerId, customer.accountManagerId)
    assertEquals(updated.notes, customer.notes)
    assertEquals(updated.createdAt, customer.createdAt)
  })
})

Deno.test('Customer API clears optional address and contact values', async () => {
  await withCustomer(async customer => {
    const { email: _email, ...contact } = customer.primaryContact[0]
    const updated = await api.Customers.update(CustomerUpdateScopes.manager, {
      ...managerUpdate(customer),
      line2: null,
      primaryContact: [contact]
    })
    assertEquals(updated.line2, undefined)
    assertEquals(updated.primaryContact[0].email, undefined)
    assertEquals(updated.primaryContact[0].phoneNumber, customer.primaryContact[0].phoneNumber)
    const fetched = await api.Customers.get(customer.id)
    assertEquals(fetched.line2, undefined)
    assertEquals(fetched.primaryContact[0].email, undefined)
  })
})

const managerUpdate = (customer: Customer) => ({
  id: customer.id,
  primaryContact: customer.primaryContact,
  name: customer.name,
  status: customer.status,
  line1: customer.line1,
  line2: customer.line2 ?? null,
  city: customer.city,
  state: customer.state,
  postalCode: customer.postalCode,
  country: customer.country,
  sites: customer.sites
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
      tags: ['history'],
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
        assertEquals(url.searchParams.get('id'), `eq.${customer.id}`)
        assertEquals(url.searchParams.get('deleted_at'), 'is.null')
        if (request.method === 'PATCH') {
          const patch = await request.json() as Dictionary
          assertEquals('account_manager_id' in patch, false)
          assertEquals('notes' in patch, false)
          record = { ...record, ...patch }
        } else assertEquals(request.method, 'GET')
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
