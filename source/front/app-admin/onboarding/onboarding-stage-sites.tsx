/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer onboarding sites stage                                              ║
║ Collects optional customer job sites and location details.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import type { Location } from '@domain/abstractions/common.ts'
import type { CustomerSite } from '@domain/abstractions/customer.ts'
import { UiButton, UiCollectionCursor, type UiComponent, UiField, UiInput, UiLayout } from '@front/ux/ui'
import type { OnboardingState } from './onboarding-state.ts'

/** Props for the optional job-sites stage. */
export type OnboardingStageSitesProps = {
  state: OnboardingState
}

/** Renders the optional job-sites stage. */
export const OnboardingStageSites = (props: OnboardingStageSitesProps): UiComponent => {
  const { state } = props
  const hasGeo = typeof navigator !== 'undefined' && 'geolocation' in navigator
  const updateSite = (index: number, update: (site: CustomerSite) => CustomerSite): void => {
    const sites = state.sites()
    const site = sites[index]
    if (!site) return
    state.setSites(sites.map((item, itemIndex) => itemIndex === index ? update(site) : item))
  }
  const updateLocation = (
    index: number,
    update: (location: Location) => Location
  ): void => {
    updateSite(index, site => ({ ...site, location: [update(site.location[0] ?? {})] }))
  }
  const useMyLocation = (index: number): void => {
    if (!hasGeo) return
    navigator.geolocation.getCurrentPosition(position => {
      updateLocation(index, location => ({
        ...location,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }))
    }, () => undefined)
  }

  return (
    <UiLayout data-app='onboarding-stage-sites'>
      <UiCollectionCursor
        items={state.sites()}
        onItemsChange={state.setSites}
        newItem={newSite}
        empty={{ icon: 'home', message: 'No job sites yet. Click New to add one.' }}
        confirmDelete={site => ({
          title: site.label.trim() ? `Delete ${site.label}?` : 'Delete this job site?',
          message: 'This job site will be removed from the onboarding collection.'
        })}
      >
        {(site, index) => (
          <SiteForm
            site={site}
            index={index}
            hasGeo={hasGeo}
            updateSite={updateSite}
            updateLocation={updateLocation}
            useMyLocation={useMyLocation}
          />
        )}
      </UiCollectionCursor>
    </UiLayout>
  )
}

type SiteFormProps = {
  site: CustomerSite
  index: number
  hasGeo: boolean
  updateSite: (index: number, update: (site: CustomerSite) => CustomerSite) => void
  updateLocation: (index: number, update: (location: Location) => Location) => void
  useMyLocation: (index: number) => void
}

const SiteForm = (props: SiteFormProps): UiComponent => {
  const location = props.site.location[0] ?? {}
  return (
    <UiLayout>
      <SiteTextInput
        index={props.index}
        name='siteLabel'
        label='Site Label'
        value={props.site.label}
        required
        placeholder='e.g., "Main Office" or "Project Alpha"'
        onValue={value => props.updateSite(props.index, site => ({ ...site, label: value }))}
      />
      <SiteTextInput
        index={props.index}
        name='siteLine1'
        label='Address'
        value={location.line1}
        onValue={value =>
          props.updateLocation(props.index, location => ({ ...location, line1: optionalText(value) }))}
      />
      <SiteTextInput
        index={props.index}
        name='siteLine2'
        label='Unit / Suite'
        value={location.line2}
        onValue={value =>
          props.updateLocation(props.index, location => ({ ...location, line2: optionalText(value) }))}
      />
      <SiteTextInput
        index={props.index}
        name='siteCity'
        label='City'
        value={location.city}
        onValue={value =>
          props.updateLocation(props.index, location => ({ ...location, city: optionalText(value) }))}
      />
      <SiteTextInput
        index={props.index}
        name='siteState'
        label='State / Province'
        value={location.state}
        onValue={value =>
          props.updateLocation(props.index, location => ({ ...location, state: optionalText(value) }))}
      />
      <SiteTextInput
        index={props.index}
        name='sitePostalCode'
        label='ZIP / Postal Code'
        value={location.postalCode}
        onValue={value =>
          props.updateLocation(
            props.index,
            location => ({ ...location, postalCode: optionalText(value) })
          )}
      />
      <SiteTextInput
        index={props.index}
        name='siteCountry'
        label='Country'
        value={location.country}
        onValue={value =>
          props.updateLocation(props.index, location => ({ ...location, country: optionalText(value) }))}
      />
      <UiLayout data-app='onboarding-coords-group'>
        <SiteTextInput
          index={props.index}
          name='siteLatitude'
          label='Latitude'
          value={numberText(location.latitude)}
          placeholder='e.g., 40.7128'
          onValue={value =>
            props.updateLocation(props.index, location => ({
              ...location,
              latitude: numberValue(value)
            }))}
        />
        <SiteTextInput
          index={props.index}
          name='siteLongitude'
          label='Longitude'
          value={numberText(location.longitude)}
          placeholder='e.g., -74.0060'
          onValue={value =>
            props.updateLocation(props.index, location => ({
              ...location,
              longitude: numberValue(value)
            }))}
        />
        <UiButton
          variant='secondary'
          disabled={!props.hasGeo}
          onClick={() => props.useMyLocation(props.index)}
        >
          Use my location
        </UiButton>
      </UiLayout>
      <SiteTextInput
        index={props.index}
        name='siteAcreage'
        label='Acreage'
        type='number'
        value={numberText(props.site.acreage)}
        onValue={value =>
          props.updateSite(props.index, site => ({ ...site, acreage: numberValue(value) }))}
      />
    </UiLayout>
  )
}

type SiteTextInputProps = {
  index: number
  name:
    | 'siteLabel'
    | 'siteLine1'
    | 'siteLine2'
    | 'siteCity'
    | 'siteState'
    | 'sitePostalCode'
    | 'siteCountry'
    | 'siteLatitude'
    | 'siteLongitude'
    | 'siteAcreage'
  label: string
  value?: string
  placeholder?: string
  required?: boolean
  type?: 'number'
  onValue: (value: string) => void
}

const SiteTextInput = (props: SiteTextInputProps): UiComponent => {
  const name = `${props.name}-${props.index}`
  return (
    <UiField for={name} label={props.label} required={props.required}>
      <UiInput
        name={name}
        type={props.type}
        value={props.value ?? ''}
        onInput={event => props.onValue(event.currentTarget.value)}
        placeholder={props.placeholder}
        required={props.required}
      />
    </UiField>
  )
}

const newSite = (): CustomerSite => ({
  label: '',
  location: [{}],
  notes: []
})

const optionalText = (value: string): string | undefined => value.trim() ? value : undefined

const numberText = (value: number | undefined): string => value === undefined ? '' : value.toString()

const numberValue = (value: string): number | undefined => {
  if (!value.trim()) return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}
