/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Attachment workbench save                                                    ║
║ Owns staged files for one editor and completes retryable record placement.   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Owns staged files for one editor and completes retryable record placement.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AttachmentSaveSpecification  Record writes, placement, and draft reconciliation.
├ create                      Write a new record.
├ update                      Write an existing record.
├ place                       Project the draft with final references.
├ reconcile                   Apply final references to editor state.
└ complete                    Optional additional aggregate writes.
AttachmentSave               One editor lifetime.
├ stage                       Stage and track a selected file.
├ create                      Create and complete, or retry the pending record.
├ update                      Update and complete.
└ discard                     Discard staging only before any write attempt.
makeAttachmentSave           Build one editor lifetime.
*/

import type { Id, Instance } from '@core/std'
import type { Attachment } from '@domain/abstractions/common.ts'
import { api } from '@front/api/api.ts'
import type { Attachments } from '@front/api/attachments.ts'
import { makeAggregateSave } from '@ux/shell/workbench/make-aggregate-save.ts'
import { isDraftChanged } from '@ux/shell/workbench/workbench-draft.ts'

/** Explicit writes and placement owned by one form. */
export type AttachmentSaveSpecification<T, D> = {
  create: (draft: D) => Promise<T>
  update: (record: T, draft: D) => Promise<T>
  place: (owner: Id, draft: D) => Promise<D>
  reconcile: (draft: D) => void
  complete?: (record: T, draft: D) => Promise<void>
}

/** The operations one editor owns until it closes. */
export type AttachmentSave<T, D> = {
  stage: (file: File) => Promise<Attachment>
  create: (draft: D) => Promise<T>
  update: (record: T, draft: D) => Promise<T>
  discard: () => Promise<void>
}

/** Build a save delegate and retain all staging once a write has been attempted. */
export const makeAttachmentSave = <T extends Instance, D>(
  spec: AttachmentSaveSpecification<T, D>,
  attachments: Pick<Attachments, 'stage' | 'discard'> = api.Attachments
): AttachmentSave<T, D> => {
  let attempted = false
  let closed = false
  const staged: Attachment[] = []
  const pending = new Set<Promise<Attachment>>()
  const stage = (file: File): Promise<Attachment> => {
    const operation = attachments.stage(file).then(async attachment => {
      if (closed && !attempted) await attachments.discard([attachment])
      else staged.push(attachment)
      return attachment
    })
    pending.add(operation)
    operation.then(() => pending.delete(operation), () => pending.delete(operation))
    return operation
  }
  const beforeWrite = async (): Promise<void> => {
    await Promise.all(pending)
    attempted = true
  }
  const save = makeAggregateSave<T, D>({
    create: async draft => {
      await beforeWrite()
      return spec.create(draft)
    },
    update: async (record, draft) => {
      await beforeWrite()
      return spec.update(record, draft)
    },
    complete: async (record, draft) => {
      const placed = await spec.place(record.id, draft)
      const final = isDraftChanged(placed, draft) ? await spec.update(record, placed) : record
      await spec.complete?.(final, placed)
      spec.reconcile(placed)
      return final
    }
  })
  return {
    stage,
    ...save,
    async discard() {
      closed = true
      if (!attempted) await attachments.discard(staged)
    }
  }
}
