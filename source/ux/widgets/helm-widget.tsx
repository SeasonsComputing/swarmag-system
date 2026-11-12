/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Helm widget                                                                  ║
║ Default dashboard navigation widget with empty application bindings.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Keeps the generic registry binding compatible with settings-only dashboards.
Applications bind commands/status through makeHelmWidget in its maker module.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
HelmWidget  Default Helm component, made with empty application bindings.
*/

import { makeHelmWidget } from './make-helm-widget.tsx'

/** Default settings-only dashboard navigation cluster. */
export const HelmWidget = makeHelmWidget({})
