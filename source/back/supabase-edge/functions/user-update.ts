/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User update edge function                                                    ║
║ Privileged orchestration for synchronizing user domain and auth attributes.  ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Updates a domain User row and synchronizes Supabase Auth email when the
primaryEmail attribute is present in the update.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
default  Wrapped Supabase Edge HTTP handler.
*/

import { type UserEdgeContext, UserOrchestra } from '@back/supabase-edge/orchestration/user-orchestra.ts'
import { wrapBusRuleHttpHandler } from '@core/service/wrap-busrule-http-handler.ts'
import type { User } from '@domain/abstractions/user.ts'
import type { UserUpdate } from '@domain/protocols/user-protocol.ts'

export default wrapBusRuleHttpHandler<UserUpdate, User, UserEdgeContext>({
  context: UserOrchestra.authorizeAdmin,
  handle: (input, context) => UserOrchestra.update(input, context)
})
