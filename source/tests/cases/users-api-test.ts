/**
 * CRUD contract tests for Users API.
 */

import { ApiError } from '@core/api/api-contract.ts'
import { assert, assertEquals } from '@std/assert'
import '@tests/config/test-config.ts'
import type { UserCreate } from '@domain/protocols/user-protocol.ts'
import { api } from '@ux/api'

Deno.test('users API supports full CRUD lifecycle with soft delete', async () => {
  if (!api.Users.list) throw new Error('Users API list contract is required for this test')

  const nonce = `${Date.now()}`
  const createInput: UserCreate = {
    roles: ['operations'],
    displayName: `Ops User ${nonce}`,
    primaryEmail: `ops-${nonce}@swarmag.example`,
    phoneNumber: `+1-325-555-${nonce.slice(-4)}`,
    avatarUrl: `https://example.com/avatars/ops-${nonce}.png`,
    status: 'active'
  }

  const created = await api.Users.create(createInput)
  assert(created.id)
  assertEquals(created.displayName, createInput.displayName)
  assertEquals(created.primaryEmail, createInput.primaryEmail)
  assertEquals(created.status, 'active')

  const fetched = await api.Users.get(created.id)
  assertEquals(fetched.id, created.id)
  assertEquals(fetched.primaryEmail, createInput.primaryEmail)

  const updated = await api.Users.update({
    id: created.id,
    displayName: `Updated Ops User ${nonce}`,
    status: 'inactive'
  })
  assertEquals(updated.id, created.id)
  assertEquals(updated.displayName, `Updated Ops User ${nonce}`)
  assertEquals(updated.status, 'inactive')

  const deleted = await api.Users.delete(created.id)
  assertEquals(deleted.id, created.id)
  assert(deleted.deletedAt.length > 0)

  let deletedGetError: unknown = null
  try {
    await api.Users.get(created.id)
  } catch (error) {
    deletedGetError = error
  }
  assert(deletedGetError instanceof ApiError)
  assertEquals(deletedGetError.status, 404)

  const listed = await api.Users.list({ limit: 100, cursor: 0 })
  assertEquals(listed.data.some(user => user.id === created.id), false)
})
