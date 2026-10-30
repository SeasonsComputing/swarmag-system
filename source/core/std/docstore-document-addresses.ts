/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Document addresses                                                           ║
║ Build, parse, format, and validate document store addresses.                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
An address names a namespace, bucket, or document by one to three segments,
each a name or id:{uuid}. These operations need no store: names are resolved
by the store's contracts, and an id-form document reference becomes a DocumentId
here.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
DocumentAddresses    Address operations; the type is DocumentAddress.
├ build              Construct an address from segments.
├ parse              Parse a slash-delimited address.
├ format             Render an address as text.
├ validate           Recognize valid address text.
└ id                 Parse an id-form document reference.
*/

import { isDictionary } from './adt.ts'
import { documentIdentity } from './docstore-contract.ts'
import type { AddressSegment, DocumentAddress, DocumentId } from './docstore-contract.ts'
import { type Id, isId } from './identifier.ts'
import { notValid, ValidatorError } from './validators.ts'

/** Document address operations; id-form references need no store. */
export const DocumentAddresses = {
  /** Build an address from its segments; a document requires a bucket. */
  build(namespace: AddressSegment, bucket?: AddressSegment, document?: AddressSegment): DocumentAddress {
    if (document !== undefined && bucket === undefined) notValid('Document address requires a bucket')
    const segments = [namespace]
    if (bucket !== undefined) segments.push(bucket)
    if (document !== undefined) segments.push(document)
    return DocumentAddresses.parse(DocumentAddresses.format(segments))
  },

  /** Parse address text into one to three segments; fails through notValid. */
  parse(address: string): DocumentAddress {
    const segments = address.split('/')
    if (segments.length < 1 || segments.length > 3) notValid('Address requires one to three segments')
    return segments.map(segment => {
      if (segment.startsWith('id:')) {
        const value = segment.slice(3)
        if (!isId(value)) return notValid('Address id must be a UUID v7')
        return { id: value }
      }
      if (!validName(segment)) return notValid('Address name must be nonblank and contain no slash')
      return segment
    })
  },

  /** Render an address as text: names as written, ids as id:{uuid}. */
  format(address: DocumentAddress): string {
    if (address.length < 1 || address.length > 3) notValid('Address requires one to three segments')
    return address.map(segment => {
      if (typeof segment === 'string') {
        if (!validName(segment)) return notValid('Invalid document store name')
        return segment
      }
      if (!isDictionary(segment) || !isId(segment.id)) return notValid('Invalid address id')
      return `id:${segment.id}`
    }).join('/')
  },

  /** Recognize valid address text without throwing. */
  validate(address: string): boolean {
    try {
      DocumentAddresses.parse(address)
      return true
    } catch (error) {
      if (error instanceof ValidatorError) return false
      throw error
    }
  },

  /** Turn an id-form document reference into a DocumentId, with no store lookup. */
  id(reference: string): DocumentId {
    const address = DocumentAddresses.parse(reference)
    if (address.length !== 3 || address.some(segment => typeof segment === 'string')) {
      return notValid('Document reference requires three id segments')
    }
    const segments = address as readonly { id: Id }[]
    return documentIdentity({
      namespace: segments[0].id,
      bucket: segments[1].id,
      document: segments[2].id
    })
  }
}

/** A valid name: nonblank, no slash, and not in id form. */
const validName = (value: string): boolean =>
  value.trim().length > 0 && !value.includes('/') && !value.startsWith('id:')
