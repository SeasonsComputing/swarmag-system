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
  AppAlert,
  AppAvatar,
  AppBadge,
  AppButton,
  AppCard,
  AppCheckbox,
  AppDialog,
  AppIconButton,
  AppInput,
  AppMultiSelect,
  AppPopover,
  AppProgress,
  AppRadioGroup,
  AppRadioItem,
  AppSelect,
  AppSelectContent,
  AppSelectItem,
  AppSeparator,
  AppSkeleton,
  AppSpinner,
  AppTab,
  AppTabList,
  AppTabPanel,
  AppTabs,
  AppTextarea,
  AppToggle,
  AppToggleGroup,
  AppToggleItem,
  AppTooltip
} from '@ux/common/components/controls'

const FIELDS = [
  {
    name: 'North Field',
    acres: 142,
    service: 'Aerial - Fixed Wing',
    status: 'Active',
    date: '2025-04-18'
  },
  {
    name: 'South Paddock',
    acres: 89,
    service: 'Ground - Sprayer',
    status: 'Scheduled',
    date: '2025-04-22'
  },
  {
    name: 'East Block',
    acres: 210,
    service: 'Aerial - Rotary',
    status: 'Pending',
    date: '2025-04-25'
  },
  {
    name: 'River Flat',
    acres: 63,
    service: 'Ground - Spreader',
    status: 'Blocked',
    date: '2025-04-30'
  },
  {
    name: 'West Ridge',
    acres: 175,
    service: 'Aerial - Fixed Wing',
    status: 'Active',
    date: '2025-05-02'
  }
] as const

const COLOR_SWATCHES = [
  { label: 'primary', token: '--sa-color-primary', value: 'var(--sa-color-primary)' },
  { label: 'success', token: '--sa-color-success', value: 'var(--sa-color-success)' },
  { label: 'warning', token: '--sa-color-warning', value: 'var(--sa-color-warning)' },
  { label: 'danger', token: '--sa-color-danger', value: 'var(--sa-color-danger)' },
  { label: 'info', token: '--sa-color-info', value: 'var(--sa-color-info)' }
] as const

const BUTTON_VARIANTS = [
  { label: 'Ghost', variant: 'ghost' },
  { label: 'Primary', variant: 'primary' },
  { label: 'Secondary', variant: 'secondary' },
  { label: 'Danger', variant: 'danger' }
] as const

const STATUSES = ['Scheduled', 'Ready', 'Blocked', 'Complete'] as const
const SERVICES = ['Aerial', 'Ground', 'Inspection', 'Followup'] as const

type SectionProps = {
  children: JSX.Element
  framed?: boolean
  title: string
}

/** Single-page living style guide application. */
export const StyleGuide = (): JSX.Element => {
  const [theme, setTheme] = createSignal<'dark' | 'light'>('dark')
  const [loading, setLoading] = createSignal(false)
  const [inputError, setInputError] = createSignal(false)
  const [checkboxChecked, setCheckboxChecked] = createSignal(true)
  const [radioValue, setRadioValue] = createSignal('aerial')
  const [togglePressed, setTogglePressed] = createSignal(true)
  const [viewMode, setViewMode] = createSignal('map')
  const [tab, setTab] = createSignal('assessment')

  createEffect(() => {
    document.documentElement.dataset.theme = theme()
  })

  return (
    <main class='sg-page'>
      <header class='sg-header'>
        <div>
          <h1>swarmAg Style Guide</h1>
          <p>Living visual validation for tokens, states, themes, and controls.</p>
        </div>
        <AppToggle
          pressed={theme() === 'light'}
          onClick={() => setTheme(theme() === 'light' ? 'dark' : 'light')}
        >
          {theme() === 'light' ? 'Light' : 'Dark'}
        </AppToggle>
      </header>

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
        <div class='sg-gradient-stripe' />
        <div class='sg-gradient-block' />
        <div class='sg-token-list'>
          <code>--sa-color-brand-start</code>
          <code>--sa-color-brand-mid</code>
          <code>--sa-color-brand-end</code>
        </div>
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

      <Section title='AppIconButton'>
        <div class='sg-row'>
          <AppIconButton aria-label='Add service note'>+</AppIconButton>
          <AppIconButton aria-label='Refresh service status' disabled>
            R
          </AppIconButton>
        </div>
      </Section>

      <Section title='AppInput / AppTextarea / AppSelect'>
        <div class='sg-row'>
          <AppButton variant='secondary' onClick={() => setInputError(!inputError())}>
            Toggle error
          </AppButton>
        </div>
        <div class='sg-form-grid'>
          <label>
            <span class='sg-label'>Field name</span>
            <AppInput
              value='North Field'
              error={inputError()}
              onInput={() => undefined}
              placeholder='Enter service location'
            />
          </label>
          <label>
            <span class='sg-label'>Application notes</span>
            <AppTextarea
              error={inputError()}
              onInput={() => undefined}
              placeholder='Wind break along west ridge; verify drift boundary before launch.'
              rows={4}
            />
          </label>
          <label>
            <span class='sg-label'>Service status</span>
            <AppSelect error={inputError()} options={STATUSES}>
              Select service status
              <AppSelectContent>
                <For each={STATUSES}>
                  {status => <AppSelectItem item={status}>{status}</AppSelectItem>}
                </For>
              </AppSelectContent>
            </AppSelect>
          </label>
          <label>
            <span class='sg-label'>Disabled acreage</span>
            <AppInput disabled value='142 acres' onInput={() => undefined} />
          </label>
          <label>
            <span class='sg-label'>Disabled comments</span>
            <AppTextarea disabled value='Locked after crew dispatch.' onInput={() => undefined} />
          </label>
          <label>
            <span class='sg-label'>Disabled select</span>
            <AppSelect disabled options={STATUSES}>Ground - Sprayer</AppSelect>
          </label>
        </div>
      </Section>

      <Section title='AppMultiSelect'>
        <AppMultiSelect>
          <div class='sg-token-list'>
            <For each={SERVICES}>
              {service => <span>{service}</span>}
            </For>
          </div>
        </AppMultiSelect>
      </Section>

      <Section title='AppCheckbox'>
        <div class='sg-row'>
          <AppCheckbox checked={checkboxChecked()} onChange={setCheckboxChecked}>
            Label reviewed
          </AppCheckbox>
          <AppCheckbox checked={false} onChange={() => undefined}>Drift boundary verified</AppCheckbox>
          <AppCheckbox error checked={false} onChange={() => undefined}>
            Missing wind reading
          </AppCheckbox>
          <AppCheckbox disabled checked>Disabled complete</AppCheckbox>
        </div>
      </Section>

      <Section title='AppRadioGroup + AppRadioItem'>
        <div class='sg-form-grid'>
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
        </div>
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
          <AppTabPanel value='planning'>Assign crew, assets, chemicals, and service window.</AppTabPanel>
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
          <AppBadge variant='success'>Field ready</AppBadge>
          <AppBadge variant='warning'>Wind watch</AppBadge>
          <AppBadge variant='danger'>Blocked</AppBadge>
          <AppBadge variant='info'>Assessment</AppBadge>
        </div>
      </Section>

      <Section title='AppAlert'>
        <div class='sg-stack'>
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
        <AppDialog trigger='Open dispatch dialog'>
          <div class='sg-stack'>
            <p>Confirm crew assignment before dispatch.</p>
          </div>
        </AppDialog>
      </Section>

      <Section title='AppPopover'>
        <AppPopover trigger='Open field menu'>
          <div class='sg-stack'>
            <p>Field actions, notes, and service history.</p>
          </div>
        </AppPopover>
      </Section>

      <Section title='AppAccordion'>
        <AppAccordion defaultValue={['weather']}>
          <div class='sg-stack'>
            <h3>Weather window</h3>
            <p>Wind, precipitation, and visibility remain inside service thresholds.</p>
          </div>
        </AppAccordion>
      </Section>

      <Section title='AppAvatar'>
        <AppAvatar>AG</AppAvatar>
      </Section>

      <Section title='AppCard' framed={false}>
        <AppCard>
          <h3>North Field readiness</h3>
          <p>142 acres scheduled for aerial service after the morning wind check.</p>
          <p>Primary crew has verified chemical labels, buffer zones, and asset readiness.</p>
        </AppCard>
      </Section>

      <Section title='AppSeparator'>
        <AppSeparator />
      </Section>

      <Section title='HTML Semantics'>
        <table>
          <thead>
            <tr>
              <th>Field name</th>
              <th>Acreage</th>
              <th>Service type</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <For each={FIELDS}>
              {field => (
                <tr>
                  <td>{field.name}</td>
                  <td>{field.acres}</td>
                  <td>{field.service}</td>
                  <td>{field.status}</td>
                  <td>{field.date}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
        <ul>
          <li>Confirm chemical inventory.</li>
          <li>Verify crew certification.</li>
          <li>Inspect required assets.</li>
        </ul>
        <ol>
          <li>Assess site.</li>
          <li>Plan service.</li>
          <li>Execute work.</li>
        </ol>
        <blockquote>
          Service logs are records of field reality and must remain clear, durable, and auditable.
        </blockquote>
        <fieldset>
          <legend>Raw fieldset</legend>
          <label>
            Field contact
            <AppInput id='nameId' value='R. Alvarez' onInput={() => undefined} />
          </label>
          <label>
            Gate code
            <AppInput id='codeId' value='4821' onInput={() => undefined} />
          </label>
        </fieldset>
      </Section>

      <Section title='Charts'>
        {/* TODO: AppChart - pending chart primitive */}
        <AppSkeleton />
      </Section>
    </main>
  )
}

const Section = (props: SectionProps): JSX.Element => (
  <section class='sg-section'>
    <AppCard>
      <div class='sg-section-frame'>
        <h2>{props.title}</h2>
        <div class='sg-section-body'>{props.children}</div>
      </div>
    </AppCard>
  </section>
)
