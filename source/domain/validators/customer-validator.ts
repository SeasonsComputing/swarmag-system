/**
 * Validators for customer protocol inputs at system boundaries.
 * Returns an error message string on failure, null on success.
 */

import { isId, isNonEmptyString } from '@core-std'
import type {
  CustomerCreateInput,
  CustomerUpdateInput
} from '@domain/protocols/customer-protocol.ts'

/** Validates input for creating a Customer. */
export const validateCustomerCreate = (input: CustomerCreateInput): string | null => {
  if (!isNonEmptyString(input.name)) return 'name is required'
  if (!isNonEmptyString(input.status)) return 'status is required'
  if (!isNonEmptyString(input.line1)) return 'line1 is required'
  if (!isNonEmptyString(input.city)) return 'city is required'
  if (!isNonEmptyString(input.state)) return 'state is required'
  if (!isNonEmptyString(input.postalCode)) return 'postalCode is required'
  if (!isNonEmptyString(input.country)) return 'country is required'
  return null
}

/** Validates input for updating a Customer. */
export const validateCustomerUpdate = (input: CustomerUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name must be a non-empty string'
  }
  if (input.status !== undefined && !isNonEmptyString(input.status)) {
    return 'status must be a non-empty string'
  }
  if (input.line1 !== undefined && !isNonEmptyString(input.line1)) {
    return 'line1 must be a non-empty string'
  }
  if (input.city !== undefined && !isNonEmptyString(input.city)) {
    return 'city must be a non-empty string'
  }
  if (input.state !== undefined && !isNonEmptyString(input.state)) {
    return 'state must be a non-empty string'
  }
  if (input.postalCode !== undefined && !isNonEmptyString(input.postalCode)) {
    return 'postalCode must be a non-empty string'
  }
  if (input.country !== undefined && !isNonEmptyString(input.country)) {
    return 'country must be a non-empty string'
  }
  return null
}
