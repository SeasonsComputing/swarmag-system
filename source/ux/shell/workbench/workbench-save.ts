/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Aggregate workbench save                                                     ║
║ Retains a persisted record while its remaining writes await completion.      ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Builds a provider-facing save delegate, owned by one editor session. A failed
completion retains the persisted record, so retry updates it with the current
draft before completing again. Failures propagate to the workbench host.
Completion is not transactional; leaving the session does not roll back writes.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
AggregateSaveSpecification  Record writes and remaining aggregate writes.
├ create                    Persist a new record.
├ update                    Apply the current draft to an existing record.
└ complete                  Perform the remaining writes after persistence.
AggregateSave               Provider-facing save operations.
├ create                    Create, or update a record pending completion.
└ update                    Update a record, then complete the aggregate.
makeAggregateSave           Build one delegate per editor session.
*/

/** Record persistence and the remaining aggregate writes. */
export type AggregateSaveSpecification<T, D> = {
  create: (draft: D) => Promise<T>
  update: (record: T, draft: D) => Promise<T>
  complete: (record: T, draft: D) => Promise<void>
}

/** Provider-facing operations for one editor session. */
export type AggregateSave<T, D> = {
  create: (draft: D) => Promise<T>
  update: (record: T, draft: D) => Promise<T>
}

/** Build a session-local delegate that retries completion against the persisted record. */
export const makeAggregateSave = <T, D>(
  spec: AggregateSaveSpecification<T, D>
): AggregateSave<T, D> => {
  let pending: { record: T } | undefined
  const save = async (record: { record: T } | undefined, draft: D): Promise<T> => {
    const persisted = record === undefined
      ? await spec.create(draft)
      : await spec.update(record.record, draft)
    pending = { record: persisted }
    await spec.complete(persisted, draft)
    pending = undefined
    return persisted
  }
  return {
    create: draft => save(pending, draft),
    update: (record, draft) => save(pending ?? { record }, draft)
  }
}
