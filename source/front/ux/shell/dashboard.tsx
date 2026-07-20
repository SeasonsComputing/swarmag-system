/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Shell dashboard                                                              ║
║ Data-driven dashboard renderer for shared application shell widgets.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the dashboard layout hydrated in DashboardState and resolves widget
type names through the active WidgetProvider registry.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Dashboard  Shared shell dashboard component.
*/

import type { DashboardStoreWidget } from '@front/ux/stores/dashboard-state.ts'
import { UiCard, type UiComponent, UiFooter } from '@front/ux/ui'
import type { WidgetComponent } from '@front/ux/widgets/widget.tsx'
import { For, onCleanup, onMount, Show } from '@solid-js'
import { useDashboard } from './dashboard-provider.tsx'

import './dashboard.css'
import footerLogo from '@front/ux/assets/logos/swarmag-logo-wordmark.png'
import headerLogo from '@front/ux/assets/logos/swarmag-ops-logo-flat.png'

/** Shared shell dashboard component. */
export const Dashboard = (): UiComponent => {
  const dashboardContext = useDashboard()
  const dashboard = dashboardContext.state.store
  const widgets = dashboardContext.widgets
  const bodyWidgets = () => dashboard.rows.flatMap(row => row.widgets)
  const headerIdentity = () => dashboard.header.widgets[0]
  const headerFields = () => dashboard.header.widgets.slice(1, -1)
  const headerTerminal = () => {
    const headerWidgets = dashboard.header.widgets
    return headerWidgets.length > 1 ? headerWidgets.at(-1) : undefined
  }
  let headerContents: HTMLDivElement | undefined
  let terminalField: HTMLDivElement | undefined

  onMount(() => {
    if (!headerContents || !terminalField) return
    let inlineSize = -1
    const updateHeaderContext = () => {
      if (!headerContents || !terminalField) return
      headerContents.dataset.featContext = 'normal'
      const identity = headerContents.querySelector<HTMLElement>(
        '[data-feat=\'dashboard-header-identity\']'
      )
      if (!identity) return
      headerContents.dataset.featContext = terminalField.offsetTop > identity.offsetTop
        ? 'wrapped'
        : 'normal'
    }
    const observer = new ResizeObserver(entries => {
      const nextInlineSize = entries[0]?.contentRect.width ?? 0
      if (nextInlineSize === inlineSize) return
      inlineSize = nextInlineSize
      updateHeaderContext()
    })

    observer.observe(headerContents)
    updateHeaderContext()
    onCleanup(() => observer.disconnect())
  })

  return (
    <div data-feat='dashboard' data-feat-layout={dashboard.settings.layout}>
      <header data-feat='dashboard-header'>
        <div
          data-feat='dashboard-header-contents'
          data-feat-context='normal'
          ref={element => {
            headerContents = element
          }}
        >
          <div data-feat='dashboard-header-identity'>
            <div data-feat='dashboard-header-logo-field'>
              <img
                data-feat='dashboard-header-logo'
                src={headerLogo}
                alt=''
                width={64}
                height={64}
              />
            </div>
            <div data-feat='dashboard-header-brand-field'>
              <Show when={headerIdentity()}>
                {widget => <DashboardWidgetContent widget={widget()} />}
              </Show>
            </div>
          </div>
          <For each={headerFields()}>
            {widget => <DashboardWidgetContent widget={widget} />}
          </For>
          <Show when={headerTerminal()}>
            {widget => (
              <div
                data-feat='dashboard-header-terminal-field'
                ref={element => {
                  terminalField = element
                }}
              >
                <DashboardWidgetContent widget={widget()} />
              </div>
            )}
          </Show>
        </div>
      </header>

      <div data-feat='dashboard-body'>
        <Show
          when={dashboard.settings.layout === 'masonry'}
          fallback={
            <For each={dashboard.rows}>
              {row => (
                <section data-feat='dashboard-row' data-feat-size={row.size}>
                  <h2 data-feat='dashboard-row-label'>{row.label}</h2>
                  <div data-feat='dashboard-row-widgets'>
                    <For each={row.widgets}>
                      {widget => <DashboardWidget widget={widget} />}
                    </For>
                  </div>
                </section>
              )}
            </For>
          }
        >
          <For each={bodyWidgets()}>
            {widget => <DashboardWidget widget={widget} />}
          </For>
        </Show>
      </div>

      <UiFooter logo={footerLogo} alt='swarmAg' />
    </div>
  )

  function DashboardWidget(props: { widget: DashboardStoreWidget }): UiComponent {
    return (
      <div
        data-feat='dashboard-widget'
        data-feat-type={props.widget.type}
        data-feat-shape={props.widget.settings.shape}
      >
        <UiCard>
          <DashboardWidgetContent widget={props.widget} />
        </UiCard>
      </div>
    )
  }

  function DashboardWidgetContent(props: { widget: DashboardStoreWidget }): UiComponent {
    const Widget = widgets[props.widget.type] as WidgetComponent | undefined
    return (
      <Show when={Widget} fallback={<MissingWidget type={props.widget.type} />}>
        {component => {
          const Component = component()
          return <Component settings={props.widget.settings} />
        }}
      </Show>
    )
  }
}

/** Missing widget marker for dashboard seed/catalog drift. */
const MissingWidget = (props: { type: string }): UiComponent => (
  <span data-feat='dashboard-missing-widget'>Missing widget: {props.type}</span>
)
