/**
 * Helpers for working with author attribution roles in apps.
 */

import { AUTHOR_ATTRIBUTION_ROLES } from '@domain/common.ts'
import type {
  AuthorAttributionContext,
  AuthorAttributionRole,
  AuthorAttributionRoleId,
} from '@domain/common.ts'

// Widen the const tuple so contexts accept the full AuthorAttributionContext union.
const ROLES: ReadonlyArray<
  AuthorAttributionRole & { contexts: readonly AuthorAttributionContext[] }
> = AUTHOR_ATTRIBUTION_ROLES

// Map role ids for quick lookup.
const ROLE_BY_ID = ROLES.reduce<Record<AuthorAttributionRoleId, AuthorAttributionRole>>(
  (acc, role) => {
    acc[role.id] = role
    return acc
  },
  {} as Record<AuthorAttributionRoleId, AuthorAttributionRole>,
)

export const attributionRoleLabel = (id?: AuthorAttributionRoleId) =>
  id ? ROLE_BY_ID[id]?.label : undefined

export const attributionRolesForContext = (context: AuthorAttributionContext) =>
  ROLES.filter((role) => role.contexts.includes(context))

export const attributionRoleOptionsForContext = (context: AuthorAttributionContext) =>
  attributionRolesForContext(context).map((role) => ({
    value: role.id,
    label: role.label,
  }))
