/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ ConfigTable                                                                  ║
║ Shell configuration metadata renderer.                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders shell configuration metadata as a labeled definition list. Used by
login and about surfaces. Optionally includes project authorship and
governance links.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
ConfigDatum       A label/value configuration pair.
ConfigRow         Renders a single label/value row.
ConfigTableProps  Props for ConfigTable.
ConfigTable       Renders labeled configuration data as a definition list.
*/

import { type UiComponent } from '@front/ux/ui'
import { For, Show } from '@solid-js'
import { type ShellMetadata } from './shell-metadata.ts'

import './config-table.css'

/** Represents a configuration datum. */
export type ConfigDatum = { label: string; value: string | UiComponent }

/** Renders a single configuration row. */
export const ConfigRow = (props: { datum: ConfigDatum }) => {
  return (
    <div>
      <dt>{props.datum.label}</dt>
      <dd>{props.datum.value}</dd>
    </div>
  )
}

/** Props for the ConfigTable component. */
export type ConfigTableProps = {
  shell: ShellMetadata
  showAuthor: boolean
}

/** Renders a table of configuration data. */
export const ConfigTable = (props: ConfigTableProps) => (
  <dl data-feat='config-table'>
    <Show when={props.showAuthor}>
      <ConfigRow
        datum={{
          label: 'project-by',
          value: <a href='https://seasonscomputing.com' target='_blank'>Seasons Computing</a>
        }}
      />
      <ConfigRow
        datum={{
          label: 'project-invariants',
          value: (
            <a
              href='https://seasonscomputing.com/markdown?documentation/CONSTITUTION.md'
              target='_blank'
            >
              CONSTITUTION
            </a>
          )
        }}
      />
      <ConfigRow datum={{ label: 'chief-architect', value: 'Ted V. Kremer' }} />
    </Show>
    <For each={props.shell.config}>
      {datum => <ConfigRow datum={datum satisfies ConfigDatum} />}
    </For>
  </dl>
)
