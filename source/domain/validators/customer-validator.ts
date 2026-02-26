/**
 * Customer protocol validator
 */

import { type Dictionary, isCompositionPositive, isId, isNonEmptyString } from '@core-std'
import type { Location } from '@domain/abstractions/common.ts'
import type { Contact } from '@domain/abstractions/customer.ts'
import type {
  CustomerCreateInput,
  CustomerSiteCreateInput,
  CustomerSiteUpdateInput,
  CustomerUpdateInput
} from '@domain/protocols/customer-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates CustomerCreateInput; returns error message or null. */
export const validateCustomerCreate = (input: CustomerCreateInput): string | null => {
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (!isNonEmptyString(input.line1)) return 'line1 must be a non-empty string'
  if (!isNonEmptyString(input.city)) return 'city must be a non-empty string'
  if (!isNonEmptyString(input.state)) return 'state must be a non-empty string'
  if (!isNonEmptyString(input.postalCode)) return 'postalCode must be a non-empty string'
  if (!isNonEmptyString(input.country)) return 'country must be a non-empty string'
  if (!isCompositionPositive(input.contacts, isContact)) {
    return 'contacts must be a non-empty array of valid contacts'
  }
  return null
}

/** Validates CustomerUpdateInput; returns error message or null. */
export const validateCustomerUpdate = (input: CustomerUpdateInput): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name must be a non-empty string'
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
  if (input.accountManagerId !== undefined && !isId(input.accountManagerId)) {
    return 'accountManagerId must be a valid Id'
  }
  return null
}

/** Validates CustomerSiteCreateInput; returns error message or null. */
export const validateCustomerSiteCreate = (
  input: CustomerSiteCreateInput
): string | null => {
  if (!isId(input.customerId)) return 'customerId must be a valid Id'
  if (!isNonEmptyString(input.label)) return 'label must be a non-empty string'
  if (!isLocation(input.location)) return 'location must be a valid Location'
  return null
}

/** Validates CustomerSiteUpdateInput; returns error message or null. */
export const validateCustomerSiteUpdate = (
  input: CustomerSiteUpdateInput
): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.label !== undefined && !isNonEmptyString(input.label)) {
    return 'label must be a non-empty string'
  }
  if (input.location !== undefined && !isLocation(input.location)) {
    return 'location must be a valid Location'
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR DECOMPOSITION
// ────────────────────────────────────────────────────────────────────────────

const isLocation = (v: unknown): v is Location => {
  if (!v || typeof v !== 'object') return false
  const l = v as Dictionary
  return typeof l.latitude === 'number' && typeof l.longitude === 'number'
}

const isContact = (v: unknown): v is Contact => {
  if (!v || typeof v !== 'object') return false
  const c = v as Dictionary
  return isNonEmptyString(c.name as unknown) && typeof c.isPrimary === 'boolean'
}
