/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Use shell navigate                                                           ║
║ Shell-owned navigation seam over the current route runtime.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Provides the shell navigation API consumed by shell-adjacent presentation code.
The hook confines router-vendor navigation details to the shell runtime boundary.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ShellNavigate       Shell-owned route navigation contract.
useShellNavigate()  Return shell navigation functions for component scope.
*/

import { useNavigate } from '@tanstack/solid-router'

/** Shell-owned route navigation contract. */
export type ShellNavigate = {
  redirect: (path: string) => Promise<void>
  replace: (path: string) => Promise<void>
}

/** Return shell navigation functions for component scope. */
export const useShellNavigate = (): ShellNavigate => {
  const navigate = useNavigate()
  return {
    redirect: path => navigate({ to: path }),
    replace: path => navigate({ to: path, replace: true })
  }
}
