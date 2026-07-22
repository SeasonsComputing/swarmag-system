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
  <div data-feat={props.feature} data-feat-mode={props.mode} data-feat-panel='container'>
    {props.header}
    {props.accessory}
    {props.index && <aside data-feat-panel='index'>{props.index}</aside>}
    <main data-feat-panel='subject' ref={props.subjectRef}>{props.subject}</main>
  </div>
)
