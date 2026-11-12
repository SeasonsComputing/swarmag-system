/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder editor state                                                    ║
║ One editor's metadata draft, durable selections, and retry identity.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Owns description, optional source URL, and a selected document reference. The
entry id is minted once per editor, including retries. File choice stages
immediately through the existing Binder Uploads instance. Late completions
remain editor-owned after Close; staging is discarded only before a write
attempt. This is plain draft state, not a persisted editor or upload engine.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FieldBinderDraft   Editor-owned save projection.
├ id               Stable entry identity.
├ description      Editable description.
├ url              Editable source URL.
├ documentAddress  Selected or published file reference.
└ createdAt        Original entry creation time.
FieldBinderState   One retained editor lifetime.
├ description      Required description reader.
├ setDescription   Edit the description.
├ url              Optional URL reader.
├ setUrl           Edit the URL.
├ documentAddress  Current file reference.
├ fileName         Filename chosen in this editor.
├ pending          Capture is still running.
├ draft            Owned-field projection for dirty checks.
├ choose           Capture and adopt only the latest choice.
├ save             Publish through the source with stable identity.
└ discard          Close and discard pre-write staging only.
createFieldBinderState Open an editor against its source publication baseline.
*/

import { id, notValid, when } from '@core/std'
import type { Id, When } from '@core/std'
import type { DocumentId } from '@core/stdx'
import { FieldBinderMetadata } from '@front/api/field-binder-inventory.ts'
import type { FieldBinderEntry } from '@front/api/field-binder-inventory.ts'
import type { FieldBinderSource } from '@front/api/field-binder-source.ts'
import { createSignal } from '@solid-js'
import type { Accessor, Setter } from '@solid-js'

/** Explicit fields owned by this feature editor; no temporary links or File objects. */
export type FieldBinderDraft = {
  id: Id
  description: string
  url: string
  documentAddress: string
  createdAt: When
}

/** One retained editor lifetime, independent of its mounted Step. */
export type FieldBinderState = {
  description: Accessor<string>
  setDescription: Setter<string>
  url: Accessor<string>
  setUrl: Setter<string>
  documentAddress: Accessor<string>
  fileName: Accessor<string>
  pending: Accessor<boolean>
  draft: () => FieldBinderDraft
  choose: (file: File) => Promise<void>
  save: (draft: FieldBinderDraft) => Promise<FieldBinderEntry>
  discard: () => Promise<void>
}

/** Bind one editor to its captured publication and existing source service. */
export const createFieldBinderState = (
  source: FieldBinderSource,
  item: FieldBinderEntry | null,
  baseline: string | undefined
): FieldBinderState => {
  const entryId = item?.id ?? id()
  const createdAt = item?.createdAt ?? when()
  const [description, setDescription] = createSignal(item?.description ?? '')
  const [url, setUrl] = createSignal(item?.url ?? '')
  const [documentAddress, setDocumentAddress] = createSignal(item?.documentAddress ?? '')
  const [fileName, setFileName] = createSignal('')
  const [pendingCount, setPendingCount] = createSignal(0)
  const staged: DocumentId[] = []
  let attempted = false
  let closed = false
  let selection = 0
  let publication = baseline

  return {
    description,
    setDescription,
    url,
    setUrl,
    documentAddress,
    fileName,
    pending: () => pendingCount() > 0,
    draft: () => ({
      id: entryId,
      description: description(),
      url: url(),
      documentAddress: documentAddress(),
      createdAt
    }),
    async choose(file: File): Promise<void> {
      const choice = ++selection
      setPendingCount(count => count + 1)
      try {
        const document = await source.stage(file)
        if (closed && !attempted) {
          await source.discard([document.id])
          return
        }
        staged.push(document.id)
        if (closed || choice !== selection) return
        setDocumentAddress(FieldBinderMetadata.address(document.id))
        setFileName(document.name)
        if (!description().trim()) setDescription(document.name)
      } finally {
        setPendingCount(count => count - 1)
      }
    },
    async save(draft: FieldBinderDraft): Promise<FieldBinderEntry> {
      if (pendingCount() > 0) {
        return notValid('Wait for the chosen file to finish saving on this device.')
      }
      if (!draft.documentAddress) return notValid('Choose a document file.')
      attempted = true
      const entry: FieldBinderEntry = {
        id: draft.id,
        description: draft.description.trim(),
        documentAddress: draft.documentAddress,
        createdAt: draft.createdAt,
        updatedAt: when(),
        ...(draft.url.trim() ? { url: draft.url.trim() } : {})
      }
      const result = await source.save(entry, publication)
      publication = FieldBinderMetadata.address(result.publication.document.id)
      return result.entry
    },
    async discard(): Promise<void> {
      closed = true
      if (!attempted) await source.discard(staged)
    }
  }
}
