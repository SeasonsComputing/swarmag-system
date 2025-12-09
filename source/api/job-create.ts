import { type ID, id } from '@utils/identifier'
import { type When, when } from '@utils/datetime'
import type { JobAssessment, JobPlan, JobStatus, Job } from '@domain/job'
import { Supabase } from '@api/helpers/supabase'
import { type ApiRequest, type ApiResult, withNetlify } from '@api/helpers/handler'

type JobAssessmentInput = Omit<JobAssessment, 'id' | 'createdAt' | 'updatedAt'>
type JobPlanInput = Omit<
  JobPlan,
  'id' | 'jobId' | 'status' | 'createdAt' | 'updatedAt'
> & { status?: JobStatus }

interface JobCreateBody {
  serviceId: ID
  customerId: ID
  assessment: JobAssessmentInput
  plan: JobPlanInput
}

const validate = (payload: JobCreateBody): string | null => {
  if (!payload?.serviceId) return 'serviceId is required'
  if (!payload.customerId) return 'customerId is required'
  if (!payload.plan?.workflowId) return 'plan.workflowId is required'
  if (!payload.plan?.scheduledStart) return 'plan.scheduledStart is required'
  if (!payload.assessment?.assessedAt) return 'assessment.assessedAt is required'
  if (!payload.assessment?.locations?.length) return 'assessment.locations requires at least one location'
  return null
}

export const handle = async (
  req: ApiRequest<JobCreateBody>
): Promise<ApiResult> => {
  if (req.method !== 'POST') {
    return { statusCode: 405, body: { error: 'Method Not Allowed' } }
  }

  const validationError = validate(req.body)
  if (validationError) {
    return { statusCode: 422, body: { error: validationError } }
  }

  const at: When = when()
  const jobId: ID = id()
  const assessmentId: ID = id()
  const planId: ID = id()
  const planStatus: JobStatus = req.body.plan.status ?? 'scheduled'

  const assessment: JobAssessment = {
    ...req.body.assessment,
    id: assessmentId,
    createdAt: at,
    updatedAt: at,
  }

  const plan: JobPlan = {
    ...req.body.plan,
    id: planId,
    jobId,
    status: planStatus,
    createdAt: at,
    updatedAt: at,
  }

  const job: Job = {
    id: jobId,
    assessmentId,
    planId,
    serviceId: req.body.serviceId,
    customerId: req.body.customerId,
    status: planStatus,
    createdAt: at,
    updatedAt: at,
  }

  const supabase = Supabase.client()

  const jobInsert = supabase.from('jobs').insert({
    id: job.id,
    service_id: job.serviceId,
    customer_id: job.customerId,
    assessment_id: assessment.id,
    plan_id: plan.id,
    status: job.status,
    payload: job,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  })

  const planInsert = supabase.from('job_plans').insert({
    id: plan.id,
    job_id: job.id,
    workflow_id: plan.workflowId,
    status: plan.status,
    payload: plan,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  })

  const assessmentInsert = supabase.from('job_assessments').insert({
    id: assessment.id,
    job_id: job.id,
    payload: assessment,
    created_at: assessment.createdAt,
    updated_at: assessment.updatedAt,
  })

  try {
    const [
      { error: jobError },
      { error: planError },
      { error: assessmentError },
    ] = await Promise.all([jobInsert, planInsert, assessmentInsert])

    if (jobError || planError || assessmentError) {
      throw new Error(
        jobError?.message ?? planError?.message ?? assessmentError?.message
      )
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: {
        error: 'Failed to create job',
        details: (error as Error).message,
      },
    }
  }

  return {
    statusCode: 201,
    body: {
      data: {
        job,
        plan,
        assessment,
      },
    },
  }
}

export const handler = withNetlify(handle)
export default handler
