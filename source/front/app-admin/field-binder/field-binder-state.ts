/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Field Binder editor state                                                    ║
║ One editor's entry draft, its chosen document's upload task, and identity.   ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Owns one entry's description, how its document arrives, and, on Edit, the
document's name. The entry id is minted once per editor, including retries. Add
chooses one document by Upload, Library, or Chemicals, where a chemical
document's link becomes the source URL and the user uploads the file it holds;
choosing a file starts its upload task, and only the latest choice is kept.
Save publishes the entry once and waits for no transfer, then releases the
task, which places the document for the drain. Edit never replaces the document: once delivered, a changed name
renames it, and until then the source URL stays editable. Closing before any
write attempt discards the chosen document's staging.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
FieldBinderDraft    Editor-owned save projection.
├ id                Stable entry identity.
├ description       Editable title.
├ documentAddress   The document's placed reference.
├ upload            How the document arrives.
└ name              The document's name.
FieldBinderState    One retained editor lifetime.
├ adding            Add, not Edit.
├ description       Required description reader.
├ setDescription    Edit the description.
├ source            How Add takes the document.
├ setSource         Switch Upload, Library, or Chemicals.
├ url               Source URL reader.
├ setUrl            Edit the source URL.
├ link              The chosen chemical document's name.
├ chooseLink        Take a chemical document's link as the source URL.
├ name              The document's name.
├ setName           Edit the name of a delivered document.
├ kind              The chosen document's kind.
├ delivered         The document is on the server.
├ uploadedAt        The server document's creation time.
├ draft             Owned-field projection for dirty checks.
├ choose            Start the chosen document's upload task.
├ save              Publish through the source with stable identity.
└ discard           Close: end an unreleased task.
createFieldBinderState Open an editor against its publication baseline.
*/

import { id, notValid } from '@core/std'
import type { Id, When } from '@core/std'
import type { DocumentId, NodeMetadata } from '@core/stdx'
import type { AttachmentKind } from '@domain/abstractions/common.ts'
import { AttachmentFormats } from '@front/api/attachment-formats.ts'
import type { LibraryTopic } from '@front/api/attachments.ts'
import { FieldBinderMetadata } from '@front/api/field-binder-inventory.ts'
import type {
  FieldBinderEntry,
  FieldBinderUpload,
  FieldBinderUploadSource
} from '@front/api/field-binder-inventory.ts'
import type { FieldBinderSource } from '@front/api/field-binder-source.ts'
import type { UploadRead, UploadTask } from '@front/api/upload-task.ts'
import { createSignal } from '@solid-js'
import type { Accessor, Setter } from '@solid-js'

/** Explicit fields owned by this feature editor; no temporary links or File objects. */
export type FieldBinderDraft = {
  id: Id
  description: string
  documentAddress: string
  upload: FieldBinderUpload
  name: string
}

/** One retained editor lifetime, independent of its mounted Step. */
export type FieldBinderState = {
  adding: boolean
  description: Accessor<string>
  setDescription: Setter<string>
  source: Accessor<FieldBinderUploadSource>
  setSource: (source: FieldBinderUploadSource) => void
  url: Accessor<string>
  setUrl: Setter<string>
  link: Accessor<string>
  chooseLink: (name: string, url: string) => void
  name: Accessor<string>
  setName: Setter<string>
  kind: Accessor<AttachmentKind | undefined>
  delivered: boolean
  uploadedAt: When | undefined
  draft: () => FieldBinderDraft
  choose: (name: string, read: UploadRead, record?: { topic: LibraryTopic; id: Id }) => void
  save: (draft: FieldBinderDraft) => Promise<FieldBinderEntry>
  discard: () => Promise<void>
}

/**
 * Bind one editor to its captured publication and the source service.
 * @param document On Edit, the entry's server document; undefined while it is pending.
 */
export const createFieldBinderState = (
  source: FieldBinderSource,
  item: FieldBinderEntry | null,
  baseline: string | undefined,
  document?: NodeMetadata<DocumentId>
): FieldBinderState => {
  const entryId = item?.id ?? id()
  const [description, setDescription] = createSignal(item?.description ?? '')
  const [uploadSource, setUploadSource] = createSignal(item?.upload.source ?? 'upload')
  const [url, setUrl] = createSignal(item?.upload.url ?? '')
  const [link, setLink] = createSignal('')
  const [name, setName] = createSignal(document?.name ?? '')
  const [kind, setKind] = createSignal(item?.upload.kind)
  const [task, setTask] = createSignal<UploadTask | undefined>()
  const [record, setRecord] = createSignal(item?.upload.record)
  let attempted = false
  let publication = baseline

  /** End a chosen document's task that no Save released. */
  const drop = (chosen: UploadTask | undefined): Promise<void> =>
    chosen === undefined ? Promise.resolve() : chosen.abandon(!attempted)

  const upload = (): FieldBinderUpload => {
    const arrived = item?.upload
    if (arrived) {
      return arrived.source === 'url' && !document ? { ...arrived, url: url().trim() } : arrived
    }
    const base = { source: uploadSource(), kind: kind() ?? 'document' }
    const chosenRecord = record()
    if (base.source === 'url') return { ...base, url: url().trim() }
    if (base.source === 'library' && chosenRecord) return { ...base, record: chosenRecord }
    return base
  }

  return {
    adding: item === null,
    description,
    setDescription,
    source: uploadSource,
    setSource(next: FieldBinderUploadSource) {
      if (next === uploadSource()) return
      void drop(task())
      setTask(undefined)
      setName('')
      setKind(undefined)
      setRecord(undefined)
      setUrl('')
      setLink('')
      setUploadSource(next)
    },
    url,
    setUrl,
    link,
    chooseLink(chosenName, chosenUrl) {
      setLink(chosenName)
      setUrl(chosenUrl)
      if (!description().trim()) setDescription(chosenName)
    },
    name,
    setName,
    kind,
    delivered: document !== undefined,
    uploadedAt: document?.createdAt,
    draft: () => {
      const chosen = task()
      const placed = chosen ? FieldBinderMetadata.placed(chosen.id) : ''
      return {
        id: entryId,
        description: description(),
        documentAddress: item?.documentAddress ?? placed,
        upload: upload(),
        name: name()
      }
    },
    choose(chosenName, read, chosenRecord) {
      const recognized = AttachmentFormats.recognize(new File([], chosenName))
      const next = source.choose(chosenName, read)
      void drop(task())
      setTask(next)
      setName(chosenName)
      setKind(recognized.kind)
      setRecord(chosenRecord)
      if (!description().trim()) setDescription(chosenName)
    },
    async save(draft: FieldBinderDraft): Promise<FieldBinderEntry> {
      if (!draft.documentAddress) return notValid('Choose a document.')
      attempted = true
      if (item && document && draft.name.trim() !== document.name) {
        await source.rename(item, draft.name.trim())
      }
      const entry: FieldBinderEntry = {
        id: draft.id,
        description: draft.description.trim(),
        documentAddress: draft.documentAddress,
        upload: draft.upload
      }
      const result = await source.save(entry, publication)
      publication = FieldBinderMetadata.address(result.publication.document.id)
      const chosen = task()
      setTask(undefined)
      if (chosen) void source.place(chosen)
      return result.entry
    },
    async discard(): Promise<void> {
      const chosen = task()
      setTask(undefined)
      await drop(chosen)
    }
  }
}
