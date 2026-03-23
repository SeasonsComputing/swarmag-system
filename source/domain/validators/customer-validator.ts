/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer protocol validators                                                 ║
║ Boundary validation for customer protocol payloads.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for customer abstractions.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateCustomerCreate(input)  Validate CustomerCreate payloads.
validateCustomerUpdate(input)  Validate CustomerUpdate payloads.
isContact(v)  Guard for Contact object values.
isCustomerSite(v)  Guard for CustomerSite object values.
*/

import {
  expectBoolean,
  expectCompositionMany,
  expectCompositionOne,
  expectCompositionPositive,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  expectPositiveNumber,
  type ExpectResult,
  expectValid
} from '@core/std'
import {
  type Contact,
  CONTACT_PREFERRED_CHANNELS,
  CUSTOMER_STATUSES,
  type CustomerSite
} from '@domain/abstractions/customer.ts'
import type { CustomerCreate, CustomerUpdate } from '@domain/protocols/customer-protocol.ts'
import { isLocation, isNote } from '@domain/validators/common-validator.ts'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

export const validateCustomerCreate = (input: CustomerCreate): ExpectResult =>
  expectValid(
    expectId(input.accountManagerId, 'accountManagerId', true),
    expectCompositionMany(input.sites, 'sites', isCustomerSite),
    expectCompositionPositive(input.contacts, 'contacts', isContact),
    expectCompositionMany(input.notes, 'notes', isNote),
    expectNonEmptyString(input.name, 'name'),
    expectConstEnum(input.status, 'status', CUSTOMER_STATUSES),
    expectNonEmptyString(input.line1, 'line1'),
    expectNonEmptyString(input.line2, 'line2', true),
    expectNonEmptyString(input.city, 'city'),
    expectNonEmptyString(input.state, 'state'),
    expectNonEmptyString(input.postalCode, 'postalCode'),
    expectNonEmptyString(input.country, 'country')
  )

export const validateCustomerUpdate = (input: CustomerUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectId(input.accountManagerId, 'accountManagerId', true),
    expectCompositionMany(input.sites, 'sites', isCustomerSite, true),
    expectCompositionPositive(input.contacts, 'contacts', isContact, true),
    expectCompositionMany(input.notes, 'notes', isNote, true),
    expectNonEmptyString(input.name, 'name', true),
    expectConstEnum(input.status, 'status', CUSTOMER_STATUSES, true),
    expectNonEmptyString(input.line1, 'line1', true),
    expectNonEmptyString(input.line2, 'line2', true),
    expectNonEmptyString(input.city, 'city', true),
    expectNonEmptyString(input.state, 'state', true),
    expectNonEmptyString(input.postalCode, 'postalCode', true),
    expectNonEmptyString(input.country, 'country', true)
  )

export const isContact = (v: unknown): v is Contact => {
  if (v === null || typeof v !== 'object') return false
  const contact = v as Contact
  return expectValid(
    expectCompositionMany(contact.notes, 'notes', isNote),
    expectNonEmptyString(contact.name, 'name'),
    expectNonEmptyString(contact.email, 'email', true),
    expectNonEmptyString(contact.phone, 'phone', true),
    expectBoolean(contact.isPrimary, 'isPrimary'),
    expectConstEnum(contact.preferredChannel, 'preferredChannel', CONTACT_PREFERRED_CHANNELS)
  ) === null
}

export const isCustomerSite = (v: unknown): v is CustomerSite => {
  if (v === null || typeof v !== 'object') return false
  const site = v as CustomerSite
  return expectValid(
    expectId(site.customerId, 'customerId'),
    expectCompositionOne(site.location, 'location', isLocation),
    expectCompositionMany(site.notes, 'notes', isNote),
    expectNonEmptyString(site.label, 'label'),
    expectPositiveNumber(site.acreage, 'acreage', true)
  ) === null
}
