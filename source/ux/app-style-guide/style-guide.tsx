/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ swarmAg living style guide                                                   ║
║ Browser validation page for design tokens and common controls.               ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the swarmAg design language and shared App{Control} primitives as a
real consuming application.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
StyleGuide  Single-page living style guide application.
*/

import { createEffect, createSignal, For, type JSX } from '@solid-js'

// dprint-ignore-start
import {
  AppAccordion, AppAccordionContent, AppAccordionItem, AppAccordionTrigger, AppAlert, AppAvatar,
  AppBadge, AppButton, AppCard, AppCheckbox, AppDialog, AppField, AppFieldset, AppFormActions,
  AppFormGrid, AppInput, AppList, AppListItem, AppMultiSelect, AppPopover, AppProgress, AppRadioGroup,
  AppRadioItem, AppRow, AppSingleSelect, AppSeparator, AppSkeleton, AppSpinner, AppStack, AppTab,
  AppTable, AppTableBody, AppTableCell, AppTableHeader, AppTableRow, AppTabList, AppTabPanel,
  AppTabs, AppTextarea, AppToggle, AppToggleGroup, AppToggleItem, AppTooltip
} from '@ux/common/components/controls'
// dprint-ignore-end

import logo from '@ux/common/assets/logos/swarmag-logo-wordmark.png'
import { AppFooter } from '@ux/common/components/shell/app-footer.tsx'

import {
  ACCORDION_DEFAULT_VALUE,
  BUTTON_VARIANTS,
  COLOR_SWATCHES,
  DEFAULT_SERVICES,
  EQUIPMENT,
  FIELDS,
  SERVICES,
  STATUSES
} from './style-guide-fixtures.ts'

type SectionProps = {
  children: JSX.Element
  title: string
}

/** Single-page living style guide application. */
export const StyleGuide = (): JSX.Element => {
  type Theme = 'dark' | 'brand' | 'light'
  type Services = 'aerial' | 'ground'
  type ServiceStatus = 'inspection' | 'ready' | 'blocked' | 'review'
  type ServiceArrival = 'morning' | 'afternoon' | 'night'
  type RadioValue = Services | ServiceStatus | ServiceArrival
  type ViewMode = 'map' | 'list' | 'grid'
  type Tab = 'assessment' | 'planning' | 'execution' | 'followup'

  const [theme, setTheme] = createSignal<Theme>('dark')
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

  createEffect(() => document.documentElement.dataset.theme = theme())

  return (
    <>
      <header class='sg-header'>
        <div>
          <h1>swarmAg Style Guide</h1>
          <p>Living visual validation for tokens, states, themes, and controls.</p>
        </div>
        <AppToggleGroup<Theme> value={theme()} onChange={setTheme}>
          <AppToggleItem value='dark'>Dark</AppToggleItem>
          <AppToggleItem value='brand'>Brand</AppToggleItem>
          <AppToggleItem value='light'>Light</AppToggleItem>
        </AppToggleGroup>
      </header>

      <main class='sg-page'>
        <Section title='Typography'>
          <AppFieldset legend='h1 – h5'>
            <h1>H1 Operations Command</h1>
            <h2>H2 Field Service Planning</h2>
            <h3>H3 Aerial Application Window</h3>
            <h4>H4 Ground Crew Assignment</h4>
            <h5>H5 Chemical Label Review</h5>
          </AppFieldset>

          <AppFieldset legend='Body & Paragraph'>
            <p>
              Body copy should inherit the product typography without local component styling. Weather,
              acreage, crew availability, and service windows remain scannable.
            </p>
          </AppFieldset>

          <AppFieldset legend='Code, Pre & Blockquote'>
            <p>
              Inline code sample: <code>service.category === 'aerial-drone-services'</code>
            </p>
            <pre>{`const acres = 142\nconst service = 'Aerial - Fixed Wing'`}</pre>
            <blockquote>
              Service logs are records of field reality and must remain clear, durable, and auditable.
            </blockquote>
          </AppFieldset>

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
                  <span class='sg-font-body'>Inspect field boundaries and document hazard zones</span>
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
                  <span class='sg-font-mono'>service.status = 'ready'; acres = 142</span>
                </AppTableCell>
              </AppTableRow>
            </AppTableBody>
          </AppTable>
        </Section>

        <Section title='HTML Semantics'>
          <AppTable>
            <AppTableHeader>
              <AppTableCell>Field name</AppTableCell>
              <AppTableCell>Acreage</AppTableCell>
              <AppTableCell>Service type</AppTableCell>
              <AppTableCell>Status</AppTableCell>
              <AppTableCell>Date</AppTableCell>
            </AppTableHeader>
            <AppTableBody>
              <For each={FIELDS}>
                {field => (
                  <AppTableRow>
                    <AppTableCell>{field.name}</AppTableCell>
                    <AppTableCell>{field.acres}</AppTableCell>
                    <AppTableCell>{field.service}</AppTableCell>
                    <AppTableCell>{field.status}</AppTableCell>
                    <AppTableCell>{field.date}</AppTableCell>
                  </AppTableRow>
                )}
              </For>
            </AppTableBody>
          </AppTable>

          <AppTable>
            <AppTableHeader>
              <AppTableCell>Equipment</AppTableCell>
              <AppTableCell>Application</AppTableCell>
            </AppTableHeader>
            <AppTableBody>
              <For each={EQUIPMENT}>
                {group => (
                  <>
                    <AppTableRow section>
                      <AppTableCell>{group.section}</AppTableCell>
                      <AppTableCell />
                    </AppTableRow>
                    <For each={group.items}>
                      {item => (
                        <AppTableRow>
                          <AppTableCell>{item.name}</AppTableCell>
                          <AppTableCell>{item.application}</AppTableCell>
                        </AppTableRow>
                      )}
                    </For>
                  </>
                )}
              </For>
            </AppTableBody>
          </AppTable>

          <AppFieldset legend='List variants'>
            <AppRow variant='fill'>
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
            </AppRow>
          </AppFieldset>

          <AppFieldset legend='Site access'>
            <AppFormGrid>
              <AppField label='Field contact' for='nameId'>
                <AppInput name='nameId' value='R. Alvarez' onInput={() => undefined} />
              </AppField>
              <AppField label='Gate code' for='codeId'>
                <AppInput name='codeId' value='4821' onInput={() => undefined} />
              </AppField>
            </AppFormGrid>
          </AppFieldset>
        </Section>

        <Section title='Color'>
          <AppFieldset legend='Swatches'>
            <div class='sg-swatch-grid'>
              <For each={COLOR_SWATCHES}>
                {swatch => (
                  <figure class='sg-swatch'>
                    <div class='sg-swatch-chip' style={{ background: swatch.value }} />
                    <figcaption>
                      <span>{swatch.label}</span>
                      <code>{swatch.token}</code>
                    </figcaption>
                  </figure>
                )}
              </For>
            </div>
          </AppFieldset>
          <AppFieldset legend='Gradient'>
            <figure>
              <div class='sg-gradient-block' />
              <figcaption>
                <span>Bright blue start</span>
                <span>Darker green center</span>
                <span>Bright teal finish</span>
              </figcaption>
            </figure>
          </AppFieldset>
        </Section>

        <Section title='Decorations'>
          <AppRow variant='fill'>
            <AppFieldset legend='AppAvatar'>
              <AppAvatar>AG</AppAvatar>
            </AppFieldset>
            <AppFieldset legend='AppSpinner'>
              <AppSpinner />
            </AppFieldset>
          </AppRow>
          <AppFieldset legend='AppSeparator'>
            <AppSeparator />
          </AppFieldset>
        </Section>

        <Section title='AppButton'>
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
            <AppRow>
              <For each={BUTTON_VARIANTS}>
                {entry => <AppButton variant={entry.variant}>{entry.label}</AppButton>}
              </For>
            </AppRow>
          </AppFieldset>
          <AppFieldset legend='Disabled and loading'>
            <AppRow>
              <AppButton disabled>Disabled</AppButton>
              <AppButton variant='primary' loading={loading()}>
                Loading
              </AppButton>
            </AppRow>
          </AppFieldset>
        </Section>

        <Section title='AppInput / AppTextarea'>
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
            <AppRow variant='fill'>
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
            </AppRow>
          </AppFieldset>
          <AppFieldset legend='Disabled'>
            <AppRow variant='fill'>
              <AppField label='Disabled acreage' for='disabled-acreage'>
                <AppInput name='disabled-acreage' disabled value='142 acres' onInput={() => undefined} />
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
            </AppRow>
          </AppFieldset>
        </Section>

        <Section title='AppSelect / AppMultiSelect'>
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
            <AppRow variant='fill'>
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
            </AppRow>
          </AppFieldset>
          <AppFieldset legend='Multi-select'>
            <AppMultiSelect options={SERVICES} defaultValue={[...DEFAULT_SERVICES]} />
          </AppFieldset>
        </Section>

        <Section title='AppField / AppFieldset / AppFormGrid / AppFormActions'>
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
          </AppFieldset>
          <AppFieldset legend='Application window'>
            <AppFormGrid>
              <AppField label='Application notes' for='form-demo-notes'>
                <AppTextarea
                  name='form-demo-notes'
                  value='Spray window 06:00–09:00.'
                  onInput={() => undefined}
                  rows={3}
                />
              </AppField>
            </AppFormGrid>
          </AppFieldset>
          <AppFormActions>
            <AppButton variant='ghost'>Cancel</AppButton>
            <AppButton variant='primary'>Save</AppButton>
          </AppFormActions>
        </Section>

        <Section title='AppCheckbox'>
          <AppRow>
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
          </AppRow>
        </Section>

        <Section title='AppRadioGroup + AppRadioItem'>
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
        </Section>

        <Section title='AppToggle / AppToggleGroup + AppToggleItem'>
          <AppRow>
            <AppToggle pressed={togglePressed()} onClick={() => setTogglePressed(!togglePressed())}>
              Active crews
            </AppToggle>
            <AppToggle pressed={false}>Offline jobs</AppToggle>
          </AppRow>
          <AppToggleGroup value={viewMode()} onChange={setViewMode}>
            <AppToggleItem value='map'>Map</AppToggleItem>
            <AppToggleItem value='list'>List</AppToggleItem>
            <AppToggleItem value='grid'>Grid</AppToggleItem>
          </AppToggleGroup>
        </Section>

        <Section title='AppTabs + AppTabList + AppTab + AppTabPanel'>
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
            <AppTabPanel value='execution'>Record work logs and answer workflow questions.</AppTabPanel>
            <AppTabPanel value='followup'>Prepare customer report and close service record.</AppTabPanel>
          </AppTabs>
        </Section>

        <Section title='AppProgress'>
          <AppStack>
            <AppProgress value={0} />
            <AppProgress value={35} />
            <AppProgress value={68} />
            <AppProgress value={100} />
          </AppStack>
        </Section>

        <Section title='AppSkeleton'>
          <AppStack>
            <AppSkeleton />
            <div class='sg-skeleton-75'>
              <AppSkeleton />
            </div>
            <div class='sg-skeleton-50'>
              <AppSkeleton />
            </div>
          </AppStack>
        </Section>

        <Section title='AppBadge'>
          <AppRow>
            <AppBadge>Pending</AppBadge>
            <AppBadge variant='success'>Field ready</AppBadge>
            <AppBadge variant='warning'>Wind watch</AppBadge>
            <AppBadge variant='danger'>Blocked</AppBadge>
            <AppBadge variant='info'>Assessment</AppBadge>
          </AppRow>
        </Section>

        <Section title='AppAlert'>
          <AppStack>
            <AppAlert>Service record updated by dispatch.</AppAlert>
            <AppAlert variant='success'>North Field completed and ready for customer review.</AppAlert>
            <AppAlert variant='warning'>Wind speed approaching service threshold.</AppAlert>
            <AppAlert variant='danger'>Chemical label missing required re-entry interval.</AppAlert>
            <AppAlert variant='info'>Crew assignment changed for the morning window.</AppAlert>
          </AppStack>
        </Section>

        <Section title='Secondary Windows'>
          <AppRow variant='fill'>
            <AppFieldset legend='AppTooltip'>
              <AppRow>
                <AppTooltip trigger='Hover field note' defaultOpen>
                  Verify buffer zone before aerial application.
                </AppTooltip>
              </AppRow>
            </AppFieldset>
            <AppFieldset legend='AppDialog'>
              <AppRow>
                <AppDialog trigger='Open dispatch dialog'>
                  <AppStack>
                    <p>Confirm crew assignment before dispatch.</p>
                  </AppStack>
                </AppDialog>
              </AppRow>
            </AppFieldset>
            <AppFieldset legend='AppPopover'>
              <AppRow>
                <AppPopover trigger='Open field menu'>
                  <AppStack>
                    <p>Field actions, notes, and service history.</p>
                  </AppStack>
                </AppPopover>
              </AppRow>
            </AppFieldset>
          </AppRow>
        </Section>

        <Section title='AppAccordion'>
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
        </Section>

        <Section title='AppCard'>
          <div class='sg-card-grid'>
            <AppCard>
              <AppStack>
                <h3>Default card</h3>
                <p>
                  Quiet interior surface — no variant. Used for form sections and guided workflow
                  sub-groups.
                </p>
              </AppStack>
            </AppCard>
            <AppCard variant='widget'>
              <AppStack>
                <h3>Widget card</h3>
                <p>Dashboard-ready surface with stripe treatment and crisp separation from the page.</p>
              </AppStack>
            </AppCard>
            <AppCard variant='workflow'>
              <AppStack>
                <h3>Workflow card</h3>
                <p>Primary framed container for guided flows that need stronger focus and elevation.</p>
              </AppStack>
            </AppCard>
          </div>
        </Section>

        <Section title='Charts'>
          {/* TODO: AppChart - pending chart primitive */}
          <AppSkeleton />
        </Section>
      </main>

      <AppFooter logo={logo} alt='swarmAg' />
    </>
  )
}

const Section = (props: SectionProps): JSX.Element => (
  <section class='sg-section'>
    <AppCard variant='widget'>
      <AppStack>
        <h2>{props.title}</h2>
        <div class='sg-section-body'>{props.children}</div>
      </AppStack>
    </AppCard>
  </section>
)
