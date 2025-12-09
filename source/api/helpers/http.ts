import type { HandlerResponse } from '@netlify/functions'

export type Headers = Record<string, string>

export const jsonResponse = (
  statusCode: number,
  body: unknown,
  headers: Headers = {}): HandlerResponse =>
({
  statusCode,
  headers: {
    'content-type': 'application/json',
    ...headers,
  },
  body: JSON.stringify(body),
})

export const parseJsonBody = <T,>(body: string | null): T => {
  if (!body) throw new Error('Empty request body')
  try {
    return JSON.parse(body) as T
  } catch (error) {
    throw new Error('Invalid JSON body')
  }
}
