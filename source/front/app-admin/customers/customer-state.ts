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
ACCOUNT_MANAGER_ROLES  Roles for account-manager defaults and choices.
CustomerDraft          Fields edited by the Customer surface.
customerDraft          Project state into an isolated aggregate draft.
CustomerState          Reactive state contract for Customer steps.
createCustomerState    Create state for a single Customer draft.
newCustomerSite        Create a blank site draft.
customerSiteDraft      Project an edited site for saving.
siteLocation(site)     The site's single location.
*/

import { demandOne, toEmail, toTrimmed } from '@core/std'
import type { Id } from '@core/std'
import type { DraftOf, QuerySet } from '@core/stdx'
import type { ContactPreferredChannel, Location, Note } from '@domain/abstractions/common.ts'
import type { Customer, CustomerSite, CustomerStatus } from '@domain/abstractions/customer.ts'
import type { UserRole } from '@domain/abstractions/user.ts'
import type { scopes } from '@front/api/scopes.ts'
import { UserProvider } from '@front/app/shell/user-provider.ts'
import { createSignal } from '@solid-js'
import type { Accessor, Setter } from '@solid-js'
import { createStore, produce } from '@solid-js/store'
import { copyDraft } from '@ux/shell/workbench/workbench-draft.ts'
import { UiText } from '@ux/ui/components/ui-helpers.ts'

/** Roles shared by account-manager defaults and picker choices. */
export const ACCOUNT_MANAGER_ROLES = ['sales'] as const satisfies QuerySet<UserRole>

/** Domain fields owned by the Customer workbench. */
export type CustomerDraft = DraftOf<typeof scopes.Customers.detail>

/** Project an isolated Customer draft; optional control text becomes domain absence. */
export const customerDraft = (state: CustomerState): CustomerDraft =>
  copyDraft({
    primaryContact: [{
      displayName: toTrimmed(state.displayName()),
      phoneNumber: toTrimmed(state.phoneNumber()),
      preferredChannel: state.preferredChannel(),
      email: UiText.optional(toEmail(state.email()))
    }],
    sites: state.sites(),
    notes: state.notes(),
    name: toTrimmed(state.name()),
    status: state.status(),
    accountManagerId: state.accountManagerId(),
    line1: toTrimmed(state.line1()),
    line2: UiText.optional(toTrimmed(state.line2())),
    city: toTrimmed(state.city()),
    state: toTrimmed(state.state()),
    postalCode: toTrimmed(state.postalCode()),
    country: toTrimmed(state.country())
  })

/** Reactive state used by the Customer workbench. */
export type CustomerState = {
  readonly storedAccountManagerId: Id | undefined
  accountManagerId: Accessor<Id | undefined>
  setAccountManagerId: Setter<Id | undefined>
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
  notes: Accessor<readonly Note[]>
  setNotes: (notes: readonly Note[]) => void
  sites: Accessor<CustomerSite[]>
  addSite: (site?: CustomerSite) => void
  setSite: (index: number, site: CustomerSite) => void
  updateSite: (index: number, update: (site: CustomerSite) => void) => void
  removeSite: (index: number) => void
  updateLocation: (index: number, update: (location: Location) => Location) => void
}

/**
 * Creates the feature-local state for a single Customer draft.
 *
 * @returns Customer state scoped to one workbench instance.
 */
export const createCustomerState = (customer: Customer | null = null): CustomerState => {
  const storedAccountManagerId = customer?.accountManagerId
  const [accountManagerId, setAccountManagerId] = createSignal<Id | undefined>(
    customer ? storedAccountManagerId : UserProvider.idWithAnyRole(ACCOUNT_MANAGER_ROLES)
  )
  const contact = customer ? demandOne(customer.primaryContact) : null
  const [displayName, setDisplayName] = createSignal(contact?.displayName ?? '')
  const [phoneNumber, setPhoneNumber] = createSignal(contact?.phoneNumber ?? '')
  const [preferredChannel, setPreferredChannel] = createSignal<ContactPreferredChannel>(
    contact?.preferredChannel ?? 'email'
  )
  const [email, setEmail] = createSignal(contact?.email ?? '')
  const [notes, setNotes] = createSignal<readonly Note[]>(copyDraft(customer?.notes ?? []))
  const [name, setName] = createSignal(customer?.name ?? '')
  const [status, setStatus] = createSignal<CustomerStatus>(customer?.status ?? 'prospect')
  const [line1, setLine1] = createSignal(customer?.line1 ?? '')
  const [line2, setLine2] = createSignal(customer?.line2 ?? '')
  const [city, setCity] = createSignal(customer?.city ?? '')
  const [state, setState] = createSignal(customer?.state ?? '')
  const [postalCode, setPostalCode] = createSignal(customer?.postalCode ?? '')
  const [country, setCountry] = createSignal(customer?.country ?? 'US')
  const [siteStore, setSiteStore] = createStore<CustomerSite[]>(
    copyDraft([...(customer?.sites ?? [])])
  )

  const sites = (): CustomerSite[] => siteStore
  const addSite = (site: CustomerSite = newCustomerSite()): void =>
    setSiteStore(siteStore.length, copyDraft(site))
  const setSite = (index: number, site: CustomerSite): void => setSiteStore(index, copyDraft(site))
  const updateSite = (index: number, update: (site: CustomerSite) => void): void => {
    setSiteStore(index, produce(update))
  }
  const removeSite = (index: number): void => setSiteStore(sites => sites.filter((_, i) => i !== index))
  const updateLocation = (index: number, update: (location: Location) => Location): void => {
    updateSite(index, site => site.location = [update(demandOne(site.location))])
  }

  return {
    storedAccountManagerId,
    accountManagerId,
    setAccountManagerId,
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
    notes,
    setNotes: notes => setNotes(copyDraft(notes)),
    sites,
    addSite,
    setSite,
    updateSite,
    removeSite,
    updateLocation
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

/** Project an edited site for saving; text is trimmed and blank optional text becomes absence. */
export const customerSiteDraft = (site: CustomerSite): CustomerSite => {
  const location = siteLocation(site)
  return copyDraft({
    ...site,
    label: toTrimmed(site.label),
    location: [{
      ...location,
      line1: optionalText(location.line1),
      line2: optionalText(location.line2),
      city: optionalText(location.city),
      state: optionalText(location.state),
      postalCode: optionalText(location.postalCode),
      country: optionalText(location.country)
    }]
  })
}

/** Reads the site's single location. */
export const siteLocation = (site: CustomerSite): Location => demandOne(site.location)

/** Trimmed optional text, or absence when blank. */
const optionalText = (value: string | undefined): string | undefined =>
  UiText.optional(toTrimmed(value ?? ''))
