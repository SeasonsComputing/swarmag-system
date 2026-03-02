/**
 * Validators for the customer domain area: Customer create and update.
 */

import type { Dictionary } from '@core-std'
import {
  isCompositionMany,
  isCompositionOne,
  isCompositionPositive,
  isId,
  isNonEmptyString,
  isWhen
} from '@core-std'
import type { ContactChannel, CustomerStatus } from '@domain/abstractions/customer.ts'
import { CONTACT_CHANNELS, CUSTOMER_STATUSES } from '@domain/abstractions/customer.ts'
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
  if (!isCustomerStatus(input.status)) return 'status must be a valid CustomerStatus'
  if (!isNonEmptyString(input.line1)) return 'line1 must be a non-empty string'
  if (!isNonEmptyString(input.city)) return 'city must be a non-empty string'
  if (!isNonEmptyString(input.state)) return 'state must be a non-empty string'
  if (!isNonEmptyString(input.postalCode)) return 'postalCode must be a non-empty string'
  if (!isNonEmptyString(input.country)) return 'country must be a non-empty string'
  if (input.accountManagerId !== undefined && !isId(input.accountManagerId)) {
    return 'accountManagerId must be a valid UUID'
  }
  if (!isCompositionMany(input.sites, isCustomerSite)) {
    return 'sites must be an array of valid CustomerSite values'
  }
  if (!isCompositionPositive(input.contacts, isContact)) {
    return 'contacts must be a non-empty array of valid Contact values'
  }
  if (!isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

/** Validates CustomerUpdate; returns error message or null. */
export const validateCustomerUpdate = (input: CustomerUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid UUID'
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name must be a non-empty string'
  }
  if (input.status !== undefined && !isCustomerStatus(input.status)) {
    return 'status must be a valid CustomerStatus'
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
    return 'accountManagerId must be a valid UUID'
  }
  if (input.sites !== undefined && !isCompositionMany(input.sites, isCustomerSite)) {
    return 'sites must be an array of valid CustomerSite values'
  }
  if (input.contacts !== undefined && !isCompositionPositive(input.contacts, isContact)) {
    return 'contacts must be a non-empty array of valid Contact values'
  }
  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values'
  }
  return null
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATOR GUARDS
// ────────────────────────────────────────────────────────────────────────────

const isCustomerStatus = (v: unknown): v is CustomerStatus =>
  typeof v === 'string' && (CUSTOMER_STATUSES as readonly string[]).includes(v)

const isContactChannel = (v: unknown): v is ContactChannel =>
  typeof v === 'string' && (CONTACT_CHANNELS as readonly string[]).includes(v)

const isNote = (v: unknown): v is Dictionary => {
  const d = v as Dictionary
  return isNonEmptyString(d.content) && isWhen(d.createdAt)
    && Array.isArray(d.attachments)
}

const isLocation = (v: unknown): v is Dictionary => {
  const d = v as Dictionary
  return typeof d.latitude === 'number' && typeof d.longitude === 'number'
}

const isContact = (v: unknown): v is Dictionary => {
  const d = v as Dictionary
  return isNonEmptyString(d.name)
    && typeof d.isPrimary === 'boolean'
    && (d.preferredChannel === undefined || isContactChannel(d.preferredChannel))
    && isCompositionMany(d.notes, isNote)
}

const isCustomerSite = (v: unknown): v is Dictionary => {
  const d = v as Dictionary
  return isId(d.customerId)
    && isCompositionOne(d.location, isLocation)
    && isNonEmptyString(d.label)
    && isCompositionMany(d.notes, isNote)
}
