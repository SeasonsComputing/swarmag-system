/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel list                                                                   ║
║ Card-backed list panel with optional toolbar content.                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelList  Card-backed list panel.
*/

import { UiCard } from '@ux/ui'
import type { UiComponent, UiContainerProps } from '@ux/ui'
import type { UiCardProps } from '@ux/ui/components/ui-card.tsx'
import type { PanelHeaderProps } from './panel-contract.ts'
import { PanelHeader } from './panel-header.tsx'

import './panel-list.css'

/** Represents the props for the PanelList component. */
type PanelListProps =
  & UiContainerProps
  & {
    header: PanelHeaderProps
    toolbar?: UiComponent
  }
  & Pick<UiCardProps, 'variant'>

/** Renders a card-backed list panel. */
export const PanelList = (props: PanelListProps) => (
  <section data-shell-panel='list'>
    <UiCard
      {...(props.variant
        ? { variant: props.variant }
        : { elevation: 'raised' as const })}
    >
      <PanelHeader {...props.header} />
      {props.toolbar && <div data-shell-panel='toolbar'>{props.toolbar}</div>}
      <div data-shell-panel='body' data-shell-panel-kind='list'>{props.children}</div>
    </UiCard>
  </section>
)
