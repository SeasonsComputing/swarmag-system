/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer onboarding sites stage                                              ║
║ Collects optional customer job sites and location details.                   ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { when } from '@core/std'
import type { Attachment, AttachmentKind, Location, Note } from '@domain/abstractions/common.ts'
import type { CustomerSite } from '@domain/abstractions/customer.ts'
import {
  UiActionButton,
  UiButton,
  type UiComponent,
  UiField,
  UiFieldset,
  UiInput,
  UiLayout,
  UiList,
  UiListItem,
  UiSingleSelect,
  UiTextArea
} from '@front/ux/ui'
import { createMemo, createSignal, For, Show } from '@solid-js'
import type { OnboardingState } from './onboarding-state.ts'

/** Props for the optional job-sites stage. */
export type OnboardingStageSitesProps = {
  state: OnboardingState
}

/** Renders the optional job-sites stage. */
export const OnboardingStageSites = (props: OnboardingStageSitesProps): UiComponent => {
  const { state } = props
  const [depth, setDepth] = createSignal<DepthState>({ level: 'sites' })
  const hasGeo = typeof navigator !== 'undefined' && 'geolocation' in navigator

  const activeSite = createMemo(() => {
    const current = depth()
    if (current.level === 'sites') return null
    return state.sites()[current.siteIndex] ?? null
  })
  const activeNote = createMemo(() => {
    const current = depth()
    if (current.level !== 'note' && current.level !== 'attachment') return null
    return state.sites()[current.siteIndex]?.notes[current.noteIndex] ?? null
  })
  const activeAttachment = createMemo(() => {
    const current = depth()
    if (current.level !== 'attachment') return null
    return state.sites()[current.siteIndex]?.notes[current.noteIndex]
      ?.attachments[current.attachmentIndex] ?? null
  })

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

  const addSite = (): void => {
    const sites = [...state.sites(), newSite()]
    state.setSites(sites)
    setDepth({ level: 'site', siteIndex: sites.length - 1 })
  }
  const deleteSite = (index: number): void => {
    state.setSites(state.sites().filter((_, itemIndex) => itemIndex !== index))
    const current = depth()
    if (current.level !== 'sites' && current.siteIndex === index) setDepth({ level: 'sites' })
  }
  const updateNote = (
    siteIndex: number,
    noteIndex: number,
    update: (note: Note) => Note
  ): void => {
    updateSite(siteIndex, site => {
      const note = site.notes[noteIndex]
      if (!note) return site
      return {
        ...site,
        notes: site.notes.map((item, itemIndex) => itemIndex === noteIndex ? update(note) : item)
      }
    })
  }
  const addNote = (siteIndex: number): void => {
    const site = state.sites()[siteIndex]
    if (!site) return
    const notes = [...site.notes, newNote()]
    updateSite(siteIndex, site => ({ ...site, notes }))
    setDepth({ level: 'note', siteIndex, noteIndex: notes.length - 1 })
  }
  const deleteNote = (siteIndex: number, noteIndex: number): void => {
    updateSite(siteIndex, site => ({
      ...site,
      notes: site.notes.filter((_, itemIndex) => itemIndex !== noteIndex)
    }))
    const current = depth()
    if (current.level !== 'sites' && current.level !== 'site' && current.noteIndex === noteIndex) {
      setDepth({ level: 'site', siteIndex })
    }
  }
  const updateAttachment = (
    siteIndex: number,
    noteIndex: number,
    attachmentIndex: number,
    update: (attachment: Attachment) => Attachment
  ): void => {
    updateNote(siteIndex, noteIndex, note => {
      const attachment = note.attachments[attachmentIndex]
      if (!attachment) return note
      return {
        ...note,
        attachments: note.attachments.map((item, itemIndex) =>
          itemIndex === attachmentIndex ? update(attachment) : item
        )
      }
    })
  }
  const addAttachment = (siteIndex: number, noteIndex: number): void => {
    const note = state.sites()[siteIndex]?.notes[noteIndex]
    if (!note) return
    const attachments = [...note.attachments, newAttachment()]
    updateNote(siteIndex, noteIndex, note => ({ ...note, attachments }))
    setDepth({ level: 'attachment', siteIndex, noteIndex, attachmentIndex: attachments.length - 1 })
  }
  const deleteAttachment = (siteIndex: number, noteIndex: number, attachmentIndex: number): void => {
    updateNote(siteIndex, noteIndex, note => ({
      ...note,
      attachments: note.attachments.filter((_, itemIndex) => itemIndex !== attachmentIndex)
    }))
    const current = depth()
    if (current.level === 'attachment' && current.attachmentIndex === attachmentIndex) {
      setDepth({ level: 'note', siteIndex, noteIndex })
    }
  }

  return (
    <div data-app='onboarding-stage-sites' data-app-depth={depth().level}>
      <div data-app='onboarding-depth-panel' data-app-panel='sites'>
        <BoundedList
          legend='Sites'
          empty={state.sites().length === 0}
          emptyMessage='No job sites yet. Use New site to add one.'
          newLabel='New site'
          onNew={addSite}
        >
          <For each={state.sites()}>
            {(site, index) => (
              <DepthListRow
                label={siteName(site)}
                placeholder='Untitled site'
                deleteLabel={`Delete ${siteName(site)}`}
                onSelect={() => setDepth({ level: 'site', siteIndex: index() })}
                onDelete={() => deleteSite(index())}
              />
            )}
          </For>
        </BoundedList>
      </div>
      <div data-app='onboarding-depth-panel' data-app-panel='site'>
        <Show when={activeSite()} keyed>
          {site => {
            const current = depth()
            if (current.level === 'sites') return null
            return (
              <SiteForm
                site={site}
                index={current.siteIndex}
                hasGeo={hasGeo}
                updateSite={updateSite}
                updateLocation={updateLocation}
                useMyLocation={useMyLocation}
                addNote={addNote}
                deleteNote={deleteNote}
                openSites={() => setDepth({ level: 'sites' })}
                openNote={noteIndex =>
                  setDepth({ level: 'note', siteIndex: current.siteIndex, noteIndex })}
              />
            )
          }}
        </Show>
      </div>
      <div data-app='onboarding-depth-panel' data-app-panel='note'>
        <Show when={activeNote()} keyed>
          {note => {
            const current = depth()
            if (current.level !== 'note' && current.level !== 'attachment') return null
            const site = activeSite()
            return (
              <NoteForm
                note={note}
                siteIndex={current.siteIndex}
                noteIndex={current.noteIndex}
                parentName={site ? siteName(site) : 'Site'}
                updateNote={updateNote}
                addAttachment={addAttachment}
                deleteAttachment={deleteAttachment}
                openSite={() => setDepth({ level: 'site', siteIndex: current.siteIndex })}
                openAttachment={attachmentIndex =>
                  setDepth({
                    level: 'attachment',
                    siteIndex: current.siteIndex,
                    noteIndex: current.noteIndex,
                    attachmentIndex
                  })}
              />
            )
          }}
        </Show>
      </div>
      <div data-app='onboarding-depth-panel' data-app-panel='attachment'>
        <Show when={activeAttachment()} keyed>
          {attachment => {
            const current = depth()
            if (current.level !== 'attachment') return null
            const note = activeNote()
            return (
              <AttachmentForm
                attachment={attachment}
                siteIndex={current.siteIndex}
                noteIndex={current.noteIndex}
                attachmentIndex={current.attachmentIndex}
                parentName={note ? noteName(note) : 'Note'}
                updateAttachment={updateAttachment}
                openNote={() =>
                  setDepth({
                    level: 'note',
                    siteIndex: current.siteIndex,
                    noteIndex: current.noteIndex
                  })}
              />
            )
          }}
        </Show>
      </div>
    </div>
  )
}

type DepthState =
  | { level: 'sites' }
  | { level: 'site'; siteIndex: number }
  | { level: 'note'; siteIndex: number; noteIndex: number }
  | { level: 'attachment'; siteIndex: number; noteIndex: number; attachmentIndex: number }

type SiteFormProps = {
  site: CustomerSite
  index: number
  hasGeo: boolean
  updateSite: (index: number, update: (site: CustomerSite) => CustomerSite) => void
  updateLocation: (index: number, update: (location: Location) => Location) => void
  useMyLocation: (index: number) => void
  addNote: (siteIndex: number) => void
  deleteNote: (siteIndex: number, noteIndex: number) => void
  openSites: () => void
  openNote: (noteIndex: number) => void
}

const SiteForm = (props: SiteFormProps): UiComponent => {
  const location = props.site.location[0] ?? {}
  return (
    <UiLayout>
      <DepthReturn label='Sites' onClick={props.openSites} />
      <h3 data-app='onboarding-depth-title'>{siteName(props.site)}</h3>
      <UiFieldset legend='Identity'>
        <SiteTextInput
          index={props.index}
          name='siteLabel'
          label='Site Label'
          value={props.site.label}
          required
          placeholder='e.g., "Main Office" or "South Pasture"'
          onValue={value => props.updateSite(props.index, site => ({ ...site, label: value }))}
        />
      </UiFieldset>
      <UiFieldset legend='Address'>
        <UiLayout>
          <SiteTextInput
            index={props.index}
            name='siteLine1'
            label='Address'
            value={location.line1}
            onValue={value =>
              props.updateLocation(props.index, location => ({
                ...location,
                line1: optionalText(value)
              }))}
          />
          <SiteTextInput
            index={props.index}
            name='siteLine2'
            label='Unit / Suite'
            value={location.line2}
            onValue={value =>
              props.updateLocation(props.index, location => ({
                ...location,
                line2: optionalText(value)
              }))}
          />
          <UiLayout variant='inline-wrap'>
            <SiteTextInput
              index={props.index}
              name='siteCity'
              label='City'
              value={location.city}
              onValue={value =>
                props.updateLocation(props.index, location => ({
                  ...location,
                  city: optionalText(value)
                }))}
            />
            <SiteTextInput
              index={props.index}
              name='siteState'
              label='State / Province'
              value={location.state}
              onValue={value =>
                props.updateLocation(props.index, location => ({
                  ...location,
                  state: optionalText(value)
                }))}
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
          </UiLayout>
          <SiteTextInput
            index={props.index}
            name='siteCountry'
            label='Country'
            value={location.country}
            onValue={value =>
              props.updateLocation(props.index, location => ({
                ...location,
                country: optionalText(value)
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
          <UiActionButton
            icon='crosshair-2'
            label='Use my location'
            disabled={!props.hasGeo}
            onClick={() => props.useMyLocation(props.index)}
          />
        </div>
      </UiFieldset>
      <SiteTextInput
        index={props.index}
        name='siteAcreage'
        label='Acreage'
        type='number'
        value={numberText(props.site.acreage)}
        onValue={value =>
          props.updateSite(props.index, site => ({ ...site, acreage: numberValue(value) }))}
      />
      <BoundedList
        legend='Notes'
        empty={props.site.notes.length === 0}
        emptyMessage='No notes yet. Use New note to add one.'
        newLabel='New note'
        onNew={() => props.addNote(props.index)}
      >
        <For each={props.site.notes}>
          {(note, noteIndex) => (
            <DepthListRow
              label={noteName(note)}
              placeholder='Empty note'
              deleteLabel='Delete note'
              onSelect={() => props.openNote(noteIndex())}
              onDelete={() => props.deleteNote(props.index, noteIndex())}
            />
          )}
        </For>
      </BoundedList>
    </UiLayout>
  )
}

type NoteFormProps = {
  note: Note
  siteIndex: number
  noteIndex: number
  parentName: string
  updateNote: (siteIndex: number, noteIndex: number, update: (note: Note) => Note) => void
  addAttachment: (siteIndex: number, noteIndex: number) => void
  deleteAttachment: (siteIndex: number, noteIndex: number, attachmentIndex: number) => void
  openSite: () => void
  openAttachment: (attachmentIndex: number) => void
}

const NoteForm = (props: NoteFormProps): UiComponent => (
  <UiLayout>
    <DepthReturn label={props.parentName} onClick={props.openSite} />
    <h3 data-app='onboarding-depth-title'>
      <span data-app='onboarding-note-title' data-app-empty={props.note.content.trim() ? undefined : ''}>
        {noteName(props.note)}
      </span>
    </h3>
    <UiField for={`site-note-content-${props.siteIndex}-${props.noteIndex}`} label='Note'>
      <UiTextArea
        name={`site-note-content-${props.siteIndex}-${props.noteIndex}`}
        rows={6}
        value={props.note.content}
        onInput={event =>
          props.updateNote(props.siteIndex, props.noteIndex, note => ({
            ...note,
            content: event.currentTarget.value
          }))}
      />
    </UiField>
    <BoundedList
      legend='Attachments'
      empty={props.note.attachments.length === 0}
      emptyMessage='No attachments yet. Use New attachment to add one.'
      newLabel='New attachment'
      onNew={() => props.addAttachment(props.siteIndex, props.noteIndex)}
    >
      <For each={props.note.attachments}>
        {(attachment, attachmentIndex) => (
          <DepthListRow
            label={attachmentName(attachment)}
            placeholder='Untitled attachment'
            deleteLabel='Delete attachment'
            onSelect={() => props.openAttachment(attachmentIndex())}
            onDelete={() => props.deleteAttachment(props.siteIndex, props.noteIndex, attachmentIndex())}
          />
        )}
      </For>
    </BoundedList>
  </UiLayout>
)

type AttachmentFormProps = {
  attachment: Attachment
  siteIndex: number
  noteIndex: number
  attachmentIndex: number
  parentName: string
  updateAttachment: (
    siteIndex: number,
    noteIndex: number,
    attachmentIndex: number,
    update: (attachment: Attachment) => Attachment
  ) => void
  openNote: () => void
}

const AttachmentForm = (props: AttachmentFormProps): UiComponent => (
  <UiLayout>
    <DepthReturn label={props.parentName} onClick={props.openNote} />
    <h3 data-app='onboarding-depth-title'>{attachmentName(props.attachment)}</h3>
    <AttachmentTextInput
      siteIndex={props.siteIndex}
      noteIndex={props.noteIndex}
      attachmentIndex={props.attachmentIndex}
      name='attachmentFilename'
      label='Filename'
      value={props.attachment.filename}
      onValue={value => ({ filename: value })}
      updateAttachment={props.updateAttachment}
    />
    <AttachmentTextInput
      siteIndex={props.siteIndex}
      noteIndex={props.noteIndex}
      attachmentIndex={props.attachmentIndex}
      name='attachmentUrl'
      label='URL'
      value={props.attachment.url}
      onValue={value => ({ url: value })}
      updateAttachment={props.updateAttachment}
    />
    <AttachmentTextInput
      siteIndex={props.siteIndex}
      noteIndex={props.noteIndex}
      attachmentIndex={props.attachmentIndex}
      name='attachmentContentType'
      label='Content Type'
      value={props.attachment.contentType}
      placeholder='e.g., image/jpeg'
      onValue={value => ({ contentType: value })}
      updateAttachment={props.updateAttachment}
    />
    <UiField
      for={`attachment-kind-${props.siteIndex}-${props.noteIndex}-${props.attachmentIndex}`}
      label='Kind'
    >
      <UiSingleSelect
        name={`attachment-kind-${props.siteIndex}-${props.noteIndex}-${props.attachmentIndex}`}
        value={props.attachment.kind}
        options={ATTACHMENT_KIND_OPTIONS}
        onChange={value =>
          props.updateAttachment(
            props.siteIndex,
            props.noteIndex,
            props.attachmentIndex,
            attachment => ({ ...attachment, kind: value as AttachmentKind })
          )}
      />
    </UiField>
  </UiLayout>
)

type AttachmentTextInputProps = {
  siteIndex: number
  noteIndex: number
  attachmentIndex: number
  name: 'attachmentFilename' | 'attachmentUrl' | 'attachmentContentType'
  label: string
  value: string
  placeholder?: string
  onValue: (value: string) => Partial<Attachment>
  updateAttachment: (
    siteIndex: number,
    noteIndex: number,
    attachmentIndex: number,
    update: (attachment: Attachment) => Attachment
  ) => void
}

const AttachmentTextInput = (props: AttachmentTextInputProps): UiComponent => {
  const name = `${props.name}-${props.siteIndex}-${props.noteIndex}-${props.attachmentIndex}`
  return (
    <UiField for={name} label={props.label}>
      <UiInput
        name={name}
        value={props.value}
        placeholder={props.placeholder}
        onInput={event =>
          props.updateAttachment(
            props.siteIndex,
            props.noteIndex,
            props.attachmentIndex,
            attachment => ({ ...attachment, ...props.onValue(event.currentTarget.value) })
          )}
      />
    </UiField>
  )
}

type BoundedListProps = {
  legend: string
  empty: boolean
  emptyMessage: string
  newLabel: string
  onNew: () => void
  children: UiComponent
}

const BoundedList = (props: BoundedListProps): UiComponent => (
  <UiFieldset legend={props.legend}>
    <div data-app='onboarding-depth-actions' data-app-align='end'>
      <UiActionButton
        icon='plus'
        label={props.newLabel}
        labelMode='visible'
        onClick={props.onNew}
      />
    </div>
    <div data-app='onboarding-bounded-list'>
      <Show when={!props.empty} fallback={<p data-app='onboarding-empty-list'>{props.emptyMessage}</p>}>
        <UiList>{props.children}</UiList>
      </Show>
    </div>
  </UiFieldset>
)

type DepthListRowProps = {
  label: string
  placeholder: string
  deleteLabel: string
  onSelect: () => void
  onDelete: () => void
}

const DepthListRow = (props: DepthListRowProps): UiComponent => {
  const empty = () => !props.label.trim()
  return (
    <UiListItem>
      <div data-app='onboarding-depth-row'>
        <UiButton variant='ghost' onClick={props.onSelect}>
          <span data-app='onboarding-depth-row-label' data-app-empty={empty() ? '' : undefined}>
            {empty() ? props.placeholder : props.label}
          </span>
        </UiButton>
        <UiActionButton
          icon='trash'
          label={props.deleteLabel}
          variant='danger'
          onClick={props.onDelete}
        />
      </div>
    </UiListItem>
  )
}

type DepthReturnProps = {
  label: string
  onClick: () => void
}

const DepthReturn = (props: DepthReturnProps): UiComponent => (
  <div data-app='onboarding-depth-actions' data-app-align='start'>
    <UiActionButton
      align='start'
      icon='corner-top-left'
      label={props.label}
      labelMode='visible'
      onClick={props.onClick}
    />
  </div>
)

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

const newNote = (): Note => ({
  attachments: [],
  createdAt: when(),
  content: '',
  visibility: 'internal',
  tags: []
})

const newAttachment = (): Attachment => ({
  filename: '',
  url: '',
  contentType: '',
  kind: 'photo',
  uploadedAt: when()
})

const ATTACHMENT_KIND_OPTIONS = [
  { value: 'photo', label: 'Photo' },
  { value: 'video', label: 'Video' },
  { value: 'map', label: 'Map' },
  { value: 'document', label: 'Document' }
]

const siteName = (site: CustomerSite): string => site.label.trim() || 'Untitled site'

const noteName = (note: Note): string => note.content.trim() || 'Empty note'

const attachmentName = (attachment: Attachment): string =>
  attachment.filename.trim() || 'Untitled attachment'

const optionalText = (value: string): string | undefined => value.trim() ? value : undefined

const numberText = (value: number | undefined): string => value === undefined ? '' : value.toString()

const numberValue = (value: string): number | undefined => {
  if (!value.trim()) return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}
