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

SHELL COMPOSITION
───────────────────────────────────────────────────────────────────────────────
ShellApplication          Complete application shell composition.
Shell                     Component, initializers, and routes for one shell.
ShellInitializer          Initializer contract for a shell.

ROUTE GRAMMAR
───────────────────────────────────────────────────────────────────────────────
ShellPath                 Shared path and behavior discriminator.
ShellIndex                Default shell child route.
ShellRedirect             Immediate navigation to a destination.
ShellTransition           Work followed by navigation to a destination.
ShellRoute                Route behavior supported by an application shell.

ROUTE CONTENT
───────────────────────────────────────────────────────────────────────────────
ShellPage                 Direct page content owned by its shell.
ShellOverlay              Overlay content presented over its shell.
ShellPageView             View contract for direct page routes.
ShellOverlayView          View contract for shell overlay routes.
ShellOverlayOptions       Overlay presentation options.

ROUTE FACTORY
───────────────────────────────────────────────────────────────────────────────
application               Create a complete application composition.
index                     Create a default shell child route.
page                      Create a direct page route.
workbench                 Create a workbench route.
dialog                    Create a dialog route.
redirect                  Create an immediate redirect route.
transition                Create a work-then-redirect route.
Factory                   Route factory convenience container.
*/

import type { UiComponent, UiDialogSize } from '@front/ux/ui'

// ────────────────────────────────────────────────────────────────────────────
// SHELL COMPOSITION
// ────────────────────────────────────────────────────────────────────────────

/** Complete shell composition supplied by one application package. */
export type ShellApplication = { shells: Shell[] }

/** One application shell compiled beneath the TanStack root route. */
export type Shell = {
  component: () => UiComponent
  initializers: ShellInitializer[]
  routes: ShellRoute[]
}

/** Initializer function for a shell. */
export type ShellInitializer = () => Promise<void>

// ────────────────────────────────────────────────────────────────────────────
// ROUTE GRAMMAR
// ────────────────────────────────────────────────────────────────────────────

/** Shared route path and behavior discriminator. */
export type ShellPath = {
  kind: 'index' | 'page' | 'overlay' | 'redirect' | 'transition'
  path: string
}

/** Default child route for its containing shell. */
export type ShellIndex = ShellPath & {
  kind: 'index'
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
  | ShellIndex
  | ShellPage
  | ShellOverlay
  | ShellRedirect
  | ShellTransition

// ────────────────────────────────────────────────────────────────────────────
// ROUTE CONTENT
// ────────────────────────────────────────────────────────────────────────────

/** Direct page content owned by a shell. */
export type ShellPage = ShellPath & {
  kind: 'page'
  component: ShellPageView
}

/** Overlay content presented over its owning shell. */
export type ShellOverlay = ShellPath & {
  kind: 'overlay'
  component: ShellOverlayView
  options: ShellOverlayOptions
}

/** View presented directly by a shell page route. */
export type ShellPageView = () => UiComponent

/** View presented inside a shell overlay route. */
export type ShellOverlayView = (props: { onCancel: () => void }) => UiComponent

/** Shell overlay presentation options. */
export type ShellOverlayOptions = {
  size: UiDialogSize
  dismissible: boolean
}

// ────────────────────────────────────────────────────────────────────────────
// ROUTE FACTORY
// ────────────────────────────────────────────────────────────────────────────

/** Create a complete application composition. */
export const application = (shells: Shell[]): ShellApplication => ({ shells })

/** Create a default shell child route. */
export const index = (): ShellIndex => ({ kind: 'index', path: '/' })

/** Create a route that presents direct page content. */
export const page = (
  path: string,
  component: ShellPageView
): ShellPage => ({ kind: 'page', path, component })

/** Create a route that presents workbench content. */
export const workbench = (
  path: string,
  component: ShellOverlayView
): ShellOverlay => ({
  kind: 'overlay',
  path,
  component,
  options: { size: 'workbench', dismissible: false }
})

/** Create a route that presents dialog content over its owning shell. */
export const dialog = (
  path: string,
  component: ShellOverlayView,
  options: ShellOverlayOptions
): ShellOverlay => ({ kind: 'overlay', path, component, options })

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

/** Route factory convenience container. */
export const Factory = {
  application,
  index,
  page,
  workbench,
  dialog,
  redirect,
  transition
}
