/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer onboarding wizard                                                   ║
║ Guided multi-stage customer creation flow for prospect intake.               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the Customer Onboarding Wizard (COW): a 3-stage guided flow that
creates a prospect Customer with primary contact, billing location, and
optional job sites.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
OnboardingProps  Props for the onboarding wizard component.
Onboarding       The onboarding wizard composition root.
*/

import { expectEmail, expectNonEmptyString, toEmail, toTrimmed } from '@core/std'
import type { ContactPreferredChannel, Location, Note } from '@domain/abstractions/common.ts'
import { CONTACT_PREFERRED_CHANNELS } from '@domain/abstractions/common.ts'
import type { Customer, CustomerSite } from '@domain/abstractions/customer.ts'
import { CUSTOMER_STATUSES, type CustomerStatus } from '@domain/abstractions/customer.ts'
import type { CustomerCreate, CustomerUpdate } from '@domain/protocols/customer-protocol.ts'
import { api } from '@front/api'
import { useAbstractionFormKeyboard } from '@front/ux/shell/use-abstraction-form-keyboard.ts'
import { useAbstractionFormValidation } from '@front/ux/shell/use-abstraction-form-validation.ts'
import type { WizardContract, WizardStage } from '@front/ux/shell/wizard-contract.ts'
import { Wizard } from '@front/ux/shell/wizard.tsx'
import {
  UiButton,
  type UiComponent,
  UiField,
  UiFieldset,
  UiInput,
  UiLayout,
  UiSingleSelect,
  UiTextArea,
  UiToggleGroup,
  UiToggleItem
} from '@front/ux/ui'
import { createSignal, For, Show } from '@solid-js'

import './onboarding.css'

/** Props for the onboarding wizard component. */
export type OnboardingProps = {
  onCancel: () => void
}

/** The onboarding wizard component. */
export const Onboarding = (props: OnboardingProps): UiComponent => {
  // Stage 1: Contact information
  const [displayName, setDisplayName] = createSignal('')
  const [phoneNumber, setPhoneNumber] = createSignal('')
  const [preferredChannel, setPreferredChannel] = createSignal<ContactPreferredChannel>('email')
  const [email, setEmail] = createSignal('')

  // Stage 2: Customer and billing address
  const [name, setName] = createSignal('')
  const [status, setStatus] = createSignal<CustomerStatus>('prospect')
  const [line1, setLine1] = createSignal('')
  const [line2, setLine2] = createSignal('')
  const [city, setCity] = createSignal('')
  const [state, setState] = createSignal('')
  const [postalCode, setPostalCode] = createSignal('')
  const [country, setCountry] = createSignal('US')
  const [customer, setCustomer] = createSignal<Customer | null>(null)

  // Stage 3: Job sites
  const [sites, setSites] = createSignal<CustomerSite[]>([])
  const [siteLabel, setSiteLabel] = createSignal('')
  const [siteLine1, setSiteLine1] = createSignal('')
  const [siteLine2, setSiteLine2] = createSignal('')
  const [siteCity, setSiteCity] = createSignal('')
  const [siteState, setSiteState] = createSignal('')
  const [sitePostalCode, setSitePostalCode] = createSignal('')
  const [siteCountry, setSiteCountry] = createSignal('')
  const [siteLatitude, setSiteLatitude] = createSignal('')
  const [siteLongitude, setSiteLongitude] = createSignal('')
  const [siteAcreage, setSiteAcreage] = createSignal('')
  const [siteNote, setSiteNote] = createSignal('')
  const [geoSupported] = createSignal(
    typeof navigator !== 'undefined' && 'geolocation' in navigator
  )

  //
  // Stage 1: Contact Details
  //

  // Each stage is its own component so that its form element, validation surface
  // and keyboard contract mount WITH the stage. Calling the hooks in the wizard
  // body instead would run their onMount while later stages are unrendered,
  // leaving those stages with a dead form ref and no listeners.
  let contactFormRef: HTMLFormElement | undefined
  const contactValidation = useAbstractionFormValidation(() => contactFormRef, {
    displayName: () => expectNonEmptyString(displayName(), 'Name'),
    phoneNumber: () => expectNonEmptyString(phoneNumber(), 'Phone'),
    email: () => email().trim() ? expectEmail(toEmail(email()), 'Email') : null
  })

  const ContactStage = (): UiComponent => {
    const validation = contactValidation
    useAbstractionFormKeyboard(() => contactFormRef, field => validation.blurField(field))

    return (
      <form ref={contactFormRef} onSubmit={event => event.preventDefault()}>
        <UiLayout data-feat='onboarding-stage-contact'>
          <UiFieldset legend='Primary Contact'>
            <UiLayout>
              <UiField for='displayName' label='Name' required>
                <UiInput
                  name='displayName'
                  value={displayName()}
                  onInput={event => {
                    setDisplayName(event.currentTarget.value)
                    validation.inputField('displayName')
                  }}
                  onBlur={() => validation.blurField('displayName')}
                  error={validation.isInvalid('displayName')}
                  required
                />
              </UiField>
              <UiField for='phoneNumber' label='Phone' required>
                <UiInput
                  name='phoneNumber'
                  type='tel'
                  value={phoneNumber()}
                  onInput={event => {
                    setPhoneNumber(event.currentTarget.value)
                    validation.inputField('phoneNumber')
                  }}
                  onBlur={() => validation.blurField('phoneNumber')}
                  error={validation.isInvalid('phoneNumber')}
                  required
                />
              </UiField>
              <UiField for='preferredChannel' label='Preferred Channel'>
                <UiSingleSelect
                  name='preferredChannel'
                  options={CONTACT_PREFERRED_CHANNELS.map(value => ({
                    value,
                    label: enumDisplayLabel(value)
                  }))}
                  value={preferredChannel()}
                  onChange={value => setPreferredChannel(value as ContactPreferredChannel)}
                />
              </UiField>
              <UiField for='email' label='Email'>
                <UiInput
                  name='email'
                  type='email'
                  value={email()}
                  onInput={event => {
                    setEmail(event.currentTarget.value)
                    validation.inputField('email')
                  }}
                  onBlur={() => validation.blurField('email')}
                  error={validation.isInvalid('email')}
                />
              </UiField>
            </UiLayout>
          </UiFieldset>
        </UiLayout>
      </form>
    )
  }

  const stageContact: WizardStage = {
    name: 'contact',
    title: 'Customer contact details',
    render: () => <ContactStage />,
    validate: () => contactValidation.validateForm(),
    canAdvance: () => {
      const trimmedName = displayName().trim()
      const trimmedPhone = phoneNumber().trim()
      const trimmedEmail = email().trim()

      if (trimmedName.length === 0 || trimmedPhone.length === 0) return false
      if (trimmedEmail.length > 0 && !trimmedEmail.includes('@')) return false
      return true
    }
  }

  //
  // Stage 2: Customer and Billing Address
  //

  let customerFormRef: HTMLFormElement | undefined
  const customerValidation = useAbstractionFormValidation(() => customerFormRef, {
    name: () => expectNonEmptyString(name(), 'Name'),
    line1: () => expectNonEmptyString(line1(), 'Address'),
    city: () => expectNonEmptyString(city(), 'City'),
    state: () => expectNonEmptyString(state(), 'State / Province'),
    postalCode: () => expectNonEmptyString(postalCode(), 'ZIP / Postal Code'),
    country: () => expectNonEmptyString(country(), 'Country')
  })

  const CustomerStage = (): UiComponent => {
    const validation = customerValidation
    useAbstractionFormKeyboard(() => customerFormRef, field => validation.blurField(field))

    return (
      <form ref={customerFormRef} onSubmit={event => event.preventDefault()}>
        <UiLayout data-feat='onboarding-stage-customer'>
          <UiFieldset legend='Customer Information'>
            <UiLayout>
              <UiField for='name' label='Name' required>
                <UiInput
                  name='name'
                  value={name()}
                  onInput={event => {
                    setName(event.currentTarget.value)
                    validation.inputField('name')
                  }}
                  onBlur={() => validation.blurField('name')}
                  error={validation.isInvalid('name')}
                  required
                />
              </UiField>
              <UiField variant='caption' label='Status'>
                <UiToggleGroup<CustomerStatus>
                  value={status()}
                  onChange={setStatus}
                >
                  <For each={CUSTOMER_STATUSES}>
                    {value => (
                      <UiToggleItem value={value}>
                        <span data-feat='onboarding-option-label'>{enumDisplayLabel(value)}</span>
                      </UiToggleItem>
                    )}
                  </For>
                </UiToggleGroup>
              </UiField>
            </UiLayout>
          </UiFieldset>
          <UiFieldset legend='Billing Address'>
            <UiLayout>
              <UiField for='line1' label='Address' required>
                <UiInput
                  name='line1'
                  value={line1()}
                  onInput={event => {
                    setLine1(event.currentTarget.value)
                    validation.inputField('line1')
                  }}
                  onBlur={() => validation.blurField('line1')}
                  error={validation.isInvalid('line1')}
                  required
                />
              </UiField>
              <UiField for='line2' label='Unit / Suite (optional)'>
                <UiInput
                  name='line2'
                  value={line2()}
                  onInput={event => setLine2(event.currentTarget.value)}
                />
              </UiField>
              <UiField for='city' label='City' required>
                <UiInput
                  name='city'
                  value={city()}
                  onInput={event => {
                    setCity(event.currentTarget.value)
                    validation.inputField('city')
                  }}
                  onBlur={() => validation.blurField('city')}
                  error={validation.isInvalid('city')}
                  required
                />
              </UiField>
              <UiField for='state' label='State / Province' required>
                <UiInput
                  name='state'
                  value={state()}
                  onInput={event => {
                    setState(event.currentTarget.value)
                    validation.inputField('state')
                  }}
                  onBlur={() => validation.blurField('state')}
                  error={validation.isInvalid('state')}
                  required
                />
              </UiField>
              <UiField for='postalCode' label='ZIP / Postal Code' required>
                <UiInput
                  name='postalCode'
                  value={postalCode()}
                  onInput={event => {
                    setPostalCode(event.currentTarget.value)
                    validation.inputField('postalCode')
                  }}
                  onBlur={() => validation.blurField('postalCode')}
                  error={validation.isInvalid('postalCode')}
                  required
                />
              </UiField>
              <UiField for='country' label='Country' required>
                <UiInput
                  name='country'
                  value={country()}
                  onInput={event => {
                    setCountry(event.currentTarget.value)
                    validation.inputField('country')
                  }}
                  onBlur={() => validation.blurField('country')}
                  error={validation.isInvalid('country')}
                  required
                />
              </UiField>
            </UiLayout>
          </UiFieldset>
        </UiLayout>
      </form>
    )
  }

  const stageCustomer: WizardStage = {
    name: 'customer',
    title: 'Customer\'s address',
    render: () => <CustomerStage />,
    validate: () => customerValidation.validateForm(),
    canAdvance: () => {
      const trimmed = {
        name: name().trim(),
        line1: line1().trim(),
        city: city().trim(),
        state: state().trim(),
        postalCode: postalCode().trim(),
        country: country().trim()
      }
      return Object.values(trimmed).every(v => v.length > 0)
    },
    commit: async () => {
      const create: CustomerCreate = {
        accountManagerId: undefined,
        primaryContact: [
          {
            displayName: toTrimmed(displayName()),
            phoneNumber: toTrimmed(phoneNumber()),
            preferredChannel: preferredChannel(),
            ...(email().trim() ? { email: toTrimmed(email()) } : {})
          }
        ],
        sites: sites(),
        notes: [],
        name: toTrimmed(name()),
        status: status(),
        line1: toTrimmed(line1()),
        ...(line2().trim() ? { line2: toTrimmed(line2()) } : {}),
        city: toTrimmed(city()),
        state: toTrimmed(state()),
        postalCode: toTrimmed(postalCode()),
        country: toTrimmed(country())
      }
      // Re-entering this stage via Back must not mint a second customer.
      const existing = customer()
      if (existing) {
        const update: CustomerUpdate = { ...existing, ...create }
        setCustomer(await api.Customers.update(update))
        return
      }
      setCustomer(await api.Customers.create(create))
    }
  }

  //
  // Stage 3: Job Sites
  //

  const addSite = (): void => {
    const c = customer()
    if (!c) return

    const lat = siteLatitude().trim() ? Number(siteLatitude()) : undefined
    const lon = siteLongitude().trim() ? Number(siteLongitude()) : undefined
    const acreageNum = siteAcreage().trim() ? Number(siteAcreage()) : undefined

    const location: Location = {}
    if (siteLine1().trim()) location.line1 = toTrimmed(siteLine1())
    if (siteLine2().trim()) location.line2 = toTrimmed(siteLine2())
    if (siteCity().trim()) location.city = toTrimmed(siteCity())
    if (siteState().trim()) location.state = toTrimmed(siteState())
    if (sitePostalCode().trim()) location.postalCode = toTrimmed(sitePostalCode())
    if (siteCountry().trim()) location.country = toTrimmed(siteCountry())
    if (lat !== undefined && Number.isFinite(lat)) location.latitude = lat
    if (lon !== undefined && Number.isFinite(lon)) location.longitude = lon

    const siteNotes: Note[] = siteNote().trim()
      ? [
        {
          attachments: [],
          createdAt: new Date().toISOString(),
          content: toTrimmed(siteNote()),
          visibility: 'internal',
          tags: []
        }
      ]
      : []

    const newSite: CustomerSite = {
      customerId: c.id,
      label: toTrimmed(siteLabel()),
      location: [location],
      notes: siteNotes,
      ...(acreageNum !== undefined && Number.isFinite(acreageNum) ? { acreage: acreageNum } : {})
    }

    setSites([...sites(), newSite])
    setSiteLabel('')
    setSiteLine1('')
    setSiteLine2('')
    setSiteCity('')
    setSiteState('')
    setSitePostalCode('')
    setSiteCountry('')
    setSiteLatitude('')
    setSiteLongitude('')
    setSiteAcreage('')
    setSiteNote('')
  }

  const canAddSite = (): boolean => {
    const label = siteLabel().trim()
    const lat = siteLatitude().trim() ? Number(siteLatitude()) : NaN
    const lon = siteLongitude().trim() ? Number(siteLongitude()) : NaN
    const hasAddress = siteLine1().trim().length > 0 && siteCity().trim().length > 0
    const hasCoords = !Number.isNaN(lat) && !Number.isNaN(lon)

    return label.length > 0 && (hasAddress || hasCoords)
  }

  const useMyLocation = (): void => {
    if (!geoSupported()) return
    navigator.geolocation.getCurrentPosition(
      position => {
        setSiteLatitude(position.coords.latitude.toString())
        setSiteLongitude(position.coords.longitude.toString())
      },
      () => {
        // Silently fail if geolocation is denied
      }
    )
  }

  const stageSites: WizardStage = {
    name: 'sites',
    title: 'Customer job sites',
    render: () => (
      <UiLayout data-feat='onboarding-stage-sites'>
        <Show when={sites().length > 0}>
          <UiFieldset legend='Added Sites'>
            <div data-feat='onboarding-sites-list'>
              <For each={sites()}>
                {(site, index) => (
                  <div data-feat='onboarding-site-item' data-feat-index={index()}>
                    <div data-feat='onboarding-site-label'>{site.label}</div>
                    <div data-feat='onboarding-site-details'>
                      {site.location[0]?.line1 && <div>{site.location[0].line1}</div>}
                      {site.location[0]?.city && (
                        <div>
                          {site.location[0].city}
                          {site.location[0].state ? `, ${site.location[0].state}` : ''}
                          {site.location[0].postalCode ? ` ${site.location[0].postalCode}` : ''}
                        </div>
                      )}
                      {site.location[0]?.latitude !== undefined
                        && site.location[0]?.longitude !== undefined && (
                        <div data-feat='onboarding-site-coords'>
                          {site.location[0].latitude.toFixed(4)}, {site.location[0].longitude.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </For>
            </div>
          </UiFieldset>
        </Show>
        <UiFieldset legend='Add Job Site (optional)'>
          <UiLayout>
            <UiField for='siteLabel' label='Site Label' required>
              <UiInput
                name='siteLabel'
                value={siteLabel()}
                onInput={event => setSiteLabel(event.currentTarget.value)}
                placeholder='e.g., "Main Office" or "Project Alpha"'
                required
              />
            </UiField>
            <UiFieldset legend='Address (optional)'>
              <UiLayout>
                <UiField for='siteLine1' label='Address'>
                  <UiInput
                    name='siteLine1'
                    value={siteLine1()}
                    onInput={event => setSiteLine1(event.currentTarget.value)}
                  />
                </UiField>
                <UiField for='siteLine2' label='Unit / Suite'>
                  <UiInput
                    name='siteLine2'
                    value={siteLine2()}
                    onInput={event => setSiteLine2(event.currentTarget.value)}
                  />
                </UiField>
                <UiField for='siteCity' label='City'>
                  <UiInput
                    name='siteCity'
                    value={siteCity()}
                    onInput={event => setSiteCity(event.currentTarget.value)}
                  />
                </UiField>
                <UiField for='siteState' label='State / Province'>
                  <UiInput
                    name='siteState'
                    value={siteState()}
                    onInput={event => setSiteState(event.currentTarget.value)}
                  />
                </UiField>
                <UiField for='sitePostalCode' label='ZIP / Postal Code'>
                  <UiInput
                    name='sitePostalCode'
                    value={sitePostalCode()}
                    onInput={event => setSitePostalCode(event.currentTarget.value)}
                  />
                </UiField>
                <UiField for='siteCountry' label='Country'>
                  <UiInput
                    name='siteCountry'
                    value={siteCountry()}
                    onInput={event => setSiteCountry(event.currentTarget.value)}
                  />
                </UiField>
              </UiLayout>
            </UiFieldset>
            <UiFieldset legend='Coordinates (optional)'>
              <UiLayout data-feat='onboarding-coords-group'>
                <UiField for='siteLatitude' label='Latitude'>
                  <UiInput
                    name='siteLatitude'
                    type='text'
                    value={siteLatitude()}
                    onInput={event => setSiteLatitude(event.currentTarget.value)}
                    placeholder='e.g., 40.7128'
                  />
                </UiField>
                <UiField for='siteLongitude' label='Longitude'>
                  <UiInput
                    name='siteLongitude'
                    type='text'
                    value={siteLongitude()}
                    onInput={event => setSiteLongitude(event.currentTarget.value)}
                    placeholder='e.g., -74.0060'
                  />
                </UiField>
                <Show when={geoSupported()}>
                  <UiButton variant='secondary' onClick={useMyLocation}>
                    Use my location
                  </UiButton>
                </Show>
              </UiLayout>
            </UiFieldset>
            <UiField for='siteAcreage' label='Acreage (optional)'>
              <UiInput
                name='siteAcreage'
                type='number'
                value={siteAcreage()}
                onInput={event => setSiteAcreage(event.currentTarget.value)}
              />
            </UiField>
            <UiField for='siteNote' label='Note (optional)'>
              <UiTextArea
                name='siteNote'
                rows={4}
                value={siteNote()}
                onInput={event => setSiteNote(event.currentTarget.value)}
              />
            </UiField>
            <div data-feat='onboarding-add-site-actions'>
              <UiButton variant='secondary' disabled={!canAddSite()} onClick={addSite}>
                Add Site
              </UiButton>
            </div>
          </UiLayout>
        </UiFieldset>
      </UiLayout>
    ),
    canAdvance: () => true,
    commit: async () => {
      if (sites().length === 0) return
      const c = customer()
      if (!c) return
      const update: CustomerUpdate = { ...c, sites: sites() }
      await api.Customers.update(update)
    }
  }

  const contract: WizardContract = {
    formTitle: 'Customer Onboarding',
    stages: [stageContact, stageCustomer, stageSites]
  }

  return (
    <div data-feat='onboarding-page'>
      <Wizard contract={contract} onFinish={props.onCancel} onCancel={props.onCancel} />
    </div>
  )
}

function enumDisplayLabel(value: string): string {
  return value
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
