/*
╔═════════════════════════════════════════════════════════════════════════════╗
║ Customer protocol validators                                                ║
║ Boundary validation for customer protocol payloads                          ║
╚═════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update payloads for customer protocol contracts.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
validateCustomerCreate              Validate CustomerCreate payloads.
validateCustomerUpdate              Validate CustomerUpdate payloads.
isCustomerSite                      Typed object guard for CustomerSite.
isContact                           Typed object guard for Contact.
*/

import {
  expectCompositionMany,
  expectCompositionPositive,
  expectConstEnum,
  expectId,
  expectNonEmptyString,
  type ExpectResult,
  expectValid
} from '@core/std'
import type { Contact, CustomerSite } from '@domain/abstractions/customer.ts'
import { CUSTOMER_STATUSES } from '@domain/abstractions/customer.ts'
import type { CustomerCreate, CustomerUpdate } from '@domain/protocols/customer-protocol.ts'
import { isNote } from '@domain/validators/common-validator.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validate CustomerCreate payloads. */
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

/** Validate CustomerUpdate payloads. */
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

// ────────────────────────────────────────────────────────────────────────────
// GUARDS
// ────────────────────────────────────────────────────────────────────────────

/** Typed object guard for CustomerSite. */
export const isCustomerSite = (value: unknown): value is CustomerSite =>
  value !== null && typeof value === 'object'

/** Typed object guard for Contact. */
export const isContact = (value: unknown): value is Contact =>
  value !== null && typeof value === 'object'
