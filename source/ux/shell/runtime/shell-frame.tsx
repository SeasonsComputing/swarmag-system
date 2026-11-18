/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Shell frame                                                                  ║
║ Fixed header and scrolling page content with an in-flow footer.              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Composes application-supplied chrome without owning branding or route state.
Retains the shell frame header fitting hooks shared by Brand and Helm.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ShellFrameHeader  Header slots in visual and keyboard order.
├ brand           Page identity content.
├ fields          Optional intermediate header content.
└ toolbar         Optional terminal actions.
ShellFrameProps   Composed page chrome and content.
├ header          Explicit header slots.
├ footer          Footer component.
└ children        Page body content.
ShellFrame        Shared authenticated page layout.
*/

import { Show } from '@solid-js'
import type { UiComponent } from '@ux/ui'

import './shell-frame.css'

/** Explicit header slots, in visual and keyboard order. */
export type ShellFrameHeader = {
  brand: UiComponent
  fields?: UiComponent
  toolbar?: UiComponent
}

/** Page chrome and content supplied by its owner. */
export type ShellFrameProps = {
  header: ShellFrameHeader
  footer: () => UiComponent
  children: UiComponent
}

/** Shared frame; header stays fixed while content and footer scroll together. */
export const ShellFrame = (props: ShellFrameProps): UiComponent => (
  <div data-shell='shell-frame'>
    <header data-shell='shell-frame-header'>
      <div data-shell='shell-frame-header-contents'>
        {props.header.brand}
        {props.header.fields}
        <Show when={props.header.toolbar}>
          <div data-shell='shell-frame-toolbar'>{props.header.toolbar}</div>
        </Show>
      </div>
    </header>
    <div data-shell='shell-frame-scroll'>
      <div data-shell='shell-frame-body'>{props.children}</div>
      <props.footer />
    </div>
  </div>
)
