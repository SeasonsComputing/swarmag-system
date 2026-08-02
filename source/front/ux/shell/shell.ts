/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Shell route                                                                  ║
║ Declarative route behavior for shared application shells.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the small route grammar used by every application shell. A route either
presents content, redirects immediately, or runs a transition before redirecting.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ShellPath         Shared path and behavior discriminator for shell routes.
ShellRoute        A specialized route instance owned by a shell.
ShellDashboard    A shell route that presents its owning dashboard.
ShellPage         A shell route that presents direct page content.
ShellWorkbench   A shell route that presents workbench content.
ShellDialog      A shell route that presents dialog content.
ShellRedirect     A shell route that redirects immediately.
ShellTransition   A shell route that runs work before redirecting.
dashboard         Create a dashboard route.
page              Create a direct page route.
workbench         Create a workbench route.
dialog            Create a dialog route.
redirect          Create an immediate redirect route.
transition        Create a work-then-redirect route.
*/

import type { Dictionary } from '@core/std'
import type { UiComponent } from '@front/ux/ui'
import type { ShellDialogComponent, ShellDialogOptions } from './shell-dialog.tsx'

/** Shared route path and behavior discriminator. */
export type ShellPath = {
  kind: 'dashboard' | 'page' | 'workbench' | 'dialog' | 'redirect' | 'transition'
  path: string
}

/** Dashboard presentation owned by its containing dashboard shell. */
export type ShellDashboard = ShellPath & {
  kind: 'dashboard'
}

/** Component presented directly by a shell page route. */
export type ShellPageComponent = () => UiComponent

/** Direct page content owned by a shell. */
export type ShellPage = ShellPath & {
  kind: 'page'
  component: ShellPageComponent
}

/** Component presented directly by a shell workbench route. */
export type ShellWorkbenchComponent = (props: { onCancel: () => void }) => UiComponent

/** Content presented directly by a shell workbench route. */
export type ShellWorkbench = ShellPath & {
  kind: 'workbench'
  component: ShellWorkbenchComponent
}

/** Dialog content presented over its owning shell. */
export type ShellDialog = ShellPath & {
  kind: 'dialog'
  component: ShellDialogComponent
  options: ShellDialogOptions
}

/** Immediate navigation from one route path to a destination path. */
export type ShellRedirect = ShellPath & {
  kind: 'redirect'
  destination: string
}

/** Work followed by navigation from one route path to a destination path. */
export type ShellTransition = ShellPath & {
  kind: 'transition'
  destination: string
  run: () => Promise<void>
}

/** Route behavior supported by an application shell. */
export type ShellRoute =
  | ShellDashboard
  | ShellPage
  | ShellWorkbench
  | ShellDialog
  | ShellRedirect
  | ShellTransition

/** Complete shell composition supplied by one application package. */
export type Application = { shells: Shell[] }

/** Initializer function for a shell. */
export type ShellInitializer = () => Promise<void>

/** One application shell compiled beneath the TanStack root route. */
export type Shell = {
  component: () => UiComponent
  initializers: ShellInitializer[]
  routes: ShellRoute[]
}

/**  */
export type ShellRegistry = Dictionary<Shell>

// ────────────────────────────────────────────────────────────────────────────
// MAKERS
// ────────────────────────────────────────────────────────────────────────────

/** Create a complete application composition. */
export const application = (shells: Shell[]): Application => ({ shells })

/** Create a route that presents its owning dashboard shell. */
export const dashboard = (path: string): ShellDashboard => ({ kind: 'dashboard', path })

/** Create a route that presents direct page content. */
export const page = (path: string, component: ShellPageComponent): ShellPage => ({
  kind: 'page',
  path,
  component
})

/** Create a route that presents workbench content. */
export const workbench = (
  path: string,
  component: ShellWorkbenchComponent
): ShellWorkbench => ({ kind: 'workbench', path, component })

/** Create a route that presents dialog content over its owning shell. */
export const dialog = (
  path: string,
  component: ShellDialogComponent,
  options: ShellDialogOptions
): ShellDialog => ({ kind: 'dialog', path, component, options })

/** Create a route that redirects immediately. */
export const redirect = (path: string, destination: string): ShellRedirect => ({
  kind: 'redirect',
  path,
  destination
})

/** Create a route that runs work before redirecting. */
export const transition = (
  path: string,
  run: () => Promise<void>,
  destination: string
): ShellTransition => ({ kind: 'transition', path, run, destination })
