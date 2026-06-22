/**
 * Generic abstraction form provider contract.
 */

import type { Instance } from '@core/std'
import type { UiComponent } from '@ux/common/components/ui'

/** Provider contract for list-and-dialog abstraction forms. */
export interface AbstractionFormContract<T extends Instance> {
  entityLabel: string
  listColumns: string[]
  list: () => T[]
  isListLoading: () => boolean
  renderListRow: (item: T) => UiComponent
  renderForm: (item: T | null, onClose: () => void) => UiComponent
}
