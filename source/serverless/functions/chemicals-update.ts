/**
 * Netlify handler for updating chemicals.
 */

import type { Chemical } from '@domain/abstractions/chemical.ts'
import { type ChemicalUpdateInput, validateChemicalUpdate } from '@domain/validators/chemical-validators.ts'
import { type ApiRequest, type ApiResponse, HttpCodes } from '@serverless-lib/api-binding.ts'
import { createApiHandler } from '@serverless-lib/api-handler.ts'
import { Supabase } from '@serverless-lib/db-supabase.ts'
import { chemicalToRow, rowToChemical } from '@serverless-mappings/chemicals-mapping.ts'
import { when } from '@utils'

/**
 * Edge function path config
 */
export const config = { path: '/api/chemicals/update' }

/**
 * Update an existing chemical while enforcing allowed fields and validation.
 * @param req - API request wrapper containing the update payload.
 * @returns API result with the updated chemical or an error response.
 */
const handle = async (
  req: ApiRequest<ChemicalUpdateInput>
): Promise<ApiResponse> => {
  if (req.method !== 'PATCH' && req.method !== 'PUT') {
    return { statusCode: HttpCodes.methodNotAllowed, body: { error: 'Method Not Allowed' } }
  }

  const validationError = validateChemicalUpdate(req.body)
  if (validationError) {
    return { statusCode: HttpCodes.unprocessableEntity, body: { error: validationError } }
  }

  const supabase = Supabase.client()
  const { data: existingRow, error: fetchError } = await supabase
    .from('chemicals')
    .select('*')
    .eq('id', req.body.id)
    .single()

  if (fetchError || !existingRow) {
    return { statusCode: HttpCodes.notFound, body: { error: 'Chemical not found' } }
  }

  let current: Chemical
  try {
    current = rowToChemical(existingRow)
  } catch (parseError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Invalid chemical record returned from Supabase', details: (parseError as Error).message }
    }
  }

  const updated: Chemical = {
    ...current,
    name: req.body.name?.trim() ?? current.name,
    epaNumber: req.body.epaNumber === null ? undefined : req.body.epaNumber?.trim() ?? current.epaNumber,
    usage: req.body.usage ?? current.usage,
    signalWord: req.body.signalWord === null ? undefined : req.body.signalWord ?? current.signalWord,
    restrictedUse: req.body.restrictedUse ?? current.restrictedUse,
    reEntryIntervalHours: req.body.reEntryIntervalHours === null
      ? undefined
      : req.body.reEntryIntervalHours ?? current.reEntryIntervalHours,
    storageLocation: req.body.storageLocation === null
      ? undefined
      : req.body.storageLocation?.trim() ?? current.storageLocation,
    sdsUrl: req.body.sdsUrl === null ? undefined : req.body.sdsUrl?.trim() ?? current.sdsUrl,
    updatedAt: when()
  }

  const { error: updateError } = await supabase
    .from('chemicals')
    .update(chemicalToRow(updated))
    .eq('id', updated.id)

  if (updateError) {
    return {
      statusCode: HttpCodes.internalError,
      body: { error: 'Failed to update chemical', details: updateError.message }
    }
  }

  return { statusCode: HttpCodes.ok, body: { data: updated } }
}

export default createApiHandler(handle)
