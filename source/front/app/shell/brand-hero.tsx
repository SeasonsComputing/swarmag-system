/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ BrandHero                                                                    ║
║ Shared product and application identity hero block.                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the swarmAg logo, product name, and application name as a branded
hero block. Shared by login and about surfaces.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
BrandHero  Logo, product name, and application name hero block.
*/

import { getShellMetadata } from '@ux/shell/runtime/shell-metadata.ts'
import { type UiComponent, UiLayout } from '@ux/ui'

import './brand-hero.css'
import logoArt from '@front/app/assets/swarmag-ops-logo-art.png'

/** Logo, product name, and application name hero block. */
export const BrandHero = (): UiComponent => {
  const shell = getShellMetadata()
  return (
    <div data-shell='brand-hero'>
      <img data-shell='brand-hero-logo' src={logoArt} alt='swarmAg' />
      <UiLayout gap='tight'>
        <span data-shell='brand-hero-product'>{shell.identity.productName}</span>
        <span data-shell='brand-hero-application'>{shell.identity.applicationName}</span>
      </UiLayout>
    </div>
  )
}
