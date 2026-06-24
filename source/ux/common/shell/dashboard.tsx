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

import { For, Show } from '@solid-js'
import { api } from '@ux/api'
import { UiCard, type UiComponent, UiFooter } from '@ux/common/components/ui'
import type { DashboardStoreWidget } from '@ux/common/stores/dashboard-state.ts'
import { useWidgets, type WidgetComponent } from './widget-provider.tsx'

import './dashboard.css'
import footerLogo from '@ux/common/assets/logos/swarmag-logo-wordmark.png'

/** Shared shell dashboard component. */
export const Dashboard = (): UiComponent => {
  const dashboard = api.DashboardState.store
  const widgets = useWidgets()
  const bodyWidgets = () => dashboard.rows.flatMap(row => row.widgets)

  return (
    <section data-feat='dashboard' data-feat-layout={dashboard.settings.layout}>
      <header data-feat='dashboard-header'>
        <For each={dashboard.header.widgets}>
          {widget => <DashboardWidget widget={widget} />}
        </For>
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
    </section>
  )

  function DashboardWidget(props: { widget: DashboardStoreWidget }): UiComponent {
    const Widget = widgets[props.widget.type] as WidgetComponent | undefined
    return (
      <div
        data-feat='dashboard-widget'
        data-feat-type={props.widget.type}
        data-feat-shape={props.widget.settings.shape}
      >
        <UiCard decoration='gradient' elevation='raised'>
          <Show when={Widget} fallback={<MissingWidget type={props.widget.type} />}>
            {component => {
              const Component = component()
              return <Component settings={props.widget.settings} />
            }}
          </Show>
        </UiCard>
      </div>
    )
  }
}

/** Missing widget marker for dashboard seed/catalog drift. */
const MissingWidget = (props: { type: string }): UiComponent => (
  <span data-feat='dashboard-missing-widget'>Missing widget: {props.type}</span>
)
