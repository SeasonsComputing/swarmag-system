/**
 * Netlify handler for creating customers.
 */

import type { Contact, Customer } from '@domain/abstractions/customer.ts'
import { type CustomerCreateInput, validateCustomerCreate } from '@domain/validators/customer-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { customerToRow } from '@serverless-mappings/customers-mapping.ts'
import { id, when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/customers/create' }

/**
 * Create a new customer record when the request payload is valid.
 * @param req - Netlify-friendly API request wrapper containing the body.
 * @returns API result with created customer or an error response.
 */
const handle = async (
  req: ApiRequest<CustomerCreateInput>
): Promise<ApiResponse> => {
  if (req.method !== 'POST') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const validationError = validateCustomerCreate(req.body)
  if (validationError) {
    return { statusCode: HttpCodes.unprocessableEntity, body: { error: validationError } }
  }

  const now = when()
  const customerId = id()
  const primaryContactId = id()

  const primaryContact: Contact = {
    id: primaryContactId,
    customerId,
    name: req.body.primaryContact.name.trim(),
    email: req.body.primaryContact.email?.trim(),
    phone: req.body.primaryContact.phone?.trim(),
    preferredChannel: req.body.primaryContact.preferredChannel,
    notes: undefined,
    createdAt: now,
    updatedAt: now
  }

  const customer: Customer = {
    id: customerId,
    name: req.body.name.trim(),
    status: req.body.status ?? 'prospect',
    line1: req.body.line1.trim(),
    line2: req.body.line2?.trim(),
    city: req.body.city.trim(),
    state: req.body.state.trim(),
    postalCode: req.body.postalCode.trim(),
    country: req.body.country.trim(),
    accountManagerId: req.body.accountManagerId,
    primaryContactId,
    sites: [],
    contacts: [primaryContact],
    notes: undefined,
    createdAt: now,
    updatedAt: now
  }

  const { error } = await Supabase.client()
    .from('customers')
    .insert(customerToRow(customer))

  if (error) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Failed to create customer', details: error.message }
    }
  }

  return { statusCode: HttpCodes.created, body: { data: customer } }
}

export default createApiHandler(handle)
