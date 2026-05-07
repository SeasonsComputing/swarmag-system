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
import {
  AppAccordion,
  AppAccordionContent,
  AppAccordionItem,
  AppAccordionTrigger,
  AppAlert,
  AppAvatar,
  AppBadge,
  AppButton,
  AppCard,
  AppCheckbox,
  AppDialog,
  AppInput,
  AppList,
  AppListItem,
  AppMultiSelect,
  AppPopover,
  AppProgress,
  AppRadioGroup,
  AppRadioItem,
  AppSelect,
  AppSeparator,
  AppSkeleton,
  AppSpinner,
  AppTab,
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableHeader,
  AppTableRow,
  AppTabList,
  AppTabPanel,
  AppTabs,
  AppTextarea,
  AppToggle,
  AppToggleGroup,
  AppToggleItem,
  AppTooltip
} from '@ux/common/components/controls'
import { AppField, AppFieldset, AppFormActions, AppFormGrid } from '@ux/common/components/forms'
import {
  ACCORDION_DEFAULT_VALUE,
  BUTTON_VARIANTS,
  COLOR_SWATCHES,
  DEFAULT_SERVICES,
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
  const [theme, setTheme] = createSignal<'dark' | 'light'>('dark')
  const [loading, setLoading] = createSignal(false)
  const [inputError, setInputError] = createSignal(false)
  const [checkboxChecked, setCheckboxChecked] = createSignal(true)
  const [checkboxDrift, setCheckboxDrift] = createSignal(false)
  const [checkboxError, setCheckboxError] = createSignal(false)
  const [radioValue, setRadioValue] = createSignal('aerial')
  const [togglePressed, setTogglePressed] = createSignal(true)
  const [viewMode, setViewMode] = createSignal('map')
  const [tab, setTab] = createSignal('assessment')

  const setThemeMode = (value: string): void => {
    if (value !== 'dark' && value !== 'light') return
    setTheme(value)
  }

  createEffect(() => {
    document.documentElement.dataset.theme = theme()
  })

  return (
    <>
      <header class='sg-header'>
        <div>
          <h1>swarmAg Style Guide</h1>
          <p>Living visual validation for tokens, states, themes, and controls.</p>
        </div>
        <AppToggleGroup value={theme()} onChange={setThemeMode}>
          <AppToggleItem value='dark'>Dark</AppToggleItem>
          <AppToggleItem value='light'>Light</AppToggleItem>
        </AppToggleGroup>
      </header>

      <main class='sg-page'>
        <Section title='Typography'>
          <h1>H1 Operations Command</h1>
          <h2>H2 Field Service Planning</h2>
          <h3>H3 Aerial Application Window</h3>
          <h4>H4 Ground Crew Assignment</h4>
          <h5>H5 Chemical Label Review</h5>
          <p>
            Body copy should inherit the product typography without local component styling. Weather,
            acreage, crew availability, and service windows remain scannable.
          </p>
          <p>
            Inline code sample: <code>service.category === 'aerial-drone-services'</code>
          </p>
          <pre>{`const acres = 142\nconst service = 'Aerial - Fixed Wing'`}</pre>
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
          <blockquote>
            Service logs are records of field reality and must remain clear, durable, and auditable.
          </blockquote>
          <AppFieldset legend='Site access'>
            <AppFormGrid>
              <AppField label='Field contact' for='nameId'>
                <AppInput id='nameId' value='R. Alvarez' onInput={() => undefined} />
              </AppField>
              <AppField label='Gate code' for='codeId'>
                <AppInput id='codeId' value='4821' onInput={() => undefined} />
              </AppField>
            </AppFormGrid>
          </AppFieldset>
        </Section>

        <Section title='Color'>
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
        </Section>

        <Section title='Gradient'>
          <figure>
            <div class='sg-gradient-block' />
            <figcaption>
              <span>Bright blue start</span>
              <span>Darker green center</span>
              <span>Bright teal finish</span>
            </figcaption>
          </figure>
        </Section>

        <Section title='AppButton'>
          <div class='sg-row'>
            <AppButton variant='secondary' onClick={() => setLoading(!loading())}>
              Toggle loading
            </AppButton>
          </div>
          <div class='sg-row'>
            <For each={BUTTON_VARIANTS}>
              {entry => <AppButton variant={entry.variant}>{entry.label}</AppButton>}
            </For>
          </div>
          <div class='sg-row'>
            <AppButton disabled>Disabled</AppButton>
            <AppButton variant='primary' loading={loading()}>
              Loading
            </AppButton>
          </div>
        </Section>

        <Section title='AppInput / AppTextarea'>
          <div class='sg-row'>
            <AppButton variant='secondary' onClick={() => setInputError(!inputError())}>
              Toggle error
            </AppButton>
          </div>
          <AppFormGrid>
            <AppField label='Field name' for='field-name'>
              <AppInput
                id='field-name'
                value='North Field'
                error={inputError()}
                onInput={() => undefined}
                placeholder='Enter service location'
              />
            </AppField>
            <AppField label='Application notes' for='application-notes'>
              <AppTextarea
                id='application-notes'
                error={inputError()}
                onInput={() => undefined}
                value='Spray window 06:00–09:00. Wind break along west ridge; verify drift boundary before launch.'
                placeholder='Wind break along west ridge; verify drift boundary before launch.'
                rows={4}
              />
            </AppField>
            <AppField label='Disabled acreage' for='disabled-acreage'>
              <AppInput id='disabled-acreage' disabled value='142 acres' onInput={() => undefined} />
            </AppField>
            <AppField label='Disabled comments' for='disabled-comments'>
              <AppTextarea
                id='disabled-comments'
                disabled
                value='Locked after crew dispatch.'
                onInput={() => undefined}
                rows={4}
              />
            </AppField>
          </AppFormGrid>
        </Section>

        <Section title='AppSelect / AppMultiSelect'>
          <div class='sg-row'>
            <AppButton variant='secondary' onClick={() => setInputError(!inputError())}>
              Toggle error
            </AppButton>
          </div>
          <AppFormGrid>
            <AppField label='Service status' for='service-status'>
              <AppSelect
                id='service-status'
                placeholder='Select service status'
                error={inputError()}
                options={STATUSES}
              />
            </AppField>
            <AppField label='Disabled select' for='disabled-select'>
              <AppSelect
                id='disabled-select'
                disabled
                defaultValue='Ground - Sprayer'
                options={STATUSES}
              />
            </AppField>
          </AppFormGrid>
          <AppMultiSelect options={SERVICES} defaultValue={[...DEFAULT_SERVICES]} />
        </Section>

        <Section title='AppField / AppFieldset / AppFormGrid / AppFormActions'>
          <AppFieldset legend='Service details'>
            <AppFormGrid>
              <AppField label='Field name' for='form-demo-name'>
                <AppInput id='form-demo-name' value='North Field' onInput={() => undefined} />
              </AppField>
              <AppField label='Service type' for='form-demo-service'>
                <AppSelect id='form-demo-service' options={STATUSES} placeholder='Select service type' />
              </AppField>
            </AppFormGrid>
          </AppFieldset>
          <AppFieldset legend='Application window'>
            <AppFormGrid>
              <AppField label='Application notes' for='form-demo-notes'>
                <AppTextarea
                  id='form-demo-notes'
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
          <div class='sg-row'>
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
          </div>
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
          <div class='sg-row'>
            <AppToggle pressed={togglePressed()} onClick={() => setTogglePressed(!togglePressed())}>
              Active crews
            </AppToggle>
            <AppToggle pressed={false}>Offline jobs</AppToggle>
          </div>
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
          <div class='sg-stack'>
            <AppProgress value={0} />
            <AppProgress value={35} />
            <AppProgress value={68} />
            <AppProgress value={100} />
          </div>
        </Section>

        <Section title='AppSpinner'>
          <AppSpinner />
        </Section>

        <Section title='AppSkeleton'>
          <div class='sg-stack'>
            <AppSkeleton />
            <div class='sg-skeleton-75'>
              <AppSkeleton />
            </div>
            <div class='sg-skeleton-50'>
              <AppSkeleton />
            </div>
          </div>
        </Section>

        <Section title='AppBadge'>
          <div class='sg-row'>
            <AppBadge>Pending</AppBadge>
            <AppBadge variant='success'>Field ready</AppBadge>
            <AppBadge variant='warning'>Wind watch</AppBadge>
            <AppBadge variant='danger'>Blocked</AppBadge>
            <AppBadge variant='info'>Assessment</AppBadge>
          </div>
        </Section>

        <Section title='AppAlert'>
          <div class='sg-stack'>
            <AppAlert>Service record updated by dispatch.</AppAlert>
            <AppAlert variant='success'>North Field completed and ready for customer review.</AppAlert>
            <AppAlert variant='warning'>Wind speed approaching service threshold.</AppAlert>
            <AppAlert variant='danger'>Chemical label missing required re-entry interval.</AppAlert>
            <AppAlert variant='info'>Crew assignment changed for the morning window.</AppAlert>
          </div>
        </Section>

        <Section title='AppTooltip'>
          <AppTooltip trigger={<AppButton variant='secondary'>Hover field note</AppButton>} defaultOpen>
            Verify buffer zone before aerial application.
          </AppTooltip>
        </Section>

        <Section title='AppDialog'>
          <AppDialog trigger={<AppButton variant='secondary'>Open dispatch dialog</AppButton>}>
            <div class='sg-stack'>
              <p>Confirm crew assignment before dispatch.</p>
            </div>
          </AppDialog>
        </Section>

        <Section title='AppPopover'>
          <AppPopover trigger={<AppButton variant='secondary'>Open field menu</AppButton>}>
            <div class='sg-stack'>
              <p>Field actions, notes, and service history.</p>
            </div>
          </AppPopover>
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

        <Section title='AppList'>
          <div class='sg-row'>
            <div>
              <AppList>
                <AppListItem>Confirm chemical inventory</AppListItem>
                <AppListItem>Verify crew certification</AppListItem>
                <AppListItem>Inspect required assets</AppListItem>
              </AppList>
            </div>
            <div>
              <AppList variant='bullet'>
                <AppListItem>Wind speed within threshold</AppListItem>
                <AppListItem>Precipitation clear</AppListItem>
                <AppListItem>Visibility acceptable</AppListItem>
              </AppList>
            </div>
            <div>
              <AppList variant='numbered'>
                <AppListItem>Assess site</AppListItem>
                <AppListItem>Plan service</AppListItem>
                <AppListItem>Execute work</AppListItem>
              </AppList>
            </div>
          </div>
        </Section>

        <Section title='AppAvatar'>
          <AppAvatar>AG</AppAvatar>
        </Section>

        <Section title='AppCard'>
          <div class='sg-card-grid'>
            <AppCard>
              <div class='sg-card-copy'>
                <h3>Default card</h3>
                <p>Base framed surface — no variant. Used for general content containment.</p>
              </div>
            </AppCard>
            <AppCard variant='widget'>
              <div class='sg-card-copy'>
                <h3>Widget card</h3>
                <p>Dashboard-ready surface with stripe treatment and crisp separation from the page.</p>
              </div>
            </AppCard>
            <AppCard variant='panel'>
              <div class='sg-card-copy'>
                <h3>Panel card</h3>
                <p>Quiet interior surface for form sections and guided workflow sub-groups.</p>
              </div>
            </AppCard>
            <AppCard variant='workflow'>
              <div class='sg-card-copy'>
                <h3>Workflow card</h3>
                <p>Primary framed container for guided flows that need stronger focus and elevation.</p>
              </div>
            </AppCard>
          </div>
        </Section>

        <Section title='AppSeparator'>
          <AppSeparator />
        </Section>

        <Section title='Charts'>
          {/* TODO: AppChart - pending chart primitive */}
          <AppSkeleton />
        </Section>
      </main>

      <footer class='sg-footer'>
      </footer>
    </>
  )
}

const Section = (props: SectionProps): JSX.Element => (
  <section class='sg-section'>
    <AppCard variant='panel'>
      <div class='sg-section-frame'>
        <h2>{props.title}</h2>
        <div class='sg-section-body'>{props.children}</div>
      </div>
    </AppCard>
  </section>
)
