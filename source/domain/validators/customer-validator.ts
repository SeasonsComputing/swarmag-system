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
import { CUSTOMER_STATUSES } from '@domain/abstractions/customer.ts'
import type { CustomerCreate, CustomerUpdate } from '@domain/protocols/customer-protocol.ts'

// ────────────────────────────────────────────────────────────────────────────
// VALIDATORS
// ────────────────────────────────────────────────────────────────────────────

/** Validate CustomerCreate payloads. */
export const validateCustomerCreate = (input: CustomerCreate): ExpectResult =>
  expectValid(
    expectId(input.accountManagerId, 'accountManagerId', true),
    expectCompositionMany(input.sites, 'sites', isObject),
    expectCompositionPositive(input.contacts, 'contacts', isObject),
    expectCompositionMany(input.notes, 'notes', isObject),
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
    expectCompositionMany(input.sites, 'sites', isObject, true),
    expectCompositionPositive(input.contacts, 'contacts', isObject, true),
    expectCompositionMany(input.notes, 'notes', isObject, true),
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

const isObject = (value: unknown): value is object =>
  value !== null && typeof value === 'object'
