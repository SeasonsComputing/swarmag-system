# Customer Onboarding — Shell/Workflow Foundation — Design Notes

**Date:** 2026-07-14
**Mode:** Foundation (new shell/workflow pattern; cross-cutting, not scoped to one feature)
**Status:** Draft — scaffold ahead of a working session between CA and AI. No
design decisions are locked yet; this doc frames context and open questions,
not answers.

---

## 1. Problem Statement

The User domain (auth/domain sync, edge functions, RLS) is now complete and
verified end-to-end (see
`documentation/project/2026-07-14-user-create-hang-handoff.md` and the
edge-functions remediation series). The next milestone is **Customer
Onboarding**: a serialized, wizard-like flow that walks an admin or sales rep
through:

1. Create User (customer contact — gets an Auth identity)
2. Create Customer (account)
3. Create initial Job Assessment

The creation-order dependency (User → Customer → CustomerContact →
`primaryContactId`, then the first Job Assessment) maps naturally onto a
multi-step wizard, where each step produces the id the next step needs.

This effort is framed as building the **shell/workflow foundation** first —
not a one-off onboarding screen — since a step-sequenced, dependency-ordered
flow is a reusable pattern likely to recur beyond this one feature.

**Target location:** `source/ux/app-admin/customer-onboarding/*` (sibling to
the existing `source/ux/app-admin/users/`).

---

## 2. Governing Context To Ingest

Before design decisions are made, load:

- `documentation/architecture/architecture-ux.md` — component boundaries,
  build composition, app packaging, widget catalog, state management rules
- `documentation/ux/ux-design-language.md` — normative interaction patterns
- `STYLE-GUIDE.md` — hard gate on any new code produced

Known facts already established (from prior sessions, re-verify currency
before relying on them):

- **App packaging model:** `app = ux/app-{name} + ux/common + ux/api + ux/config`
- **UX archetype taxonomy** (from `common/components/`): Controls (closed),
  Charts (closed), Forms (bounded), Dashboard host (bounded), Widgets
  (bounded), **Shell (bounded)**, Views/Pages (`app-{name}/`, unbounded).
  Notably, there is currently no named **Workflow** archetype — this session
  needs to decide whether step-sequencing logic is a Shell specialization, a
  new sibling archetype, or view-layer logic that doesn't need its own
  archetype at all.
- `ux/api` is the composed API namespace with dual storage (Supabase +
  IndexedDB) behind one contract — the onboarding flow's data operations
  should go through this, not bespoke fetch calls.

---

## 3. Open Design Questions

Nothing below is decided. This is the working agenda for the CA/AI session.

1. **Shell vs. Workflow as an archetype.** Does generic wizard/step-sequencing
   chrome belong in the existing `common/components/shell/` archetype, or
   does it need a new bounded archetype? What's actually shared
   infrastructure (step indicator, forward/back nav, per-step validation
   gating) versus what's onboarding-specific?
2. **Where does step state live?** URL-driven (route per step, resumable via
   back/forward and refresh) vs. in-memory store vs. `ux/common/stores/`
   pattern already used elsewhere (`app-state.ts`, `dashboard-state.ts`,
   `session-state.ts`).
3. **Step failure/rollback semantics.** If step 2 (Create Customer) fails
   after step 1 (Create User) already succeeded, what's the recovery story?
   Does this need compensation logic analogous to the edge-function
   create/compensate pattern, or is a partially-completed onboarding an
   acceptable, resumable state?
4. **Reusability boundary.** Is the wizard shell built generic-first (usable
   for future multi-step flows beyond onboarding), or built for this one flow
   with generalization deferred until a second consumer exists? (Style-guide
   default leans toward the latter — no premature abstraction — but this is
   explicitly a "build the foundation" effort per the CA's framing, so it's
   worth confirming intent before starting.)
5. **Relationship to existing `users/` feature code.** `app-admin/users/`
   already has `user-manager.tsx` — does onboarding's "Create User" step
   reuse that component/logic, or is it a distinct, simpler creation form
   scoped to the wizard context?

---
