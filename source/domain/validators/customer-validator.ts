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
validateCustomerCreate(input)         Validate CustomerCreate payloads.
validateCustomerUpdate(input)         Validate CustomerUpdate payloads.
validateCustomerContactCreate(input)  Validate CustomerContactCreate payloads.
isCustomerSite(v)                     Guard for CustomerSite object values.
*/

import {
  expectCompositionMany,
  expectCompositionOne,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  expectPositiveNumber,
  type ExpectResult,
  expectValid
} from '@core/std'
import { CUSTOMER_STATUSES, type CustomerSite } from '@domain/abstractions/customer.ts'
import type {
  CustomerContactCreate,
  CustomerCreate,
  CustomerUpdate
} from '@domain/protocols/customer-protocol.ts'
import { isLocation, isNote } from '@domain/validators/common-validator.ts'

/** Validate CustomerCreate payloads. */
export const validateCustomerCreate = (input: CustomerCreate): ExpectResult =>
  expectValid(
    expectId(input.accountManagerId, 'accountManagerId', true),
    expectId(input.primaryContactId, 'primaryContactId'),
    expectCompositionMany(input.sites, 'sites', isCustomerSite),
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

/** Validate CustomerUpdate payloads. */
export const validateCustomerUpdate = (input: CustomerUpdate): ExpectResult =>
  expectValid(
    expectId(input.id, 'id'),
    expectId(input.accountManagerId, 'accountManagerId', true),
    expectId(input.primaryContactId, 'primaryContactId', true),
    expectCompositionMany(input.sites, 'sites', isCustomerSite, true),
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

/** Validate CustomerContactCreate payloads. */
export const validateCustomerContactCreate = (input: CustomerContactCreate): ExpectResult =>
  expectValid(
    expectId(input.customerId, 'customerId'),
    expectId(input.userId, 'userId')
  )

/** Guard for CustomerSite values. */
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
