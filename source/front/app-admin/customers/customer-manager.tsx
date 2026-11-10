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
CUSTOMERS_QUERY_KEY   TanStack Query cache key for the Customer collection.
CustomerManagerProps  Props for the Customer Manager route workbench.
└ onCancel            Return to the dashboard.
CustomerManager       Customer collection and editor host.
*/

import { demandOne } from '@core/std'
import { listAll } from '@core/stdx'
import type { Customer, CustomerStatus } from '@domain/abstractions/customer.ts'
import { api } from '@front/api/api.ts'
import { scopes } from '@front/api/scopes.ts'
import { makeAttachmentSave } from '@front/app/shell/make-attachment-save.ts'
import type { AttachmentSave } from '@front/app/shell/make-attachment-save.ts'
import { StatusBadge } from '@front/app/shell/status-badge.tsx'
import { onCleanup } from '@solid-js'
import { createQuery } from '@tanstack/solid-query'
import { PanelRowIdentity } from '@ux/shell/panel/panel-row-identity.tsx'
import type { AbstractionManagerContract } from '@ux/shell/workbench/abstraction-manager-contract.ts'
import { AbstractionManager } from '@ux/shell/workbench/abstraction-manager.tsx'
import { UiText } from '@ux/ui'
import type { UiBadgeVariant, UiComponent } from '@ux/ui'
import { createCustomerState, customerDraft } from './customer-state.ts'
import type { CustomerDraft } from './customer-state.ts'
import { customerSteps } from './customer-steps.tsx'

import './customer-manager.css'

/** TanStack Query cache key for the Customer collection. */
export const CUSTOMERS_QUERY_KEY = ['customers'] as const

/** Props for the Customer Manager route workbench. */
export type CustomerManagerProps = {
  onCancel: () => void
}

/** Customer collection and editor host. */
export const CustomerManager = (props: CustomerManagerProps): UiComponent => {
  const scope = scopes.Customers.detail
  const loadCustomers = (): Promise<Customer[]> => Array.fromAsync(listAll(api.Customers))
  const customersQuery = createQuery(() => ({
    queryKey: CUSTOMERS_QUERY_KEY,
    queryFn: loadCustomers
  }))

  let save: AttachmentSave<Customer, CustomerDraft>
  const provider: AbstractionManagerContract<Customer, CustomerDraft> = {
    formTitle: 'Customer Manager',
    entityLabel: 'Customer',
    listColumns: [
      {
        label: 'Customer',
        render: customer => (
          <PanelRowIdentity
            title={customer.name}
            subtitle={demandOne(customer.primaryContact).displayName}
            annotation={customerAddress(customer)}
          />
        )
      },
      {
        label: 'Status',
        align: 'center',
        render: customer => (
          <StatusBadge
            variant={CustomerStatusBadges[customer.status].variant}
            icon={CustomerStatusBadges[customer.status].icon}
            label={UiText.label(customer.status)}
          />
        )
      }
    ],
    list: () => customersQuery.data ?? [],
    isListLoading: () => customersQuery.isPending,
    listError: () => customersQuery.error,
    itemLabel: customer => customer.name,
    refresh: async () => {
      await customersQuery.refetch()
    },
    create: draft => save.create(draft),
    update: (record, draft) => save.update(record, draft),
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
    detail: customer => {
      const state = createCustomerState(customer)
      save = makeAttachmentSave<Customer, CustomerDraft>({
        create: draft => api.Customers.create(scope.toCreate(draft)),
        update: (customer, draft) =>
          api.Customers.update(scope.adapter, scope.toUpdate(customer.id, draft)),
        place: async (owner, draft) => ({
          ...draft,
          notes: await api.Attachments.Customers.place(owner, draft.notes),
          sites: await Promise.all(
            draft.sites.map(async site => ({
              ...site,
              notes: await api.Attachments.Customers.place(owner, site.notes)
            }))
          )
        }),
        reconcile: draft => {
          state.setNotes(draft.notes)
          draft.sites.forEach((site, index) => state.setSite(index, site))
        }
      })
      const editorSave = save
      onCleanup(() => {
        void editorSave.discard()
      })
      return { steps: customerSteps(state, editorSave.stage), draft: () => customerDraft(state) }
    }
  }
  return (
    <div data-app='customers-page'>
      <AbstractionManager provider={provider} onCancel={props.onCancel} />
    </div>
  )
}

// Present the billing address on one line, omitting the optional unit when absent.
const customerAddress = (customer: Customer): string =>
  [
    customer.line1,
    customer.line2,
    customer.city,
    `${customer.state} ${customer.postalCode}`,
    customer.country
  ].filter(Boolean).join(', ')

/** Status tones and glyphs cover every Customer status. */
const CustomerStatusBadges: Record<CustomerStatus, { variant: UiBadgeVariant; icon: string }> = {
  active: { variant: 'success', icon: 'check' },
  inactive: { variant: 'warning', icon: 'minus' },
  prospect: { variant: 'info', icon: 'target' }
}
