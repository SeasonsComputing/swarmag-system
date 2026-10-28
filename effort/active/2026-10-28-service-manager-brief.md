# Service Manager — Brief

**Active, dispatched 2026-10-28** for ACE review; later changes are amendments. Recorded and chosen
2026-10-28 from a CA + AI Architect session: Services was
missed from M-5's mechanical productions. Minimal by intent: the reference implementations stand on
their own, so this brief names only the deviations, which also tests that they do. Produced after
the junction client (`effort/completed/2026-10-28-junction-client-brief.md`), which it uses.

## The recipe

Copy the Asset, Asset Type, and Chemical managers
(`effort/completed/2026-10-21-asset-chemical-managers-brief.md`), themselves copied from Customers:
a validator-bound `Services` client in `front/api/api.ts` (its commented line becomes live), a
`detail` scope, a state, one detail step, the manager, a route, and a dashboard action. The form
edits `name`, `sku`, `description`, `category` (a toggle group over `SERVICE_CATEGORIES`, as
`status` is elsewhere), and `notes`.

## Deviations

1. **Facets are deferred.** No facet manager maintains the catalog a picker would choose from. The
   form excludes `facets`; create defaults it to `[]`, and update preserves stored facets, as the
   Chemical form preserves `labels`.
2. **Required asset types: the first many-to-many.** `service_required_asset_types` is a junction:
   two foreign keys as its key, no id or lifecycle, insert and delete only.
   - **Ownership.** Service owns it: its key cascades and the asset type's restricts, and the table
     is named owner first. Only Service edits it, so from the Service form it reads as a list.
   - **The form.** The draft holds `requiredAssetTypes: Id[]`, loaded with the service; the scope
     does not project it. An inline multi-select over asset types, sorted by label, stable while
     editing.
   - **References.** New partners come from active asset types. A stored partner that is inactive
     or deleted still resolves and shows as such, stays available throughout the edit, and no other
     inactive one is offered (`effort/completed/2026-10-13-soft-deleted-references-brief.md`, as
     `AssetTypePicker` applies it to one reference).
   - **Saving.** _Through `makeAggregateSave`, per Amendment 1._ The service saves, then
     `api.ServiceRequiredAssetTypes.replace` replaces its
     partners, composed in `front/api/api.ts` with `makeJunctionSupabaseClient` (junction client
     brief); the form loads them through `partners`.
3. **Large catalogs** (search, filtering, selected-first) wait for parking lot P-13.

## Records

Opened for this production: `front/api/`, `front/app-admin/` (a `services/` folder, routes, and the
dashboard seed), and `source/tests/`. `core/` and `domain/` are not opened. _Amendment 1 opens
`ux/shell/workbench/workbench-save.ts`._

## Amendment 1 (2026-10-28): ACE's review

ACE needed nothing about fields, scopes, steps, routes, or the dashboard: the recipe stood. Both
findings came from the junction, the one real deviation, which brings what the reference
implementations never met: data loaded beside the record, and a save that spans two writes. Each
was verified against `AbstractionManager`.

1. **Membership loads before the baseline.** The manager snapshots the draft synchronously when the
   editor opens (`abstraction-manager.tsx`), so a service's partners are in its draft before that,
   loaded within `app-admin/services/`.
2. **A save that spans writes goes through `makeAggregateSave`,** a provider-facing delegate in
   `ux/shell/workbench/workbench-save.ts`, beside `workbench-draft.ts`. When `create` succeeded and
   `replace` failed, the host kept the New form and a second Save would create a duplicate
   (`services` has no unique key), invisible because the list does not refresh after a failure.
   The host treats rejected input and a failed write alike; the delegate keeps that unchanged and
   makes the retry true: one delegate per editor session holds a record whose completion failed,
   and the next save updates it and completes it.

   ```ts
   export const makeAggregateSave = <T, D>(spec: {
     create: (draft: D) => Promise<T>
     update: (record: T, draft: D) => Promise<T>
     complete: (record: T, draft: D) => Promise<void>
   }): { create: (draft: D) => Promise<T>; update: (record: T, draft: D) => Promise<T> }
   ```

   Services declares `complete` as `api.ServiceRequiredAssetTypes.replace(service.id,
   draft.requiredAssetTypes)` and creates a delegate in `detail`. It is additive: the host's
   contract and existing managers do not change, and later aggregates with a second write use it.
3. **Documentation leads code** (CONSTITUTION §8), written by the AI Architect before production:
   CONVENTIONS 1.5 §17.2, beside `AbstractionManager`'s provider shape, as the UX toolkit
   decomposition places how to build with `ux/shell`
   (`effort/completed/2026-10-20-ux-toolkit-decomposition-brief.md`).
4. **Production mode is Foundation,** as `ux/` is opened (AGENTS §1.2).
5. **Verification adds** the delegate's tests: create then complete; a failed complete followed by a
   retry that updates rather than creates; update then complete; a fresh delegate per editor
   session. And membership present in the baseline when the editor opens.

## Amendment 2 (2026-10-28): the CA and AI Architect's review

The production matched Amendment 1. The review found three things before it was committed; none is
a failure of the production, which built the best design the brief and the contracts allowed.

1. **Membership loads in one set-based read.** `loadServices` read each service's partners
   separately, two requests each (about 25 for 12 services), and any one failure failed the list.
   The junction contract gains `partnersOf(owners)`, one read over the owner set grouped by owner,
   paged internally, owners without partners mapping to `[]`; the maker splits a long owner list
   so its ids fit a request. `loadServices` then makes two reads: the services, then every
   membership. The records are unchanged: an abstraction loads whole, and only the round trips
   change. A join (PostgREST resource embedding) was set aside: IndexedDB has no joins, so a list
   returning embedded memberships would fork the store-agnostic contract; it would make the CRUD
   maker's list relation-aware; and it would complicate keyset paging. Relational questions, such
   as reports across services, belong in the database through a business-rule client
   (CONVENTIONS §10.6), never in application loops.

   ```ts
   /** The partners of each owner, in one set-based read. Owners without partners map to []. */
   partnersOf(owners: readonly Id[]): Promise<ReadonlyMap<Id, readonly Id[]>>
   ```

   Documentation leads code: CONVENTIONS 1.6 §10.6. `core/std/api-contracts.ts` and
   `core/cli/make-supabase-client.ts` are opened for this addition.
2. **A new service has no category until one is chosen.** The state defaulted `category` to the
   first value (`aerial-drone-services`), so a service saved without anyone choosing was filed as
   aerial. New starts with no category, and saving requires one, as the Asset form leaves its type
   unchosen ("Asset creation has no silently assigned type").
3. **The list's first column stacks name, SKU, and required asset types,** the last as a
   comma-separated line of labels resolved through the asset type catalog, with a stored inactive
   or deleted type marked as in the form. Category keeps its own column. Users and Customers stack
   their identity columns the same way.

**Verification adds:** `partnersOf` returns every listed owner, empty owners as `[]`, grouped
correctly across pages and split owner lists; `loadServices` makes one membership read; a new
service cannot save without a category; the list renders the stacked column.
