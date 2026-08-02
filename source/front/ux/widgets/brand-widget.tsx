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

/** Dashboard header brand widget. */
export const BrandWidget = (): UiComponent => {
  const identity = getShellIdentity()
  return (
    <div data-widget='brand-widget'>
      <UiLayout gap='tight'>
        <span data-widget='brand-widget-product'>{identity.productName}</span>
        <span data-widget='brand-widget-application'>{identity.applicationName}</span>
      </UiLayout>
    </div>
  )
}
