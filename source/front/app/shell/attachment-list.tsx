/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Note attachments                                                             ║
║ Picker, drop target, and document actions for a note draft.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Picker, drop target, and document actions for a note draft.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AttachmentListProps  Draft inputs and staging callback.
├ attachments        Current note attachments.
├ onChange           Replace the draft attachments.
├ attach             Stage a chosen file.
├ kinds              Accepted attachment kinds.
└ busy               Report staging to the note Save gate.
AttachmentList       Render the attachment collection.
*/

import { notValid } from '@core/std'
import type { Attachment, AttachmentKind } from '@domain/abstractions/common.ts'
import { api } from '@front/api/api.ts'
import { AttachmentFormats } from '@front/api/attachment-formats.ts'
import { createResource, createSignal, For, Show } from '@solid-js'
import {
  UiActionButton,
  UiAlert,
  UiButton,
  UiDialog,
  UiField,
  UiFormActions,
  UiInput,
  UiLayout,
  UiTable,
  UiTableBody,
  UiTableCell,
  UiTableHeader,
  UiTableRow
} from '@ux/ui'
import type { UiComponent } from '@ux/ui'

/** Controlled attachment collection inside a note draft. */
export type AttachmentListProps = {
  attachments: () => readonly Attachment[]
  onChange: (attachments: readonly Attachment[]) => void
  attach: (file: File) => Promise<Attachment>
  kinds: readonly AttachmentKind[]
  busy: (busy: boolean) => void
}

/** Render file capture and metadata-only editing without persisting the record. */
export const AttachmentList = (props: AttachmentListProps): UiComponent => {
  const [busy, setBusy] = createSignal(false)
  const [error, setError] = createSignal('')
  const [remove, setRemove] = createSignal<number | null>(null)
  const [rename, setRename] = createSignal<number | null>(null)
  const [filename, setFilename] = createSignal('')
  const capture = async (files: readonly File[]): Promise<void> => {
    if (busy()) return
    setBusy(true)
    props.busy(true)
    setError('')
    try {
      for (const file of files) {
        // Recognition also runs before staging so a host restriction never stores refused bytes.
        const recognized = AttachmentFormats.recognize(file)
        if (!props.kinds.includes(recognized.kind)) notValid('This attachment kind is not accepted.')
        const attachment = await props.attach(file)
        props.onChange([...props.attachments(), attachment])
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to attach file.')
    } finally {
      setBusy(false)
      props.busy(false)
    }
  }
  const open = async (attachment: Attachment): Promise<void> => {
    const viewer = globalThis.open('about:blank', '_blank')
    if (!viewer) {
      setError('Allow a secondary window to open this attachment.')
      return
    }
    viewer.opener = null
    try {
      const link = await api.Attachments.link(attachment)
      viewer.location.href = link.url
    } catch (error) {
      viewer.close()
      setError(error instanceof Error ? error.message : 'Unable to open attachment.')
    }
  }
  return (
    <UiLayout>
      <Show when={error()}>
        <UiAlert variant='danger'>{error()}</UiAlert>
      </Show>
      <div
        data-shell='attachment-drop'
        onDragOver={event => event.preventDefault()}
        onDrop={event => {
          event.preventDefault()
          void capture(Array.from(event.dataTransfer?.files ?? []))
        }}
      >
        <UiField label='Add files or drop them here' for='note-files'>
          <UiInput
            name='note-files'
            type='file'
            multiple
            disabled={busy() || !api.Attachments.accept(props.kinds)}
            accept={api.Attachments.accept(props.kinds)}
            onInput={event => {
              // Reset before the text-field primitive reads it; file inputs cannot accept text.
              const files = Array.from(event.currentTarget.files ?? [])
              event.currentTarget.value = ''
              void capture(files)
            }}
          />
        </UiField>
      </div>
      <Show when={busy()}>
        <p role='status'>Attaching files…</p>
      </Show>
      <div data-shell='attachment-list'>
        <UiTable>
          <UiTableHeader>
            <UiTableCell>File</UiTableCell>
            <UiTableCell>Size</UiTableCell>
            <UiTableCell align='end'>Actions</UiTableCell>
          </UiTableHeader>
          <UiTableBody>
            <For each={props.attachments()}>
              {(attachment, index) => (
                <UiTableRow onActivate={() => void open(attachment)}>
                  <UiTableCell>
                    <UiActionButton
                      icon={attachment.kind === 'photo' ? 'image' : 'file-text'}
                      label={attachment.filename}
                      labelMode='visible'
                      disabled={busy()}
                      onClick={event => {
                        event.stopPropagation()
                        void open(attachment)
                      }}
                    />
                  </UiTableCell>
                  <UiTableCell>
                    <AttachmentSize attachment={attachment} />
                  </UiTableCell>
                  <UiTableCell align='end'>
                    <UiActionButton
                      icon='pencil-1'
                      label='Rename'
                      disabled={busy()}
                      onClick={event => {
                        event.stopPropagation()
                        setFilename(attachment.filename)
                        setRename(index())
                      }}
                    />
                    <UiActionButton
                      icon='minus'
                      label='Remove'
                      disabled={busy()}
                      onClick={event => {
                        event.stopPropagation()
                        setRemove(index())
                      }}
                    />
                  </UiTableCell>
                </UiTableRow>
              )}
            </For>
          </UiTableBody>
        </UiTable>
      </div>
      <Show when={remove() !== null}>
        <UiDialog open size='content' onOpenChange={open => !open && setRemove(null)}>
          <h2>Remove attachment?</h2>
          <p>This attachment will be removed from the note.</p>
          <UiFormActions>
            <UiButton variant='ghost' onClick={() => setRemove(null)}>Cancel</UiButton>
            <UiButton
              variant='danger'
              onClick={() => {
                props.onChange(props.attachments().filter((_, i) => i !== remove()))
                setRemove(null)
              }}
            >
              Remove
            </UiButton>
          </UiFormActions>
        </UiDialog>
      </Show>
      <Show when={rename() !== null}>
        <UiDialog open size='content' onOpenChange={open => !open && setRename(null)}>
          <h2>Rename attachment</h2>
          <UiField label='Filename' for='attachment-name'>
            <UiInput
              name='attachment-name'
              value={filename()}
              onInput={event => setFilename(event.currentTarget.value)}
            />
          </UiField>
          <UiFormActions>
            <UiButton variant='ghost' onClick={() => setRename(null)}>Cancel</UiButton>
            <UiButton
              disabled={!filename().trim()}
              onClick={() => {
                props.onChange(
                  props.attachments().map((item, i) =>
                    i === rename()
                      ? { ...item, filename: filename().trim() }
                      : item
                  )
                )
                setRename(null)
              }}
            >
              Save
            </UiButton>
          </UiFormActions>
        </UiDialog>
      </Show>
    </UiLayout>
  )
}

/** Store metadata supplies size without adding fields to Attachment. */
const AttachmentSize = (props: { attachment: Attachment }): UiComponent => {
  const [size] = createResource(
    () => props.attachment.documentAddress,
    () => api.Attachments.size(props.attachment)
  )
  return (
    <span title={size.error ? 'Unable to read document size' : undefined}>
      {size.error ? 'Unavailable' : size.loading ? '…' : `${size()} bytes`}
    </span>
  )
}
