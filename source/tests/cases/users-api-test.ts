/**
 * Unit tests for UsersApi abstraction layer.
 */

import { ApiError } from '@core/api/api-contract.ts'
import type { User } from '@domain/abstractions/user.ts'
import { api } from '@ux-api'
import { assert, assertEquals, assertRejects } from 'jsr:@std/assert@1'

/** Mock user data for testing. */
const mockUser: User = {
  id: '019400a1-b2c3-7def-8901-234567890abc',
  displayName: 'Ada Lovelace',
  primaryEmail: 'ada@example.com',
  phoneNumber: '555-0100',
  roles: [],
  status: 'active',
  createdAt: '2024-01-15T10:30:00.000Z',
  updatedAt: '2024-01-15T10:30:00.000Z'
}

/** Create a mock Response with JSON body. */
const jsonResponse = (status: number, body: unknown): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

/** Install a fetch mock and return cleanup function. */
const mockFetch = (
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>
) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = handler as typeof fetch
  return () => {
    globalThis.fetch = originalFetch
  }
}

Deno.test('api.Users.create returns created user', async () => {
  const cleanup = mockFetch((_url, init) => {
    assertEquals(init?.method, 'POST')
    const body = JSON.parse(init?.body as string)
    assertEquals(body.displayName, 'Ada Lovelace')
    return jsonResponse(201, { data: mockUser })
  })

  try {
    const user = await api.Users.create({
      displayName: 'Ada Lovelace',
      primaryEmail: 'ada@example.com',
      phoneNumber: '555-0100'
    })

    assertEquals(user.id, mockUser.id)
    assertEquals(user.displayName, 'Ada Lovelace')
  } finally {
    cleanup()
  }
})

Deno.test('api.Users.create throws ApiError on validation failure', async () => {
  const cleanup = mockFetch(() => {
    return jsonResponse(422, { error: 'displayName is required' })
  })

  try {
    const error = await assertRejects(
      () => api.Users.create({ displayName: '', primaryEmail: 'a@b.com', phoneNumber: '555' }),
      ApiError
    ) as ApiError
    assertEquals(error.status, 422)
    assertEquals(error.message, 'displayName is required')
  } finally {
    cleanup()
  }
})

Deno.test('api.Users.get returns user by Id', async () => {
  const cleanup = mockFetch(url => {
    assert(url.includes(`id=${mockUser.id}`))
    return jsonResponse(200, { data: mockUser })
  })

  try {
    const user = await api.Users.get(mockUser.id)
    assertEquals(user.id, mockUser.id)
    assertEquals(user.primaryEmail, 'ada@example.com')
  } finally {
    cleanup()
  }
})

Deno.test('api.Users.get throws ApiError when not found', async () => {
  const cleanup = mockFetch(() => {
    return jsonResponse(404, { error: 'User not found' })
  })

  try {
    const error = await assertRejects(() => api.Users.get('nonexistent-id'),
      ApiError) as ApiError
    assertEquals(error.status, 404)
    assertEquals(error.message, 'User not found')
  } finally {
    cleanup()
  }
})

Deno.test('api.Users.list returns paginated users', async () => {
  const cleanup = mockFetch((_url, init) => {
    assertEquals(init?.method, 'POST')
    const body = JSON.parse(init?.body as string)
    assertEquals(body.limit, 10)
    assertEquals(body.cursor, 0)
    return jsonResponse(200, { data: [mockUser], cursor: 1, hasMore: false })
  })

  try {
    const result = await api.Users.list({ limit: 10, cursor: 0 })
    assertEquals(result.data.length, 1)
    assertEquals(result.data[0].id, mockUser.id)
    assertEquals(result.cursor, 1)
    assertEquals(result.hasMore, false)
  } finally {
    cleanup()
  }
})

Deno.test('api.Users.list works without options', async () => {
  const cleanup = mockFetch((_url, init) => {
    assertEquals(init?.method, 'POST')
    const body = JSON.parse(init?.body as string)
    assertEquals(body, {})
    return jsonResponse(200, { data: [], cursor: 0, hasMore: false })
  })

  try {
    const result = await api.Users.list()
    assertEquals(result.data.length, 0)
  } finally {
    cleanup()
  }
})

Deno.test('api.Users.update returns updated user', async () => {
  const updatedUser = { ...mockUser, displayName: 'Ada Byron' }

  const cleanup = mockFetch((_url, init) => {
    assertEquals(init?.method, 'PUT')
    const body = JSON.parse(init?.body as string)
    assertEquals(body.id, mockUser.id)
    assertEquals(body.displayName, 'Ada Byron')
    return jsonResponse(200, { data: updatedUser })
  })

  try {
    const user = await api.Users.update({ id: mockUser.id, displayName: 'Ada Byron' })
    assertEquals(user.displayName, 'Ada Byron')
  } finally {
    cleanup()
  }
})

Deno.test('api.Users.update throws ApiError when not found', async () => {
  const cleanup = mockFetch(() => {
    return jsonResponse(404, { error: 'User not found' })
  })

  try {
    const error = await assertRejects(
      () => api.Users.update({ id: 'nonexistent', displayName: 'Test' }),
      ApiError
    ) as ApiError
    assertEquals(error.status, 404)
  } finally {
    cleanup()
  }
})

Deno.test('api.Users.delete returns deletion result', async () => {
  const deletedAt = '2024-01-16T12:00:00.000Z'

  const cleanup = mockFetch((_url, init) => {
    assertEquals(init?.method, 'DELETE')
    const body = JSON.parse(init?.body as string)
    assertEquals(body.id, mockUser.id)
    return jsonResponse(200, { data: { id: mockUser.id, deletedAt } })
  })

  try {
    const result = await api.Users.delete(mockUser.id)
    assertEquals(result.id, mockUser.id)
    assertEquals(result.deletedAt, deletedAt)
  } finally {
    cleanup()
  }
})

Deno.test('api.Users.delete throws ApiError when not found', async () => {
  const cleanup = mockFetch(() => {
    return jsonResponse(404, { error: 'User not found' })
  })

  try {
    const error = await assertRejects(() => api.Users.delete('nonexistent'),
      ApiError) as ApiError
    assertEquals(error.status, 404)
  } finally {
    cleanup()
  }
})

Deno.test('UsersApi handles server errors with details', async () => {
  const cleanup = mockFetch(() => {
    return jsonResponse(500, {
      error: 'Database connection failed',
      details: 'Connection timeout'
    })
  })

  try {
    const error = await assertRejects(() => api.Users.get(mockUser.id), ApiError) as ApiError
    assertEquals(error.status, 500)
    assertEquals(error.message, 'Database connection failed')
    assertEquals(error.details, 'Connection timeout')
  } finally {
    cleanup()
  }
})
