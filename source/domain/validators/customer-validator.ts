/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer domain validator                                                    ║
║ Boundary validation for customer topic abstractions.                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Validates create and update protocol payloads for Customer.

EXPORTED APIs & TYPEs
───────────────────────────────────────────────────────────────────────────────
validateCustomerCreate  Validate CustomerCreate payloads.
validateCustomerUpdate  Validate CustomerUpdate payloads.
*/

import {
  expectCompositionMany,
  expectCompositionPositive,
  expectConstEnum,
  type ExpectGuard,
  expectId,
  expectNonEmptyString,
  type ExpectResult,
  expectValid
} from '@core/std'
import type { Note } from '@domain/abstractions/common.ts'
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
    expectCompositionMany(input.sites, 'sites', isCustomerSite, true),
    expectCompositionPositive(input.contacts, 'contacts', isContact),
    expectCompositionMany(input.notes, 'notes', isNote as ExpectGuard<Note>, true),
    expectNonEmptyString(input.name, 'name'),
    expectConstEnum(input.status, 'status', CUSTOMER_STATUSES, true),
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
    expectCompositionMany(input.notes, 'notes', isNote as ExpectGuard<Note>, true),
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

const isContact: ExpectGuard<Contact> = (v): v is Contact => v !== null && typeof v === 'object'

const isCustomerSite: ExpectGuard<CustomerSite> = (v): v is CustomerSite =>
  v !== null && typeof v === 'object'
