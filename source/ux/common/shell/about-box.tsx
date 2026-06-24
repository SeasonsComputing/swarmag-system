/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ About box                                                                    ║
║ Shell application identity and configuration dialog.                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Displays shell identity and approved runtime configuration metadata.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AboutBox  Shell about dialog content.
*/

import { For } from '@solid-js'
import { type UiComponent, UiLayout } from '@ux/common/components/ui'
import { getShellMetadata } from './shell-metadata.ts'

import './about-box.css'
import logoArt from '@ux/common/assets/logos/swarmag-ops-logo-art.png'

/** Shell about dialog content. */
export const AboutBox = (): UiComponent => {
  const shell = getShellMetadata()
  return (
    <div data-feat='about-box'>
      <div data-feat='about-box-hero'>
        <img data-feat='about-box-logo' src={logoArt} alt='swarmAg' />
        <UiLayout gap='tight'>
          <span data-feat='about-box-product'>{shell.identity.productName}</span>
          <span data-feat='about-box-application'>{shell.identity.applicationName}</span>
        </UiLayout>
      </div>
      <dl data-feat='about-box-config'>
        <For each={shell.config}>
          {datum => (
            <div>
              <dt>{datum.label}</dt>
              <dd>{datum.value}</dd>
            </div>
          )}
        </For>
      </dl>
    </div>
  )
}
