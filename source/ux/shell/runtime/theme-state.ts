/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Theme state                                                                  ║
║ Assigned login theme and persisted authenticated theme selection.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Uses the HTML-assigned theme until the session is prepared, then applies the
saved AppState preference. Initialize within the application Solid owner.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ThemeState       Application theme state.
├ store          Reactive applied theme.
├ init()         Capture the assigned theme and follow session preferences.
└ choose(name)   Persist a theme selection through AppState.
*/

import { createEffect } from '@solid-js'
import { createStore } from '@solid-js/store'
import { AppState } from './app-state.ts'
import { SessionState } from './session-state.ts'

/** Applied application theme. */
const [themeStore, setThemeStore] = createStore({ theme: '' })

/** Follow session readiness and the saved preference within the Solid owner. */
function initTheme(): void {
  const assigned = document.documentElement.dataset.theme!
  createEffect(() => {
    const theme = SessionState.isPrepared() ? AppState.store.theme ?? assigned : assigned
    document.documentElement.dataset.theme = theme
    setThemeStore({ theme })
  })
}

/** Persist the selected theme; the reactive effect applies it. */
async function chooseTheme(name: string): Promise<void> {
  await AppState.set('theme', name)
}

/** Application theme state. */
export const ThemeState = { store: themeStore, init: initTheme, choose: chooseTheme }
