/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Application shell composition                                                ║
║ Contracts and makers for application, shell, and route declarations.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Defines the complete application composition compiled by shared bootstrap:
ordered shells, their initialization and root components, and the route grammar
each shell owns. Routes present content, redirect immediately, or run work before
redirecting.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
Application               Complete application shell composition.
ShellPath                 Shared path and behavior discriminator.
ShellDashboard            Dashboard presentation owned by its shell.
ShellPageComponent        Component contract for direct page routes.
ShellPage                 Direct page content owned by its shell.
ShellWorkbenchComponent   Component contract for workbench routes.
ShellWorkbench            Workbench content owned by its shell.
ShellDialog               Dialog content presented over its shell.
ShellRedirect             Immediate navigation to a destination.
ShellTransition           Work followed by navigation to a destination.
ShellRoute                Route behavior supported by an application shell.
ShellInitializer          Initializer contract for a shell.
Shell                     Component, initializers, and routes for one shell.
ShellDialogComponent      Component contract for dialog routes.
ShellDialogOptions        Dialog presentation options.

MAKERS
───────────────────────────────────────────────────────────────────────────────
application               Create a complete application composition.
dashboard                 Create a dashboard route.
page                      Create a direct page route.
workbench                 Create a workbench route.
dialog                    Create a dialog route.
redirect                  Create an immediate redirect route.
transition                Create a work-then-redirect route.
*/

import type { UiComponent, UiDialogSize } from '@front/ux/ui'

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

/** Component contract for shell-owned dialog routes. */
export type ShellDialogComponent = (props: { onCancel: () => void }) => UiComponent

/** Shell dialog presentation options. */
export type ShellDialogOptions = {
  size: UiDialogSize
  dismissible: boolean
}

/** Create a complete application composition. */
export const application = (shells: Shell[]): Application => ({ shells })

/** Create a route that presents its owning dashboard shell. */
export const dashboard = (path: string): ShellDashboard => ({ kind: 'dashboard', path })

/** Create a route that presents direct page content. */
export const page = (
  path: string,
  component: ShellPageComponent
): ShellPage => ({ kind: 'page', path, component })

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
export const redirect = (
  path: string,
  destination: string
): ShellRedirect => ({ kind: 'redirect', path, destination })

/** Create a route that runs work before redirecting. */
export const transition = (
  path: string,
  run: () => Promise<void>,
  destination: string
): ShellTransition => ({ kind: 'transition', path, run, destination })
