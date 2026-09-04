/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer onboarding state                                                    ║
║ Feature-local state shared by the onboarding wizard stages.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Holds transient state for one customer onboarding flow. Flat fields remain
signal-backed; the sites collection is store-backed for leaf updates.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
OnboardingState         Reactive state contract for customer onboarding stages.
createOnboardingState   Create state for a single customer onboarding flow.
cloneCustomerSite       Clone a customer site for draft editing.
cloneNote               Clone a note for draft editing.
newOnboardingSite       Create a blank site draft.
newOnboardingNote       Create a blank note draft.
siteLocation(site)      The site's single location.
*/

import { demandOne, when } from '@core/std'
import type { ContactPreferredChannel, Location, Note } from '@domain/abstractions/common.ts'
import type { Customer, CustomerSite } from '@domain/abstractions/customer.ts'
import type { CustomerStatus } from '@domain/abstractions/customer.ts'
import { type Accessor, createSignal, type Setter } from '@solid-js'
import { createStore, produce } from '@solid-js/store'

/** Reactive state used by the customer onboarding wizard. */
export type OnboardingState = {
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
  customer: Accessor<Customer | null>
  setCustomer: Setter<Customer | null>
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
 * Creates the feature-local state for a single onboarding flow.
 *
 * @returns Onboarding state scoped to one wizard instance.
 */
export const createOnboardingState = (): OnboardingState => {
  const [displayName, setDisplayName] = createSignal('')
  const [phoneNumber, setPhoneNumber] = createSignal('')
  const [preferredChannel, setPreferredChannel] = createSignal<ContactPreferredChannel>('email')
  const [email, setEmail] = createSignal('')
  const [name, setName] = createSignal('')
  const [status, setStatus] = createSignal<CustomerStatus>('prospect')
  const [line1, setLine1] = createSignal('')
  const [line2, setLine2] = createSignal('')
  const [city, setCity] = createSignal('')
  const [state, setState] = createSignal('')
  const [postalCode, setPostalCode] = createSignal('')
  const [country, setCountry] = createSignal('US')
  const [customer, setCustomer] = createSignal<Customer | null>(null)
  const [siteStore, setSiteStore] = createStore<CustomerSite[]>([])

  const sites = (): CustomerSite[] => siteStore
  const addSite = (site: CustomerSite = newOnboardingSite()): void =>
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
    note: CustomerSite['notes'][number] = newOnboardingNote()
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
    customer,
    setCustomer,
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
export const newOnboardingSite = (): CustomerSite => ({ label: '', location: [{}], notes: [] })

/** Produces an empty internal note with every field the domain requires. */
export const newOnboardingNote = (): Note => ({
  attachments: [],
  createdAt: when(),
  content: '',
  visibility: 'internal',
  tags: []
})

/** Clones a note so a draft can be edited without mutating committed state. */
export const cloneNote = (note: Note): Note => ({
  ...note,
  attachments: [...note.attachments],
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
