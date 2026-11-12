/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Helm bindings and configuration                                              ║
║ Explicit application behavior and validated dashboard action data.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Applications supply command execution/disabled predicates and reactive status
readers; settings supply data only. Existing command records accept labelMode.
Menus have label/icon/items and are always inline icon triggers: no labelMode,
command, or nesting. Items are commands or noninteractive status readers.
Routes start with /; application commands are adorned with @. Reserved @theme
and @tasks cannot be bound. Bound commands own expected failures and retry.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
HelmCommandBinding  Application command execute and optional disabled predicate.
HelmBindings        Optional commands and status reader dictionaries.
HelmCommand         Command, label, icon, and normalized labelMode.
HelmStatus          Status binding name.
HelmMenu            Label/icon with one level of command/status items.
HelmAction          Top-level command or menu.
readHelmActions     Validate settings actions against supplied bindings.
*/

import { isConstEnum, isDictionary, isNonEmptyString, notValid } from '@core/std'
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

/** Configured command with normalized label presentation. */
export type HelmCommand = {
  command: string
  label: string
  icon: string
  labelMode: HelmLabelMode
}

/** Noninteractive text supplied by a reactive status binding. */
export type HelmStatus = { status: string }

/** Inline icon trigger for one level of labelled commands and status text. */
export type HelmMenu = {
  label: string
  icon: string
  items: (HelmCommand | HelmStatus)[]
}

/** One top-level configured action. */
export type HelmAction = HelmCommand | HelmMenu

/** Validate configured actions and fail before rendering on missing or invalid bindings. */
export const readHelmActions = (value: unknown, bindings: HelmBindings): HelmAction[] => {
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
  if (!Array.isArray(value)) return notValid('HelmWidget settings.actions must be an array')
  return value.map((item, index) => {
    const field = `HelmWidget settings.actions[${index}]`
    const record = readHelmDictionary(item, field)
    if (Object.hasOwn(record, 'items')) {
      if (Object.hasOwn(record, 'command') || Object.hasOwn(record, 'status')) {
        notValid(`${field} menu cannot have an operation`)
      }
      if (Object.hasOwn(record, 'labelMode')) notValid(`${field} menus are inline icon triggers`)
      if (!Array.isArray(record.items) || record.items.length === 0) {
        return notValid(`${field}.items must be a non-empty array`)
      }
      return {
        label: readHelmString(record.label, `${field}.label`),
        icon: readHelmString(record.icon, `${field}.icon`),
        items: record.items.map((child, childIndex) => {
          const childField = `${field}.items[${childIndex}]`
          const entry = readHelmDictionary(child, childField)
          if (Object.hasOwn(entry, 'items')) notValid(`${childField} cannot be a nested menu`)
          const command = Object.hasOwn(entry, 'command')
          const status = Object.hasOwn(entry, 'status')
          if (command === status) notValid(`${childField} needs exactly one command or status`)
          if (command) {
            if (Object.hasOwn(entry, 'labelMode')) notValid(`${childField} commands are labelled`)
            return readHelmCommand(entry, childField, bindings)
          }
          if (Object.hasOwn(entry, 'label') || Object.hasOwn(entry, 'icon')) {
            notValid(`${childField} status only accepts a binding name`)
          }
          const name = readHelmString(entry.status, `${childField}.status`)
          if (!Object.hasOwn(bindings.status ?? {}, name)) notValid(`Missing Helm status: ${name}`)
          return { status: name }
        })
      }
    }
    if (Object.hasOwn(record, 'status')) notValid(`${field} status belongs inside a menu`)
    return readHelmCommand(record, field, bindings)
  })
}

const HELM_LABEL_MODES = ['hidden', 'visible', 'visible-no-icon'] as const
type HelmLabelMode = (typeof HELM_LABEL_MODES)[number]

const readHelmCommand = (
  record: Dictionary,
  field: string,
  bindings: HelmBindings
): HelmCommand => {
  const command = readHelmString(record.command, `${field}.command`)
  if (command !== '@theme' && command !== '@tasks' && !command.startsWith('/')) {
    if (!Object.hasOwn(bindings.commands ?? {}, command)) notValid(`Missing Helm command: ${command}`)
  }
  const labelMode = record.labelMode === undefined ? 'visible' : record.labelMode
  if (!isConstEnum(labelMode, HELM_LABEL_MODES)) return notValid(`${field}.labelMode is invalid`)
  return {
    command,
    label: readHelmString(record.label, `${field}.label`),
    icon: readHelmString(record.icon, `${field}.icon`),
    labelMode
  }
}

const readHelmDictionary = (value: unknown, field: string): Dictionary => {
  if (isDictionary(value)) return value
  return notValid(`${field} must be an object`)
}

const readHelmString = (value: unknown, field: string): string => {
  if (isNonEmptyString(value)) return value
  return notValid(`${field} must be a non-empty string`)
}
