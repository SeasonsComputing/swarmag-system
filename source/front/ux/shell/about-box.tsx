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

import { type UiComponent } from '@front/ux/ui'
import { BrandHero } from './brand-hero.tsx'
import { ConfigTable } from './config-table.tsx'
import { getShellMetadata } from './shell-metadata.ts'

import './about-box.css'

/** Shell about dialog content. */
export const AboutBox = (): UiComponent => {
  const shell = getShellMetadata()
  return (
    <div data-feat='about-box'>
      <BrandHero />
      <ConfigTable shell={shell} showAuthor />
    </div>
  )
}
