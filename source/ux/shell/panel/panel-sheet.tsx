/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Panel sheet                                                                  ║
║ Chrome of a full-device dialog: a title, Close, and one panel of content.    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Frames one panel in the sheet dialog that Routes.sheet opens. It has no Detail,
so it has no Aside, and it stays neutral to what its content presents. Close is
unavailable while the content reports work in flight.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
PanelSheet  Title, Close, and a single content panel.
*/

import { UiActionButton } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { PanelContainer } from './panel-container.tsx'
import type { PanelSheetProps } from './panel-contract.ts'
import { PanelHeader } from './panel-header.tsx'

/** Renders the chrome of a full-device dialog around its content. */
export const PanelSheet = (props: PanelSheetProps): UiComponent => (
  <PanelContainer
    feature='sheet'
    header={
      <PanelHeader
        leading={<h1>{props.title}</h1>}
        trailing={
          <UiActionButton
            icon='cross-1'
            label='Close'
            labelMode='visible'
            density='dense'
            disabled={props.busy === true}
            onClick={() => {
              if (!props.busy) props.onCancel()
            }}
          />
        }
      />
    }
    main={props.children}
  />
)
