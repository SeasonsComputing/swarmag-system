/**
 * Typed SDK for User operations against the serverless runtime.
 */

import {
  type DeleteResult,
  type ListOptions,
  type ListResult,
  unwrap,
  unwrapList
} from '@api/lib/client-binding.ts'
import type {
  UserCreateInput,
  UserDeleteInput,
  UserUpdateInput
} from '@domain/common-validators.ts'
import type { User } from '@domain/common.ts'
import type { ID } from '@utils'

/**
 * Utility class for User CRUD operations.
 * All methods return domain types directly and throw ApiError on failure.
 */
export class UsersApi {
  /** Base URL for API requests. */
  private static baseUrl = ''

  /**
   * Configure the base URL for all API requests.
   * @param url - The base URL (e.g., "https://api.swarmag.com" or "" for relative).
   */
  static configure(url: string): void {
    UsersApi.baseUrl = url.replace(/\/$/, '')
  }

  /**
   * Create a new user.
   * @param input - User creation data.
   * @returns The created user.
   * @throws ApiError on validation or server failure.
   */
  static async create(input: UserCreateInput): Promise<User> {
    const response = await fetch(`${UsersApi.baseUrl}/api/users/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })

    return unwrap<User>(response)
  }

  /**
   * Get a user by ID.
   * @param id - The user ID.
   * @returns The user.
   * @throws ApiError if not found or on server failure.
   */
  static async get(id: ID): Promise<User> {
    const response = await fetch(
      `${UsersApi.baseUrl}/api/users/get?id=${encodeURIComponent(id)}`,
      { method: 'GET' }
    )

    return unwrap<User>(response)
  }

  /**
   * List users with pagination.
   * @param options - Optional pagination parameters.
   * @returns Paginated list of users.
   * @throws ApiError on server failure.
   */
  static async list(options?: ListOptions): Promise<ListResult<User>> {
    const params = new URLSearchParams()
    if (options?.limit !== undefined) params.set('limit', String(options.limit))
    if (options?.cursor !== undefined) params.set('cursor', String(options.cursor))

    const query = params.toString()
    const url = `${UsersApi.baseUrl}/api/users/list${query ? `?${query}` : ''}`

    const response = await fetch(url, { method: 'GET' })

    return unwrapList<User>(response, 'Failed to list users')
  }

  /**
   * Update an existing user.
   * @param input - User update data including the ID.
   * @returns The updated user.
   * @throws ApiError if not found or on validation/server failure.
   */
  static async update(input: UserUpdateInput): Promise<User> {
    const response = await fetch(`${UsersApi.baseUrl}/api/users/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })

    return unwrap<User>(response)
  }

  /**
   * Soft-delete a user.
   * @param id - The user ID to delete.
   * @returns Deletion metadata with timestamp.
   * @throws ApiError if not found or on server failure.
   */
  static async delete(id: ID): Promise<DeleteResult> {
    const input: UserDeleteInput = { id }
    const response = await fetch(`${UsersApi.baseUrl}/api/users/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })

    return unwrap<DeleteResult>(response)
  }
}
