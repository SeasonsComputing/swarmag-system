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

import { type UiComponent, UiLayout } from '@front/ux/ui'
import { getShellMetadata } from './shell-metadata.ts'

import './brand-hero.css'
import logoArt from '@front/ux/assets/logos/swarmag-ops-logo-art.png'

/** Logo, product name, and application name hero block. */
export const BrandHero = (): UiComponent => {
  const shell = getShellMetadata()
  return (
    <div data-feat='brand-hero'>
      <img data-feat='brand-hero-logo' src={logoArt} alt='swarmAg' />
      <UiLayout gap='tight'>
        <span data-feat='brand-hero-product'>{shell.identity.productName}</span>
        <span data-feat='brand-hero-application'>{shell.identity.applicationName}</span>
      </UiLayout>
    </div>
  )
}
