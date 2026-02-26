/**
 * Customer protocol validators.
 */

import { isCompositionMany, isCompositionPositive, isId, isNonEmptyString } from '@core-std'
import type { Dictionary } from '@core-std'
import type { Contact } from '@domain/abstractions/customer.ts'
import type { Location } from '@domain/abstractions/common.ts'
import type { CustomerCreate, CustomerSiteCreate, CustomerSiteUpdate, CustomerUpdate } from '@domain/protocols/customer-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates CustomerSiteCreate; returns error message or null. */
export const validateCustomerSiteCreate = (input: CustomerSiteCreate): string | null => {
  if (!isId(input.customerId)) return 'customerId must be a valid Id'
  if (!isNonEmptyString(input.label)) return 'label must be a non-empty string'
  if (!isLocation(input.location)) return 'location must be a valid Location'
  return null
}

/** Validates CustomerSiteUpdate; returns error message or null. */
export const validateCustomerSiteUpdate = (input: CustomerSiteUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.label !== undefined && !isNonEmptyString(input.label)) return 'label must be a non-empty string'
  if (input.location !== undefined && !isLocation(input.location)) return 'location must be a valid Location'
  return null
}

/** Validates CustomerCreate; returns error message or null. */
export const validateCustomerCreate = (input: CustomerCreate): string | null => {
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (!isNonEmptyString(input.status)) return 'status must be a non-empty string'
  if (!isNonEmptyString(input.line1)) return 'line1 must be a non-empty string'
  if (!isNonEmptyString(input.city)) return 'city must be a non-empty string'
  if (!isNonEmptyString(input.state)) return 'state must be a non-empty string'
  if (!isNonEmptyString(input.postalCode)) return 'postalCode must be a non-empty string'
  if (!isNonEmptyString(input.country)) return 'country must be a non-empty string'
  if (!isCompositionPositive(input.contacts, isContact)) return 'contacts must be a non-empty array of valid contacts'
  return null
}

/** Validates CustomerUpdate; returns error message or null. */
export const validateCustomerUpdate = (input: CustomerUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'
  if (input.name !== undefined && !isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (input.status !== undefined && !isNonEmptyString(input.status)) return 'status must be a non-empty string'
  if (input.line1 !== undefined && !isNonEmptyString(input.line1)) return 'line1 must be a non-empty string'
  if (input.city !== undefined && !isNonEmptyString(input.city)) return 'city must be a non-empty string'
  if (input.state !== undefined && !isNonEmptyString(input.state)) return 'state must be a non-empty string'
  if (input.postalCode !== undefined && !isNonEmptyString(input.postalCode)) return 'postalCode must be a non-empty string'
  if (input.country !== undefined && !isNonEmptyString(input.country)) return 'country must be a non-empty string'
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
  return isNonEmptyString(c.name as unknown)
    && typeof c.isPrimary === 'boolean'
    && isCompositionMany(c.notes, (n): n is unknown => typeof n === 'object' && n !== null)
}
