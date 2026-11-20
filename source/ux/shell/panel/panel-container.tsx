/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel container                                                              ║
║ Semantic roles and geometry for panel-owned workbench surfaces.              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelContainer  Panel-owned workbench geometry and semantic roles.
*/

import type { PanelContainerProps } from './panel-contract.ts'

import './panel-container.css'

/** Renders the main panel and optional aside with shared semantic roles. */
export const PanelContainer = (props: PanelContainerProps) => (
  <div
    data-shell={props.feature}
    data-shell-layout={props.layout}
    data-shell-mode={props.mode}
    data-shell-panel='container'
  >
    {props.aside && <aside data-shell-panel='aside'>{props.aside}</aside>}
    <main data-shell-panel='main' ref={props.mainRef}>{props.main}</main>
  </div>
)
