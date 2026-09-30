/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Customer manager                                                             ║
║ Customer collection, draft persistence, and confirmed soft deletion.         ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Loads the Customer collection and composes its manager provider, write scope,
and confirmed soft-delete action.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
CustomerManagerProps  Props for the Customer Manager route workbench.
CustomerManager       Customer collection and editor host.
*/

import type { Customer } from '@domain/abstractions/customer.ts'
import { CustomerUpdateScopes } from '@front/api/api-update-scopes.ts'
import { api } from '@front/api/api.ts'
import { Show } from '@solid-js'
import { createQuery } from '@tanstack/solid-query'
import type { AbstractionManagerContract } from '@ux/shell/workbench/abstraction-manager-contract.ts'
import { AbstractionManager } from '@ux/shell/workbench/abstraction-manager.tsx'
import { UiAlert, UiTableCell, UiText } from '@ux/ui'
import type { UiComponent } from '@ux/ui'
import { createCustomerState, customerDraft } from './customer-state.ts'
import type { CustomerDraft } from './customer-state.ts'
import { customerSteps } from './customer-steps.tsx'

import './customer-manager.css'

/** Props for the Customer Manager route workbench. */
export type CustomerManagerProps = {
  onCancel: () => void
}

/** Customer CRUD provider using the same first-page limit as User Manager. */
export const CustomerManager = (props: CustomerManagerProps): UiComponent => {
  const customersQuery = createQuery(() => ({
    queryKey: ['customers'],
    queryFn: async () => (await api.Customers.list({ limit: 100 })).data
  }))
  const provider: AbstractionManagerContract<Customer, CustomerDraft> = {
    formTitle: 'Customer Manager',
    entityLabel: 'Customer',
    listColumns: ['Customer', 'Status'],
    list: () => customersQuery.data ?? [],
    isListLoading: () => customersQuery.isPending,
    itemLabel: customer => customer.name,
    refresh: async () => {
      await customersQuery.refetch()
    },
    create: draft => api.Customers.create({ ...draft, accountManagerId: undefined, notes: [] }),
    update: (customer, draft) =>
      api.Customers.update(CustomerUpdateScopes.manager, {
        id: customer.id,
        ...draft,
        line2: draft.line2 ?? null
      }),
    actions: [{
      name: 'delete',
      label: 'Delete',
      icon: 'minus',
      confirmation: {
        title: 'Delete customer?',
        message: customer => `Delete ${customer.name}? This removes the customer from active records.`
      },
      handler: async customer => {
        await api.Customers.delete(customer.id)
      }
    }],
    renderListCells: customer => (
      <>
        <UiTableCell>{customer.name}</UiTableCell>
        <UiTableCell>{UiText.label(customer.status)}</UiTableCell>
      </>
    ),
    detail: customer => {
      const state = createCustomerState(customer)
      return { steps: customerSteps(state), draft: () => customerDraft(state) }
    }
  }
  return (
    <div data-app='customers-page'>
      <Show when={customersQuery.error}>
        <UiAlert variant='danger'>
          {customersQuery.error instanceof Error
            ? customersQuery.error.message
            : 'Customer operation failed.'}
        </UiAlert>
      </Show>
      <AbstractionManager provider={provider} onCancel={props.onCancel} />
    </div>
  )
}
