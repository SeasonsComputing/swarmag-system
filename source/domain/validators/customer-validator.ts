/**
 * Customer protocol validators.
 */

import {
  isCompositionMany,
  isCompositionOne,
  isCompositionPositive,
  isId,
  isNonEmptyString
} from '@core-std'
import type { Dictionary } from '@core-std'
import type { Location, Note } from '@domain/abstractions/common.ts'
import type { Contact, CustomerSite } from '@domain/abstractions/customer.ts'
import type {
  CustomerCreate,
  CustomerUpdate
} from '@domain/protocols/customer-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates CustomerCreate; returns error message or null. */
export const validateCustomerCreate = (input: CustomerCreate): string | null => {
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (!isNonEmptyString(input.status)) return 'status must be a non-empty string'
  if (!isNonEmptyString(input.line1)) return 'line1 must be a non-empty string'
  if (!isNonEmptyString(input.city)) return 'city must be a non-empty string'
  if (!isNonEmptyString(input.state)) return 'state must be a non-empty string'
  if (!isNonEmptyString(input.postalCode)) return 'postalCode must be a non-empty string'
  if (!isNonEmptyString(input.country)) return 'country must be a non-empty string'
  if (!isCompositionPositive(input.contacts, isContact)) {
    return 'contacts must be a non-empty array of valid contacts'
  }
  if (!isCompositionMany(input.sites, isCustomerSite)) {
    return 'sites must be an array of valid customer sites'
  }
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid notes'
  }
  return null
}

/** Validates CustomerUpdate; returns error message or null. */
export const validateCustomerUpdate = (input: CustomerUpdate): string | null => {
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
  if (input.sites !== undefined && !isCompositionMany(input.sites, isCustomerSite)) {
    return 'sites must be an array of valid customer sites'
  }
  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid notes'
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
  return isNonEmptyString(c.name as unknown)
    && typeof c.isPrimary === 'boolean'
    && isCompositionMany(c.notes,
      (n): n is unknown => typeof n === 'object' && n !== null)
}

const isNote = (v: unknown): v is Note => typeof v === 'object' && v !== null

const isCustomerSite = (v: unknown): v is CustomerSite => {
  if (!v || typeof v !== 'object') return false
  const s = v as Dictionary
  return isId(s.customerId as unknown)
    && isNonEmptyString(s.label as unknown)
    && isCompositionOne(s.location, isLocation)
    && isCompositionMany(s.notes, isNote)
}
