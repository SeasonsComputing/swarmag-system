/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel sections                                                               ║
║ Vertical panel groups separated by a rule between direct children.          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Owns spacing and separation between panel sections. Each direct child is one
section, independent of the fieldsets or wrappers it contains.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelSectionsProps  Section layout properties; extends UiContainerProps.
PanelSections       Vertical section layout for panel content.
*/

import type { UiComponent, UiContainerProps } from '@ux/ui'

import './panel-sections.css'

/** Properties for a panel's section layout. */
export type PanelSectionsProps = UiContainerProps

/** Arrange panel sections with a rule between direct children. */
export const PanelSections = (props: PanelSectionsProps): UiComponent => (
  <div data-shell-panel='sections'>
    {props.children}
  </div>
)
