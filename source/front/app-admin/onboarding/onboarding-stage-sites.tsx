/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer onboarding sites stage                                              ║
║ Collects optional customer job sites and nested internal notes.              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the onboarding job-sites stage using shared list/edit collection
composition. Site and note selection is local to each collection.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
OnboardingStageSitesProps  Props for the optional job-sites stage.
OnboardingStageSites       Render the optional job-sites stage.
*/

import { when } from '@core/std'
import type { Location, Note } from '@domain/abstractions/common.ts'
import type { CustomerSite } from '@domain/abstractions/customer.ts'
import { CollectionEditor } from '@front/ux/shell/collection-editor.tsx'
import {
  UiActionButton,
  type UiComponent,
  UiField,
  UiFieldset,
  UiInput,
  UiLayout,
  UiText,
  UiTextArea
} from '@front/ux/ui'
import type { OnboardingState } from './onboarding-state.ts'

// ────────────────────────────────────────────────────────────────────────────
// ONBOARDING: CUSTOMER SITES
// ────────────────────────────────────────────────────────────────────────────

/** Props for the optional job-sites stage. */
export type OnboardingStageSitesProps = {
  state: OnboardingState
}

/**
 * Renders the optional job-sites stage.
 *
 * @param props Stage props carrying onboarding state.
 * @returns Job-sites onboarding stage component.
 */
export const OnboardingStageSites = (props: OnboardingStageSitesProps): UiComponent => {
  const hasGeo = typeof navigator !== 'undefined' && 'geolocation' in navigator
  const addSite = (): void => props.state.addSite(newSite())

  return (
    <CollectionEditor
      legend='Sites'
      items={props.state.sites}
      label={siteName}
      emptyMessage='No job sites yet. Use New site to add one.'
      newLabel='New site'
      onNew={addSite}
      onRemove={props.state.removeSite}
      renderEditor={(site, index) => (
        <SiteEditor
          state={props.state}
          site={site}
          index={index}
          hasGeo={hasGeo}
        />
      )}
    />
  )
}

/** Props for the editor disclosed when a site row is selected. */
type SiteEditorProps = {
  state: OnboardingState
  site: CustomerSite
  index: number
  hasGeo: boolean
}

/** Renders one site's identity, address, and location fields above its notes collection. */
const SiteEditor = (props: SiteEditorProps): UiComponent => (
  <UiLayout>
    <UiFieldset legend='Identity'>
      <SiteTextInput
        index={props.index}
        name='siteLabel'
        label='Site Label'
        value={props.site.label}
        required
        placeholder='e.g., "Main Office" or "South Pasture"'
        onValue={value => props.state.updateSite(props.index, site => site.label = value)}
      />
    </UiFieldset>
    <UiFieldset legend='Address'>
      <UiLayout>
        <SiteTextInput
          index={props.index}
          name='siteLine1'
          label='Address'
          value={siteLocation(props.site).line1}
          onValue={value =>
            updateLocation(props.state, props.index, location => ({
              ...location,
              line1: UiText.optional(value)
            }))}
        />
        <SiteTextInput
          index={props.index}
          name='siteLine2'
          label='Unit / Suite'
          value={siteLocation(props.site).line2}
          onValue={value =>
            updateLocation(props.state, props.index, location => ({
              ...location,
              line2: UiText.optional(value)
            }))}
        />
        <UiLayout variant='inline-wrap'>
          <SiteTextInput
            index={props.index}
            name='siteCity'
            label='City'
            value={siteLocation(props.site).city}
            onValue={value =>
              updateLocation(props.state, props.index, location => ({
                ...location,
                city: UiText.optional(value)
              }))}
          />
          <SiteTextInput
            index={props.index}
            name='siteState'
            label='State / Province'
            value={siteLocation(props.site).state}
            onValue={value =>
              updateLocation(props.state, props.index, location => ({
                ...location,
                state: UiText.optional(value)
              }))}
          />
          <SiteTextInput
            index={props.index}
            name='sitePostalCode'
            label='ZIP / Postal Code'
            value={siteLocation(props.site).postalCode}
            onValue={value =>
              updateLocation(props.state, props.index, location => ({
                ...location,
                postalCode: UiText.optional(value)
              }))}
          />
        </UiLayout>
        <SiteTextInput
          index={props.index}
          name='siteCountry'
          label='Country'
          value={siteLocation(props.site).country}
          onValue={value =>
            updateLocation(props.state, props.index, location => ({
              ...location,
              country: UiText.optional(value)
            }))}
        />
      </UiLayout>
    </UiFieldset>
    <UiFieldset legend='Location'>
      <div data-app='onboarding-coords-group'>
        <SiteTextInput
          index={props.index}
          name='siteLatitude'
          label='Latitude'
          value={UiText.from(siteLocation(props.site).latitude)}
          placeholder='e.g., 40.7128'
          onValue={value =>
            updateLocation(props.state, props.index, location => ({
              ...location,
              latitude: UiText.number(value)
            }))}
        />
        <SiteTextInput
          index={props.index}
          name='siteLongitude'
          label='Longitude'
          value={UiText.from(siteLocation(props.site).longitude)}
          placeholder='e.g., -74.0060'
          onValue={value =>
            updateLocation(props.state, props.index, location => ({
              ...location,
              longitude: UiText.number(value)
            }))}
        />
        <UiActionButton
          icon='crosshair-2'
          label='Use my location'
          disabled={!props.hasGeo}
          onClick={() => useMyLocation(props.state, props.index, props.hasGeo)}
        />
        <SiteTextInput
          index={props.index}
          name='siteAcreage'
          label='Acreage'
          type='number'
          value={UiText.from(props.site.acreage)}
          onValue={value =>
            props.state.updateSite(props.index, site => site.acreage = UiText.number(value))}
        />
      </div>
    </UiFieldset>
    <CollectionEditor
      legend='Notes'
      items={() => props.site.notes}
      label={noteName}
      emptyMessage='No notes yet. Use New note to add one.'
      newLabel='New note'
      onNew={() => props.state.addNote(props.index, newNote())}
      onRemove={notePosition => props.state.removeNote(props.index, notePosition)}
      renderEditor={(note, notePosition) => (
        <NoteEditor
          state={props.state}
          note={note}
          sitePosition={props.index}
          notePosition={notePosition}
        />
      )}
    />
  </UiLayout>
)

// ────────────────────────────────────────────────────────────────────────────
// CUSTOMER SITE: NOTES
// ────────────────────────────────────────────────────────────────────────────

/** Props for the editor disclosed when a note row is selected. */
type NoteEditorProps = {
  state: OnboardingState
  note: Note
  sitePosition: number
  notePosition: number
}

/** Renders one note's content, keyed to its position within its site. */
const NoteEditor = (props: NoteEditorProps): UiComponent => {
  const name = `site-note-content-${props.sitePosition}-${props.notePosition}`
  return (
    <UiField for={name} label='Note'>
      <UiTextArea
        name={name}
        rows={6}
        value={props.note.content}
        onInput={event =>
          props.state.updateNote(props.sitePosition, props.notePosition, note => {
            note.content = event.currentTarget.value
          })}
      />
    </UiField>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// CUSTOMER SITE: TEXT INPUT FIELDS
// ────────────────────────────────────────────────────────────────────────────

/** Props for one labelled site field; `name` selects the field and scopes its input id. */
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

/** Renders one labelled site field, suffixing its input name with the site position. */
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

// ────────────────────────────────────────────────────────────────────────────
// IMPLEMENTATION
// ────────────────────────────────────────────────────────────────────────────

const newSite = (): CustomerSite => ({ label: '', location: [{}], notes: [] })

const newNote = (): Note => ({
  attachments: [],
  createdAt: when(),
  content: '',
  visibility: 'internal',
  tags: []
})

const siteName = (site: CustomerSite): string => site.label.trim() || 'Untitled site'
const noteName = (note: Note): string => note.content.trim()
const siteLocation = (site: CustomerSite): Location => site.location[0] ?? {}

const updateLocation = (
  state: OnboardingState,
  index: number,
  update: (location: Location) => Location
): void => {
  state.updateSite(index, site => site.location = [update(siteLocation(site))])
}

const useMyLocation = (state: OnboardingState, index: number, hasGeo: boolean): void => {
  if (!hasGeo) return
  navigator.geolocation.getCurrentPosition(position => {
    updateLocation(state, index, location => ({
      ...location,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }))
  }, () => undefined)
}
