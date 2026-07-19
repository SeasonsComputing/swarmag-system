/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Brand widget                                                                 ║
║ Header widget for active shell identity.                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders the product and application names in the dashboard header, read from
the host-supplied widget context — never from the shell directly.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
BrandWidget  Dashboard header brand widget.
*/

import { type UiComponent, UiLayout } from '@front/ux/ui'
import { useWidget } from './widget.tsx'

import './brand-widget.css'

/** Dashboard header brand widget. */
export const BrandWidget = (): UiComponent => {
  const { identity } = useWidget()
  return (
    <div data-feat='brand-widget'>
      <UiLayout gap='tight'>
        <span data-feat='brand-widget-product'>{identity.productName}</span>
        <span data-feat='brand-widget-application'>{identity.applicationName}</span>
      </UiLayout>
    </div>
  )
}
