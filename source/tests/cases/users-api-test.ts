/**
 * Unit tests for UsersApi abstraction layer.
 */

import { UsersApi } from '@api/client/users-api.ts'
import { ApiError } from '@api/lib/api-client-binding.ts'
import type { User } from '@domain/abstractions/common.ts'
import { assert, assertEquals, assertRejects } from '@std/assert'

/** Mock user data for testing. */
const mockUser: User = {
  id: '019400a1-b2c3-7def-8901-234567890abc',
  displayName: 'Ada Lovelace',
  primaryEmail: 'ada@example.com',
  phoneNumber: '555-0100',
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
const mockFetch = (handler: (url: string, init?: RequestInit) => Response | Promise<Response>) => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = handler as typeof fetch
  return () => {
    globalThis.fetch = originalFetch
  }
}

Deno.test('UsersApi.create returns created user', async () => {
  const cleanup = mockFetch((_url, init) => {
    assertEquals(init?.method, 'POST')
    const body = JSON.parse(init?.body as string)
    assertEquals(body.displayName, 'Ada Lovelace')
    return jsonResponse(201, { data: mockUser })
  })

  try {
    const user = await UsersApi.create({
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

Deno.test('UsersApi.create throws ApiError on validation failure', async () => {
  const cleanup = mockFetch(() => {
    return jsonResponse(422, { error: 'displayName is required' })
  })

  try {
    const error = await assertRejects(
      () => UsersApi.create({ displayName: '', primaryEmail: 'a@b.com', phoneNumber: '555' }),
      ApiError
    ) as ApiError
    assertEquals(error.status, 422)
    assertEquals(error.message, 'displayName is required')
  } finally {
    cleanup()
  }
})

Deno.test('UsersApi.get returns user by ID', async () => {
  const cleanup = mockFetch(url => {
    assert(url.includes(`id=${mockUser.id}`))
    return jsonResponse(200, { data: mockUser })
  })

  try {
    const user = await UsersApi.get(mockUser.id)
    assertEquals(user.id, mockUser.id)
    assertEquals(user.primaryEmail, 'ada@example.com')
  } finally {
    cleanup()
  }
})

Deno.test('UsersApi.get throws ApiError when not found', async () => {
  const cleanup = mockFetch(() => {
    return jsonResponse(404, { error: 'User not found' })
  })

  try {
    const error = await assertRejects(
      () => UsersApi.get('nonexistent-id'),
      ApiError
    ) as ApiError
    assertEquals(error.status, 404)
    assertEquals(error.message, 'User not found')
  } finally {
    cleanup()
  }
})

Deno.test('UsersApi.list returns paginated users', async () => {
  const cleanup = mockFetch(url => {
    assert(url.includes('limit=10'))
    assert(url.includes('cursor=0'))
    return jsonResponse(200, {
      data: [mockUser],
      cursor: 1,
      hasMore: false
    })
  })

  try {
    const result = await UsersApi.list({ limit: 10, cursor: 0 })
    assertEquals(result.data.length, 1)
    assertEquals(result.data[0].id, mockUser.id)
    assertEquals(result.cursor, 1)
    assertEquals(result.hasMore, false)
  } finally {
    cleanup()
  }
})

Deno.test('UsersApi.list works without options', async () => {
  const cleanup = mockFetch(url => {
    assert(!url.includes('limit='))
    assert(!url.includes('cursor='))
    return jsonResponse(200, { data: [], cursor: 0, hasMore: false })
  })

  try {
    const result = await UsersApi.list()
    assertEquals(result.data.length, 0)
  } finally {
    cleanup()
  }
})

Deno.test('UsersApi.update returns updated user', async () => {
  const updatedUser = { ...mockUser, displayName: 'Ada Byron' }

  const cleanup = mockFetch((_url, init) => {
    assertEquals(init?.method, 'PATCH')
    const body = JSON.parse(init?.body as string)
    assertEquals(body.id, mockUser.id)
    assertEquals(body.displayName, 'Ada Byron')
    return jsonResponse(200, { data: updatedUser })
  })

  try {
    const user = await UsersApi.update({ id: mockUser.id, displayName: 'Ada Byron' })
    assertEquals(user.displayName, 'Ada Byron')
  } finally {
    cleanup()
  }
})

Deno.test('UsersApi.update throws ApiError when not found', async () => {
  const cleanup = mockFetch(() => {
    return jsonResponse(404, { error: 'User not found' })
  })

  try {
    const error = await assertRejects(
      () => UsersApi.update({ id: 'nonexistent', displayName: 'Test' }),
      ApiError
    ) as ApiError
    assertEquals(error.status, 404)
  } finally {
    cleanup()
  }
})

Deno.test('UsersApi.delete returns deletion result', async () => {
  const deletedAt = '2024-01-16T12:00:00.000Z'

  const cleanup = mockFetch((_url, init) => {
    assertEquals(init?.method, 'DELETE')
    const body = JSON.parse(init?.body as string)
    assertEquals(body.id, mockUser.id)
    return jsonResponse(200, { data: { id: mockUser.id, deletedAt } })
  })

  try {
    const result = await UsersApi.delete(mockUser.id)
    assertEquals(result.id, mockUser.id)
    assertEquals(result.deletedAt, deletedAt)
  } finally {
    cleanup()
  }
})

Deno.test('UsersApi.delete throws ApiError when not found', async () => {
  const cleanup = mockFetch(() => {
    return jsonResponse(404, { error: 'User not found' })
  })

  try {
    const error = await assertRejects(
      () => UsersApi.delete('nonexistent'),
      ApiError
    ) as ApiError
    assertEquals(error.status, 404)
  } finally {
    cleanup()
  }
})

Deno.test('UsersApi handles server errors with details', async () => {
  const cleanup = mockFetch(() => {
    return jsonResponse(500, { error: 'Database connection failed', details: 'Connection timeout' })
  })

  try {
    const error = await assertRejects(
      () => UsersApi.get(mockUser.id),
      ApiError
    ) as ApiError
    assertEquals(error.status, 500)
    assertEquals(error.message, 'Database connection failed')
    assertEquals(error.details, 'Connection timeout')
  } finally {
    cleanup()
  }
})
