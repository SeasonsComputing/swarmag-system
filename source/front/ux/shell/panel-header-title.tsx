/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel header title                                                           ║
║ Title row with an optional leading command for shell panel headers.          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the reusable shell panel title composition: optional leading command,
divider, and title text as one explicit header unit.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelHeaderTitle  Shell panel title with optional leading action.
*/

import { UiActionButton, type UiActionButtonProps, type UiComponent } from '@front/ux/ui'
import { For, Show } from '@solid-js'

import './panel-header.css'

/** Props for a shell panel title with optional leading command. */
type PanelHeaderTitleProps = {
  command?: UiActionButtonProps
  path?: readonly string[]
  title: string
}

/** Renders a shell panel title with an optional leading command and divider. */
export const PanelHeaderTitle = (props: PanelHeaderTitleProps): UiComponent => {
  const path = (): readonly string[] => props.path?.length ? props.path : [props.title]
  return (
    <span data-shell-panel='header-title'>
      <Show when={props.command}>
        {command => (
          <>
            <UiActionButton {...command()} align={command().align ?? 'start'} density='dense' />
            <span aria-hidden='true' data-shell-panel='header-title-divider' />
          </>
        )}
      </Show>
      <span data-shell-panel='header-title-path'>
        <For each={path()}>
          {(segment, index) => (
            <>
              <Show when={index() > 0}>
                <span aria-hidden='true' data-shell-panel='header-title-separator'>/</span>
              </Show>
              <TitleSegment level={index()} text={segment} />
            </>
          )}
        </For>
      </span>
    </span>
  )
}

/** Renders one semantic segment of a panel title path. */
const TitleSegment = (props: { level: number; text: string }): UiComponent => (
  <Show
    when={props.level === 0}
    fallback={
      <Show when={props.level === 1} fallback={<h4>{props.text}</h4>}>
        <h3>{props.text}</h3>
      </Show>
    }
  >
    <h2>{props.text}</h2>
  </Show>
)
