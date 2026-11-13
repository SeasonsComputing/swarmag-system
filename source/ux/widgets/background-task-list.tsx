/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Background task list                                                         ║
║ Per-operation counts, failure copy, and explicit dismissal.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Renders transient reports independently without combining units or inventing
progress for unknown work. Only non-blocking failures can be dismissed here;
operations own clearing other reports and all retry/cancel execution.
The list is the items of the Helm's Tasks menu: Helm owns the trigger, the
popover, and its title. This list has no navigation responsibility.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
BackgroundTaskList  Reactive task reports, the items of the Helm's Tasks menu.
*/

import { For, Show } from '@solid-js'
import { BackgroundTasks } from '@ux/shell/runtime/background-tasks.ts'
import { UiActionButton, UiLayout, UiList, UiListItem } from '@ux/ui'
import type { UiComponent } from '@ux/ui'

import './background-task-list.css'

/** Each report retains its own units, phase, and exit responsibility. */
export const BackgroundTaskList = (): UiComponent => (
  <UiLayout data-widget='background-task-list' gap='tight'>
    <UiList>
      <For each={Object.keys(BackgroundTasks.store)}>
        {key => {
          const task = () =>
            BackgroundTasks.store[key]
          return (
            <UiListItem>
              <UiLayout gap='tight'>
                <strong>{task().label}</strong>
                <span data-widget-task-phase={task().phase}>{task().phase}</span>
                <Show when={task().remaining}>
                  {remaining => <span>{remaining().count} {remaining().unit} remaining</span>}
                </Show>
                <Show when={task().progress}>
                  {progress => (
                    <span>
                      {progress().completed} of {progress().total} {progress().unit}
                    </span>
                  )}
                </Show>
                <Show when={task().error}>{error => <p role='alert'>{error()}</p>}</Show>
                <Show when={task().phase === 'failed' && !task().blocksExit}>
                  <UiActionButton
                    icon='cross-2'
                    label={`Dismiss ${task().label}`}
                    labelMode='visible'
                    align='start'
                    onClick={() => BackgroundTasks.clear(key)}
                  />
                </Show>
              </UiLayout>
            </UiListItem>
          )
        }}
      </For>
    </UiList>
  </UiLayout>
)
