import { beforeEach, describe, expect, it, vi } from 'vitest'
import handlerCreate from '@core/api/user-create'
import handlerGet from '@core/api/user-get'
import handlerUpdate from '@core/api/user-update'
import handlerDelete from '@core/api/user-delete'
import { HttpCodes } from '@core/platform/netlify'
import { runNetlifyHandler } from './helpers/netlify'

type UsersTable = Record<string, Record<string, any>>

const { users, fromMock, clientMock } = vi.hoisted(() => {
  const users: UsersTable = {}
  const fromMock = vi.fn()
  const clientMock = vi.fn(() => ({ from: fromMock }))
  return { users, fromMock, clientMock }
})

vi.mock('@core/platform/supabase', () => ({
  Supabase: {
    client: clientMock,
  },
}))

const resetTables = () => {
  Object.keys(users).forEach((key) => delete users[key])
}

const buildUserInsert = (payload: Record<string, any>) => ({
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

const updateBuilder = (updates: Record<string, any>) => ({
  eq: async (col: string, value: string) => {
    if (col === 'id' && users[value]) {
      users[value] = { ...users[value], ...updates }
      return { error: null }
    }
    return { error: new Error('No rows') }
  },
})

beforeEach(() => {
  resetTables()
  fromMock.mockImplementation((table: string) => {
    if (table !== 'users') throw new Error(`Unexpected table ${table}`)

    return {
      insert: async (payload: any) => {
        users[payload.id] = buildUserInsert(payload)
        return { error: null }
      },
      select: () => selectBuilder(),
      update: (payload: any) => updateBuilder(payload),
    }
  })
})

describe('user CRUD handlers', () => {
  it('creates, reads, updates, and soft-deletes a user', async () => {
    const createResponse = await runNetlifyHandler(
      handlerCreate,
      'POST',
      {
        displayName: 'Ada Lovelace',
        primaryEmail: 'ada@example.com',
        phoneNumber: '555-0100',
      }
    )
    expect(createResponse.statusCode).toBe(HttpCodes.created)
    const createdUser = (createResponse.body as any).data
    expect(createdUser.displayName).toBe('Ada Lovelace')
    expect(users[createdUser.id]).toBeDefined()

    const getResponse = await runNetlifyHandler(
      handlerGet,
      'GET',
      undefined,
      { id: createdUser.id }
    )
    expect(getResponse.statusCode).toBe(HttpCodes.ok)
    expect((getResponse.body as any).data.id).toBe(createdUser.id)

    const updateResponse = await runNetlifyHandler(
      handlerUpdate,
      'PATCH',
      { id: createdUser.id, displayName: 'Ada Byron' }
    )
    expect(updateResponse.statusCode).toBe(HttpCodes.ok)
    expect((updateResponse.body as any).data.displayName).toBe('Ada Byron')

    const deleteResponse = await runNetlifyHandler(
      handlerDelete,
      'DELETE',
      { id: createdUser.id }
    )
    expect(deleteResponse.statusCode).toBe(HttpCodes.ok)
    expect((deleteResponse.body as any).data.deletedAt).toBeDefined()
    expect(users[createdUser.id].deleted_at).not.toBeNull()

    const getAfterDelete = await runNetlifyHandler(
      handlerGet,
      'GET',
      undefined,
      { id: createdUser.id }
    )
    expect(getAfterDelete.statusCode).toBe(HttpCodes.notFound)
  })
})
