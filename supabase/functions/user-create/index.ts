import handler from '@back/supabase-edge/functions/user-create.ts'
import { wrapSupabaseShim } from '@core/service/wrap-supabase-shim.ts'

Deno.serve(wrapSupabaseShim(handler))
