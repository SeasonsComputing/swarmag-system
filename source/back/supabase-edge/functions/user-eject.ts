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

import { BUILD_META, HEADER_BUILD } from '@back/supabase-edge/config/build-meta.ts'
import {
  type UserEdgeContext,
  type UserIdRequest,
  UserOrchestra
} from '@back/supabase-edge/orchestration/user-orchestra.ts'
import { wrapBusRuleHttpHandler } from '@core/service/wrap-busrule-http-handler.ts'
import type { User } from '@domain/abstractions/user.ts'

export default wrapBusRuleHttpHandler<UserIdRequest, User, UserEdgeContext>({
  context: UserOrchestra.authorizeAdmin,
  handle: (input, context) => UserOrchestra.eject(input, context),
  headers: { [HEADER_BUILD]: BUILD_META }
})
