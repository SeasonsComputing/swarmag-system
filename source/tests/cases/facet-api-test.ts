/**
 * Facet adapter and protocol validation contract tests.
 */

import type { Facet } from '@domain/abstractions/common.ts'
import { FacetAdapter } from '@domain/adapters/common-adapter.ts'
import type { FacetCreate, FacetUpdate } from '@domain/protocols/common-protocol.ts'
import {
  isFacetRef,
  isNote,
  validateFacetCreate,
  validateFacetUpdate
} from '@domain/validators/common-validator.ts'
import { validateServiceCreate, validateServiceUpdate } from '@domain/validators/service-validator.ts'
import { validateWorkflowCreate, validateWorkflowUpdate } from '@domain/validators/workflow-validator.ts'
import { assert, assertEquals } from '@std/assert'
import { aerialSprayFacet } from '@tests/fixtures/facet-samples.ts'

Deno.test('Facet adapter round-trips active and retired catalog entries', () => {
  for (const active of [true, false]) {
    const facet: Facet = { ...aerialSprayFacet, active }
    const record = FacetAdapter.fromDomain(facet)
    assertEquals(record.scheme, facet.scheme)
    assertEquals(record.created_at, facet.createdAt)
    assertEquals(record.active, active)
    assertEquals(FacetAdapter.toDomain(record), facet)
  }
})

Deno.test('Facet create validates required fields and reserved separators', () => {
  assertEquals(validateFacetCreate(aerialSprayFacet), null)
  assertEquals(validateFacetCreate({ ...aerialSprayFacet, active: false }), null)
  for (const field of ['scheme', 'code', 'label'] as const) {
    for (const value of ['', '   ', undefined]) {
      assert(validateFacetCreate({ ...aerialSprayFacet, [field]: value } as FacetCreate) !== null)
    }
  }
  for (const field of ['scheme', 'code'] as const) {
    assert(validateFacetCreate({ ...aerialSprayFacet, [field]: 'a:b' }) !== null)
  }
  assert(validateFacetCreate({ ...aerialSprayFacet, active: 'true' } as unknown as FacetCreate) !== null)
  assert(
    validateFacetCreate({ ...aerialSprayFacet, active: undefined } as unknown as FacetCreate) !== null
  )
})

Deno.test('Facet update validates supplied fields while allowing partial updates', () => {
  const patch: FacetUpdate = { id: aerialSprayFacet.id, active: false, label: 'Retired spray' }
  assertEquals(validateFacetUpdate(patch), null)
  assertEquals(validateFacetUpdate({ id: aerialSprayFacet.id }), null)
  assert(validateFacetUpdate({ ...patch, id: 'invalid' }) !== null)
  for (const field of ['scheme', 'code'] as const) {
    assert(validateFacetUpdate({ ...patch, [field]: 'a:b' }) !== null)
    assert(validateFacetUpdate({ ...patch, [field]: '   ' }) !== null)
  }
  assert(validateFacetUpdate({ ...patch, label: '' }) !== null)
  assert(validateFacetUpdate({ ...patch, active: 'false' } as unknown as FacetUpdate) !== null)
})

Deno.test('Facet references require exactly one separator and non-empty parts', () => {
  assert(isFacetRef('service:aerial/spray'))
  for (const ref of ['service', ':x', 'x:', 'a:b:c', ' :x', 'x: ', '', null, 1]) {
    assertEquals(isFacetRef(ref), false)
  }
})

Deno.test('Note validation accepts notes without tags', () => {
  assert(isNote({
    attachments: [],
    createdAt: aerialSprayFacet.createdAt,
    content: 'Operational knowledge',
    visibility: 'internal'
  }))
})

Deno.test('Service and Workflow create and update validate facet references', () => {
  const service = {
    name: 'Aerial spray',
    sku: 'A-CHEM-01',
    category: 'aerial-drone-services' as const,
    notes: [],
    facets: ['service:aerial/spray']
  }
  const workflow = { name: 'Spray preparation', version: 1, notes: [], facets: service.facets }
  assertEquals(validateServiceCreate(service), null)
  assertEquals(validateWorkflowCreate(workflow), null)
  const patch = { id: aerialSprayFacet.id, facets: service.facets }
  assertEquals(validateServiceUpdate(patch), null)
  assertEquals(validateWorkflowUpdate(patch), null)
  for (const facets of [[], ['service:aerial/spray', 'asset:drone']]) {
    assertEquals(validateServiceCreate({ ...service, facets }), null)
    assertEquals(validateWorkflowCreate({ ...workflow, facets }), null)
  }
  for (const ref of ['service', ':x', 'x:', 'a:b:c']) {
    const facets = [ref]
    assert(validateServiceCreate({ ...service, facets }) !== null)
    assert(validateWorkflowCreate({ ...workflow, facets }) !== null)
    assert(validateServiceUpdate({ ...patch, facets }) !== null)
    assert(validateWorkflowUpdate({ ...patch, facets }) !== null)
  }
})
