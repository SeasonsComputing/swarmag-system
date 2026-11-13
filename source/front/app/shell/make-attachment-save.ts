/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Attachment workbench save                                                    ║
║ Owns one editor's upload tasks and writes placed references once.            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Owns the upload tasks one editor starts and writes its record's placed
references once. Choosing a file adds its row at once and starts its upload
task; Save waits for no transfer. An update writes the record with placed
addresses. A create writes the record without the attachments whose placed
address needs its id, then updates it with them. After a successful write the
editor releases its tasks, and each places its document once staged. Cancel
before any write attempt discards this editor's staging; after an attempted
write, staging remains.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AttachmentSaveSpecification  Record writes, placement, and draft reconciliation.
├ create                      Write a new record.
├ update                      Write an existing record.
├ address                     Project the draft with placed references.
├ reconcile                   Apply placed references to editor state.
└ complete                    Optional additional aggregate writes.
AttachmentSave               One editor lifetime.
├ stage                       Start a chosen file's upload task; return its row.
├ create                      Create and complete, or retry the pending record.
├ update                      Update and complete.
└ discard                     End unreleased tasks when the editor closes.
makeAttachmentSave           Build one editor lifetime.
*/

import type { Id, Instance } from '@core/std'
import { DocumentAddresses } from '@core/stdx'
import type { Attachment } from '@domain/abstractions/common.ts'
import { api } from '@front/api/api.ts'
import type { Attachments } from '@front/api/attachments.ts'
import { makeAggregateSave } from '@ux/shell/workbench/make-aggregate-save.ts'
import { isDraftChanged } from '@ux/shell/workbench/workbench-draft.ts'

/** Explicit writes and placement owned by one form. */
export type AttachmentSaveSpecification<T, D> = {
  create: (draft: D) => Promise<T>
  update: (record: T, draft: D) => Promise<T>
  /** Undefined owner: before a create, leaving out what needs the record's id. */
  address: (owner: Id | undefined, draft: D) => Promise<D>
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

/** Build a save delegate that writes placed references once and releases its tasks after. */
export const makeAttachmentSave = <T extends Instance, D>(
  spec: AttachmentSaveSpecification<T, D>,
  attachments: Pick<Attachments, 'stage' | 'reset' | 'release' | 'abandon'> = api.Attachments
): AttachmentSave<T, D> => {
  let attempted = false
  let chosen: Id[] = []
  // The projection the last write persisted; complete compares against it.
  let written!: D
  const stage = (file: File): Promise<Attachment> => {
    const attachment = attachments.stage(file)
    chosen.push(DocumentAddresses.id(attachment.documentAddress).document)
    return Promise.resolve(attachment)
  }
  const write = async (draft: D, persist: (projected: D) => Promise<T>, owner?: Id): Promise<T> => {
    attempted = true
    attachments.reset(chosen)
    const projected = await spec.address(owner, draft)
    const record = await persist(projected)
    written = projected
    return record
  }
  const save = makeAggregateSave<T, D>({
    create: draft => write(draft, spec.create),
    update: (record, draft) => write(draft, projected => spec.update(record, projected), record.id),
    complete: async (record, draft) => {
      const placed = await spec.address(record.id, draft)
      // A create left out the attachments that needed its id; this update adds them.
      const final = isDraftChanged(placed, written) ? await spec.update(record, placed) : record
      await spec.complete?.(final, placed)
      spec.reconcile(placed)
      attachments.release(chosen)
      chosen = []
      return final
    }
  })
  return {
    stage,
    ...save,
    async discard() {
      const unreleased = chosen
      chosen = []
      await attachments.abandon(unreleased, !attempted)
    }
  }
}
