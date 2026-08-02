/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Widget contract                                                              ║
║ Shell-owned extension contracts for dashboard widgets.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the stable contracts through which applications bind concrete widgets
to the shell. Widgets may consume public shell services, while the shell remains
closed to concrete widget implementations.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
WidgetComponent        Dashboard widget component contract.
WidgetRegistry         Widget registry keyed by dashboard widget type string.
*/

import type { Dictionary } from '@core/std'
import type { UiComponent } from '@front/ux/ui'

/** Dashboard widget component contract. */
export type WidgetComponent = (props: { settings: Dictionary }) => UiComponent

/** Widget registry keyed by dashboard widget type string. */
export type WidgetRegistry = Dictionary<WidgetComponent>
