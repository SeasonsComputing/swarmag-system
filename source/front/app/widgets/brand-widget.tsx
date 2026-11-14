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

import { getShellIdentity } from '@ux/shell/runtime/shell-metadata.ts'
import type { UiComponent } from '@ux/ui'

import './brand-widget.css'
import headerLogo from '@front/app/assets/swarmag-ops-logo-flat.png'

/** Dashboard header brand widget. */
export const BrandWidget = (): UiComponent => {
  const identity = getShellIdentity()
  return (
    <div data-app='brand-widget'>
      <img
        data-app='brand-widget-logo'
        src={headerLogo}
        alt=''
        width={64}
        height={64}
      />
      <div data-app='brand-widget-names'>
        <span data-app='brand-widget-product'>{identity.productName}</span>
        <span data-app='brand-widget-application'>{identity.applicationName}</span>
      </div>
    </div>
  )
}
