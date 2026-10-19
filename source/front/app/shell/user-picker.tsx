/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ swarmAg User picker                                                          ║
║ Role-filtered assignment with the stored reference retained.                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Loads live eligible Users and resolves an absent stored manager separately.
Options follow the stored assignment; selection follows the editable draft.
Default query refetch behavior keeps eligibility live across step remounts.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
USER_PICKER_QUERY_KEY  Picker queries under the intentional Users prefix.
UserPickerProps       Role filter, stored reference, and controlled selection.
UserPicker            User assignment control with None and reference feedback.
*/

import type { Id } from '@core/std'
import { listAll } from '@core/stdx'
import type { QuerySet } from '@core/stdx'
import type { User, UserRole } from '@domain/abstractions/user.ts'
import { api } from '@front/api/api.ts'
import { queries } from '@front/api/queries.ts'
import { Show } from '@solid-js'
import { createQuery } from '@tanstack/solid-query'
import { UiAlert, UiLayout, UiSingleSelect } from '@ux/ui'
import type { UiComponent, UiOption } from '@ux/ui'

/** Users invalidation intentionally refreshes both picker reads. */
export const USER_PICKER_QUERY_KEY = ['users', 'picker'] as const

/** Controlled assignment with an independent, unchanged stored reference. */
export type UserPickerProps = {
  name: string
  listedRoles: QuerySet<UserRole>
  storedId: Id | undefined
  value: Id | undefined
  onChange: (value: Id | undefined) => void
}

/** Select an eligible User, restore the stored reference, or explicitly choose None. */
export const UserPicker = (props: UserPickerProps): UiComponent => {
  const eligible = createQuery(() => ({
    queryKey: [...USER_PICKER_QUERY_KEY, 'eligible', props.listedRoles],
    queryFn: () =>
      Array.fromAsync(listAll(
        api.Users,
        queries.Users.byRole.build({
          where: { roles: { hasAny: props.listedRoles }, status: { eq: 'active' } }
        })
      ))
  }))
  const needsStored = (): boolean =>
    props.storedId !== undefined && eligible.data !== undefined
    && !eligible.data.some(user => user.id === props.storedId)
  const stored = createQuery(() => ({
    queryKey: [...USER_PICKER_QUERY_KEY, 'stored', props.storedId],
    queryFn: () => api.Users.get(props.storedId!),
    enabled: needsStored()
  }))
  const options = (): UiOption[] => {
    const eligibleUsers = eligible.data ?? []
    const users: User[] = [...eligibleUsers]
    if (needsStored() && stored.data) users.push(stored.data)
    users.sort((a, b) => a.displayName.localeCompare(b.displayName, 'en-US') || a.id.localeCompare(b.id))
    return [
      { value: NONE_VALUE, label: 'None' },
      ...users.map(user => ({
        value: user.id,
        label: userLabel(user, eligibleUsers.some(candidate => candidate.id === user.id))
      }))
    ]
  }
  const failed = (): boolean => eligible.isError || (needsStored() && stored.isError)
  const loading = (): boolean => eligible.isLoading || (needsStored() && stored.isLoading)

  return (
    <UiLayout variant='block-fit'>
      <UiSingleSelect
        name={props.name}
        options={options()}
        value={props.value ?? NONE_VALUE}
        onChange={value => props.onChange(value === NONE_VALUE ? undefined : value)}
        placeholder={failed() ? 'Unable to load Users' : 'Loading Users…'}
        loading={loading()}
        error={failed()}
        disabled={failed()}
      />
      <Show when={failed()}>
        <UiAlert variant='danger'>Unable to load Users. Reopen the step to retry.</UiAlert>
      </Show>
    </UiLayout>
  )
}

/** Cannot collide with UUID User identifiers. */
const NONE_VALUE = 'none'

// Eligibility follows the list; the stored lookup may still hold older role data.
const userLabel = (user: User, eligible: boolean): string => {
  if (user.deletedAt !== undefined) return `${user.displayName} (deleted)`
  if (!eligible) return `${user.displayName} (ineligible)`
  return user.displayName
}
