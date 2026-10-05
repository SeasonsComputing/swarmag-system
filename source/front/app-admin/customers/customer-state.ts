/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer draft state                                                         ║
║ Feature-local state shared by the Customer steps.                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Holds transient state for one Customer draft. Flat fields remain
signal-backed; the sites collection is store-backed for leaf updates.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CustomerDraft         Fields edited by the Customer surface.
customerDraft         Project state into an isolated aggregate draft.
CustomerState         Reactive state contract for Customer steps.
createCustomerState   Create state for a single Customer draft.
cloneCustomerSite     Clone a customer site for draft editing.
cloneNote             Clone a note for draft editing.
newCustomerSite       Create a blank site draft.
newCustomerNote       Create a blank note draft.
siteLocation(site)    The site's single location.
*/

import { demandOne, toTrimmed, when } from '@core/std'
import type { DraftOf } from '@core/stdx'
import type { ContactPreferredChannel, Location, Note } from '@domain/abstractions/common.ts'
import type { Customer, CustomerSite, CustomerStatus } from '@domain/abstractions/customer.ts'
import type { scopes } from '@front/api/form-scopes.ts'
import { createSignal } from '@solid-js'
import type { Accessor, Setter } from '@solid-js'
import { createStore, produce } from '@solid-js/store'
import { UiText } from '@ux/ui'

/** Domain fields owned by the Customer workbench. */
export type CustomerDraft = DraftOf<typeof scopes.Customers.detail>

/** Project an isolated Customer draft; optional control text becomes domain absence. */
export const customerDraft = (state: CustomerState): CustomerDraft => ({
  primaryContact: [{
    displayName: toTrimmed(state.displayName()),
    phoneNumber: toTrimmed(state.phoneNumber()),
    preferredChannel: state.preferredChannel(),
    ...(state.email().trim() ? { email: toTrimmed(state.email()) } : {})
  }],
  sites: state.sites().map(cloneCustomerSite),
  name: toTrimmed(state.name()),
  status: state.status(),
  line1: toTrimmed(state.line1()),
  line2: UiText.optional(state.line2()),
  city: toTrimmed(state.city()),
  state: toTrimmed(state.state()),
  postalCode: toTrimmed(state.postalCode()),
  country: toTrimmed(state.country())
})

/** Reactive state used by the Customer workbench. */
export type CustomerState = {
  displayName: Accessor<string>
  setDisplayName: Setter<string>
  phoneNumber: Accessor<string>
  setPhoneNumber: Setter<string>
  preferredChannel: Accessor<ContactPreferredChannel>
  setPreferredChannel: Setter<ContactPreferredChannel>
  email: Accessor<string>
  setEmail: Setter<string>
  name: Accessor<string>
  setName: Setter<string>
  status: Accessor<CustomerStatus>
  setStatus: Setter<CustomerStatus>
  line1: Accessor<string>
  setLine1: Setter<string>
  line2: Accessor<string>
  setLine2: Setter<string>
  city: Accessor<string>
  setCity: Setter<string>
  state: Accessor<string>
  setState: Setter<string>
  postalCode: Accessor<string>
  setPostalCode: Setter<string>
  country: Accessor<string>
  setCountry: Setter<string>
  sites: Accessor<CustomerSite[]>
  addSite: (site?: CustomerSite) => void
  setSite: (index: number, site: CustomerSite) => void
  updateSite: (index: number, update: (site: CustomerSite) => void) => void
  removeSite: (index: number) => void
  updateLocation: (index: number, update: (location: Location) => Location) => void
  addNote: (sitePosition: number, note?: CustomerSite['notes'][number]) => void
  updateNote: (
    sitePosition: number,
    notePosition: number,
    update: (note: CustomerSite['notes'][number]) => void
  ) => void
  removeNote: (sitePosition: number, notePosition: number) => void
}

/**
 * Creates the feature-local state for a single Customer draft.
 *
 * @returns Customer state scoped to one workbench instance.
 */
export const createCustomerState = (customer: Customer | null = null): CustomerState => {
  const contact = customer ? demandOne(customer.primaryContact) : null
  const [displayName, setDisplayName] = createSignal(contact?.displayName ?? '')
  const [phoneNumber, setPhoneNumber] = createSignal(contact?.phoneNumber ?? '')
  const [preferredChannel, setPreferredChannel] = createSignal<ContactPreferredChannel>(
    contact?.preferredChannel ?? 'email'
  )
  const [email, setEmail] = createSignal(contact?.email ?? '')
  const [name, setName] = createSignal(customer?.name ?? '')
  const [status, setStatus] = createSignal<CustomerStatus>(customer?.status ?? 'prospect')
  const [line1, setLine1] = createSignal(customer?.line1 ?? '')
  const [line2, setLine2] = createSignal(customer?.line2 ?? '')
  const [city, setCity] = createSignal(customer?.city ?? '')
  const [state, setState] = createSignal(customer?.state ?? '')
  const [postalCode, setPostalCode] = createSignal(customer?.postalCode ?? '')
  const [country, setCountry] = createSignal(customer?.country ?? 'US')
  const [siteStore, setSiteStore] = createStore<CustomerSite[]>(
    customer?.sites.map(cloneCustomerSite) ?? []
  )

  const sites = (): CustomerSite[] => siteStore
  const addSite = (site: CustomerSite = newCustomerSite()): void =>
    setSiteStore(siteStore.length, cloneCustomerSite(site))
  const setSite = (index: number, site: CustomerSite): void =>
    setSiteStore(index, cloneCustomerSite(site))
  const updateSite = (index: number, update: (site: CustomerSite) => void): void => {
    setSiteStore(index, produce(update))
  }
  const removeSite = (index: number): void => setSiteStore(sites => sites.filter((_, i) => i !== index))
  const updateLocation = (index: number, update: (location: Location) => Location): void => {
    updateSite(index, site => site.location = [update(demandOne(site.location))])
  }
  const addNote = (
    sitePosition: number,
    note: CustomerSite['notes'][number] = newCustomerNote()
  ): void => {
    setSiteStore(sitePosition, 'notes', notes => [...notes, cloneNote(note)])
  }
  const updateNote = (
    sitePosition: number,
    notePosition: number,
    update: (note: CustomerSite['notes'][number]) => void
  ): void => {
    setSiteStore(sitePosition, produce(site => update(site.notes[notePosition])))
  }
  const removeNote = (sitePosition: number, notePosition: number): void => {
    setSiteStore(sitePosition, 'notes', notes => notes.filter((_, i) => i !== notePosition))
  }

  return {
    displayName,
    setDisplayName,
    phoneNumber,
    setPhoneNumber,
    preferredChannel,
    setPreferredChannel,
    email,
    setEmail,
    name,
    setName,
    status,
    setStatus,
    line1,
    setLine1,
    line2,
    setLine2,
    city,
    setCity,
    state,
    setState,
    postalCode,
    setPostalCode,
    country,
    setCountry,
    sites,
    addSite,
    setSite,
    updateSite,
    removeSite,
    updateLocation,
    addNote,
    updateNote,
    removeNote
  }
}

// ────────────────────────────────────────────────────────────────────────────
// FACTORIES AND ACCESSORS
// ────────────────────────────────────────────────────────────────────────────

/** Produces an empty customer site satisfying the domain's cardinality rules. */
export const newCustomerSite = (): CustomerSite => ({
  label: '',
  location: [{ country: 'US' }],
  notes: []
})

/** Produces an empty internal note with every field the domain requires. */
export const newCustomerNote = (): Note => ({
  attachments: [],
  createdAt: when(),
  content: '',
  visibility: 'internal',
  tags: []
})

/** Clones a note so a draft can be edited without mutating committed state. */
export const cloneNote = (note: Note): Note => ({
  ...note,
  attachments: note.attachments.map(attachment => ({ ...attachment })),
  tags: [...note.tags]
})

/** Clones a customer site so a draft can be edited without mutating committed state. */
export const cloneCustomerSite = (site: CustomerSite): CustomerSite => ({
  ...site,
  location: site.location.map(location => ({ ...location })) as CustomerSite['location'],
  notes: site.notes.map(cloneNote)
})

/** Reads the site's single location. */
export const siteLocation = (site: CustomerSite): Location => demandOne(site.location)
