/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel container                                                              ║
║ Shared chrome and semantic roles for two-panel shell surfaces.               ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import type { PanelContainerProps } from './panel-contract.ts'

import './panel-container.css'

/** Renders shared chrome and semantic panel roles. */
export const PanelContainer = (props: PanelContainerProps) => (
  <div data-shell={props.feature} data-shell-mode={props.mode} data-shell-panel='container'>
    {props.header}
    {props.accessory && <div data-shell-panel='accessory'>{props.accessory}</div>}
    {props.index && <aside data-shell-panel='index'>{props.index}</aside>}
    <main data-shell-panel='subject' ref={props.subjectRef}>{props.subject}</main>
  </div>
)
