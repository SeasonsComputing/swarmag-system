/**
 * Domain-level invariant validators for customers.
 */

import type { Contact, Customer } from '@domain/abstractions/customer.ts'
import { isNonEmptyString } from '@domain/validators/common-validators.ts'

/**
 * Type guard for customer status.
 * @param value - Potential status value.
 * @returns True when the value matches a known status.
 */
export const isCustomerStatus = (value: unknown): value is Customer['status'] =>
  value === 'active' || value === 'inactive' || value === 'prospect'

/** Input type for primary contact in customer creation. */
export interface PrimaryContactInput {
  name: string
  email?: string
  phone?: string
  preferredChannel?: Contact['preferredChannel']
}

/** Input type for creating a customer. */
export interface CustomerCreateInput {
  name: string
  status?: Customer['status']
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  accountManagerId?: string
  primaryContact: PrimaryContactInput
}

/** Input type for updating a customer. */
export interface CustomerUpdateInput {
  id: string
  name?: string
  status?: Customer['status']
  line1?: string
  line2?: string | null
  city?: string
  state?: string
  postalCode?: string
  country?: string
  accountManagerId?: string | null
  primaryContactId?: string
}

/**
 * Validate customer creation input.
 * @param input - Customer creation input to validate.
 * @returns Error message or null if valid.
 */
export const validateCustomerCreate = (input?: CustomerCreateInput | null): string | null => {
  if (!input) return 'Request body is required'
  if (!isNonEmptyString(input.name)) return 'name is required'
  if (input.status !== undefined && !isCustomerStatus(input.status)) {
    return 'status must be active, inactive, or prospect'
  }
  if (!isNonEmptyString(input.line1)) return 'line1 is required'
  if (!isNonEmptyString(input.city)) return 'city is required'
  if (!isNonEmptyString(input.state)) return 'state is required'
  if (!isNonEmptyString(input.postalCode)) return 'postalCode is required'
  if (!isNonEmptyString(input.country)) return 'country is required'
  if (!input.primaryContact) return 'primaryContact is required'
  if (!isNonEmptyString(input.primaryContact.name)) return 'primaryContact.name is required'
  return null
}

/**
 * Validate customer update input.
 * @param input - Customer update input to validate.
 * @returns Error message or null if valid.
 */
export const validateCustomerUpdate = (input?: CustomerUpdateInput | null): string | null => {
  if (!input) return 'Request body is required'
  if (!isNonEmptyString(input.id)) return 'id is required'
  if (input.name !== undefined && !isNonEmptyString(input.name)) return 'name cannot be empty'
  if (input.status !== undefined && !isCustomerStatus(input.status)) {
    return 'status must be active, inactive, or prospect'
  }
  if (input.line1 !== undefined && !isNonEmptyString(input.line1)) return 'line1 cannot be empty'
  if (input.city !== undefined && !isNonEmptyString(input.city)) return 'city cannot be empty'
  if (input.state !== undefined && !isNonEmptyString(input.state)) return 'state cannot be empty'
  if (input.postalCode !== undefined && !isNonEmptyString(input.postalCode)) return 'postalCode cannot be empty'
  if (input.country !== undefined && !isNonEmptyString(input.country)) return 'country cannot be empty'
  return null
}
