/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder Library dialog                                                  ║
║ Chooses one Library attachment: topic, then record, then document.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Uses shared Library levels to walk topics, records, and documents. Choosing a
document hands back its name, a read of its bytes through Attachments that
reports download progress from the response body, and the record it came from.
The Binder keeps its own copy, so a record's attachment can change freely.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FieldBinderLibraryDialogProps  Dialog inputs.
├ disabled                     The host is busy.
├ name                         The form field the picker fills.
├ error                        The field is shown invalid.
└ onChoose                     Receives the chosen document.
FieldBinderLibraryDialog       Choose-from-library button and sheet.
*/

import type { Id } from '@core/std'
import { api } from '@front/api/api.ts'
import type { LibraryTopic } from '@front/api/attachments.ts'
import type { UploadRead } from '@front/api/upload-task.ts'
import { DrillDialog } from '@front/app/shell/retrieval/drill-dialog.tsx'
import { LibraryLevels } from '@front/app/shell/retrieval/library-levels.ts'
import type { UiComponent } from '@ux/ui'

/** The host's busy state and the chosen document's receiver. */
export type FieldBinderLibraryDialogProps = {
  disabled: boolean
  name: string
  error: boolean
  onChoose: (name: string, read: UploadRead, record: { topic: LibraryTopic; id: Id }) => void
}

/** A dialog over the Library: topic, record, then document; choosing one closes it. */
export const FieldBinderLibraryDialog = (props: FieldBinderLibraryDialogProps): UiComponent => {
  return (
    <DrillDialog
      label='Choose from library'
      title='Library'
      disabled={props.disabled}
      name={props.name}
      error={props.error}
      root={LibraryLevels.root((attachment, record) =>
        props.onChoose(
          attachment.filename,
          report => api.Attachments.file(attachment, report),
          record
        )
      )}
    />
  )
}
