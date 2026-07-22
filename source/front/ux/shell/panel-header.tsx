/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel header                                                                 ║
║ Two-zone bar shared by container and panel-level headers.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import type { PanelHeaderProps } from './panel-contract.ts'

import './panel-header.css'

/** Renders leading and trailing header zones. */
export const PanelHeader = (props: PanelHeaderProps) => (
  <header data-feat-panel='header'>
    <div data-feat-panel='header-leading'>{props.leading}</div>
    <div data-feat-panel='header-trailing'>{props.trailing}</div>
  </header>
)
