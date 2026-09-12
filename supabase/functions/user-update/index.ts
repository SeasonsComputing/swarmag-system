import handler from '@back/supabase-edge/functions/user-update.ts'
import { wrapSupabaseShim } from '@core/svc/wrap-supabase-shim.ts'

Deno.serve(wrapSupabaseShim(handler))
