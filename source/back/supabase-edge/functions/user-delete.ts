/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ User delete edge function                                                    ║
║ Privileged orchestration for removing user domain and auth access.           ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Soft-deletes the domain User row and deletes the matching Supabase Auth
identity.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
default  Wrapped Supabase Edge HTTP handler.
*/

import {
  type UserEdgeContext,
  type UserIdRequest,
  UserOrchestra
} from '@back/supabase-edge/orchestration/user-orchestra.ts'
import { type DeleteResult } from '@core/api/api-contract.ts'
import { wrapBusRuleHttpHandler } from '@core/service/wrap-busrule-http-handler.ts'

export default wrapBusRuleHttpHandler<UserIdRequest, DeleteResult, UserEdgeContext>({
  context: UserOrchestra.authorizeAdmin,
  handle: (input, context) => UserOrchestra.delete(input, context)
})
