/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Use abstraction mutation                                                     ║
║ createMutation wrapper that invalidates its query key on success.            ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Every create/update/delete mutation in an AbstractionManager consumer needs
the same thing on success: invalidate the list query so it fetches again. This
wraps that pairing into one call instead of repeating the same
`createMutation({ ..., onSuccess: () => queryClient.invalidateQueries(...) })`
shape per operation.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
useAbstractionMutation(queryKey, mutationFn)  Invalidating mutation for a query key.
*/

import { createMutation, type QueryKey, useQueryClient } from '@tanstack/solid-query'

// ────────────────────────────────────────────────────────────────────────────
// PUBLIC
// ────────────────────────────────────────────────────────────────────────────

/**
 * Create a mutation that invalidates `queryKey` on success.
 * @param queryKey Query key to invalidate once the mutation succeeds.
 * @param mutationFn The mutation's own async operation.
 */
export const useAbstractionMutation = <TInput, TResult>(
  queryKey: QueryKey,
  mutationFn: (input: TInput) => Promise<TResult>
) => {
  const queryClient = useQueryClient()
  return createMutation(() => ({
    mutationFn,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey })
    }
  }))
}
