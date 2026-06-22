/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Brand widget                                                                 ║
║ Header widget for active shell identity.                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the configured product and application names in the dashboard header.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
BrandWidget  Dashboard header brand widget.
*/

import { type UiComponent, UiLayout } from '@ux/common/components/ui'
import { getShellIdentity } from '@ux/common/shell/shell-metadata.ts'

import './brand-widget.css'

/** Dashboard header brand widget. */
export const BrandWidget = (): UiComponent => {
  const identity = getShellIdentity()
  return (
    <div data-feat='brand-widget'>
      <UiLayout gap='tight'>
        <span data-feat='brand-widget-product'>{identity.productName}</span>
        <span data-feat='brand-widget-application'>{identity.applicationName}</span>
      </UiLayout>
    </div>
  )
}
