/**
 * Widget registry provider and lookup hook.
 */

import type { Dictionary } from '@core/std'
import { createContext, useContext } from '@solid-js'
import type { UiComponent } from '@ux/common/components/ui'

/** Dashboard widget component contract. */
export type WidgetComponent = (props: { settings: Dictionary }) => UiComponent

/** Dashboard widget registry keyed by dashboard widget type string. */
export type WidgetRegistry = Dictionary<WidgetComponent>

const WidgetContext = createContext<WidgetRegistry>({})

/** Provides the dashboard widget registry to dashboard renderers. */
export const WidgetProvider = (props: {
  registry: WidgetRegistry
  children: UiComponent
}): UiComponent => (
  <WidgetContext.Provider value={props.registry}>
    {props.children}
  </WidgetContext.Provider>
)

/** Read the active dashboard widget registry. */
export const useWidgets = (): WidgetRegistry => useContext(WidgetContext)
