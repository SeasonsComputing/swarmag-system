/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer sites step                                                          ║
║ Collects optional customer job sites and nested notes.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the Customer job-sites step with drill-down collection panels. Sites
and notes replace the current panel rather than rendering inline.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CustomerStepSitesProps  Props for the optional job-sites step.
CustomerStepSites       Render the optional job-sites step.
*/

import type { Location } from '@domain/abstractions/common.ts'
import type { CustomerSite } from '@domain/abstractions/customer.ts'
import { isCustomerSite } from '@domain/validators/customer-validator.ts'
import { NotesEditor } from '@front/app/shell/notes-editor.tsx'
import { createSignal, onCleanup, Show } from '@solid-js'
import { createStore, produce } from '@solid-js/store'
import type { SetStoreFunction } from '@solid-js/store'
import { CollectionPanel } from '@ux/shell/panel/collection-panel.tsx'
import type { DrillContract, DrillPanelContext } from '@ux/shell/panel/drill-contract.ts'
import { DrillDown } from '@ux/shell/panel/drill-down.tsx'
import type { PanelStepContext } from '@ux/shell/panel/panel-sequence-contract.ts'
import { copyDraft } from '@ux/shell/workbench/workbench-draft.ts'
import {
  UiActionButton,
  UiAlert,
  UiField,
  UiFieldset,
  UiInput,
  UiLayout,
  UiText,
  UiToggleGroup,
  UiToggleItem
} from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { newCustomerSite, siteLocation } from './customer-state.ts'
import type { CustomerState } from './customer-state.ts'

/** Props for the optional job-sites step. */
export type CustomerStepSitesProps = {
  state: CustomerState
  context: PanelStepContext
}

/** Render Site drafts inside a step-owned drill host. */
export const CustomerStepSites = (props: CustomerStepSitesProps): UiComponent => {
  const hasGeo = typeof navigator !== 'undefined' && 'geolocation' in navigator
  const [pendingSite, setPendingSite] = createSignal<CustomerSite | null>(null)
  const sites = (): readonly CustomerSite[] => {
    const pending = pendingSite()
    return pending ? [...props.state.sites(), pending] : props.state.sites()
  }
  return (
    <DrillDown
      rootTitle='Sites'
      context={props.context}
      root={drill => (
        <CollectionPanel
          legend='Sites'
          itemColumn='Site'
          items={sites}
          label={siteName}
          emptyMessage={
            <>
              No job sites yet. Use <kbd>New Site</kbd> to add one.
            </>
          }
          newLabel='New Site'
          onNew={() => setPendingSite(newCustomerSite())}
          onRemove={props.state.removeSite}
          confirmRemove={site => ({
            title: `Delete ${siteName(site)}?`,
            message: 'This job site will be removed from the customer.'
          })}
          renderItem={(site, index, context) => {
            onCleanup(() => setPendingSite(null))
            return (
              <SiteEditor
                state={props.state}
                site={site}
                index={index}
                hasGeo={hasGeo}
                drill={drill}
                context={context}
              />
            )
          }}
          drill={drill}
        />
      )}
    />
  )
}

// ────────────────────────────────────────────────────────────────────────────
// CUSTOMER: SITE DRAFT
// ────────────────────────────────────────────────────────────────────────────

/** Props for one Site draft and its host-owned lifetime. */
type SiteEditorProps = {
  state: CustomerState
  site: CustomerSite
  index: number
  hasGeo: boolean
  drill: DrillContract
  context: DrillPanelContext
}

/** Location input modes for a Site. */
type LocationMode = 'address' | 'coordinates'

const SiteEditor = (props: SiteEditorProps): UiComponent => {
  const original = copyDraft(props.site)
  const [draft, setDraft] = createStore<CustomerSite>(copyDraft(props.site))
  const [mode, setMode] = createSignal<LocationMode>(locationMode(draft))
  const [saveAttempted, setSaveAttempted] = createSignal(false)
  const siteError = (): boolean => saveAttempted() && !isCustomerSite(draft)
  const isActiveDraft = props.context.isActive
  props.context.registerDirty(() => draftFingerprint(draft) !== draftFingerprint(original))
  /** Switches location mode, clearing the fields the other mode owns. */
  const changeMode = (next: LocationMode): void => {
    setMode(next)
    updateDraftLocation(setDraft, location =>
      next === 'coordinates'
        ? {
          ...location,
          line1: undefined,
          line2: undefined,
          city: undefined,
          state: undefined,
          postalCode: undefined,
          country: undefined
        }
        : { ...location, latitude: undefined, longitude: undefined })
  }
  const saveSite = (): void => {
    if (!isActiveDraft()) return
    setSaveAttempted(true)
    if (!isCustomerSite(draft)) return
    if (props.index >= props.state.sites().length) props.state.addSite(draft)
    else props.state.setSite(props.index, draft)
    props.context.returnToParent()
  }
  props.context.registerSave(() => ({
    icon: 'check',
    label: 'Save',
    labelMode: 'visible',
    density: 'dense',
    error: siteError(),
    onClick: saveSite
  }))

  return (
    <UiLayout>
      <Show when={siteError()}>
        <UiAlert variant='danger'>Complete the required site fields before saving.</UiAlert>
      </Show>
      <UiFieldset legend='Identity'>
        <SiteTextInput
          index={props.index}
          name='siteLabel'
          label='Site Label'
          value={draft.label}
          required
          error={saveAttempted() && draft.label.trim().length === 0}
          placeholder='e.g., "Main Office" or "South Pasture"'
          onValue={value => setDraft('label', value)}
        />
        <SiteTextInput
          commit='change'
          index={props.index}
          name='siteAcreage'
          label='Acreage'
          type='number'
          value={UiText.from(draft.acreage)}
          onValue={value => setDraft('acreage', UiText.number(value))}
        />
      </UiFieldset>
      <UiFieldset legend='Site Location'>
        <UiToggleGroup<LocationMode> value={mode()} onChange={changeMode}>
          <UiToggleItem value='address'>
            <span>Address</span>
          </UiToggleItem>
          <UiToggleItem value='coordinates'>
            <span>Coordinates</span>
          </UiToggleItem>
        </UiToggleGroup>
        <Show when={mode() === 'address'}>
          <UiLayout>
            <SiteTextInput
              index={props.index}
              name='siteLine1'
              label='Address'
              value={siteLocation(draft).line1}
              required
              error={saveAttempted() && !siteLocation(draft).line1}
              onValue={value =>
                updateDraftLocation(setDraft, location => ({
                  ...location,
                  line1: UiText.optional(value)
                }))}
            />
            <SiteTextInput
              index={props.index}
              name='siteLine2'
              label='Unit'
              value={siteLocation(draft).line2}
              onValue={value =>
                updateDraftLocation(setDraft, location => ({
                  ...location,
                  line2: UiText.optional(value)
                }))}
            />
            <SiteTextInput
              index={props.index}
              name='siteCity'
              label='City'
              value={siteLocation(draft).city}
              required
              error={saveAttempted() && !siteLocation(draft).city}
              onValue={value =>
                updateDraftLocation(setDraft, location => ({
                  ...location,
                  city: UiText.optional(value)
                }))}
            />
            <UiLayout variant='inline-fill'>
              <SiteTextInput
                index={props.index}
                name='siteState'
                label='Region'
                required
                value={siteLocation(draft).state}
                error={saveAttempted() && !siteLocation(draft).state}
                onValue={value =>
                  updateDraftLocation(setDraft, location => ({
                    ...location,
                    state: UiText.optional(value)
                  }))}
              />
              <SiteTextInput
                index={props.index}
                name='sitePostalCode'
                label='Postal'
                required
                value={siteLocation(draft).postalCode}
                error={saveAttempted() && !siteLocation(draft).postalCode}
                onValue={value =>
                  updateDraftLocation(setDraft, location => ({
                    ...location,
                    postalCode: UiText.optional(value)
                  }))}
              />
              <SiteTextInput
                index={props.index}
                name='siteCountry'
                label='Country'
                required
                value={siteLocation(draft).country}
                error={saveAttempted() && !siteLocation(draft).country}
                onValue={value =>
                  updateDraftLocation(setDraft, location => ({
                    ...location,
                    country: UiText.optional(value)
                  }))}
              />
            </UiLayout>
          </UiLayout>
        </Show>
        <Show when={mode() === 'coordinates'}>
          <UiLayout variant='inline-fit'>
            <SiteTextInput
              commit='change'
              index={props.index}
              name='siteLatitude'
              label='Latitude'
              value={UiText.from(siteLocation(draft).latitude)}
              required
              error={saveAttempted() && siteLocation(draft).latitude === undefined}
              placeholder='e.g., 40.7128'
              onValue={value =>
                updateDraftLocation(setDraft, location => ({
                  ...location,
                  latitude: UiText.number(value)
                }))}
            />
            <SiteTextInput
              commit='change'
              index={props.index}
              name='siteLongitude'
              label='Longitude'
              value={UiText.from(siteLocation(draft).longitude)}
              required
              error={saveAttempted() && siteLocation(draft).longitude === undefined}
              placeholder='e.g., -74.0060'
              onValue={value =>
                updateDraftLocation(setDraft, location => ({
                  ...location,
                  longitude: UiText.number(value)
                }))}
            />
            <UiField label='Get GPS Coords' variant='caption'>
              <UiActionButton
                icon='crosshair-2'
                label='Get GPS Coords'
                disabled={!props.hasGeo}
                onClick={() => captureLocation(setDraft, props.hasGeo, isActiveDraft)}
              />
            </UiField>
          </UiLayout>
        </Show>
      </UiFieldset>
      <NotesEditor
        notes={() => draft.notes}
        onChange={notes => setDraft('notes', copyDraft(notes))}
        drill={props.drill}
      />
    </UiLayout>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// CUSTOMER SITE: TEXT INPUT FIELDS
// ────────────────────────────────────────────────────────────────────────────

/** Props for one labelled site field; `name` selects the field and scopes its input id. */
type SiteTextInputProps = {
  commit?: 'input' | 'change'
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
  error?: boolean
  type?: 'number'
  onValue: (value: string) => void
}

/** Renders one labelled site field, suffixing its input name with the site position. */
const SiteTextInput = (props: SiteTextInputProps): UiComponent => {
  const name = `${props.name}-${props.index}`
  const commitOnChange = (): boolean => props.commit === 'change'
  return (
    <UiField for={name} label={props.label} required={props.required}>
      <UiInput
        name={name}
        type={props.type}
        value={props.value ?? ''}
        error={props.error}
        onChange={event => {
          if (commitOnChange()) props.onValue(event.currentTarget.value)
        }}
        onInput={event => {
          if (!commitOnChange()) props.onValue(event.currentTarget.value)
        }}
        placeholder={props.placeholder}
        required={props.required}
      />
    </UiField>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ────────────────────────────────────────────────────────────────────────────

const siteName = (site: CustomerSite): string => UiText.untitled(site.label, 'Untitled site')
const draftFingerprint = (draft: CustomerSite): string => JSON.stringify(draft)

const updateDraftLocation = (
  setDraft: SetStoreFunction<CustomerSite>,
  update: (location: Location) => Location
): void => {
  setDraft(produce(site => site.location = [update(siteLocation(site))]))
}

// The permission prompt can outlive the draft panel. Gate the callback on the
// draft lifecycle instead of a shared-state index.
const captureLocation = (
  setDraft: SetStoreFunction<CustomerSite>,
  hasGeo: boolean,
  isActiveDraft: () => boolean
): void => {
  if (!hasGeo) return
  navigator.geolocation.getCurrentPosition(position => {
    if (!isActiveDraft()) return
    updateDraftLocation(setDraft, location => ({
      ...location,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }))
  }, () => undefined)
}

const locationMode = (site: CustomerSite): LocationMode => {
  const location = siteLocation(site)
  return location.latitude !== undefined || location.longitude !== undefined ? 'coordinates' : 'address'
}
