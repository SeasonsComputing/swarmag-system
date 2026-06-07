/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ swarmAg living style guide                                                   ║
║ Browser validation page for design tokens and common controls.               ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { createEffect, createSignal, For } from '@solid-js'

// dprint-ignore
import {
  UiAccordion, UiAccordionContent, UiAccordionItem, UiAccordionTrigger, UiAlert, UiAvatar,
  UiBadge, UiButton, UiCard, UiCheckbox, UiDialog, UiField, UiFieldset, UiFooter,
  UiFormActions, UiInput, UiLayout, UiList, UiListItem, UiMultiSelect,
  UiPopover, UiProgress, UiRadioGroup, UiRadioItem, UiSingleSelect, UiSeparator,
  UiSkeleton, UiSpinner, UiTab, UiTable, UiTableBody, UiTableCell, UiTableHeader,
  UiTableRow, UiTabList, UiTabPanel, UiTabs, UiTextArea, UiToggle, UiToggleGroup,
  UiToggleItem, UiTooltip, type UiComponent, type UiContainerProps
} from '@ux/common/components/ui'

import '@ux/common/components/css/css.tsx'
import './style-guide.css'

import logo from '@ux/common/assets/logos/swarmag-logo-wordmark.png'

import {
  ACCORDION_DEFAULT_VALUE,
  BUTTON_VARIANTS,
  COLOR_SWATCHES,
  DEFAULT_SERVICES,
  EQUIPMENT,
  SERVICES,
  STATUSES,
  TEXT_TOKENS
} from './style-guide-fixtures.ts'

/** Style-guide specimen enumerations */
type Theme = 'dark' | 'light'
type Services = 'aerial' | 'ground'
type ServiceStatus = 'inspection' | 'ready' | 'blocked' | 'review'
type ServiceArrival = 'morning' | 'afternoon' | 'night'
type RadioValue = Services | ServiceStatus | ServiceArrival
type ViewMode = 'map' | 'list' | 'grid'
type Tab = 'assessment' | 'planning' | 'crew'
type TabScroll = Tab | 'chemicals' | 'execution' | 'reporting' | 'followup'

/** Header with theme switching for validating controls across supported themes. */
const SgHeader = (): UiComponent => {
  const [theme, setTheme] = createSignal<Theme>('dark')
  createEffect(() => document.documentElement.dataset.theme = theme())
  return (
    <header class='sg-header'>
      <div class='sg-header-contents'>
        <UiLayout gap='none'>
          <h1>
            swarmAg <span class='nowrap'>Style Guide</span>
          </h1>
          <p class='sg-header-subtitle'>
            Living visual validation for tokens, states, themes, and controls.
          </p>
        </UiLayout>
        <UiToggleGroup<Theme> value={theme()} onChange={setTheme}>
          <UiToggleItem value='dark'>Dark</UiToggleItem>
          <UiToggleItem value='light'>Light</UiToggleItem>
        </UiToggleGroup>
      </div>
    </header>
  )
}

/** Footer for the style guide. */
const SgFooter = (): UiComponent => (<UiFooter logo={logo} alt='swarmAg' />)

/** Main content area for the style guide. */
type SgMainProps = UiContainerProps
const SgMain = (props: SgMainProps): UiComponent => (
  <main class='sg-main'>
    {props.children}
  </main>
)

/** Framed style-guide section used to group related control specimens. */
type SgSectionProps = UiContainerProps & { title: string }
const SgSection = (props: SgSectionProps): UiComponent => (
  <section class='sg-section'>
    <UiLayout gap='tight'>
      <h2>{props.title}</h2>
      <UiCard>
        <UiLayout>
          {props.children}
        </UiLayout>
      </UiCard>
    </UiLayout>
  </section>
)

/** Color swatch used to display a color value and its token name. */
type SgSwatchProps = {
  value: string
  label: string
  token: string
}
const SgSwatch = (props: SgSwatchProps): UiComponent => (
  <figure class='sg-swatch'>
    <div class='sg-swatch-chip' style={{ background: props.value }} />
    <figcaption>
      <UiLayout gap='tight'>
        <span>{props.label}</span>
        <code>{props.token}</code>
      </UiLayout>
    </figcaption>
  </figure>
)

/** Single-page living style guide application. */
export const StyleGuide = (): UiComponent => {
  const [loading, setLoading] = createSignal(false)
  const [inputError, setInputError] = createSignal(false)
  const [selectError, setSelectError] = createSignal(false)
  const [checkboxChecked, setCheckboxChecked] = createSignal(true)
  const [checkboxDrift, setCheckboxDrift] = createSignal(false)
  const [checkboxError, setCheckboxError] = createSignal(false)
  const [radioValue, setRadioValue] = createSignal<RadioValue>('aerial')
  const [togglePressed, setTogglePressed] = createSignal(true)
  const [viewMode, setViewMode] = createSignal<ViewMode>('map')
  const [tab, setTab] = createSignal<Tab>('assessment')
  const [tabScroll, setTabScroll] = createSignal<TabScroll>('assessment')

  return (
    <>
      <SgHeader />

      <SgMain>
        <UiLayout gap='loose'>
          <SgSection title='Typography'>
            <UiFieldset legend='Typefaces'>
              <UiTable>
                <UiTableHeader>
                  <UiTableCell>Role</UiTableCell>
                  <UiTableCell>Example</UiTableCell>
                </UiTableHeader>
                <UiTableBody>
                  <UiTableRow variant='section'>
                    <UiTableCell>Comfortaa</UiTableCell>
                  </UiTableRow>
                  <UiTableRow>
                    <UiTableCell>Heading</UiTableCell>
                    <UiTableCell>
                      <span class='sg-font-heading'>Operations briefing schedule confirmed</span>
                    </UiTableCell>
                  </UiTableRow>
                  <UiTableRow>
                    <UiTableCell>Body</UiTableCell>
                    <UiTableCell>
                      <span class='sg-font-body'>
                        Inspect field boundaries and document hazard zones
                      </span>
                    </UiTableCell>
                  </UiTableRow>
                  <UiTableRow variant='section'>
                    <UiTableCell>Lexend</UiTableCell>
                  </UiTableRow>
                  <UiTableRow>
                    <UiTableCell>Label</UiTableCell>
                    <UiTableCell>
                      <span class='sg-font-label'>Service window 06:00–09:00</span>
                    </UiTableCell>
                  </UiTableRow>
                  <UiTableRow>
                    <UiTableCell>Annotation</UiTableCell>
                    <UiTableCell>
                      <span class='sg-font-annotation'>Caption or Legend</span>
                    </UiTableCell>
                  </UiTableRow>
                  <UiTableRow>
                    <UiTableCell>UI</UiTableCell>
                    <UiTableCell>
                      <span class='sg-font-ui'>Assign crew and assets for spray mission</span>
                    </UiTableCell>
                  </UiTableRow>
                  <UiTableRow variant='section'>
                    <UiTableCell>Cascadia Mono</UiTableCell>
                  </UiTableRow>
                  <UiTableRow>
                    <UiTableCell>Data</UiTableCell>
                    <UiTableCell>
                      <samp>service.status = 'ready'; acres = 142</samp>
                    </UiTableCell>
                  </UiTableRow>
                </UiTableBody>
              </UiTable>
            </UiFieldset>
            <UiFieldset legend='<h1>, <h2>, <h3>, <h4>, <h5>'>
              <h1>H1 Operations Command</h1>
              <h2>H2 Field Service Planning</h2>
              <h3>H3 Aerial Application Window</h3>
              <h4>H4 Ground Crew Assignment</h4>
              <h5>H5 Chemical Label Review</h5>
            </UiFieldset>
            <UiFieldset legend='<body>, <p>, <blockquote>'>
              <p>
                Body copy should inherit the product typography without local component styling. Weather,
                acreage, crew availability, and service windows remain scannable.
              </p>
              <blockquote>
                Service logs are records of field reality and must remain clear, durable, and auditable.
              </blockquote>
            </UiFieldset>
            <UiFieldset legend='<code>, <kbd>, <samp>, <pre>'>
              <p>
                Inline code sample: <code>service.category === 'aerial-drone-services'</code>
              </p>
              <p>
                Keyboard shortcut: Press <kbd>Ctrl+S</kbd> to save the job plan.
              </p>
              <p>
                System output: <samp>asset.status = 'ready'</samp>
              </p>
              <pre>{`const acres = 142\nconst service = 'Aerial - Fixed Wing'`}</pre>
            </UiFieldset>
          </SgSection>

          <SgSection title='HTML'>
            <UiFieldset legend='<table>, <thead>, <tbody>, <tr>, <th>, <td>'>
              <UiField
                label='UiTable, UiTableHeader, UiTableBody, UiTableRow, UiTableCell, UiTableSection'
                variant='caption'
              >
                <UiTable overflow='scroll'>
                  <UiTableHeader>
                    <UiTableCell>Equipment</UiTableCell>
                    <UiTableCell>Application</UiTableCell>
                    <UiTableCell align='end'>Price</UiTableCell>
                    <UiTableCell align='end'>Cost</UiTableCell>
                  </UiTableHeader>
                  <UiTableBody>
                    <For each={EQUIPMENT}>
                      {e => (
                        <>
                          <UiTableRow variant='section'>
                            <UiTableCell>{e.section}</UiTableCell>
                          </UiTableRow>
                          <For each={e.items}>
                            {i => (
                              <UiTableRow>
                                <UiTableCell>{i.name}</UiTableCell>
                                <UiTableCell>{i.application}</UiTableCell>
                                <UiTableCell align='end'>
                                  <samp>{i.price}</samp>
                                </UiTableCell>
                                <UiTableCell align='end'>
                                  <samp>{i.cost}</samp>
                                </UiTableCell>
                              </UiTableRow>
                            )}
                          </For>
                        </>
                      )}
                    </For>
                  </UiTableBody>
                </UiTable>
              </UiField>
            </UiFieldset>
            <UiFieldset legend='<ul>, <ol>, <li>'>
              <UiLayout variant='inline-wrap'>
                <UiField label='UiList (default)' variant='caption'>
                  <UiList>
                    <UiListItem>Confirm chemical inventory.</UiListItem>
                    <UiListItem>Verify crew certification.</UiListItem>
                    <UiListItem>Inspect required assets.</UiListItem>
                  </UiList>
                </UiField>
                <UiField label='UiList (bullet)' variant='caption'>
                  <UiList variant='bullet'>
                    <UiListItem>Confirm chemical inventory.</UiListItem>
                    <UiListItem>Verify crew certification.</UiListItem>
                    <UiListItem>Inspect required assets.</UiListItem>
                  </UiList>
                </UiField>
                <UiField label='UiList (numbered)' variant='caption'>
                  <UiList variant='numbered'>
                    <UiListItem>Assess site.</UiListItem>
                    <UiListItem>Plan service.</UiListItem>
                    <UiListItem>Execute work.</UiListItem>
                  </UiList>
                </UiField>
              </UiLayout>
            </UiFieldset>
            <UiFieldset legend='<input>, <textarea>, <select>, <option>'>
              <UiLayout variant='inline-wrap'>
                <UiField label='UiInput' for='field-name-1'>
                  <UiInput
                    name='field-name-1'
                    value='North Field'
                    error={inputError()}
                    onInput={() => undefined}
                    placeholder='Enter service location'
                  />
                </UiField>
                <UiField label='UiTextArea' for='application-notes-1'>
                  <UiTextArea
                    name='application-notes-1'
                    error={inputError()}
                    onInput={() => undefined}
                    value='Spray window 06:00–09:00. Wind break along west ridge; verify drift boundary before launch.'
                    placeholder='Wind break along west ridge; verify drift boundary before launch.'
                    rows={6}
                  />
                </UiField>
              </UiLayout>
              <UiLayout variant='inline-wrap'>
                <UiField label='UiSingleSelect' for='service-status'>
                  <UiSingleSelect
                    name='service-status'
                    placeholder='Select service status'
                    error={selectError()}
                    options={STATUSES}
                  />
                </UiField>
                <UiField label='UiMultiSelect' variant='caption'>
                  <UiMultiSelect
                    options={SERVICES}
                    defaultValue={[...DEFAULT_SERVICES]}
                  />
                </UiField>
              </UiLayout>
            </UiFieldset>
          </SgSection>

          <SgSection title='Color'>
            <UiLayout variant='inline-wrap'>
              <For each={COLOR_SWATCHES}>
                {s => (
                  <UiFieldset legend={s.legend}>
                    <UiLayout variant='inline-fill'>
                      <For each={s.colors}>
                        {c => <SgSwatch value={c.value} label={c.label} token={c.token} />}
                      </For>
                    </UiLayout>
                  </UiFieldset>
                )}
              </For>
            </UiLayout>
            <UiFieldset legend='Gradient/Brand'>
              <figure>
                <div class='sg-gradient-block' />
                <figcaption>
                  <span>start</span>
                  <span>mid</span>
                  <span>end</span>
                </figcaption>
              </figure>
            </UiFieldset>
            <UiFieldset legend='Text'>
              <UiLayout variant='inline-wrap'>
                <For each={TEXT_TOKENS}>
                  {t => <span style={{ color: `var(${t})` }}>{t}</span>}
                </For>
              </UiLayout>
            </UiFieldset>
          </SgSection>

          <SgSection title='Decorations'>
            <UiLayout>
              <UiLayout variant='inline-fill'>
                <UiFieldset legend='UiAvatar'>
                  <UiAvatar>AG</UiAvatar>
                </UiFieldset>
                <UiFieldset legend='UiSpinner'>
                  <UiSpinner />
                </UiFieldset>
              </UiLayout>
              <UiFieldset legend='UiSeparator'>
                <UiSeparator />
              </UiFieldset>
            </UiLayout>
          </SgSection>

          <SgSection title='UiButton'>
            <UiField label='Toggle loading state' for='button-loading-toggle' variant='inline'>
              <UiToggle
                id='button-loading-toggle'
                pressed={loading()}
                onClick={() => setLoading(!loading())}
              >
                Loading
              </UiToggle>
            </UiField>
            <UiFieldset legend='Variants'>
              <UiLayout variant='inline'>
                <For each={BUTTON_VARIANTS}>
                  {b => <UiButton variant={b.variant}>{b.label}</UiButton>}
                </For>
              </UiLayout>
            </UiFieldset>
            <UiFieldset legend='Disabled and loading'>
              <UiLayout variant='inline'>
                <UiButton disabled>Disabled</UiButton>
                <UiButton variant='primary' loading={loading()}>Loading</UiButton>
              </UiLayout>
            </UiFieldset>
          </SgSection>

          <SgSection title='UiInput / UiTextArea'>
            <UiField label='Toggle error state' for='input-error-toggle' variant='inline'>
              <UiToggle
                id='input-error-toggle'
                pressed={inputError()}
                onClick={() => setInputError(!inputError())}
              >
                Error
              </UiToggle>
            </UiField>
            <UiFieldset legend='Enabled'>
              <UiLayout variant='inline-wrap'>
                <UiField label='Field name' for='field-name-2'>
                  <UiInput
                    name='field-name-2'
                    value='North Field'
                    error={inputError()}
                    onInput={() => undefined}
                    placeholder='Enter service location'
                  />
                </UiField>
                <UiField label='Application notes' for='application-notes-2'>
                  <UiTextArea
                    name='application-notes-2'
                    error={inputError()}
                    onInput={() => undefined}
                    value='Spray window 06:00–09:00. Wind break along west ridge; verify drift boundary before launch.'
                    placeholder='Wind break along west ridge; verify drift boundary before launch.'
                    rows={6}
                  />
                </UiField>
              </UiLayout>
            </UiFieldset>
            <UiFieldset legend='Disabled'>
              <UiLayout variant='inline-wrap'>
                <UiField label='Disabled acreage' for='disabled-acreage'>
                  <UiInput
                    name='disabled-acreage'
                    disabled
                    value='142 acres'
                    onInput={() => undefined}
                  />
                </UiField>
                <UiField label='Disabled comments' for='disabled-comments'>
                  <UiTextArea
                    name='disabled-comments'
                    disabled
                    value='Locked after crew dispatch.'
                    onInput={() => undefined}
                    rows={6}
                  />
                </UiField>
              </UiLayout>
            </UiFieldset>
          </SgSection>

          <SgSection title='UiSingleSelect / UiMultiSelect'>
            <UiField label='Toggle error state' for='select-error-toggle' variant='inline'>
              <UiToggle
                id='select-error-toggle'
                pressed={selectError()}
                onClick={() => setSelectError(!selectError())}
              >
                Error
              </UiToggle>
            </UiField>
            <UiFieldset legend='Single-select'>
              <UiLayout variant='inline-wrap'>
                <UiField label='Enabled select' for='service-status'>
                  <UiSingleSelect
                    name='service-status'
                    placeholder='Select service status'
                    error={selectError()}
                    options={STATUSES}
                  />
                </UiField>
                <UiField label='Disabled select' for='disabled-select'>
                  <UiSingleSelect
                    name='disabled-select'
                    disabled
                    defaultValue='Ready'
                    options={STATUSES}
                  />
                </UiField>
              </UiLayout>
            </UiFieldset>
            <UiFieldset legend='Multi-select'>
              <UiMultiSelect options={SERVICES} defaultValue={[...DEFAULT_SERVICES]} />
            </UiFieldset>
          </SgSection>

          <SgSection title='UiField / UiFieldset / UiLayout / UiFormActions'>
            <UiFieldset legend='Service details'>
              <UiLayout variant='inline-wrap'>
                <UiField label='Field name' for='form-demo-name'>
                  <UiInput name='form-demo-name' value='North Field' onInput={() => undefined} />
                </UiField>
                <UiField label='Service type' for='form-demo-service'>
                  <UiSingleSelect
                    name='form-demo-service'
                    options={STATUSES}
                    placeholder='Select service type'
                  />
                </UiField>
              </UiLayout>
              <UiField label='Field notes' for='form-demo-notes'>
                <UiTextArea
                  name='form-demo-notes'
                  value='Spray window 06:00–09:00.'
                  onInput={() => undefined}
                  rows={3}
                />
              </UiField>
            </UiFieldset>
            <UiFormActions>
              <UiButton variant='ghost'>Cancel</UiButton>
              <UiButton variant='primary'>Save</UiButton>
            </UiFormActions>
          </SgSection>

          <SgSection title='UiCheckbox'>
            <UiFieldset legend='Checkbox States'>
              <UiLayout variant='inline'>
                <UiCheckbox checked={checkboxChecked()} onChange={setCheckboxChecked}>
                  Label reviewed
                </UiCheckbox>
                <UiCheckbox checked={checkboxDrift()} onChange={setCheckboxDrift}>
                  Drift boundary verified
                </UiCheckbox>
                <UiCheckbox error checked={checkboxError()} onChange={setCheckboxError}>
                  Missing wind reading
                </UiCheckbox>
                <UiCheckbox disabled checked>Disabled complete</UiCheckbox>
              </UiLayout>
            </UiFieldset>
          </SgSection>

          <SgSection title='UiRadioGroup / UiRadioItem'>
            <UiFieldset legend='Radio States'>
              <UiLayout variant='inline-wrap'>
                <UiRadioGroup value={radioValue()} onChange={setRadioValue}>
                  <UiRadioItem value='aerial'>Aerial application</UiRadioItem>
                  <UiRadioItem value='ground'>Ground machinery</UiRadioItem>
                  <UiRadioItem value='inspection'>Site inspection</UiRadioItem>
                </UiRadioGroup>
                <UiRadioGroup error defaultValue='blocked'>
                  <UiRadioItem value='ready'>Ready</UiRadioItem>
                  <UiRadioItem value='blocked'>Blocked</UiRadioItem>
                  <UiRadioItem value='review'>Needs review</UiRadioItem>
                </UiRadioGroup>
                <UiRadioGroup disabled defaultValue='night'>
                  <UiRadioItem value='morning'>Morning</UiRadioItem>
                  <UiRadioItem value='afternoon'>Afternoon</UiRadioItem>
                  <UiRadioItem value='night'>Night</UiRadioItem>
                </UiRadioGroup>
              </UiLayout>
            </UiFieldset>
          </SgSection>

          <SgSection title='UiToggle / UiToggleGroup / UiToggleItem'>
            <UiLayout variant='inline'>
              <UiToggle pressed={togglePressed()} onClick={() => setTogglePressed(!togglePressed())}>
                Active crews
              </UiToggle>
              <UiToggle pressed={false}>Offline jobs</UiToggle>
            </UiLayout>
            <UiToggleGroup value={viewMode()} onChange={setViewMode}>
              <UiToggleItem value='map'>Map</UiToggleItem>
              <UiToggleItem value='list'>List</UiToggleItem>
              <UiToggleItem value='grid'>Grid</UiToggleItem>
            </UiToggleGroup>
          </SgSection>

          <SgSection title='UiTabs / UiTabList / UiTab / UiTabPanel'>
            <UiTabs value={tab()} onChange={setTab}>
              <UiTabList layout='between'>
                <UiTab value='assessment'>Assessment</UiTab>
                <UiTab value='planning'>Planning</UiTab>
                <UiTab value='crew'>Crew Assignments</UiTab>
              </UiTabList>
              <UiTabPanel value='assessment'>Walk field edges and capture hazard notes.</UiTabPanel>
              <UiTabPanel value='planning'>
                Assign crew, assets, chemicals, and service window.
              </UiTabPanel>
              <UiTabPanel value='crew'>Confirm operator roles and crew availability.</UiTabPanel>
            </UiTabs>
            <UiTabs value={tabScroll()} onChange={setTabScroll} activationMode='automatic'>
              <UiTabList>
                <UiTab value='assessment'>Assessment</UiTab>
                <UiTab value='planning'>Planning</UiTab>
                <UiTab value='crew'>Crew Assignments</UiTab>
                <UiTab value='chemicals'>Chemical Readiness</UiTab>
                <UiTab value='execution'>Execution</UiTab>
                <UiTab value='reporting'>Customer Reporting</UiTab>
                <UiTab value='followup'>Followup</UiTab>
              </UiTabList>
              <UiTabPanel value='assessment'>Walk field edges and capture hazard notes.</UiTabPanel>
              <UiTabPanel value='planning'>
                Assign crew, assets, chemicals, and service window.
              </UiTabPanel>
              <UiTabPanel value='crew'>Confirm operator roles and crew availability.</UiTabPanel>
              <UiTabPanel value='chemicals'>
                Review inventory, labels, and restricted-use status.
              </UiTabPanel>
              <UiTabPanel value='execution'>
                Record work logs and answer workflow questions.
              </UiTabPanel>
              <UiTabPanel value='reporting'>
                Assemble maps, photos, notes, and service summary.
              </UiTabPanel>
              <UiTabPanel value='followup'>
                Prepare customer report and close service record.
              </UiTabPanel>
            </UiTabs>
          </SgSection>

          <SgSection title='UiProgress'>
            <UiFieldset legend='Progress Indicators'>
              <UiLayout>
                <UiProgress value={0} />
                <UiProgress value={35} />
                <UiProgress value={68} />
                <UiProgress value={100} />
              </UiLayout>
            </UiFieldset>
          </SgSection>

          <SgSection title='UiSkeleton'>
            <UiFieldset legend='Loading Indicators'>
              <UiLayout>
                <UiSkeleton />
                <div class='sg-skeleton-75'>
                  <UiSkeleton />
                </div>
                <div class='sg-skeleton-50'>
                  <UiSkeleton />
                </div>
              </UiLayout>
            </UiFieldset>
          </SgSection>

          <SgSection title='UiBadge'>
            <UiFieldset legend='Variants'>
              <UiLayout variant='inline'>
                <UiBadge>Pending</UiBadge>
                <UiBadge variant='success'>Field ready</UiBadge>
                <UiBadge variant='warning'>Wind watch</UiBadge>
                <UiBadge variant='danger'>Blocked</UiBadge>
                <UiBadge variant='info'>Assessment</UiBadge>
              </UiLayout>
            </UiFieldset>
          </SgSection>

          <SgSection title='UiAlert'>
            <UiFieldset legend='Variants'>
              <UiLayout>
                <UiAlert>Service record updated by dispatch.</UiAlert>
                <UiAlert variant='success'>North Field completed and ready for customer review.</UiAlert>
                <UiAlert variant='warning'>Wind speed approaching service threshold.</UiAlert>
                <UiAlert variant='danger'>Chemical label missing required re-entry interval.</UiAlert>
                <UiAlert variant='info'>Crew assignment changed for the morning window.</UiAlert>
              </UiLayout>
            </UiFieldset>
          </SgSection>

          <SgSection title='Secondary Windows'>
            <UiLayout variant='inline-wrap'>
              <UiFieldset legend='UiTooltip'>
                <UiLayout variant='inline'>
                  <UiTooltip trigger='Hover field note' defaultOpen>
                    Verify buffer zone before aerial application.
                  </UiTooltip>
                </UiLayout>
              </UiFieldset>
              <UiFieldset legend='UiDialog'>
                <UiLayout variant='inline'>
                  <UiDialog trigger='Open dispatch dialog'>
                    <UiLayout>
                      <p>Confirm crew assignment before dispatch.</p>
                    </UiLayout>
                  </UiDialog>
                </UiLayout>
              </UiFieldset>
              <UiFieldset legend='UiPopover'>
                <UiLayout variant='inline'>
                  <UiPopover trigger='Open field menu'>
                    <UiLayout>
                      <p>Field actions, notes, and service history.</p>
                    </UiLayout>
                  </UiPopover>
                </UiLayout>
              </UiFieldset>
            </UiLayout>
          </SgSection>

          <SgSection title='UiAccordion'>
            <UiAccordion defaultValue={[...ACCORDION_DEFAULT_VALUE]}>
              <UiAccordionItem value='weather'>
                <UiAccordionTrigger>Weather window</UiAccordionTrigger>
                <UiAccordionContent>
                  <UiList variant='bullet'>
                    <UiListItem>Wind speed 12 km/h — within threshold</UiListItem>
                    <UiListItem>Precipitation 0% — clear</UiListItem>
                    <UiListItem>Visibility 18 km — acceptable</UiListItem>
                    <UiListItem>Temperature 21°C — nominal</UiListItem>
                  </UiList>
                </UiAccordionContent>
              </UiAccordionItem>
              <UiAccordionItem value='crew'>
                <UiAccordionTrigger>Crew status</UiAccordionTrigger>
                <UiAccordionContent>
                  <UiList variant='numbered'>
                    <UiListItem>Lead operator certified and on-site</UiListItem>
                    <UiListItem>Equipment pre-check complete</UiListItem>
                    <UiListItem>Safety brief conducted</UiListItem>
                    <UiListItem>Flight plan filed and acknowledged</UiListItem>
                  </UiList>
                </UiAccordionContent>
              </UiAccordionItem>
              <UiAccordionItem value='compliance'>
                <UiAccordionTrigger>Compliance notes</UiAccordionTrigger>
                <UiAccordionContent>
                  <UiList variant='bullet'>
                    <UiListItem>Buffer zones confirmed</UiListItem>
                    <UiListItem>No restricted area conflicts detected</UiListItem>
                    <UiListItem>Chemical application rate within permit limits</UiListItem>
                  </UiList>
                </UiAccordionContent>
              </UiAccordionItem>
            </UiAccordion>
          </SgSection>

          <SgSection title='UiCard'>
            <UiLayout variant='inline-wrap'>
              <UiCard>
                <UiLayout>
                  <h3>Default card</h3>
                  <p>
                    Quiet interior surface — no variant. Used for form sections and guided workflow
                    sub-groups.
                  </p>
                </UiLayout>
              </UiCard>
              <UiCard variant='widget'>
                <UiLayout>
                  <h3>Widget card</h3>
                  <p>
                    Dashboard-ready surface with stripe treatment and crisp separation from the page.
                  </p>
                </UiLayout>
              </UiCard>
              <UiCard variant='workflow'>
                <UiLayout>
                  <h3>Workflow card</h3>
                  <p>
                    Primary framed container for guided flows that need stronger focus and elevation.
                  </p>
                </UiLayout>
              </UiCard>
            </UiLayout>
          </SgSection>

          <SgSection title='UiLayout'>
            <UiLayout variant='inline-wrap'>
              <UiFieldset legend='Stack (block, default)'>
                <UiLayout>
                  <UiAlert>North Field spray window confirmed.</UiAlert>
                  <UiAlert variant='warning'>Wind speed approaching threshold.</UiAlert>
                  <UiAlert variant='success'>Crew pre-check complete.</UiAlert>
                </UiLayout>
              </UiFieldset>
              <UiFieldset legend='Stack (block-fit)'>
                <UiLayout variant='block-fit'>
                  <UiBadge>Pending</UiBadge>
                  <UiBadge variant='success'>Field ready</UiBadge>
                  <UiBadge variant='warning'>Wind watch</UiBadge>
                </UiLayout>
              </UiFieldset>
            </UiLayout>
            <UiFieldset legend='Row (inline)'>
              <UiLayout variant='inline'>
                <UiButton>Cancel</UiButton>
                <UiButton variant='primary'>Confirm dispatch</UiButton>
              </UiLayout>
            </UiFieldset>
            <UiFieldset legend='Row (inline-fill)'>
              <UiLayout variant='inline-fill'>
                <UiButton>Aerial</UiButton>
                <UiButton>Ground</UiButton>
                <UiButton>Inspection</UiButton>
              </UiLayout>
            </UiFieldset>
          </SgSection>

          <SgSection title='UiChart'>
            <UiFieldset legend='Variants'>
              <UiField label='pie' variant='caption'>
                <UiSkeleton />
              </UiField>
              <UiField label='bar' variant='caption'>
                <UiSkeleton />
              </UiField>
              <UiField label='line' variant='caption'>
                <UiSkeleton />
              </UiField>
              <UiField label='spark-line' variant='caption'>
                <UiSkeleton />
              </UiField>
            </UiFieldset>
          </SgSection>
        </UiLayout>
      </SgMain>

      <SgFooter />
    </>
  )
}
