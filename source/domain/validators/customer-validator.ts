/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Customer protocol validator                                                ║
║ Boundary validation for customer protocol payloads.                        ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for customer topic abstractions.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
validateCustomerCreate(input)
  Validate CustomerCreate payloads.

validateCustomerUpdate(input)
  Validate CustomerUpdate payloads.
*/

import {
  type Dictionary,
  isCompositionMany,
  isCompositionOne,
  isCompositionPositive,
  isId,
  isNonEmptyString,
  isPositiveNumber,
  isWhen
} from '@core-std'
import {
  type Contact,
  CONTACT_PREFERRED_CHANNELS,
  type ContactPreferredChannel,
  CUSTOMER_STATUSES,
  type CustomerSite,
  type CustomerStatus
} from '@domain/abstractions/customer.ts'
import type {
  CustomerCreate,
  CustomerUpdate
} from '@domain/protocols/customer-protocol.ts'
import { isNote } from '@domain/validators/common-validator.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validates CustomerCreate; returns error message or null. */
export const validateCustomerCreate = (input: CustomerCreate): string | null => {
  if (input.accountManagerId !== undefined && !isId(input.accountManagerId)) {
    return 'accountManagerId must be a valid Id when provided'
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
  if (!isNonEmptyString(input.name)) return 'name must be a non-empty string'
  if (!CUSTOMER_STATUSES.includes(input.status as CustomerStatus)) {
    return 'status must be a valid CustomerStatus'
  }
  if (!isNonEmptyString(input.line1)) return 'line1 must be a non-empty string'
  if (input.line2 !== undefined && !isNonEmptyString(input.line2)) {
    return 'line2 must be a non-empty string when provided'
  }
  if (!isNonEmptyString(input.city)) return 'city must be a non-empty string'
  if (!isNonEmptyString(input.state)) return 'state must be a non-empty string'
  if (!isNonEmptyString(input.postalCode)) return 'postalCode must be a non-empty string'
  if (!isNonEmptyString(input.country)) return 'country must be a non-empty string'

  return null
}

/** Validates CustomerUpdate; returns error message or null. */
export const validateCustomerUpdate = (input: CustomerUpdate): string | null => {
  if (!isId(input.id)) return 'id must be a valid Id'

  if (input.accountManagerId !== undefined && !isId(input.accountManagerId)) {
    return 'accountManagerId must be a valid Id when provided'
  }
  if (input.sites !== undefined && !isCompositionMany(input.sites, isCustomerSite)) {
    return 'sites must be an array of valid CustomerSite values when provided'
  }
  if (input.contacts !== undefined && !isCompositionPositive(input.contacts, isContact)) {
    return 'contacts must be a non-empty array of valid Contact values when provided'
  }
  if (input.notes !== undefined && !isCompositionMany(input.notes, isNote)) {
    return 'notes must be an array of valid Note values when provided'
  }
  if (input.name !== undefined && !isNonEmptyString(input.name)) {
    return 'name must be a non-empty string when provided'
  }
  if (
    input.status !== undefined
    && !CUSTOMER_STATUSES.includes(input.status as CustomerStatus)
  ) {
    return 'status must be a valid CustomerStatus when provided'
  }
  if (input.line1 !== undefined && !isNonEmptyString(input.line1)) {
    return 'line1 must be a non-empty string when provided'
  }
  if (input.line2 !== undefined && !isNonEmptyString(input.line2)) {
    return 'line2 must be a non-empty string when provided'
  }
  if (input.city !== undefined && !isNonEmptyString(input.city)) {
    return 'city must be a non-empty string when provided'
  }
  if (input.state !== undefined && !isNonEmptyString(input.state)) {
    return 'state must be a non-empty string when provided'
  }
  if (input.postalCode !== undefined && !isNonEmptyString(input.postalCode)) {
    return 'postalCode must be a non-empty string when provided'
  }
  if (input.country !== undefined && !isNonEmptyString(input.country)) {
    return 'country must be a non-empty string when provided'
  }

  return null
}

// ────────────────────────────────────────────────────────────────────────────
// INTERNALS
// ────────────────────────────────────────────────────────────────────────────

const isLocation = (
  value: unknown
): value is import('@domain/abstractions/common.ts').Location => {
  if (typeof value !== 'object' || value === null) return false

  const data = value as Dictionary

  if (typeof data.latitude !== 'number' || !Number.isFinite(data.latitude)) return false
  if (typeof data.longitude !== 'number' || !Number.isFinite(data.longitude)) return false

  if (data.altitudeMeters !== undefined) {
    if (
      typeof data.altitudeMeters !== 'number' || !Number.isFinite(data.altitudeMeters)
    ) {
      return false
    }
  }
  if (data.line1 !== undefined && !isNonEmptyString(data.line1)) return false
  if (data.line2 !== undefined && !isNonEmptyString(data.line2)) return false
  if (data.city !== undefined && !isNonEmptyString(data.city)) return false
  if (data.state !== undefined && !isNonEmptyString(data.state)) return false
  if (data.postalCode !== undefined && !isNonEmptyString(data.postalCode)) return false
  if (data.country !== undefined && !isNonEmptyString(data.country)) return false
  if (data.recordedAt !== undefined && !isWhen(data.recordedAt)) return false
  if (data.accuracyMeters !== undefined) {
    if (
      typeof data.accuracyMeters !== 'number' || !Number.isFinite(data.accuracyMeters)
    ) {
      return false
    }
  }
  if (data.description !== undefined && !isNonEmptyString(data.description)) return false

  return true
}

const isContact = (value: unknown): value is Contact => {
  if (typeof value !== 'object' || value === null) return false

  const data = value as Dictionary

  if (!isCompositionMany(data.notes, isNote)) return false
  if (!isNonEmptyString(data.name)) return false
  if (data.email !== undefined && !isNonEmptyString(data.email)) return false
  if (data.phone !== undefined && !isNonEmptyString(data.phone)) return false
  if (typeof data.isPrimary !== 'boolean') return false
  if (
    data.preferredChannel !== undefined
    && !CONTACT_PREFERRED_CHANNELS.includes(data.preferredChannel as ContactPreferredChannel)
  ) {
    return false
  }

  return true
}

const isCustomerSite = (value: unknown): value is CustomerSite => {
  if (typeof value !== 'object' || value === null) return false

  const data = value as Dictionary

  if (!isId(data.customerId)) return false
  if (!isCompositionOne(data.location, isLocation)) return false
  if (!isCompositionMany(data.notes, isNote)) return false
  if (!isNonEmptyString(data.label)) return false
  if (data.acreage !== undefined && !isPositiveNumber(data.acreage)) return false

  return true
}
