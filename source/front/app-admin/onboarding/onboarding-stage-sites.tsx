/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer onboarding sites stage                                              ║
║ Collects optional customer job sites and nested internal notes.              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the onboarding job-sites stage with drill-down collection panels. Sites
and notes replace the current panel rather than rendering inline.

EXPORTS
───────────────────────────────────────────────────────────────────────────────
OnboardingStageSitesProps  Props for the optional job-sites stage.
OnboardingStageSites       Render the optional job-sites stage.
*/

import type { Note } from '@domain/abstractions/common.ts'
import type { CustomerSite } from '@domain/abstractions/customer.ts'
import { CollectionPanel } from '@front/ux/shell/collection-panel.tsx'
import type { DrillContract } from '@front/ux/shell/drill-contract.ts'
import { DrillDown } from '@front/ux/shell/drill-down.tsx'
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
import { type OnboardingState, siteLocation } from './onboarding-state.ts'

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

  return (
    <DrillDown
      rootTitle='Sites'
      root={drill => (
        <CollectionPanel
          legend='Sites'
          itemColumn='Site'
          items={props.state.sites}
          label={siteName}
          emptyMessage='No job sites yet. Use New site to add one.'
          newLabel='New site'
          onNew={() => props.state.addSite()}
          onRemove={props.state.removeSite}
          confirmRemove={site => ({
            title: `Delete ${siteName(site)}?`,
            message: 'This job site will be removed from the customer.'
          })}
          renderItem={(site, index) => (
            <SiteEditor
              state={props.state}
              site={site}
              index={index}
              hasGeo={hasGeo}
              drill={drill}
            />
          )}
          drill={drill}
        />
      )}
    />
  )
}

/** Props for the panel disclosed when a site row is selected. */
type SiteEditorProps = {
  state: OnboardingState
  site: CustomerSite
  index: number
  hasGeo: boolean
  drill: DrillContract
}

/** Renders one site's identity, address, location fields, and notes collection. */
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
            props.state.updateLocation(props.index, location => ({
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
            props.state.updateLocation(props.index, location => ({
              ...location,
              line2: UiText.optional(value)
            }))}
        />
        <SiteTextInput
          index={props.index}
          name='siteCity'
          label='City'
          value={siteLocation(props.site).city}
          onValue={value =>
            props.state.updateLocation(props.index, location => ({
              ...location,
              city: UiText.optional(value)
            }))}
        />
        <UiLayout variant='inline-fill'>
          <SiteTextInput
            index={props.index}
            name='siteState'
            label='State / Region'
            value={siteLocation(props.site).state}
            onValue={value =>
              props.state.updateLocation(props.index, location => ({
                ...location,
                state: UiText.optional(value)
              }))}
          />
          <SiteTextInput
            index={props.index}
            name='sitePostalCode'
            label='Postal Code'
            value={siteLocation(props.site).postalCode}
            onValue={value =>
              props.state.updateLocation(props.index, location => ({
                ...location,
                postalCode: UiText.optional(value)
              }))}
          />
          <SiteTextInput
            index={props.index}
            name='siteCountry'
            label='Country'
            value={siteLocation(props.site).country}
            onValue={value =>
              props.state.updateLocation(props.index, location => ({
                ...location,
                country: UiText.optional(value)
              }))}
          />
        </UiLayout>
      </UiLayout>
    </UiFieldset>
    <UiFieldset legend='Location'>
      <UiLayout variant='inline-fit'>
        <SiteTextInput
          commit='change'
          index={props.index}
          name='siteLatitude'
          label='Latitude'
          value={UiText.from(siteLocation(props.site).latitude)}
          placeholder='e.g., 40.7128'
          onValue={value =>
            props.state.updateLocation(props.index, location => ({
              ...location,
              latitude: UiText.number(value)
            }))}
        />
        <SiteTextInput
          commit='change'
          index={props.index}
          name='siteLongitude'
          label='Longitude'
          value={UiText.from(siteLocation(props.site).longitude)}
          placeholder='e.g., -74.0060'
          onValue={value =>
            props.state.updateLocation(props.index, location => ({
              ...location,
              longitude: UiText.number(value)
            }))}
        />
        <UiActionButton
          icon='crosshair-2'
          label='Use my location'
          disabled={!props.hasGeo}
          onClick={() => captureLocation(props.state, props.index, props.hasGeo)}
        />
      </UiLayout>
      <SiteTextInput
        commit='change'
        index={props.index}
        name='siteAcreage'
        label='Acreage'
        type='number'
        value={UiText.from(props.site.acreage)}
        onValue={value =>
          props.state.updateSite(props.index, site => site.acreage = UiText.number(value))}
      />
    </UiFieldset>
    <CollectionPanel
      legend='Notes'
      itemColumn='Note'
      items={() => props.site.notes}
      label={noteName}
      emptyMessage='No notes yet. Use New Note to add one.'
      newLabel='New Note'
      onNew={() => props.state.addNote(props.index)}
      onRemove={notePosition => props.state.removeNote(props.index, notePosition)}
      confirmRemove={note => ({
        title: `Delete ${noteName(note)}?`,
        message: 'This note will be removed from the job site.'
      })}
      renderItem={(note, notePosition) => (
        <NoteEditor
          state={props.state}
          note={note}
          sitePosition={props.index}
          notePosition={notePosition}
        />
      )}
      drill={props.drill}
    />
  </UiLayout>
)

// ────────────────────────────────────────────────────────────────────────────
// CUSTOMER SITE: NOTES
// ────────────────────────────────────────────────────────────────────────────

/** Props for the panel disclosed when a note row is selected. */
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
const noteName = (note: Note): string => UiText.untitled(note.content, 'Untitled note')

// The permission prompt can outlive the site. A CustomerSite has no identity, so
// its position is the only handle, and removing a site shifts every position
// after it — a late fix would land on whichever site now occupies this index.
// Capture the site itself and abandon the result if the slot changed hands.
const captureLocation = (state: OnboardingState, index: number, hasGeo: boolean): void => {
  if (!hasGeo) return
  const requested = state.sites()[index]
  navigator.geolocation.getCurrentPosition(position => {
    if (state.sites()[index] !== requested) return
    state.updateLocation(index, location => ({
      ...location,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    }))
  }, () => undefined)
}
