/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer onboarding sites stage                                              ║
║ Collects optional customer job sites and location details.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { toTrimmed } from '@core/std'
import type { Location, Note } from '@domain/abstractions/common.ts'
import type { CustomerSite } from '@domain/abstractions/customer.ts'
import {
  UiButton,
  type UiComponent,
  UiField,
  UiFieldset,
  UiInput,
  UiLayout,
  UiTextArea
} from '@front/ux/ui'
import { For, Show } from '@solid-js'
import type { OnboardingState } from './onboarding-state.ts'

/** Props for the optional job-sites stage. */
export type OnboardingStageSitesProps = {
  state: OnboardingState
}

/** Renders the optional job-sites stage. */
export const OnboardingStageSites = (props: OnboardingStageSitesProps): UiComponent => {
  const { state } = props
  const addSite = (): void => {
    const customer = state.customer()
    if (!customer) return
    const latitude = numberValue(state.siteLatitude())
    const longitude = numberValue(state.siteLongitude())
    const acreage = numberValue(state.siteAcreage())
    const location: Location = {}
    if (state.siteLine1().trim()) location.line1 = toTrimmed(state.siteLine1())
    if (state.siteLine2().trim()) location.line2 = toTrimmed(state.siteLine2())
    if (state.siteCity().trim()) location.city = toTrimmed(state.siteCity())
    if (state.siteState().trim()) location.state = toTrimmed(state.siteState())
    if (state.sitePostalCode().trim()) location.postalCode = toTrimmed(state.sitePostalCode())
    if (state.siteCountry().trim()) location.country = toTrimmed(state.siteCountry())
    if (latitude !== undefined) location.latitude = latitude
    if (longitude !== undefined) location.longitude = longitude
    const notes: Note[] = state.siteNote().trim()
      ? [{
        attachments: [],
        createdAt: new Date().toISOString(),
        content: toTrimmed(state.siteNote()),
        visibility: 'internal',
        tags: []
      }]
      : []
    const site: CustomerSite = {
      customerId: customer.id,
      label: toTrimmed(state.siteLabel()),
      location: [location],
      notes,
      ...(acreage === undefined ? {} : { acreage })
    }
    state.setSites([...state.sites(), site])
    clearSite(state)
  }
  const canAddSite = (): boolean => {
    const hasAddress = state.siteLine1().trim().length > 0 && state.siteCity().trim().length > 0
    const hasCoordinates = numberValue(state.siteLatitude()) !== undefined
      && numberValue(state.siteLongitude()) !== undefined
    return state.siteLabel().trim().length > 0 && (hasAddress || hasCoordinates)
  }
  const useMyLocation = (): void => {
    if (!state.geoSupported()) return
    navigator.geolocation.getCurrentPosition(position => {
      state.setSiteLatitude(position.coords.latitude.toString())
      state.setSiteLongitude(position.coords.longitude.toString())
    }, () => undefined)
  }

  return (
    <UiLayout data-feat='onboarding-stage-sites'>
      <Show when={state.sites().length > 0}>
        <UiFieldset legend='Added Sites'>
          <div data-feat='onboarding-sites-list'>
            <For each={state.sites()}>
              {(site, index) => <SiteSummary site={site} index={index()} />}
            </For>
          </div>
        </UiFieldset>
      </Show>
      <UiFieldset legend='Add Job Site (optional)'>
        <UiLayout>
          <SiteInput
            state={state}
            name='siteLabel'
            label='Site Label'
            required
            placeholder='e.g., "Main Office" or "Project Alpha"'
          />
          <UiFieldset legend='Address (optional)'>
            <UiLayout>
              <SiteInput state={state} name='siteLine1' label='Address' />
              <SiteInput state={state} name='siteLine2' label='Unit / Suite' />
              <SiteInput state={state} name='siteCity' label='City' />
              <SiteInput state={state} name='siteState' label='State / Province' />
              <SiteInput state={state} name='sitePostalCode' label='ZIP / Postal Code' />
              <SiteInput state={state} name='siteCountry' label='Country' />
            </UiLayout>
          </UiFieldset>
          <UiFieldset legend='Coordinates (optional)'>
            <UiLayout data-feat='onboarding-coords-group'>
              <SiteInput
                state={state}
                name='siteLatitude'
                label='Latitude'
                placeholder='e.g., 40.7128'
              />
              <SiteInput
                state={state}
                name='siteLongitude'
                label='Longitude'
                placeholder='e.g., -74.0060'
              />
              <Show when={state.geoSupported()}>
                <UiButton variant='secondary' onClick={useMyLocation}>Use my location</UiButton>
              </Show>
            </UiLayout>
          </UiFieldset>
          <SiteInput state={state} name='siteAcreage' label='Acreage (optional)' type='number' />
          <UiField for='siteNote' label='Note (optional)'>
            <UiTextArea
              name='siteNote'
              rows={4}
              value={state.siteNote()}
              onInput={event => state.setSiteNote(event.currentTarget.value)}
            />
          </UiField>
          <div data-feat='onboarding-add-site-actions'>
            <UiButton variant='secondary' disabled={!canAddSite()} onClick={addSite}>Add Site</UiButton>
          </div>
        </UiLayout>
      </UiFieldset>
    </UiLayout>
  )
}

type SiteInputProps = {
  state: OnboardingState
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
  placeholder?: string
  required?: boolean
  type?: 'number'
}

const SiteInput = (props: SiteInputProps): UiComponent => {
  const input = siteInput(props.state, props.name)
  return (
    <UiField for={props.name} label={props.label} required={props.required}>
      <UiInput
        name={props.name}
        type={props.type}
        value={input[0]()}
        onInput={event => input[1](event.currentTarget.value)}
        placeholder={props.placeholder}
        required={props.required}
      />
    </UiField>
  )
}

const siteInput = (state: OnboardingState, name: SiteInputProps['name']) => {
  switch (name) {
    case 'siteLabel':
      return [state.siteLabel, state.setSiteLabel] as const
    case 'siteLine1':
      return [state.siteLine1, state.setSiteLine1] as const
    case 'siteLine2':
      return [state.siteLine2, state.setSiteLine2] as const
    case 'siteCity':
      return [state.siteCity, state.setSiteCity] as const
    case 'siteState':
      return [state.siteState, state.setSiteState] as const
    case 'sitePostalCode':
      return [state.sitePostalCode, state.setSitePostalCode] as const
    case 'siteCountry':
      return [state.siteCountry, state.setSiteCountry] as const
    case 'siteLatitude':
      return [state.siteLatitude, state.setSiteLatitude] as const
    case 'siteLongitude':
      return [state.siteLongitude, state.setSiteLongitude] as const
    case 'siteAcreage':
      return [state.siteAcreage, state.setSiteAcreage] as const
  }
}

const SiteSummary = (props: { site: CustomerSite; index: number }): UiComponent => (
  <div data-feat='onboarding-site-item' data-feat-index={props.index}>
    <div data-feat='onboarding-site-label'>{props.site.label}</div>
    <div data-feat='onboarding-site-details'>
      {props.site.location[0]?.line1 && <div>{props.site.location[0].line1}</div>}
      {props.site.location[0]?.city && (
        <div>
          {props.site.location[0].city}
          {props.site.location[0].state ? `, ${props.site.location[0].state}` : ''}
          {props.site.location[0].postalCode ? ` ${props.site.location[0].postalCode}` : ''}
        </div>
      )}
      {props.site.location[0]?.latitude !== undefined && props.site.location[0]?.longitude !== undefined
        && (
          <div data-feat='onboarding-site-coords'>
            {props.site.location[0].latitude.toFixed(4)}, {props.site.location[0].longitude.toFixed(4)}
          </div>
        )}
    </div>
  </div>
)

const numberValue = (value: string): number | undefined => {
  if (!value.trim()) return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

const clearSite = (state: OnboardingState): void => {
  state.setSiteLabel('')
  state.setSiteLine1('')
  state.setSiteLine2('')
  state.setSiteCity('')
  state.setSiteState('')
  state.setSitePostalCode('')
  state.setSiteCountry('')
  state.setSiteLatitude('')
  state.setSiteLongitude('')
  state.setSiteAcreage('')
  state.setSiteNote('')
}
