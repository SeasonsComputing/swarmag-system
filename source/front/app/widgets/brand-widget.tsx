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
BrandWidgetProps  Optional page identity overrides.
├ image           Logo source; defaults to the suite logo.
├ title           Replaces the application name (the prominent line).
└ subtitle        Replaces the product name (the small line).
BrandWidget  Dashboard header brand widget.
*/

import { getShellIdentity } from '@ux/shell/runtime/shell-metadata.ts'
import type { UiComponent } from '@ux/ui'

import './brand-widget.css'
import headerLogo from '@front/app/assets/swarmag-ops-logo-flat.png'

/**
 * Page identity overrides; omitted properties retain application defaults.
 * `title` replaces the application name (the prominent line); `subtitle`
 * replaces the product name (the small line).
 */
export type BrandWidgetProps = {
  image?: string
  title?: string
  subtitle?: string
}

/** Dashboard or independently framed page identity widget. */
export const BrandWidget = (props: BrandWidgetProps = {}): UiComponent => {
  const identity = getShellIdentity()
  return (
    <div data-app='brand-widget'>
      <img
        data-app='brand-widget-logo'
        src={props.image ?? headerLogo}
        alt=''
        width={64}
        height={64}
      />
      <div data-app='brand-widget-names'>
        <span data-app='brand-widget-product'>{props.subtitle ?? identity.productName}</span>
        <span data-app='brand-widget-application'>{props.title ?? identity.applicationName}</span>
      </div>
    </div>
  )
}
