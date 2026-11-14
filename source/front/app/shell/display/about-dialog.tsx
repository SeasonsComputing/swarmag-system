/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ About dialog                                                                 ║
║ Shell application identity and configuration dialog.                         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Displays shell identity and approved runtime configuration metadata.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AboutDialog  Shell about dialog content.
*/

import { ConfigTable } from '@ux/shell/runtime/config-table.tsx'
import { getShellMetadata } from '@ux/shell/runtime/shell-metadata.ts'
import type { UiComponent } from '@ux/ui'
import { BrandHero } from './brand-hero.tsx'

import './about-dialog.css'

/** Shell about dialog content. */
export const AboutDialog = (): UiComponent => {
  const shell = getShellMetadata()
  return (
    <div data-shell='about-box'>
      <BrandHero />
      <ConfigTable shell={shell} showAuthor />
    </div>
  )
}
