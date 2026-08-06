/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer onboarding state                                                    ║
║ Feature-local state shared by the onboarding wizard stages.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import type { ContactPreferredChannel } from '@domain/abstractions/common.ts'
import type { Customer, CustomerSite } from '@domain/abstractions/customer.ts'
import type { CustomerStatus } from '@domain/abstractions/customer.ts'
import { type Accessor, createSignal, type Setter } from '@solid-js'

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
  setSites: Setter<CustomerSite[]>
}

/** Creates the feature-local state for a single onboarding flow. */
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
  const [sites, setSites] = createSignal<CustomerSite[]>([])
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
    setSites
  }
}
