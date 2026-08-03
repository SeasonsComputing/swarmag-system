/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Brand widget                                                                 ║
║ Header widget for active shell identity.                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the product and application names in the dashboard header from the
shared shell identity service.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
BrandWidget  Dashboard header brand widget.
*/

import { getShellIdentity } from '@front/ux/shell/shell-metadata.ts'
import { type UiComponent, UiLayout } from '@front/ux/ui'

import './brand-widget.css'
import headerLogo from '@front/ux/assets/logos/swarmag-ops-logo-flat.png'

/** Dashboard header brand widget. */
export const BrandWidget = (): UiComponent => {
  const identity = getShellIdentity()
  return (
    <div data-widget='brand-widget'>
      <img
        data-widget='brand-widget-logo'
        src={headerLogo}
        alt=''
        width={64}
        height={64}
      />
      <div data-widget='brand-widget-labels'>
        <UiLayout gap='tight'>
          <span data-widget='brand-widget-product'>{identity.productName}</span>
          <span data-widget='brand-widget-application'>{identity.applicationName}</span>
        </UiLayout>
      </div>
    </div>
  )
}
