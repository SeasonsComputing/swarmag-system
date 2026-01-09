/**
 * Unit tests for user CRUD Netlify handlers.
 */

import { assertEquals, assert } from '@std/assert'
import handlerCreate from '@serverless-functions/users-create.ts'
import handlerGet from '@serverless-functions/users-get.ts'
import handlerUpdate from '@serverless-functions/users-update.ts'
import handlerDelete from '@serverless-functions/users-delete.ts'
import { HttpCodes } from '@serverless-lib/api-binding.ts'
import { Supabase } from '@serverless-lib/supabase.ts'
import { runNetlifyHandler } from '@tests-helpers/netlify.ts'

type UsersTable = Record<string, Record<string, unknown>>

const users: UsersTable = {}

const resetTables = () => {
  Object.keys(users).forEach((key) => delete users[key])
}

const buildUserInsert = (payload: Record<string, unknown>) => ({
  ...payload,
  created_at: payload.created_at,
  updated_at: payload.updated_at,
  deleted_at: null,
  payload,
})

const selectBuilder = () => {
  let idFilter: string | null = null
  let filterDeletedNull = false

  const builder = {
    eq: (col: string, value: string) => {
      if (col === 'id') idFilter = value
      return builder
    },
    is: (col: string, value: unknown) => {
      if (col === 'deleted_at') filterDeletedNull = value === null
      return builder
    },
    single: async () => {
      const row = Object.values(users).find((user) => {
        const matchesId = idFilter ? user.id === idFilter : true
        const matchesDeleted =
          filterDeletedNull ? user.deleted_at === null : true
        return matchesId && matchesDeleted
      })

      return row
        ? { data: row, error: null }
        : { data: null, error: new Error('No rows') }
    },
  }

  return builder
}

const updateBuilder = (updates: Record<string, unknown>) => ({
  eq: async (col: string, value: string) => {
    if (col === 'id' && users[value]) {
      users[value] = { ...users[value], ...updates }
      return { error: null }
    }
    return { error: new Error('No rows') }
  },
})

Deno.test('user CRUD handlers', async () => {
  const originalClient = Supabase.client

  Supabase.client = ((() => ({
    from: (table: string) => {
      if (table !== 'users') throw new Error(`Unexpected table ${table}`)

      return {
        insert: async (payload: Record<string, unknown>) => {
          users[payload.id as string] = buildUserInsert(payload)
          return { error: null }
        },
        select: () => selectBuilder(),
        update: (payload: Record<string, unknown>) => updateBuilder(payload),
      }
    },
  })) as unknown as typeof Supabase.client)

  try {
    resetTables()

    const createResponse = await runNetlifyHandler(
      handlerCreate,
      'POST',
      {
        displayName: 'Ada Lovelace',
        primaryEmail: 'ada@example.com',
        phoneNumber: '555-0100',
      }
    )
    assertEquals(createResponse.statusCode, HttpCodes.created)
    const createdUser = (createResponse.body as { data: Record<string, unknown> }).data
    assertEquals(createdUser.displayName, 'Ada Lovelace')
    assert(users[createdUser.id as string])

    const getResponse = await runNetlifyHandler(
      handlerGet,
      'GET',
      undefined,
      { id: createdUser.id }
    )
    assertEquals(getResponse.statusCode, HttpCodes.ok)
    assertEquals((getResponse.body as { data: Record<string, unknown> }).data.id, createdUser.id)

    const updateResponse = await runNetlifyHandler(
      handlerUpdate,
      'PATCH',
      { id: createdUser.id, displayName: 'Ada Byron' }
    )
    assertEquals(updateResponse.statusCode, HttpCodes.ok)
    assertEquals((updateResponse.body as { data: Record<string, unknown> }).data.displayName, 'Ada Byron')

    const deleteResponse = await runNetlifyHandler(
      handlerDelete,
      'DELETE',
      { id: createdUser.id }
    )
    assertEquals(deleteResponse.statusCode, HttpCodes.ok)
    assert((deleteResponse.body as { data: Record<string, unknown> }).data.deletedAt)
    assert(users[createdUser.id as string]?.deleted_at)

    const getAfterDelete = await runNetlifyHandler(
      handlerGet,
      'GET',
      undefined,
      { id: createdUser.id }
    )
    assertEquals(getAfterDelete.statusCode, HttpCodes.notFound)
  } finally {
    Supabase.client = originalClient
  }
})
