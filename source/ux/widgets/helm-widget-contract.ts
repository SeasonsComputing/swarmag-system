/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Helm bindings and configuration                                              ║
║ Explicit application behavior and the validated dashboard toolbar.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Applications supply command execution/disabled predicates and reactive status
readers; settings supply data only. A toolbar holds commands and menus, in
order. A menu has a label, an icon, and one level of commands and status
lines; menus do not nest. The container decides presentation, so no
item carries a label mode. Routes start with /; application commands are
adorned with @. Reserved @theme and @tasks cannot be bound, and @tasks is
valid only in the toolbar. Bound commands own expected failures and retry.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
HelmCommandBinding  Application command execute and optional disabled predicate.
HelmBindings        Optional commands and status reader dictionaries.
HelmToolbar         The Helm's items, in order.
HelmToolbarItem     A toolbar command or menu.
HelmCommand         Command, label, and icon.
HelmMenu            Label/icon with one level of menu items.
HelmMenuItem        A menu command or status line.
HelmStatus          Status binding name.
readHelmToolbar     Validate settings toolbar against supplied bindings.
*/

import { isDictionary, isNonEmptyString, notValid } from '@core/std'
import type { Dictionary } from '@core/std'

/** Executable application command; expected failures are reported by its owner. */
export type HelmCommandBinding = {
  execute: () => void | Promise<void>
  disabled?: () => boolean
}

/** Executable behavior supplied at the application composition root. */
export type HelmBindings = {
  commands?: Dictionary<HelmCommandBinding>
  status?: Dictionary<() => string>
}

/** The Helm's items, rendered inline and in order. */
export type HelmToolbar = { items: readonly HelmToolbarItem[] }

/** One toolbar item: a command or a menu. */
export type HelmToolbarItem = HelmCommand | HelmMenu

/** Configured command: a route or an application command. */
export type HelmCommand = { command: string; label: string; icon: string }

/** Icon trigger for a titled popover of one level of items. */
export type HelmMenu = { label: string; icon: string; items: readonly HelmMenuItem[] }

/** One menu item: a command or a status line. */
export type HelmMenuItem = HelmCommand | HelmStatus

/** Noninteractive text supplied by a reactive status binding. */
export type HelmStatus = { status: string }

/** Validate the configured toolbar and fail before rendering on missing or invalid bindings. */
export const readHelmToolbar = (value: unknown, bindings: HelmBindings): HelmToolbar => {
  for (const [name, binding] of Object.entries(bindings.commands ?? {})) {
    if (!name.startsWith('@') || name.length === 1 || name === '@theme' || name === '@tasks') {
      notValid(`Invalid Helm command binding: ${name}`)
    }
    if (!isDictionary(binding) || typeof binding.execute !== 'function') {
      notValid(`Helm command ${name} requires execute`)
    }
    if (binding.disabled !== undefined && typeof binding.disabled !== 'function') {
      notValid(`Helm command ${name} disabled must be a function`)
    }
  }
  for (const [name, read] of Object.entries(bindings.status ?? {})) {
    if (!isNonEmptyString(name) || typeof read !== 'function') notValid('Invalid Helm status binding')
  }
  const toolbar = readHelmDictionary(value, 'HelmWidget settings.toolbar')
  const items = readHelmItems(toolbar.items, 'HelmWidget settings.toolbar.items')
  return {
    items: items.map((item, index): HelmToolbarItem => {
      const field = `HelmWidget settings.toolbar.items[${index}]`
      const record = readHelmDictionary(item, field)
      if (Object.hasOwn(record, 'items')) return readHelmMenu(record, field, bindings)
      if (Object.hasOwn(record, 'status')) notValid(`${field} status belongs inside a menu`)
      return readHelmCommand(record, field, bindings)
    })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────────────

/** The fields a command record may carry. */
const HELM_COMMAND_KEYS: readonly string[] = ['command', 'label', 'icon']

/** The fields a menu record may carry. */
const HELM_MENU_KEYS: readonly string[] = ['label', 'icon', 'items']

/** Parse one menu; its items are commands and status lines, never menus. */
const readHelmMenu = (record: Dictionary, field: string, bindings: HelmBindings): HelmMenu => {
  for (const key of Object.keys(record)) {
    if (!HELM_MENU_KEYS.includes(key)) notValid(`${field} menu cannot have ${key}`)
  }
  return {
    label: readHelmString(record.label, `${field}.label`),
    icon: readHelmString(record.icon, `${field}.icon`),
    items: readHelmItems(record.items, `${field}.items`).map((child, index): HelmMenuItem => {
      const childField = `${field}.items[${index}]`
      const entry = readHelmDictionary(child, childField)
      if (Object.hasOwn(entry, 'items')) notValid(`${childField} cannot be a nested menu`)
      const command = Object.hasOwn(entry, 'command')
      if (command === Object.hasOwn(entry, 'status')) {
        notValid(`${childField} needs exactly one command or status`)
      }
      if (command) {
        const item = readHelmCommand(entry, childField, bindings)
        if (item.command === '@tasks') notValid(`${childField} @tasks belongs in the toolbar`)
        return item
      }
      if (Object.keys(entry).length !== 1) notValid(`${childField} status only accepts a binding name`)
      const name = readHelmString(entry.status, `${childField}.status`)
      if (!Object.hasOwn(bindings.status ?? {}, name)) notValid(`Missing Helm status: ${name}`)
      return { status: name }
    })
  }
}

/** Parse one command record; an application command must have a supplied binding. */
const readHelmCommand = (
  record: Dictionary,
  field: string,
  bindings: HelmBindings
): HelmCommand => {
  for (const key of Object.keys(record)) {
    if (!HELM_COMMAND_KEYS.includes(key)) notValid(`${field}.${key} is not accepted`)
  }
  const command = readHelmString(record.command, `${field}.command`)
  if (command !== '@theme' && command !== '@tasks' && !command.startsWith('/')) {
    if (!Object.hasOwn(bindings.commands ?? {}, command)) notValid(`Missing Helm command: ${command}`)
  }
  return {
    command,
    label: readHelmString(record.label, `${field}.label`),
    icon: readHelmString(record.icon, `${field}.icon`)
  }
}

/** Require a non-empty array of items. */
const readHelmItems = (value: unknown, field: string): readonly unknown[] => {
  if (Array.isArray(value) && value.length > 0) return value
  return notValid(`${field} must be a non-empty array`)
}

/** Require an object dictionary. */
const readHelmDictionary = (value: unknown, field: string): Dictionary => {
  if (isDictionary(value)) return value
  return notValid(`${field} must be an object`)
}

/** Require a non-empty string. */
const readHelmString = (value: unknown, field: string): string => {
  if (isNonEmptyString(value)) return value
  return notValid(`${field} must be a non-empty string`)
}
