/**
 * Netlify handler for fetching a customer by id.
 */

import type { Customer } from '@domain/abstractions/customer.ts'
import { isNonEmptyString } from '@domain/validators/common-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { rowToCustomer } from '@serverless-mappings/customers-mapping.ts'

/**
 * Edge function path config
 */
export const config = { path: '/api/customers/get' }

/**
 * Fetch a customer by id when provided via query string.
 * @param req - API request wrapper containing query parameters.
 * @returns API result with the customer payload or an error response.
 */
const handle = async (
  req: ApiRequest<undefined, { id?: string }>
): Promise<ApiResponse> => {
  if (req.method !== 'GET') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const customerId = req.query?.id
  if (!isNonEmptyString(customerId)) {
    return { statusCode: HttpCodes.badRequest, body: { error: 'id is required' } }
  }

  const { data, error } = await Supabase.client()
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single()

  if (error || !data) {
    return { statusCode: HttpCodes.notFound, body: { error: 'Customer not found' } }
  }

  let customer: Customer
  try {
    customer = rowToCustomer(data)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Invalid customer record returned from Supabase', details: (parseError as Error).message }
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: customer } }
}

export default createApiHandler(handle)
