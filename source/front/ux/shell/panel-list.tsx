/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel list                                                                   ║
║ Card-backed list panel with optional toolbar content.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { UiCard, type UiComponent } from '@front/ux/ui'
import type { PanelHeaderProps } from './panel-contract.ts'
import { PanelHeader } from './panel-header.tsx'

import './panel-list.css'

/** Represents the props for the PanelList component. */
type PanelListProps = {
  children: UiComponent
  header: PanelHeaderProps
  toolbar?: UiComponent
}

/** Renders a card-backed list panel. */
export const PanelList = (props: PanelListProps) => (
  <section data-shell-panel='list'>
    <UiCard elevation='raised'>
      <PanelHeader {...props.header} />
      {props.toolbar && <div data-shell-panel='toolbar'>{props.toolbar}</div>}
      <div data-shell-panel='body' data-shell-panel-kind='list'>{props.children}</div>
    </UiCard>
  </section>
)
