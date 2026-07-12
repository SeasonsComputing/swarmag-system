/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User eject edge function                                                     ║
║ Privileged orchestration for revoking user auth access.                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Marks the domain User inactive, preserves domain history, and deletes the
matching Supabase Auth identity.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
default  Wrapped Supabase Edge HTTP handler.
*/

import {
  type UserEdgeContext,
  type UserIdRequest,
  UserManagement
} from '@back/supabase-edge/orchestration/user-management.ts'
import { wrapBusRuleHttpHandler } from '@core/service/wrap-busrule-http-handler.ts'
import type { User } from '@domain/abstractions/user.ts'

export default wrapBusRuleHttpHandler<UserIdRequest, User, UserEdgeContext>({
  context: UserManagement.authorizeAdmin,
  handle: (input, context) => UserManagement.eject(input, context)
})
