/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ swarmAg shell makers                                                         ║
║ Suite presentation and authentication bindings for generic shells.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Binds swarmAg Login, About, footer branding, and sign-out behavior once for
all application roots. Generic shells retain route execution and placement.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
makeAnonymousShell  Create the swarmAg anonymous shell.
makeDashboardShell  Create the swarmAg dashboard shell.
*/

import { api } from '@front/api/api.ts'
import { SessionCoordinator } from '@front/app/shell/session-coordinator.ts'
import type { DashboardStateSeed } from '@ux/shell/dashboard-state.ts'
import { logout } from '@ux/shell/logout.ts'
import {
  makeAnonymousShell as makeAppAnonymousShell,
  makeDashboardShell as makeAppDashboardShell
} from '@ux/shell/shell-makers.tsx'
import type { Shell, ShellRoute } from '@ux/shell/shell.ts'
import type { WidgetRegistry } from '@ux/shell/widget-contract.ts'
import { UiFooter } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { AboutBox } from './about-box.tsx'
import { Login } from './login.tsx'

import footerLogo from '@front/app/assets/swarmag-logo-wordmark.png'

/** Bind the suite's Login and sign-out transition. */
export const makeAnonymousShell = (): Shell => makeAppAnonymousShell(Login, signOut)

/** Bind suite chrome while preserving app-owned dashboard data and routes. */
export const makeDashboardShell = (
  seed: DashboardStateSeed,
  widgets: WidgetRegistry,
  routes: ShellRoute[]
): Shell => makeAppDashboardShell(seed, widgets, AboutBox, Footer, routes)

/** Suite footer content; its placement belongs to the generic dashboard. */
const Footer = (): UiComponent => <UiFooter logo={footerLogo} alt='swarmAg' />

/** Always invalidate application preparation, including failed remote sign-out. */
async function signOut(): Promise<void> {
  try {
    await logout(api.Auth)
  } finally {
    SessionCoordinator.clear()
  }
}
