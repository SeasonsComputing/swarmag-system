import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiRequest } from '@api/platform/netlify'
import { HttpCodes } from '@api/platform/netlify'
import { ranchMappingAssessment } from '../fixtures/samples'

const insertCalls: Record<string, unknown> = {}
const fromMock = vi.fn()
const clientMock = vi.fn(() => ({ from: fromMock }))

vi.mock('@api/platform/supabase', () => ({
  Supabase: {
    client: clientMock,
  },
}))

// Imported after mocks so the handler uses the mocked Supabase client.
import { handle } from '@api/job-create'

type JobCreateRequest = Parameters<typeof handle>[0]
type JobCreateBody = JobCreateRequest['body']

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

const makeRequest = (
  overrides: Partial<JobCreateBody> = {}
): ApiRequest<JobCreateBody> => ({
  method: 'POST',
  body: buildBody(overrides),
  query: {} as Record<string, never>,
  headers: {},
  rawEvent: {} as never,
})

beforeEach(() => {
  Object.keys(insertCalls).forEach((key) => delete insertCalls[key])
  fromMock.mockReset()
  clientMock.mockClear()

  fromMock.mockImplementation((table: string) => ({
    insert: (payload: unknown) => {
      insertCalls[table] = payload
      return Promise.resolve({ error: null })
    },
  }))
})

describe('job-create handler', () => {
  it('rejects invalid payloads before touching Supabase', async () => {
    const request = makeRequest({
      plan: { ...basePlanInput, scheduledStart: undefined as never },
    })

    const response = await handle(request)

    expect(response.statusCode).toBe(HttpCodes.unprocessableEntity)
    expect(clientMock).not.toHaveBeenCalled()
  })

  it('persists job, plan, and assessment with generated IDs', async () => {
    const response = await handle(makeRequest())
    const body = response.body as { data: { job: unknown; plan: unknown; assessment: unknown } }

    expect(response.statusCode).toBe(HttpCodes.created)
    expect(clientMock).toHaveBeenCalledTimes(1)
    expect(fromMock).toHaveBeenCalledTimes(3)
    expect(insertCalls.jobs).toBeDefined()
    expect(insertCalls.job_plans).toBeDefined()
    expect(insertCalls.job_assessments).toBeDefined()

    const jobInsert = insertCalls.jobs as Record<string, any>
    const planInsert = insertCalls.job_plans as Record<string, any>
    const assessmentInsert = insertCalls.job_assessments as Record<string, any>

    expect(jobInsert.payload.id).toBe(jobInsert.id)
    expect(jobInsert.payload.assessmentId).toBe(assessmentInsert.id)
    expect(jobInsert.payload.planId).toBe(planInsert.id)
    expect(jobInsert.payload.status).toBe('scheduled')

    expect(planInsert.job_id).toBe(jobInsert.id)
    expect(planInsert.payload.workflowId).toBe(basePlanInput.workflowId)
    expect(planInsert.payload.status).toBe('scheduled')
    expect(planInsert.payload.createdAt).toBe(planInsert.created_at)

    expect(assessmentInsert.job_id).toBe(jobInsert.id)
    expect(assessmentInsert.payload.customerId).toBe(ranchMappingAssessment.customerId)

    expect(body.data.job.id).toBe(jobInsert.id)
    expect(body.data.plan.id).toBe(planInsert.id)
    expect(body.data.assessment.id).toBe(assessmentInsert.id)
  })
})
