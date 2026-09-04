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

import type { Location, Note } from '@domain/abstractions/common.ts'
import type { CustomerSite } from '@domain/abstractions/customer.ts'
import { isNote } from '@domain/validators/common-validator.ts'
import { isCustomerSite } from '@domain/validators/customer-validator.ts'
import { CollectionPanel } from '@front/ux/shell/collection-panel.tsx'
import type { DrillContract, DrillReturnControl } from '@front/ux/shell/drill-contract.ts'
import { DrillDown } from '@front/ux/shell/drill-down.tsx'
import {
  UiActionButton,
  type UiActionButtonProps,
  UiAlert,
  UiButton,
  type UiComponent,
  UiDialog,
  UiField,
  UiFieldset,
  UiFormActions,
  UiInput,
  UiLayout,
  UiText,
  UiTextArea,
  UiToggleGroup,
  UiToggleItem
} from '@front/ux/ui'
import { createEffect, createSignal, onCleanup, onMount, Show } from '@solid-js'
import { createStore, produce, type SetStoreFunction } from '@solid-js/store'
import {
  cloneCustomerSite,
  cloneNote,
  newOnboardingNote,
  newOnboardingSite,
  type OnboardingState,
  siteLocation
} from './onboarding-state.ts'

// ────────────────────────────────────────────────────────────────────────────
// ONBOARDING: CUSTOMER SITES
// ────────────────────────────────────────────────────────────────────────────

/** Trailing header action reported by whichever drilled panel is currently active. */
type TrailingAction = (() => UiActionButtonProps | undefined) | null
/** Dirty-state guard reported by whichever drilled panel is currently active. */
type DirtyCheck = (() => boolean) | null

/** Props for the optional job-sites stage. */
export type OnboardingStageSitesProps = {
  state: OnboardingState
  onReturnControl?: (control: DrillReturnControl | null) => void
  onTrailingAction?: (action: TrailingAction) => void
}

/**
 * Renders the optional job-sites stage.
 *
 * @param props Stage props carrying onboarding state.
 * @returns Job-sites onboarding stage component.
 */
export const OnboardingStageSites = (props: OnboardingStageSitesProps): UiComponent => {
  const hasGeo = typeof navigator !== 'undefined' && 'geolocation' in navigator
  const [pendingSite, setPendingSite] = createSignal<CustomerSite | null>(null)
  const [drillReturn, setDrillReturn] = createSignal<DrillReturnControl | null>(null)
  const [dirtyCheck, setDirtyCheck] = createSignal<DirtyCheck>(null)
  const [pendingDiscard, setPendingDiscard] = createSignal<DrillReturnControl | null>(null)
  const [activeSiteToken, setActiveSiteToken] = createSignal<symbol | null>(null)
  const sites = (): readonly CustomerSite[] => {
    const draft = pendingSite()
    return draft ? [...props.state.sites(), draft] : props.state.sites()
  }
  const drillPath = (): readonly string[] => drillReturn()?.path() ?? []
  const requestDrillReturn = (control: DrillReturnControl): void => {
    if (dirtyCheck()?.()) {
      setPendingDiscard(control)
      return
    }
    control.returnToIndex()
  }
  const registerDrillReturn = (control: DrillReturnControl | null): void => {
    setDrillReturn(() => control)
    props.onReturnControl?.(
      control
        ? {
          path: control.path,
          returnTitle: control.returnTitle,
          returnToIndex: () => requestDrillReturn(control)
        }
        : null
    )
  }
  const addSiteDraft = (): void => {
    setPendingSite(newOnboardingSite())
  }
  const removeSite = (index: number): void => {
    if (index < props.state.sites().length) {
      props.state.removeSite(index)
      return
    }
    setPendingSite(null)
  }

  createEffect(() => {
    if (drillPath()[0] === 'Site') return
    setPendingSite(null)
    setActiveSiteToken(null)
    setDirtyCheck(null)
  })

  return (
    <>
      <DrillDown
        rootTitle='Sites'
        onReturnControl={registerDrillReturn}
        root={drill => (
          <CollectionPanel
            legend='Sites'
            itemColumn='Site'
            items={sites}
            label={siteName}
            emptyMessage={
              <p>
                No job sites yet. Use <kbd>New Site</kbd> to add one.
              </p>
            }
            newLabel='New Site'
            onNew={addSiteDraft}
            onRemove={removeSite}
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
                drillPath={drillPath}
                activeDraft={activeSiteToken}
                registerActiveDraft={setActiveSiteToken}
                onSaveNew={() => setPendingSite(null)}
                onReturnAfterSave={() => drillReturn()?.returnToIndex()}
                onDirtyCheck={check => setDirtyCheck(() => check)}
                onTrailingAction={action => props.onTrailingAction?.(action)}
              />
            )}
            drill={drill}
          />
        )}
      />
      <Show when={pendingDiscard()}>
        {target => (
          <UiDialog
            open
            size='content'
            onOpenChange={open => {
              if (!open) setPendingDiscard(null)
            }}
          >
            <div data-shell='collection-panel-confirmation'>
              <h2>Discard unsaved changes?</h2>
              <p>Changes in this panel will be discarded.</p>
              <UiFormActions>
                <UiButton variant='ghost' onClick={() => setPendingDiscard(null)}>Cancel</UiButton>
                <UiButton
                  variant='danger'
                  onClick={() => {
                    setPendingDiscard(null)
                    target().returnToIndex()
                  }}
                >
                  Discard
                </UiButton>
              </UiFormActions>
            </div>
          </UiDialog>
        )}
      </Show>
    </>
  )
}

/** Props for the panel disclosed when a site row is selected. */
type SiteEditorProps = {
  state: OnboardingState
  site: CustomerSite
  index: number
  hasGeo: boolean
  drill: DrillContract
  drillPath: () => readonly string[]
  activeDraft: () => symbol | null
  registerActiveDraft: (token: symbol | null) => void
  onSaveNew: () => void
  onReturnAfterSave: () => void
  onDirtyCheck: (check: DirtyCheck) => void
  onTrailingAction: (action: TrailingAction) => void
}

/** Which mutually-exclusive way a site's location is currently specified. */
type LocationMode = 'address' | 'coordinates'

/** Determines which location mode a site's current data represents. */
const locationMode = (site: CustomerSite): LocationMode => {
  const location = siteLocation(site)
  return location.latitude !== undefined || location.longitude !== undefined
    ? 'coordinates'
    : 'address'
}

/** Renders one site's identity, address-or-coordinates location, and notes collection. */
const SiteEditor = (props: SiteEditorProps): UiComponent => {
  const token = Symbol('site-draft')
  const original = cloneCustomerSite(props.site)
  const [draft, setDraft] = createStore<CustomerSite>(cloneCustomerSite(props.site))
  const [mode, setMode] = createSignal<LocationMode>(locationMode(draft))
  const [saveAttempted, setSaveAttempted] = createSignal(false)
  const [activeNoteToken, setActiveNoteToken] = createSignal<symbol | null>(null)
  const [pendingNote, setPendingNote] = createSignal<Note | null>(null)
  const notes = (): readonly Note[] => {
    const note = pendingNote()
    return note ? [...draft.notes, note] : draft.notes
  }
  const isNewSite = (): boolean => props.index >= props.state.sites().length
  const siteError = (): boolean => saveAttempted() && !isCustomerSite(draft)
  const isActiveDraft = (): boolean => props.activeDraft() === token && props.drillPath()[0] === 'Site'
  const isDirty = (): boolean => draftFingerprint(draft) !== draftFingerprint(original)

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
  const addNoteDraft = (): void => {
    setPendingNote(newOnboardingNote())
  }
  const removeNote = (notePosition: number): void => {
    if (notePosition < draft.notes.length) {
      setDraft('notes', notes => notes.filter((_, i) => i !== notePosition))
      return
    }
    setPendingNote(null)
  }
  const saveSite = (): void => {
    setSaveAttempted(true)
    if (!isCustomerSite(draft)) return
    if (isNewSite()) {
      props.state.addSite(draft)
      props.onSaveNew()
      props.onReturnAfterSave()
      return
    }
    props.state.setSite(props.index, draft)
    props.onReturnAfterSave()
  }

  createEffect(() => {
    if (props.drillPath()[1] === 'Note') return
    setPendingNote(null)
    setActiveNoteToken(null)
  })
  onMount(() => props.registerActiveDraft(token))
  onCleanup(() => {
    if (props.activeDraft() === token) props.registerActiveDraft(null)
  })

  // Deferred to the Note's own report once a Note is drilled beneath this Site —
  // only the innermost active panel occupies the wizard's trailing header slot.
  createEffect(() => {
    if (!isActiveDraft() || props.drillPath()[1] === 'Note') {
      props.onTrailingAction(null)
      props.onDirtyCheck(null)
      return
    }
    props.onDirtyCheck(isDirty)
    props.onTrailingAction(() => ({
      icon: 'check',
      label: 'Save',
      labelMode: 'visible',
      density: 'dense',
      error: siteError(),
      onClick: saveSite
    }))
  })

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
            <UiField label='Device Coordinates' variant='caption'>
              <UiActionButton
                icon='crosshair-2'
                label='Device Coordinates'
                disabled={!props.hasGeo}
                onClick={() => captureLocation(setDraft, props.hasGeo, isActiveDraft)}
              />
            </UiField>
          </UiLayout>
        </Show>
      </UiFieldset>
      <CollectionPanel
        legend='Notes'
        itemColumn='Note'
        items={notes}
        label={noteName}
        emptyMessage={
          <p>
            No notes yet. Use <kbd>New Note</kbd> to add one.
          </p>
        }
        newLabel='New Note'
        onNew={addNoteDraft}
        onRemove={removeNote}
        confirmRemove={note => ({
          title: `Delete ${noteName(note)}?`,
          message: 'This note will be removed from the job site.'
        })}
        renderItem={(note, notePosition) => (
          <NoteEditor
            note={note}
            sitePosition={props.index}
            notePosition={notePosition}
            activeDraft={activeNoteToken}
            registerActiveDraft={setActiveNoteToken}
            drillPath={props.drillPath}
            onReturnAfterSave={props.onReturnAfterSave}
            onDirtyCheck={props.onDirtyCheck}
            onTrailingAction={props.onTrailingAction}
            onSave={saved => {
              if (notePosition >= draft.notes.length) {
                setDraft('notes', notes => [...notes, cloneNote(saved)])
                setPendingNote(null)
                return
              }
              setDraft(
                'notes',
                notes => notes.map((note, i) => i === notePosition ? cloneNote(saved) : note)
              )
            }}
          />
        )}
        drill={props.drill}
      />
    </UiLayout>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// CUSTOMER SITE: NOTES
// ────────────────────────────────────────────────────────────────────────────

/** Props for the panel disclosed when a note row is selected. */
type NoteEditorProps = {
  note: Note
  sitePosition: number
  notePosition: number
  activeDraft: () => symbol | null
  registerActiveDraft: (token: symbol | null) => void
  drillPath: () => readonly string[]
  onReturnAfterSave: () => void
  onDirtyCheck: (check: DirtyCheck) => void
  onTrailingAction: (action: TrailingAction) => void
  onSave: (note: Note) => void
}

/** Renders one note's content, keyed to its position within its site. */
const NoteEditor = (props: NoteEditorProps): UiComponent => {
  const token = Symbol('note-draft')
  const original = cloneNote(props.note)
  const [draft, setDraft] = createStore<Note>(cloneNote(props.note))
  const [saveAttempted, setSaveAttempted] = createSignal(false)
  const name = `site-note-content-${props.sitePosition}-${props.notePosition}`
  const noteError = (): boolean => saveAttempted() && !isNote(draft)
  const isActiveDraft = (): boolean => props.activeDraft() === token && props.drillPath()[1] === 'Note'
  const isDirty = (): boolean => draftFingerprint(draft) !== draftFingerprint(original)
  const saveNote = (): void => {
    setSaveAttempted(true)
    if (!isActiveDraft() || !isNote(draft)) return
    props.onSave(draft)
    props.onReturnAfterSave()
  }

  onMount(() => props.registerActiveDraft(token))
  onCleanup(() => {
    if (props.activeDraft() === token) props.registerActiveDraft(null)
  })

  createEffect(() => {
    if (!isActiveDraft()) {
      props.onTrailingAction(null)
      props.onDirtyCheck(null)
      return
    }
    props.onDirtyCheck(isDirty)
    props.onTrailingAction(() => ({
      icon: 'check',
      label: 'Save',
      labelMode: 'visible',
      density: 'dense',
      error: noteError(),
      onClick: saveNote
    }))
  })

  return (
    <UiLayout>
      <Show when={noteError()}>
        <UiAlert variant='danger'>Complete the note before saving.</UiAlert>
      </Show>
      <UiFieldset legend='Note'>
        <UiField for={name} label='Content' required>
          <UiTextArea
            name={name}
            rows={6}
            value={draft.content}
            error={saveAttempted() && draft.content.trim().length === 0}
            onInput={event => setDraft('content', event.currentTarget.value)}
          />
        </UiField>
      </UiFieldset>
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
const noteName = (note: Note): string => UiText.untitled(note.content, 'Untitled note')
const draftFingerprint = (draft: CustomerSite | Note): string => JSON.stringify(draft)

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
