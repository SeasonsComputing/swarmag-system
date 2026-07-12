/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User create edge function                                                    ║
║ Privileged orchestration for creating auth/domain users.                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Creates a Supabase Auth identity and matching domain User row with the same
application-supplied UUID.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
default  Wrapped Supabase Edge HTTP handler.
*/

import {
  type UserEdgeContext,
  UserManagement
} from '@back/supabase-edge/orchestration/user-management.ts'
import { wrapBusRuleHttpHandler } from '@core/service/wrap-busrule-http-handler.ts'
import type { User } from '@domain/abstractions/user.ts'
import type { UserCreate } from '@domain/protocols/user-protocol.ts'

export default wrapBusRuleHttpHandler<UserCreate, User, UserEdgeContext>({
  context: UserManagement.authorizeAdmin,
  handle: (input, context) => UserManagement.create(input, context)
})
