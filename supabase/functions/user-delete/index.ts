import handler from '@back/supabase-edge/functions/user-delete.ts'
import { wrapSupabaseShim } from '@core/service/wrap-supabase-shim.ts'

Deno.serve(wrapSupabaseShim(handler))
