# Junction Client — Brief

**Active, dispatched 2026-10-28** for ACE review; later changes are amendments. Recorded and chosen
2026-10-28 from a CA + AI Architect session, while scoping
the Service Manager (`effort/active/2026-10-28-service-manager-brief.md`), whose required asset
types are the first many-to-many a manager edits. An M-5 enabler: the Service Manager is produced
after it. Foundation mode: it adds to `core/std` and `core/cli`.

## What triggered it

Every pure junction in the schema has one shape: two foreign keys as its key, no id or lifecycle,
insert and delete only. The owner's key cascades and the partner's restricts, and the table is named
owner first. Genesis gives each a domain type of two `AssociationJunction<T>` fields, an adapter,
and a create validator, consistently named though a junction is a relational construct:

| Junction                   | Owner        | Partner       | Extra      |
| -------------------------- | ------------ | ------------- | ---------- |
| `ServiceRequiredAssetType` | `serviceId`  | `assetTypeId` |            |
| `CustomerUser`             | `customerId` | `userId`      |            |
| `JobPlanAsset`             | `planId`     | `assetId`     |            |
| `TaskQuestion`             | `taskId`     | `questionId`  | `sequence` |
| `WorkflowTask`             | `workflowId` | `taskId`      | `sequence` |

No client composes them: `makeCrudSupabaseClient` assumes an `Instantiable` with updates and soft
delete. A table with an id, a lifecycle, and fields of its own (`job_plan_assignments`,
`job_plan_chemicals`) is a child record of its owner, edited through CRUD, not a junction.

## The design

From its owner, a junction is a list of partner ids. The client reads and replaces that list,
declared like every other client: a table, an adapter, a validator, and the two sides.

```ts
// core/std/api-contracts.ts
/** A junction seen from its owning side. */
export interface ApiJunctionContract {
  /** The partners an owner holds. */
  partners(owner: Id): Promise<readonly Id[]>
  /** Replace an owner's partners: removed pairs are deleted, added pairs inserted. */
  replace(owner: Id, partners: readonly Id[]): Promise<void>
}

// core/std/validators.ts, beside Validator<T>
/** Domain validation for a junction: rows are inserted and deleted, never updated. */
export type JunctionValidator<J> = {
  validateCreate: (input: J) => ExpectResult
}

// core/cli/make-supabase-client.ts, beside CrudSupabaseSpecification
/** Fields of J whose values are identifiers. */
type IdKey<J> = { [K in keyof J]: J[K] extends Id ? K : never }[keyof J]

/** Configuration for a junction Supabase API client. */
export type JunctionSupabaseSpecification<J> = {
  table: string
  adapter: Adapter<J>
  validator: JunctionValidator<J>
  owner: IdKey<J>
  partner: IdKey<J>
}

/** Maker to produce a junction API client over Supabase. */
export const makeJunctionSupabaseClient = <J>(
  spec: JunctionSupabaseSpecification<J>
): ApiJunctionContract => ({ … })

// front/api/api.ts, its first consumer
ServiceRequiredAssetTypes: makeJunctionSupabaseClient<ServiceRequiredAssetType>({
  table: 'service_required_asset_types',
  adapter: ServiceRequiredAssetTypeAdapter,
  validator: { validateCreate: validateServiceRequiredAssetTypeCreate },
  owner: 'serviceId',
  partner: 'assetTypeId'
}),
```

1. **The contract is substitutable,** so it lives in `api-contracts.ts`; an IndexedDB junction
   client for offline Ops follows the same contract.
2. **`partners`, not `list`:** `list` means a paged list of records (`CrudListContract`); this
   returns one owner's partner ids.
3. **Columns come from the adapter.** The specification names the sides by domain field, and the
   maker resolves their columns through the adapter, as `makeCrudSupabaseClient` resolves
   `adapter.id.column`.
4. **`owner` and `partner` are `IdKey<J>`:** each must name a field of the junction holding an
   `Id`, checked at compile time at no runtime cost. With `Id` a `string` today it admits any string
   field, harmless in a junction whose only other field is a numeric `sequence`; it becomes exact
   when `Id` is nominal (parking lot P-12).
5. **`replace` compares and writes:** it reads the owner's partners, deletes the removed pairs, and
   validates and inserts the added ones. It is idempotent and convergent: replaying it after a
   partial failure ends in the same state.
6. **No transaction.** _Example corrected by Amendment 1._ PostgREST runs each request in its own transaction, so a client cannot span
   requests. The question is who recovers a partial write: configuration (catalogs, services) is
   edited by a person who sees a failure and saves again, and a convergent replace survives retries
   anyway. A transaction, through an RPC or a server-side step, belongs to the first feature that
   writes non-convergent, multi-step changes with no one watching, such as an offline sync.
7. **The ordered variant is additive:** _Understated; see Amendment 1._ a `sequence` field in the specification makes `partners`
   return in order and `replace` write `sequence`, and `JunctionValidator<J>` gains the
   `validateUpdate` the ordered junctions already have. It arrives with workflows.

## Verification

A test for the junction client: partners round-trip; `replace` adds and removes; a replayed
`replace` converges; the validator rejects an invalid pair; `IdKey<J>` rejects a field that is not
the junction's. With `deno task check` and formatting.

## Records

Opened for this production: `core/std/api-contracts.ts` and `validators.ts`;
`core/cli/make-supabase-client.ts`; and `source/tests/`. `core/` is locked; the CA opens it for this
brief, recorded here. The Service Manager brief composes the client in `front/api/api.ts`.

## Amendment 1 (2026-10-28): ACE's review

ACE found no blocker for unordered junctions. Each point below was verified against the code,
schema, and architecture.

1. **`replace` treats partners as a set.** Duplicate ids collapse to one membership; an empty list
   clears the owner's partners; an unchanged list dispatches no writes.
2. **Every addition is validated before anything is deleted,** so invalid input leaves the
   existing membership intact.
3. **`partners` reads complete membership,** paging internally past the provider's response limit
   (1,000 rows by default on Supabase); the contract does not expose paging.
4. **Convergence is bounded:** replaying the same requested membership converges after a partial
   failure when no competing writer is present and permissions allow the operations. Concurrent
   replacement is not coordinated.
5. **The transaction example is corrected.** Offline Ops does not sync multi-step writes: it deep
   clones a job and uploads append-only logs (`architecture-core.md` §3.2.2, §9.1). Multi-step
   atomic work in this architecture goes through business-rule orchestration, as `deepCloneJob`
   does, and a transaction belongs there.
6. **The ordered variant needs schema work too.** `workflow_tasks` and `task_questions` have no
   `UPDATE` policy, so writing `sequence` needs RLS and schema changes beside the specification
   field and validator. It stays deferred to workflows.
7. _Superseded by Amendment 2: documentation leads code._ **Documentation follows the production,
   written by the AI Architect** with the CA's go: CONVENTIONS §10.6 gains the junction client
   beside the CRUD and business-rule clients, and `architecture-core.md` §5.2 and §5.3 recognize it
   as a third client family. ACE's production is code and tests only.
8. **Verification adds:** clearing, duplicates, unchanged saves, owner isolation, complete paged
   reads, validation before mutation, provider failures, and a retry after a successful deletion
   followed by a failed insertion. Compile-time checks reject an unknown field and an existing
   numeric field (`sequence`). Tests are database-free, using the existing SDK/fetch test pattern.

## Amendment 2 (2026-10-28): documentation leads code

ACE's scoping found Amendment 1 point 7 backwards. CONSTITUTION §8: "For foundational concerns,
documentation must lead code." A third client family is an architecture change, and
`architecture-core.md` §5.1.2 said every client conforms to `ApiCrudContract` or
`ApiBusRuleContract`. Point 7 followed the nominal types precedent, whose changes were idioms, not
architecture. The AI Architect wrote the documentation before ACE's production, with the CA's go:
`architecture-core.md` §5.1.2, §5.2, and §5.3 recognize the junction client, and CONVENTIONS 1.4
adds it to §10.6. ACE's production remains code and tests only.
