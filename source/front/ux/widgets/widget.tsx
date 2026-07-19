/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Widget SPI                                                                   ║
║ Contract and runtime context for dashboard widgets.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
The widget layer's own SDK. Widgets are the shell's plugins: apps bind
concrete widgets to the shell through a registry at bootstrap (the
composition root), the shell hosts them knowing only these contracts, and
runtime context flows down through WidgetProvider — widgets never import the
shell. The shell imports this file to provide; widgets import it to consume.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
WidgetComponent        Dashboard widget component contract.
WidgetRegistry         Widget registry keyed by dashboard widget type string.
WidgetIdentity         Application identity supplied to widgets.
WidgetContextContract  Runtime context supplied to hosted widgets.
WidgetProvider         Provides widget runtime context to hosted widgets.
useWidget              Reads the active widget runtime context.
*/

import type { Dictionary } from '@core/std'
import type { UiComponent } from '@front/ux/ui'
import { createContext, useContext } from '@solid-js'

/** Dashboard widget component contract. */
export type WidgetComponent = (props: { settings: Dictionary }) => UiComponent

/** Widget registry keyed by dashboard widget type string. */
export type WidgetRegistry = Dictionary<WidgetComponent>

/** Application identity supplied to widgets by the host. */
export type WidgetIdentity = {
  productName: string
  applicationName: string
}

/** Runtime context supplied to hosted widgets. */
export type WidgetContextContract = {
  identity: WidgetIdentity
}

/** Context for the widget runtime contract. */
const WidgetContext = createContext<WidgetContextContract>()

/** Provides widget runtime context to hosted widgets. */
export const WidgetProvider = (props: {
  identity: WidgetIdentity
  children: UiComponent
}): UiComponent => (
  <WidgetContext.Provider value={{ identity: props.identity }}>
    {props.children}
  </WidgetContext.Provider>
)

/** Reads the active widget runtime context. */
export const useWidget = (): WidgetContextContract => {
  const widget = useContext(WidgetContext)
  if (!widget) throw new Error('useWidget must be used within WidgetProvider')
  return widget
}
