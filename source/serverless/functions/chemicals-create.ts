/**
 * Netlify handler for creating chemicals.
 */

import type { Chemical } from '@domain/abstractions/chemical.ts'
import { type ChemicalCreateInput, validateChemicalCreate } from '@domain/validators/chemical-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { chemicalToRow } from '@serverless-mappings/chemicals-mapping.ts'
import { id, when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/chemicals/create' }

/**
 * Create a new chemical record when the request payload is valid.
 * @param req - Netlify-friendly API request wrapper containing the body.
 * @returns API result with created chemical or an error response.
 */
const handle = async (
  req: ApiRequest<ChemicalCreateInput>
): Promise<ApiResponse> => {
  if (req.method !== 'POST') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const validationError = validateChemicalCreate(req.body)
  if (validationError) {
    return { statusCode: HttpCodes.unprocessableEntity, body: { error: validationError } }
  }

  const now = when()
  const chemical: Chemical = {
    id: id(),
    name: req.body.name.trim(),
    epaNumber: req.body.epaNumber?.trim(),
    usage: req.body.usage,
    signalWord: req.body.signalWord,
    restrictedUse: req.body.restrictedUse,
    reEntryIntervalHours: req.body.reEntryIntervalHours,
    storageLocation: req.body.storageLocation?.trim(),
    sdsUrl: req.body.sdsUrl?.trim(),
    labels: undefined,
    attachments: undefined,
    notes: undefined,
    createdAt: now,
    updatedAt: now
  }

  const { error } = await Supabase.client()
    .from('chemicals')
    .insert(chemicalToRow(chemical))

  if (error) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Failed to create chemical', details: error.message }
    }
  }

  return { statusCode: HttpCodes.created, body: { data: chemical } }
}

export default createApiHandler(handle)
