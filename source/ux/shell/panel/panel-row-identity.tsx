/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel row identity                                                           ║
║ Presents a collection Item's identity in three lines of decreasing emphasis. ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Presents identity content supplied by collection providers. Owns each line's
style; providers own content and may supply components for styling within a line.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelRowIdentityProps  Content for one collection row's identity.
├ title                Primary identifying content.
├ subtitle             Optional secondary identifying content.
└ annotation           Optional annotating content.
PanelRowIdentity       Stack the supplied identity lines in their role styles.
*/

import { Show } from '@solid-js'
import { UiLayout } from '@ux/ui'
import type { UiComponent } from '@ux/ui'

import './panel-row-identity.css'

/** Provider-owned content for one collection row's identity. */
export type PanelRowIdentityProps = {
  title: UiComponent | string
  subtitle?: UiComponent | string
  annotation?: UiComponent | string
}

/** Present title, subtitle, and annotation with shared line styles. */
export const PanelRowIdentity = (props: PanelRowIdentityProps): UiComponent => (
  <div data-shell-panel='row-identity'>
    <UiLayout variant='block-fit' gap='none'>
      <span data-shell-panel='row-title'>{props.title}</span>
      <Show when={props.subtitle !== undefined}>
        <span data-shell-panel='row-subtitle'>{props.subtitle}</span>
      </Show>
      <Show when={props.annotation !== undefined}>
        <span data-shell-panel='row-annotation'>{props.annotation}</span>
      </Show>
    </UiLayout>
  </div>
)
