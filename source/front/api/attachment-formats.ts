/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Attachment formats                                                           ║
║ The accepted attachment formats, recognized by extension from one table.     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Names every accepted attachment format in one table. Recognition and the picker
filter both read it, so adding or removing a format is one entry. A document is
stored and opened with the table's content type, so a file never runs as what
its bytes might be.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AttachmentFormats  Format recognition and picker filters over the table.
├ recognize        A file's kind and content type, by its extension.
└ accept           Picker filter for the given kinds.
*/

import { notValid } from '@core/std'
import type { AttachmentKind } from '@domain/abstractions/common.ts'

/** An accepted attachment format. */
type AttachmentFormat = {
  kind: AttachmentKind
  contentType: string
  extensions: readonly string[]
}

/** Every accepted format; a file in none is refused. Video is deferred, so it has no entry. */
const ATTACHMENT_FORMATS: readonly AttachmentFormat[] = [
  { kind: 'photo', contentType: 'image/jpeg', extensions: ['.jpg', '.jpeg'] },
  { kind: 'photo', contentType: 'image/png', extensions: ['.png'] },
  { kind: 'photo', contentType: 'image/heic', extensions: ['.heic'] },
  { kind: 'photo', contentType: 'image/heif', extensions: ['.heif'] },
  { kind: 'photo', contentType: 'image/webp', extensions: ['.webp'] },
  { kind: 'map', contentType: 'image/tiff', extensions: ['.tif', '.tiff'] },
  { kind: 'document', contentType: 'application/pdf', extensions: ['.pdf'] },
  { kind: 'document', contentType: 'text/plain', extensions: ['.txt'] },
  { kind: 'document', contentType: 'text/markdown', extensions: ['.md'] },
  { kind: 'document', contentType: 'application/json', extensions: ['.json'] }
]

/** Recognition and picker rules for Attachments. */
export const AttachmentFormats = {
  /** The picker's accept string for the host's kinds: their content types and file extensions. */
  accept(kinds: readonly AttachmentKind[]): string {
    const formats = ATTACHMENT_FORMATS.filter(format => kinds.includes(format.kind))
    const contentTypes = formats.map(format => format.contentType)
    const extensions = formats.flatMap(format => format.extensions)
    return [...contentTypes, ...extensions].join(',')
  },

  /** A file's kind and content type, from the format that owns its extension; any other is refused. */
  recognize(file: File): { kind: AttachmentKind; contentType: string } {
    const dot = file.name.lastIndexOf('.')
    const extension = dot < 0 ? '' : file.name.slice(dot).toLowerCase()
    const format = ATTACHMENT_FORMATS.find(entry => entry.extensions.includes(extension))
    if (!format) return notValid('This file format is not accepted.')
    return { kind: format.kind, contentType: format.contentType }
  }
}
