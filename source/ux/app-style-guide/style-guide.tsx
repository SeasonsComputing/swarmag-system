/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ swarmAg living style guide                                                   ║
║ Browser validation page for design tokens and common controls.               ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { createEffect, createSignal, For } from '@solid-js'

// dprint-ignore
import {
  AppAccordion, AppAccordionContent, AppAccordionItem, AppAccordionTrigger, AppAlert, AppAvatar,
  AppBadge, AppButton, AppCard, AppCheckbox, AppDialog, AppField, AppFieldset, AppFooter,
  AppFormActions, AppFormGrid, AppInput, AppLayout, AppList, AppListItem, AppMultiSelect,
  AppPopover, AppProgress, AppRadioGroup, AppRadioItem, AppSingleSelect, AppSeparator,
  AppSkeleton, AppSpinner, AppTab, AppTable, AppTableBody, AppTableCell, AppTableHeader,
  AppTableRow, AppTabList, AppTabPanel, AppTabs, AppTextarea, AppToggle, AppToggleGroup,
  AppToggleItem, AppTooltip, type AppComponent, type AppContainerProps
} from '@ux/common/components/controls'

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
  STATUSES
} from './style-guide-fixtures.ts'

/** Style-guide specimen enumerations */
type Theme = 'dark' | 'light'
type Services = 'aerial' | 'ground'
type ServiceStatus = 'inspection' | 'ready' | 'blocked' | 'review'
type ServiceArrival = 'morning' | 'afternoon' | 'night'
type RadioValue = Services | ServiceStatus | ServiceArrival
type ViewMode = 'map' | 'list' | 'grid'
type Tab = 'assessment' | 'planning' | 'execution' | 'followup'

/** Header with theme switching for validating controls across supported themes. */
const SgHeader = (): AppComponent => {
  const [theme, setTheme] = createSignal<Theme>('dark')
  createEffect(() => document.documentElement.dataset.theme = theme())

  return (
    <header class='sg-header'>
      <AppLayout gap='tight'>
        <h1>
          swarmAg <span class='nowrap'>Style Guide</span>
        </h1>
        <p class='sg-header-subtitle'>
          Living visual validation for tokens, states, themes, and controls.
        </p>
      </AppLayout>
      <AppToggleGroup<Theme> value={theme()} onChange={setTheme}>
        <AppToggleItem value='dark'>Dark</AppToggleItem>
        <AppToggleItem value='light'>Light</AppToggleItem>
      </AppToggleGroup>
    </header>
  )
}

/** Footer for the style guide. */
const SgFooter = (): AppComponent => (<AppFooter logo={logo} alt='swarmAg' />)

/** Main content area for the style guide. */
type SgMainProps = AppContainerProps
const SgMain = (props: SgMainProps): AppComponent => (
  <main class='sg-main'>
    {props.children}
  </main>
)

/** Framed style-guide section used to group related control specimens. */
type SgSectionProps = AppContainerProps & { title: string }
const SgSection = (props: SgSectionProps): AppComponent => (
  <section class='sg-section'>
    <AppLayout gap='tight'>
      <h2>{props.title}</h2>
      <AppCard>
        <AppLayout>
          {props.children}
        </AppLayout>
      </AppCard>
    </AppLayout>
  </section>
)

/** Color swatch used to display a color value and its token name. */
type SgSwatchProps = {
  value: string
  label: string
  token: string
}
const SgSwatch = (props: SgSwatchProps): AppComponent => (
  <figure class='sg-swatch'>
    <div class='sg-swatch-chip' style={{ background: props.value }} />
    <figcaption>
      <span>{props.label}</span>
      <code>{props.token}</code>
    </figcaption>
  </figure>
)

/** Single-page living style guide application. */
export const StyleGuide = (): AppComponent => {
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

  return (
    <>
      <SgHeader />

      <SgMain>
        <AppLayout gap='loose'>
          <SgSection title='Typography'>
            <AppFieldset legend='<h1>, <h2>, <h3>, <h4>, <h5>'>
              <h1>H1 Operations Command</h1>
              <h2>H2 Field Service Planning</h2>
              <h3>H3 Aerial Application Window</h3>
              <h4>H4 Ground Crew Assignment</h4>
              <h5>H5 Chemical Label Review</h5>
            </AppFieldset>
            <AppFieldset legend='<body>, <p>'>
              <p>
                Body copy should inherit the product typography without local component styling. Weather,
                acreage, crew availability, and service windows remain scannable.
              </p>
            </AppFieldset>
            <AppFieldset legend='<code>, <kbd>, <samp>, <pre>, <blockquote>'>
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
              <blockquote>
                Service logs are records of field reality and must remain clear, durable, and auditable.
              </blockquote>
            </AppFieldset>
            <AppFieldset legend='Typefaces'>
              <AppTable>
                <AppTableHeader>
                  <AppTableCell>Typeface</AppTableCell>
                  <AppTableCell>Role</AppTableCell>
                  <AppTableCell>Example</AppTableCell>
                </AppTableHeader>
                <AppTableBody>
                  <AppTableRow>
                    <AppTableCell>Comfortaa</AppTableCell>
                    <AppTableCell>Heading</AppTableCell>
                    <AppTableCell>
                      <span class='sg-font-heading'>Operations briefing schedule confirmed</span>
                    </AppTableCell>
                  </AppTableRow>
                  <AppTableRow>
                    <AppTableCell>Comfortaa</AppTableCell>
                    <AppTableCell>Body</AppTableCell>
                    <AppTableCell>
                      <span class='sg-font-body'>
                        Inspect field boundaries and document hazard zones
                      </span>
                    </AppTableCell>
                  </AppTableRow>
                  <AppTableRow>
                    <AppTableCell>Lexend</AppTableCell>
                    <AppTableCell>Label</AppTableCell>
                    <AppTableCell>
                      <span class='sg-font-label'>Service window 06:00–09:00</span>
                    </AppTableCell>
                  </AppTableRow>
                  <AppTableRow>
                    <AppTableCell>Lexend</AppTableCell>
                    <AppTableCell>UI</AppTableCell>
                    <AppTableCell>
                      <span class='sg-font-ui'>Assign crew and assets for spray mission</span>
                    </AppTableCell>
                  </AppTableRow>
                  <AppTableRow>
                    <AppTableCell>Cascadia Mono</AppTableCell>
                    <AppTableCell>Mono</AppTableCell>
                    <AppTableCell>
                      <code>service.status = 'ready'; acres = 142</code>
                    </AppTableCell>
                  </AppTableRow>
                </AppTableBody>
              </AppTable>
            </AppFieldset>
          </SgSection>

          <SgSection title='HTML'>
            <AppFieldset legend='<table>, <thead>, <tbody>, <tr>, <th>, <td>'>
              <AppTable>
                <AppTableHeader>
                  <AppTableCell>Equipment</AppTableCell>
                  <AppTableCell>Application</AppTableCell>
                  <AppTableCell align='end'>Price</AppTableCell>
                  <AppTableCell align='end'>Cost</AppTableCell>
                </AppTableHeader>
                <AppTableBody>
                  <For each={EQUIPMENT}>
                    {e => (
                      <>
                        <AppTableRow variant='section'>
                          <AppTableCell>{e.section}</AppTableCell>
                        </AppTableRow>
                        <For each={e.items}>
                          {i => (
                            <AppTableRow>
                              <AppTableCell>{i.name}</AppTableCell>
                              <AppTableCell>{i.application}</AppTableCell>
                              <AppTableCell align='end'>
                                <samp>{i.price}</samp>
                              </AppTableCell>
                              <AppTableCell align='end'>
                                <samp>{i.cost}</samp>
                              </AppTableCell>
                            </AppTableRow>
                          )}
                        </For>
                      </>
                    )}
                  </For>
                </AppTableBody>
              </AppTable>
            </AppFieldset>
            <AppFieldset legend='<ul>, <ol>, <li>'>
              <AppFormGrid>
                <AppList>
                  <AppListItem>Confirm chemical inventory.</AppListItem>
                  <AppListItem>Verify crew certification.</AppListItem>
                  <AppListItem>Inspect required assets.</AppListItem>
                </AppList>
                <AppList variant='bullet'>
                  <AppListItem>Confirm chemical inventory.</AppListItem>
                  <AppListItem>Verify crew certification.</AppListItem>
                  <AppListItem>Inspect required assets.</AppListItem>
                </AppList>
                <AppList variant='numbered'>
                  <AppListItem>Assess site.</AppListItem>
                  <AppListItem>Plan service.</AppListItem>
                  <AppListItem>Execute work.</AppListItem>
                </AppList>
              </AppFormGrid>
            </AppFieldset>
            <AppFieldset legend='<input>, <textarea>, <select>, <option>'>
              <AppFormGrid>
                <AppField label='Text-line' for='field-name'>
                  <AppInput
                    name='field-name'
                    value='North Field'
                    error={inputError()}
                    onInput={() => undefined}
                    placeholder='Enter service location'
                  />
                </AppField>
                <AppField label='Textbox' for='application-notes'>
                  <AppTextarea
                    name='application-notes'
                    error={inputError()}
                    onInput={() => undefined}
                    value='Spray window 06:00–09:00. Wind break along west ridge; verify drift boundary before launch.'
                    placeholder='Wind break along west ridge; verify drift boundary before launch.'
                    rows={6}
                  />
                </AppField>
              </AppFormGrid>
              <AppFormGrid>
                <AppField label='Dropdown single-select' for='service-status'>
                  <AppSingleSelect
                    name='service-status'
                    placeholder='Select service status'
                    error={selectError()}
                    options={STATUSES}
                  />
                </AppField>
                <AppField label='Listbox multi-select' for='service-options'>
                  {/*TODO: AppMultiSelect needs a name?*/}
                  <AppMultiSelect options={SERVICES} defaultValue={[...DEFAULT_SERVICES]} />
                </AppField>
              </AppFormGrid>
            </AppFieldset>
          </SgSection>

          <SgSection title='Color'>
            <AppFieldset legend='Swatches'>
              <AppLayout variant='inline-fill'>
                <For each={COLOR_SWATCHES}>
                  {s => <SgSwatch value={s.value} label={s.label} token={s.token} />}
                </For>
              </AppLayout>
            </AppFieldset>
            <AppFieldset legend='Gradient'>
              <figure>
                <div class='sg-gradient-block' />
                <figcaption>
                  <span>Gradient start</span>
                  <span>Gradient midpoint</span>
                  <span>Gradient finish</span>
                </figcaption>
              </figure>
            </AppFieldset>
          </SgSection>

          <SgSection title='Decorations'>
            <AppLayout>
              <AppLayout variant='inline-fill'>
                <AppFieldset legend='AppAvatar'>
                  <AppAvatar>AG</AppAvatar>
                </AppFieldset>
                <AppFieldset legend='AppSpinner'>
                  <AppSpinner />
                </AppFieldset>
              </AppLayout>
              <AppFieldset legend='AppSeparator'>
                <AppSeparator />
              </AppFieldset>
            </AppLayout>
          </SgSection>

          <SgSection title='AppButton'>
            <AppField label='Toggle loading state' for='button-loading-toggle' variant='inline'>
              <AppToggle
                id='button-loading-toggle'
                pressed={loading()}
                onClick={() => setLoading(!loading())}
              >
                Loading
              </AppToggle>
            </AppField>
            <AppFieldset legend='Variants'>
              <AppLayout variant='inline'>
                <For each={BUTTON_VARIANTS}>
                  {b => <AppButton variant={b.variant}>{b.label}</AppButton>}
                </For>
              </AppLayout>
            </AppFieldset>
            <AppFieldset legend='Disabled and loading'>
              <AppLayout variant='inline'>
                <AppButton disabled>Disabled</AppButton>
                <AppButton variant='primary' loading={loading()}>Loading</AppButton>
              </AppLayout>
            </AppFieldset>
          </SgSection>

          <SgSection title='AppInput / AppTextarea'>
            <AppField label='Toggle error state' for='input-error-toggle' variant='inline'>
              <AppToggle
                id='input-error-toggle'
                pressed={inputError()}
                onClick={() => setInputError(!inputError())}
              >
                Error
              </AppToggle>
            </AppField>
            <AppFieldset legend='Enabled'>
              <AppFormGrid>
                <AppField label='Field name' for='field-name'>
                  <AppInput
                    name='field-name'
                    value='North Field'
                    error={inputError()}
                    onInput={() => undefined}
                    placeholder='Enter service location'
                  />
                </AppField>
                <AppField label='Application notes' for='application-notes'>
                  <AppTextarea
                    name='application-notes'
                    error={inputError()}
                    onInput={() => undefined}
                    value='Spray window 06:00–09:00. Wind break along west ridge; verify drift boundary before launch.'
                    placeholder='Wind break along west ridge; verify drift boundary before launch.'
                    rows={6}
                  />
                </AppField>
              </AppFormGrid>
            </AppFieldset>
            <AppFieldset legend='Disabled'>
              <AppFormGrid>
                <AppField label='Disabled acreage' for='disabled-acreage'>
                  <AppInput
                    name='disabled-acreage'
                    disabled
                    value='142 acres'
                    onInput={() => undefined}
                  />
                </AppField>
                <AppField label='Disabled comments' for='disabled-comments'>
                  <AppTextarea
                    name='disabled-comments'
                    disabled
                    value='Locked after crew dispatch.'
                    onInput={() => undefined}
                    rows={6}
                  />
                </AppField>
              </AppFormGrid>
            </AppFieldset>
          </SgSection>

          <SgSection title='AppSingleSelect / AppMultiSelect'>
            <AppField label='Toggle error state' for='select-error-toggle' variant='inline'>
              <AppToggle
                id='select-error-toggle'
                pressed={selectError()}
                onClick={() => setSelectError(!selectError())}
              >
                Error
              </AppToggle>
            </AppField>
            <AppFieldset legend='Single-select'>
              <AppFormGrid>
                <AppField label='Enabled select' for='service-status'>
                  <AppSingleSelect
                    name='service-status'
                    placeholder='Select service status'
                    error={selectError()}
                    options={STATUSES}
                  />
                </AppField>
                <AppField label='Disabled select' for='disabled-select'>
                  <AppSingleSelect
                    name='disabled-select'
                    disabled
                    defaultValue='Ready'
                    options={STATUSES}
                  />
                </AppField>
              </AppFormGrid>
            </AppFieldset>
            <AppFieldset legend='Multi-select'>
              <AppMultiSelect options={SERVICES} defaultValue={[...DEFAULT_SERVICES]} />
            </AppFieldset>
          </SgSection>

          <SgSection title='AppField / AppFieldset / AppFormGrid / AppFormActions'>
            <AppFieldset legend='Service details'>
              <AppFormGrid>
                <AppField label='Field name' for='form-demo-name'>
                  <AppInput name='form-demo-name' value='North Field' onInput={() => undefined} />
                </AppField>
                <AppField label='Service type' for='form-demo-service'>
                  <AppSingleSelect
                    name='form-demo-service'
                    options={STATUSES}
                    placeholder='Select service type'
                  />
                </AppField>
              </AppFormGrid>
              <AppField label='Application notes' for='form-demo-notes'>
                <AppTextarea
                  name='form-demo-notes'
                  value='Spray window 06:00–09:00.'
                  onInput={() => undefined}
                  rows={3}
                />
              </AppField>
            </AppFieldset>
            <AppFormActions>
              <AppButton variant='ghost'>Cancel</AppButton>
              <AppButton variant='primary'>Save</AppButton>
            </AppFormActions>
          </SgSection>

          <SgSection title='AppCheckbox'>
            <AppLayout variant='inline'>
              <AppCheckbox checked={checkboxChecked()} onChange={setCheckboxChecked}>
                Label reviewed
              </AppCheckbox>
              <AppCheckbox checked={checkboxDrift()} onChange={setCheckboxDrift}>
                Drift boundary verified
              </AppCheckbox>
              <AppCheckbox error checked={checkboxError()} onChange={setCheckboxError}>
                Missing wind reading
              </AppCheckbox>
              <AppCheckbox disabled checked>Disabled complete</AppCheckbox>
            </AppLayout>
          </SgSection>

          <SgSection title='AppRadioGroup / AppRadioItem'>
            <AppFormGrid>
              <AppRadioGroup value={radioValue()} onChange={setRadioValue}>
                <AppRadioItem value='aerial'>Aerial application</AppRadioItem>
                <AppRadioItem value='ground'>Ground machinery</AppRadioItem>
                <AppRadioItem value='inspection'>Site inspection</AppRadioItem>
              </AppRadioGroup>
              <AppRadioGroup error defaultValue='blocked'>
                <AppRadioItem value='ready'>Ready</AppRadioItem>
                <AppRadioItem value='blocked'>Blocked</AppRadioItem>
                <AppRadioItem value='review'>Needs review</AppRadioItem>
              </AppRadioGroup>
              <AppRadioGroup disabled defaultValue='night'>
                <AppRadioItem value='morning'>Morning</AppRadioItem>
                <AppRadioItem value='afternoon'>Afternoon</AppRadioItem>
                <AppRadioItem value='night'>Night</AppRadioItem>
              </AppRadioGroup>
            </AppFormGrid>
          </SgSection>

          <SgSection title='AppToggle / AppToggleGroup / AppToggleItem'>
            <AppLayout variant='inline'>
              <AppToggle pressed={togglePressed()} onClick={() => setTogglePressed(!togglePressed())}>
                Active crews
              </AppToggle>
              <AppToggle pressed={false}>Offline jobs</AppToggle>
            </AppLayout>
            <AppToggleGroup value={viewMode()} onChange={setViewMode}>
              <AppToggleItem value='map'>Map</AppToggleItem>
              <AppToggleItem value='list'>List</AppToggleItem>
              <AppToggleItem value='grid'>Grid</AppToggleItem>
            </AppToggleGroup>
          </SgSection>

          <SgSection title='AppTabs / AppTabList / AppTab / AppTabPanel'>
            <AppTabs value={tab()} onChange={setTab}>
              <AppTabList>
                <AppTab value='assessment'>Assessment</AppTab>
                <AppTab value='planning'>Planning</AppTab>
                <AppTab value='execution'>Execution</AppTab>
                <AppTab value='followup'>Followup</AppTab>
              </AppTabList>
              <AppTabPanel value='assessment'>Walk field edges and capture hazard notes.</AppTabPanel>
              <AppTabPanel value='planning'>
                Assign crew, assets, chemicals, and service window.
              </AppTabPanel>
              <AppTabPanel value='execution'>
                Record work logs and answer workflow questions.
              </AppTabPanel>
              <AppTabPanel value='followup'>
                Prepare customer report and close service record.
              </AppTabPanel>
            </AppTabs>
          </SgSection>

          <SgSection title='AppProgress'>
            <AppLayout>
              <AppProgress value={0} />
              <AppProgress value={35} />
              <AppProgress value={68} />
              <AppProgress value={100} />
            </AppLayout>
          </SgSection>

          <SgSection title='AppSkeleton'>
            <AppLayout>
              <AppSkeleton />
              <div class='sg-skeleton-75'>
                <AppSkeleton />
              </div>
              <div class='sg-skeleton-50'>
                <AppSkeleton />
              </div>
            </AppLayout>
          </SgSection>

          <SgSection title='AppBadge'>
            <AppLayout variant='inline'>
              <AppBadge>Pending</AppBadge>
              <AppBadge variant='success'>Field ready</AppBadge>
              <AppBadge variant='warning'>Wind watch</AppBadge>
              <AppBadge variant='danger'>Blocked</AppBadge>
              <AppBadge variant='info'>Assessment</AppBadge>
            </AppLayout>
          </SgSection>

          <SgSection title='AppAlert'>
            <AppLayout>
              <AppAlert>Service record updated by dispatch.</AppAlert>
              <AppAlert variant='success'>North Field completed and ready for customer review.</AppAlert>
              <AppAlert variant='warning'>Wind speed approaching service threshold.</AppAlert>
              <AppAlert variant='danger'>Chemical label missing required re-entry interval.</AppAlert>
              <AppAlert variant='info'>Crew assignment changed for the morning window.</AppAlert>
            </AppLayout>
          </SgSection>

          <SgSection title='Secondary Windows'>
            <AppFormGrid>
              <AppFieldset legend='AppTooltip'>
                <AppLayout variant='inline'>
                  <AppTooltip trigger='Hover field note' defaultOpen>
                    Verify buffer zone before aerial application.
                  </AppTooltip>
                </AppLayout>
              </AppFieldset>
              <AppFieldset legend='AppDialog'>
                <AppLayout variant='inline'>
                  <AppDialog trigger='Open dispatch dialog'>
                    <AppLayout>
                      <p>Confirm crew assignment before dispatch.</p>
                    </AppLayout>
                  </AppDialog>
                </AppLayout>
              </AppFieldset>
              <AppFieldset legend='AppPopover'>
                <AppLayout variant='inline'>
                  <AppPopover trigger='Open field menu'>
                    <AppLayout>
                      <p>Field actions, notes, and service history.</p>
                    </AppLayout>
                  </AppPopover>
                </AppLayout>
              </AppFieldset>
            </AppFormGrid>
          </SgSection>

          <SgSection title='AppAccordion'>
            <AppAccordion defaultValue={[...ACCORDION_DEFAULT_VALUE]}>
              <AppAccordionItem value='weather'>
                <AppAccordionTrigger>Weather window</AppAccordionTrigger>
                <AppAccordionContent>
                  <AppList variant='bullet'>
                    <AppListItem>Wind speed 12 km/h — within threshold</AppListItem>
                    <AppListItem>Precipitation 0% — clear</AppListItem>
                    <AppListItem>Visibility 18 km — acceptable</AppListItem>
                    <AppListItem>Temperature 21°C — nominal</AppListItem>
                  </AppList>
                </AppAccordionContent>
              </AppAccordionItem>
              <AppAccordionItem value='crew'>
                <AppAccordionTrigger>Crew status</AppAccordionTrigger>
                <AppAccordionContent>
                  <AppList variant='numbered'>
                    <AppListItem>Lead operator certified and on-site</AppListItem>
                    <AppListItem>Equipment pre-check complete</AppListItem>
                    <AppListItem>Safety brief conducted</AppListItem>
                    <AppListItem>Flight plan filed and acknowledged</AppListItem>
                  </AppList>
                </AppAccordionContent>
              </AppAccordionItem>
              <AppAccordionItem value='compliance'>
                <AppAccordionTrigger>Compliance notes</AppAccordionTrigger>
                <AppAccordionContent>
                  <AppList variant='bullet'>
                    <AppListItem>Buffer zones confirmed</AppListItem>
                    <AppListItem>No restricted area conflicts detected</AppListItem>
                    <AppListItem>Chemical application rate within permit limits</AppListItem>
                  </AppList>
                </AppAccordionContent>
              </AppAccordionItem>
            </AppAccordion>
          </SgSection>

          <SgSection title='AppCard'>
            <AppFormGrid>
              <AppCard>
                <AppLayout>
                  <h3>Default card</h3>
                  <p>
                    Quiet interior surface — no variant. Used for form sections and guided workflow
                    sub-groups.
                  </p>
                </AppLayout>
              </AppCard>
              <AppCard variant='widget'>
                <AppLayout>
                  <h3>Widget card</h3>
                  <p>
                    Dashboard-ready surface with stripe treatment and crisp separation from the page.
                  </p>
                </AppLayout>
              </AppCard>
              <AppCard variant='workflow'>
                <AppLayout>
                  <h3>Workflow card</h3>
                  <p>
                    Primary framed container for guided flows that need stronger focus and elevation.
                  </p>
                </AppLayout>
              </AppCard>
            </AppFormGrid>
          </SgSection>

          <SgSection title='AppLayout'>
            <AppFormGrid>
              <AppFieldset legend='Stack (block, default)'>
                <AppLayout>
                  <AppAlert>North Field spray window confirmed.</AppAlert>
                  <AppAlert variant='warning'>Wind speed approaching threshold.</AppAlert>
                  <AppAlert variant='success'>Crew pre-check complete.</AppAlert>
                </AppLayout>
              </AppFieldset>
              <AppFieldset legend='Stack (block-fit)'>
                <AppLayout variant='block-fit'>
                  <AppBadge>Pending</AppBadge>
                  <AppBadge variant='success'>Field ready</AppBadge>
                  <AppBadge variant='warning'>Wind watch</AppBadge>
                </AppLayout>
              </AppFieldset>
            </AppFormGrid>
            <AppFieldset legend='Row (inline)'>
              <AppLayout variant='inline'>
                <AppButton>Cancel</AppButton>
                <AppButton variant='primary'>Confirm dispatch</AppButton>
              </AppLayout>
            </AppFieldset>
            <AppFieldset legend='Row (inline-fill)'>
              <AppLayout variant='inline-fill'>
                <AppButton>Aerial</AppButton>
                <AppButton>Ground</AppButton>
                <AppButton>Inspection</AppButton>
              </AppLayout>
            </AppFieldset>
          </SgSection>

          <SgSection title='Charts'>
            {/* TODO: AppChart - pending chart primitive */}
            <AppSkeleton />
          </SgSection>
        </AppLayout>
      </SgMain>

      <SgFooter />
    </>
  )
}
