/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Note attachments                                                             ║
║ Picker and document actions for a note draft.                                ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Picker and document actions for a note draft.

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
  UiFieldset,
  UiFormActions,
  UiInput,
  UiLayout,
  UiTable,
  UiTableBody,
  UiTableCell,
  UiTableHeader,
  UiTableRow,
  UiText,
  UiWindow
} from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { LabelCell } from './table-cells.tsx'

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
  const [pickerOpen, setPickerOpen] = createSignal(false)
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
      if (files.length) setPickerOpen(false)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to attach file.')
    } finally {
      setBusy(false)
      props.busy(false)
    }
  }
  const open = async (attachment: Attachment): Promise<void> => {
    if (busy()) return
    try {
      await UiWindow.openResolved(
        async () => (await api.Attachments.link(attachment)).url,
        'Allow a secondary window to open this attachment.'
      )
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to open attachment.')
    }
  }
  return (
    <UiLayout>
      <Show when={error()}>
        <UiAlert variant='danger'>{error()}</UiAlert>
      </Show>
      <UiFieldset legend='Attachments'>
        <UiLayout>
          <UiLayout variant='inline-fit'>
            <UiActionButton
              icon='plus'
              label='Add Attachment'
              labelMode='visible'
              align='start'
              density='dense'
              disabled={busy()}
              onClick={() => setPickerOpen(true)}
            />
          </UiLayout>
          <Show when={pickerOpen()}>
            <UiField label='Add files' for='note-files'>
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
          </Show>
          <Show when={busy()}>
            <p role='status'>Attaching files…</p>
          </Show>
          <div data-shell='attachment-list'>
            <Show
              when={props.attachments().length > 0}
              fallback={
                <p data-shell='attachment-list-empty'>
                  <span>
                    No attachments yet. Use <kbd>Add Attachment</kbd> to add one.
                  </span>
                </p>
              }
            >
              <UiTable>
                <UiTableHeader>
                  <UiTableCell>File</UiTableCell>
                  <UiTableCell align='end'>Size</UiTableCell>
                  <UiTableCell align='end'>Actions</UiTableCell>
                </UiTableHeader>
                <UiTableBody>
                  <For each={props.attachments()}>
                    {(attachment, index) => (
                      <UiTableRow onActivate={() => void open(attachment)}>
                        <UiTableCell>
                          <LabelCell
                            text={attachment.filename}
                            icon={AttachmentIcons[attachment.kind]}
                          />
                        </UiTableCell>
                        <UiTableCell align='end'>
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
            </Show>
          </div>
        </UiLayout>
      </UiFieldset>
      <Show when={remove() !== null}>
        <UiDialog open size='content' onOpenChange={open => !open && setRemove(null)}>
          <UiLayout>
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
          </UiLayout>
        </UiDialog>
      </Show>
      <Show when={rename() !== null}>
        <UiDialog open size='panel' onOpenChange={open => !open && setRename(null)}>
          <UiLayout>
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
                variant='primary'
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
          </UiLayout>
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
    <span data-shell='attachment-size' title={size.error ? 'Unable to read document size' : undefined}>
      {size.error ? 'Unavailable' : size.loading ? '…' : UiText.size(size()!)}
    </span>
  )
}

/** Exhaustive kind-to-catalog mapping; video uses the generic file glyph. */
const AttachmentIcons: { [Kind in AttachmentKind]: string } = {
  photo: 'image',
  map: 'globe',
  document: 'file-text',
  video: 'file'
}
