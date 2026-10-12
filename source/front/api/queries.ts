/**
 * Declared list queries shared by swarmAg application consumers.
 */

import { makeQuery } from '@core/stdx'
import { UserAdapter } from '@domain/adapters/user-adapter.ts'

/** Typed list declarations; application code never needs adapter metadata. */
export const queries = {
  Users: {
    byRole: makeQuery({
      filter: [UserAdapter.roles, UserAdapter.status],
      search: [UserAdapter.displayName, UserAdapter.primaryEmail, UserAdapter.phoneNumber],
      order: [UserAdapter.displayName]
    })
  }
}
