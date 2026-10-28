# Service Manager — Brief

**Active, draft.** Recorded and chosen 2026-10-28 from a CA + AI Architect session: Services was
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
   - **Saving.** The service saves, then `api.ServiceRequiredAssetTypes.replace` replaces its
     partners, composed in `front/api/api.ts` with `makeJunctionSupabaseClient` (junction client
     brief); the form loads them through `partners`.
3. **Large catalogs** (search, filtering, selected-first) wait for parking lot P-13.

## Records

Opened for this production: `front/api/`, `front/app-admin/` (a `services/` folder, routes, and the
dashboard seed), and `source/tests/`. `core/` and `domain/` are not opened.
