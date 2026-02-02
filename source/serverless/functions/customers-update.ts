/**
 * Netlify handler for updating customers.
 */

import type { Customer } from '@domain/abstractions/customer.ts'
import {
  type CustomerUpdateInput,
  validateCustomerUpdate
} from '@domain/validators/customer-validators.ts'
import {
  type ApiRequest,
  type ApiResponse,
  toInternalError,
  toMethodNotAllowed,
  toNotFound,
  toOk,
  toUnprocessable
} from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { customerToRow, rowToCustomer } from '@serverless-mappings/customers-mapping.ts'
import { when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/customers/update' }

/**
 * Update an existing customer while enforcing allowed fields and validation.
 * @param req - API request wrapper containing the update payload.
 * @returns API result with the updated customer or an error response.
 */
const handle = async (req: ApiRequest<CustomerUpdateInput>): Promise<ApiResponse> => {
  if (req.method !== 'PATCH' && req.method !== 'PUT') return toMethodNotAllowed()

  const validationError = validateCustomerUpdate(req.body)
  if (validationError) return toUnprocessable(validationError)

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase.from('customers').select('*')
    .eq('id', req.body.id).single()

  if (fetchError || !existingRow) return toNotFound('Customer not found')

  let current: Customer
  try {
    current = rowToCustomer(existingRow)
  } catch (parseError) {
    return toInternalError('Invalid customer record returned from Supabase',
      parseError as Error)
  }

  const updated: Customer = {
    ...current,
    name: req.body.name?.trim() ?? current.name,
    status: req.body.status ?? current.status,
    line1: req.body.line1?.trim() ?? current.line1,
    line2: req.body.line2 === null ? undefined : req.body.line2?.trim() ?? current.line2,
    city: req.body.city?.trim() ?? current.city,
    state: req.body.state?.trim() ?? current.state,
    postalCode: req.body.postalCode?.trim() ?? current.postalCode,
    country: req.body.country?.trim() ?? current.country,
    accountManagerId: req.body.accountManagerId === null
      ? undefined
      : req.body.accountManagerId ?? current.accountManagerId,
    primaryContactId: req.body.primaryContactId ?? current.primaryContactId,
    updatedAt: when()
  }

  const { error: updateError } = await supabase.from('customers').update(
    customerToRow(updated)
  ).eq('id', updated.id)

  if (updateError) return toInternalError('Failed to update customer', updateError)

  return toOk(updated)
}

export default createApiHandler(handle)
