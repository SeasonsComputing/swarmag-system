/**
 * Netlify handler for deleting customers.
 */

import { isNonEmptyString } from '@domain/validators/common-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/customers/delete' }

/**
 * Delete a customer by id (hard delete).
 * @param req - API request wrapper containing the customer id to delete.
 * @returns API result with deletion metadata or an error response.
 */
const handle = async (
  req: ApiRequest<{ id?: string }>
): Promise<ApiResponse> => {
  if (req.method !== 'DELETE') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const customerId = req.body?.id
  if (!isNonEmptyString(customerId)) {
    return { statusCode: HttpCodes.unprocessableEntity, body: { error: 'id is required' } }
  }

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .single()

  if (fetchError || !existingRow) {
    return { statusCode: HttpCodes.notFound, body: { error: 'Customer not found' } }
  }

  const { error: deleteError } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId)

  if (deleteError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Failed to delete customer', details: deleteError.message }
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: { id: customerId, deletedAt: when() } } }
}

export default createApiHandler(handle)
