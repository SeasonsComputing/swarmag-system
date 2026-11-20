/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel header                                                                 ║
║ Two-zone bar shared by container and panel-level headers.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelHeader  Leading and trailing header zones.
*/

import { Show } from '@solid-js'
import { UiLayout } from '@ux/ui'
import type { PanelHeaderProps } from './panel-contract.ts'

import './panel-header.css'

/** Renders leading and trailing header zones. */
export const PanelHeader = (props: PanelHeaderProps) => (
  <header data-shell-panel='header'>
    <div data-shell-panel='header-leading'>
      <Show when={props.contextTitle} fallback={props.leading}>
        {title => (
          <UiLayout gap='none'>
            <span data-shell-panel='header-context'>{title()}</span>
            {props.leading}
          </UiLayout>
        )}
      </Show>
    </div>
    <div data-shell-panel='header-trailing'>{props.trailing}</div>
  </header>
)
