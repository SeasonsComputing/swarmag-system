/**
 * Unit tests for the job-create Netlify handler.
 */

import { assertEquals, assert } from 'https://deno.land/std@0.224.0/assert/mod.ts'
import handler from '@serverless/functions/job-create.ts'
import { HttpCodes } from '@serverless/lib/api-binding.ts'
import { Supabase } from '@serverless/lib/supabase.ts'
import { ranchMappingAssessment } from '../fixtures/samples.ts'
import { runNetlifyHandler } from './helpers/netlify.ts'

const insertCalls: Record<string, unknown> = {}

type JobCreateBody = {
  serviceId: string
  customerId: string
  assessment: Record<string, unknown>
  plan: Record<string, unknown>
}

const buildAssessmentInput = () => {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } =
    ranchMappingAssessment
  return { ...rest }
}

const basePlanInput: JobCreateBody['plan'] = {
  workflowId: '01J0WORKFLOW00001',
  scheduledStart: '2025-01-20T08:00:00Z',
  targetLocations: ranchMappingAssessment.locations,
  assignments: [],
  assets: [],
  chemicals: [],
  notes: [],
}

const buildBody = (overrides: Partial<JobCreateBody> = {}): JobCreateBody => ({
  serviceId: overrides.serviceId ?? '01J0SERVICEHERBICIDE',
  customerId: overrides.customerId ?? ranchMappingAssessment.customerId,
  assessment: {
    ...buildAssessmentInput(),
    ...(overrides.assessment ?? {}),
  },
  plan: {
    ...basePlanInput,
    ...(overrides.plan ?? {}),
  },
})

Deno.test('job-create handler rejects invalid payloads before touching Supabase', async () => {
  const originalClient = Supabase.client
  let fromCalls = 0
  let clientCalls = 0

  Supabase.client = ((() => {
    clientCalls += 1
    return {
      from: (table: string) => {
        fromCalls += 1
        return {
          insert: (payload: unknown) => {
            insertCalls[table] = payload
            return Promise.resolve({ error: null })
          },
        }
      },
    }
  }) as unknown as typeof Supabase.client)

  try {
    const request = buildBody({
      plan: { ...basePlanInput, scheduledStart: undefined as never },
    })

    const response = await runNetlifyHandler(handler, 'POST', request)

    assertEquals(response.statusCode, HttpCodes.unprocessableEntity)
    assertEquals(clientCalls, 0)
    assertEquals(fromCalls, 0)
  } finally {
    Supabase.client = originalClient
    Object.keys(insertCalls).forEach((key) => delete insertCalls[key])
  }
})

Deno.test('job-create handler persists job, plan, and assessment with generated IDs', async () => {
  const originalClient = Supabase.client
  let fromCalls = 0
  let clientCalls = 0

  Supabase.client = ((() => {
    clientCalls += 1
    return {
      from: (table: string) => {
        fromCalls += 1
        return {
          insert: (payload: unknown) => {
            insertCalls[table] = payload
            return Promise.resolve({ error: null })
          },
        }
      },
    }
  }) as unknown as typeof Supabase.client)

  try {
    const response = await runNetlifyHandler(handler, 'POST', buildBody())
    const body = response.body as { data: { job: Record<string, unknown>; plan: Record<string, unknown>; assessment: Record<string, unknown> } }

    assertEquals(response.statusCode, HttpCodes.created)
    assertEquals(clientCalls, 1)
    assertEquals(fromCalls, 3)
    assert(insertCalls.jobs)
    assert(insertCalls.job_plans)
    assert(insertCalls.job_assessments)

    const jobInsert = insertCalls.jobs as Record<string, any>
    const planInsert = insertCalls.job_plans as Record<string, any>
    const assessmentInsert = insertCalls.job_assessments as Record<string, any>

    assertEquals(jobInsert.payload.id, jobInsert.id)
    assertEquals(jobInsert.payload.assessmentId, assessmentInsert.id)
    assertEquals(jobInsert.payload.planId, planInsert.id)
    assertEquals(jobInsert.payload.status, 'scheduled')

    assertEquals(planInsert.job_id, jobInsert.id)
    assertEquals(planInsert.payload.workflowId, basePlanInput.workflowId)
    assertEquals(planInsert.payload.status, 'scheduled')
    assertEquals(planInsert.payload.createdAt, planInsert.created_at)

    assertEquals(assessmentInsert.job_id, jobInsert.id)
    assertEquals(assessmentInsert.payload.customerId, ranchMappingAssessment.customerId)

    assertEquals(body.data.job.id, jobInsert.id)
    assertEquals(body.data.plan.id, planInsert.id)
    assertEquals(body.data.assessment.id, assessmentInsert.id)
  } finally {
    Supabase.client = originalClient
    Object.keys(insertCalls).forEach((key) => delete insertCalls[key])
  }
})
