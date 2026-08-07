/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Shell dashboard                                                              ║
║ Data-driven dashboard renderer for shared application shell widgets.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the dashboard layout hydrated in DashboardState and resolves widget
type names through the supplied widget registry.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Dashboard  Shared shell dashboard component.
*/

import type { DashboardStateContract, DashboardStoreWidget } from '@front/ux/stores/dashboard-state.ts'
import { UiCard, type UiComponent, UiFooter } from '@front/ux/ui'
import { For, Show } from '@solid-js'
import type { WidgetComponent, WidgetRegistry } from './widget-contract.ts'

import './dashboard.css'
import footerLogo from '@front/ux/assets/logos/swarmag-logo-wordmark.png'

/** Shared shell dashboard component. */
export const Dashboard = (props: {
  state: DashboardStateContract
  widgets: WidgetRegistry
}): UiComponent => {
  const dashboard = props.state.store
  const widgets = props.widgets

  /** Primary dashboard identity widget in the header. */
  const headerIdentity = () => dashboard.header.widgets[0]

  /** Dashboard header widgets rendered between identity and terminal slots. */
  const headerFields = () => dashboard.header.widgets.slice(1, -1)

  /** Optional terminal dashboard header widget. */
  const headerTerminal = () => {
    const headerWidgets = dashboard.header.widgets
    return headerWidgets.length > 1 ? headerWidgets.at(-1) : undefined
  }

  return (
    <div data-shell='dashboard'>
      <header data-shell='dashboard-header'>
        <div data-shell='dashboard-header-contents'>
          <Show when={headerIdentity()}>
            {widget => <DashboardWidgetContent widget={widget()} />}
          </Show>
          <For each={headerFields()}>
            {widget => <DashboardWidgetContent widget={widget} />}
          </For>
          <Show when={headerTerminal()}>
            {widget => (
              <div data-shell='dashboard-header-terminal-field'>
                <DashboardWidgetContent widget={widget()} />
              </div>
            )}
          </Show>
        </div>
      </header>

      <div data-shell='dashboard-body'>
        <For each={dashboard.rows}>
          {row => (
            <section data-shell='dashboard-row' data-shell-size={row.size}>
              <h2 data-shell='dashboard-row-label'>{row.label}</h2>
              <div data-shell='dashboard-row-widgets'>
                <For each={row.widgets}>
                  {widget => <DashboardWidget widget={widget} />}
                </For>
              </div>
            </section>
          )}
        </For>
      </div>

      <UiFooter logo={footerLogo} alt='swarmAg' />
    </div>
  )

  /** Dashboard widget frame for card-backed body widgets. */
  function DashboardWidget(props: { widget: DashboardStoreWidget }): UiComponent {
    return (
      <div
        data-shell='dashboard-widget'
        data-shell-type={props.widget.type}
        data-shell-shape={props.widget.settings.shape}
      >
        <UiCard>
          <DashboardWidgetContent widget={props.widget} />
        </UiCard>
      </div>
    )
  }

  /** Resolve and render the registered component for a dashboard widget. */
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
  <span data-shell='dashboard-missing-widget'>Missing widget: {props.type}</span>
)
