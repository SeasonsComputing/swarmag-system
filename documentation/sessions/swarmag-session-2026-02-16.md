# SwarmAg System — Session Notes

**Mon Feb 16, 2026**

---

## 1. Refresh Repo

**[1.1]** Repo updated by Ted immediately prior to session. Project knowledge rescanned. domain.md has moved ahead of source code in several areas — this is the primary driver of items 3 and 5.

---

## 2. Field Execution Model (formerly "Offline-First")

**[2.1]** The term "offline-first" is banned from the codebase and all documentation. It carries specific architectural meaning (sync, reconciliation, conflict resolution) that describes exactly what we rejected. It must not appear anywhere.

**[2.2]** What we actually do is better: CRUD and business rule contracts per abstraction, with a precise maker per abstraction bound to an appropriate provider. This shrunk design scope, code volume, and complexity simultaneously.

**[2.3]** `arch-core` should articulate this as a **design principle** (general, durable) and **capabilities** (concrete, enumerated). Downstream documents (`arch-back`, `arch-ux`) and application specs derive from these.

**[2.4]** Canonical language for arch-core:

> **Design Principle:** Domain abstractions are accessed via CRUD and business rule contracts. Each abstraction is bound to a provider via a precise maker. Providers may be local or remote, and multiple providers may be active simultaneously.
>
> **Capabilities:**
>
> - Remote RDBMS — Supabase + PostgreSQL (direct SDK, RLS enforced)
> - Remote HTTP service — Edge functions via Netlify or Supabase; cloud runtime via Deno or Node
> - Local RDBMS — IndexedDB (browser)
> - Remote orchestration — Edge functions (Netlify or Supabase functions)

**[2.5]** Concrete example for the docs: the Ops mobile app uses CRUD + BusRule contracts for Jobs bound to the IndexedDB provider. This enables guided workflow progression with telemetry, GPS, and knowledge capture absent a stable connection — not as a degraded mode, but as the designed execution path.

**[2.6]** All occurrences to purge: `arch-core` sections 3.2.1, 8 (heading and body), 9.1.5 (reword invariant); `arch-ux` section 2.2 ("offline-capable" in the table); `ops-mobile-app.md` sections 1 and 4.3; `README.md` section 1.3.4 ("offline-first" in app-ops description). Search for the string literally and eliminate every instance.

---

## 3. Domain: WorkflowStep, Workflow, and Related Gaps

**[3.1]** **domain.md data-dictionary is out of sync with itself and the source code.** The domain.md solution space (section 1) now uses `Task` and `Workflow.tags[]`. The data-dictionary (section 3.8) has partially caught up (`Task` appears, `tags` appears, `serviceId` is gone). But `source/domain/abstractions/workflow.ts` still has `WorkflowStep`, `serviceId`, `effectiveFrom`, and `steps[]`. The adapter is therefore also wrong. Regenerating domain source is a primary deliverable of this session's document work.

**[3.2]** **Terminology alignment:** `WorkflowStep` → `Task` throughout. This is the domain vocabulary. The data-dictionary entry `Task` is correct; the TypeScript source needs to catch up.

**[3.3]** **JSONB mapping rules — clarification needed.** Current understanding:

- `name: Abstraction[]` maps to a JSONB column containing a JSON array of objects.
- `name: Abstraction` (singular embedded object) maps to a JSONB column containing a single JSON object.
- This is the subordinate composition JSONB exception — these types have no independent lifecycle and no external FK references.

**[3.4]** **Wrapping rule question:** You previously established that JSONB columns always contain exactly one object — either a POJO or a POJO array — to simplify the API surface. Question: Is this rule still worth enforcing given modern Postgres and Supabase SDK capabilities? The answer affects whether `tasks: Task[]` is stored as a JSONB array directly or wrapped in `{ tasks: [...] }`. **Decision needed.**

**[3.5]** **`things: ID[]` pattern is absent from the domain.** Confirmed — no array-of-IDs associations exist. All FK associations are either a scalar FK (`jobId: ID`), a join table (4NF), or subordinate composition (JSONB). This is correct and intentional.

**[3.6]** **Join table naming convention.** You asked whether join tables should be declared in domain.md with a uniform naming convention. Proposal: `{Abstraction}_x_{Abstraction}` (using `_x_` to avoid ambiguity with underscores in names). Example: `Service_x_Workflow` for the service-to-workflow tag-based association. These should appear in domain.md section 2.4 explicitly, not just implied. **Decision needed on convention.**

**[3.7]** **Workflow ↔ Service association redesign.** The old model had `Workflow.serviceId: ID` (FK, one workflow belongs to one service). The new model: `Workflow.tags: string[]` and `Service` declares which workflow tags are recommended. This decouples workflows from services, enabling reuse across service categories and tag-based filtering in the UX. This is a significant and correct architectural improvement.

**[3.8]** **Service ↔ Workflow recommended association.** If Services recommend workflows by tag, there needs to be a mechanism to declare this. Options:

- `Service.recommendedWorkflowTags: string[]` — simple, inline on Service
- A join structure `Service_x_WorkflowTag` — more formal but adds a table for a string list

The simpler option (embedded tag list on Service) is consistent with the minimalism principle. **Decision needed.**

**[3.9]** **JobAssessment ↔ Workflow: m:m is missing.** A Job Assessment requires multiple workflows. The current model has no association between `JobAssessment` and `Workflow`. This is a gap. A join table `JobAssessment_x_Workflow` is needed, carrying the workflow instance (a clone of the template at assessment time) or a reference to the workflow template used. **Decision needed: reference or clone?**

**[3.10]** **Workflow instance vs. template.** domain.md section 1.4 (TODO block) articulates the issue: workflow masters are read-only templates; the assessment creates instances from them. The Job Plan can further edit those instances or add more. This is the prototypical inheritance / clone pattern. The domain model needs to express this clearly — likely as a separate `WorkflowInstance` abstraction or a `templateId` field on a mutable workflow record. **Decision needed — this is a blocker for domain regeneration.**

**[3.11]** **JobWork abstraction (TODO in domain.md).** domain.md section 1.4 flags a missing `JobWork` entity: added when work begins, transitions Job to `inprogress`, serves as the lock state for deep-clone eligibility. Only Jobs with a `JobWork` record (status `inprogress`) can be cloned for field execution. This abstraction is missing from the domain model entirely. **Decision needed — include in this regeneration pass?**

**[3.12]** **JobPlan ↔ Workflow association.** `JobPlan` previously had `workflowId: ID` (source code) which is now removed in domain.md. The plan-to-workflow association presumably flows through the workflow instances created during assessment. If `WorkflowInstance` becomes an abstraction, `JobPlan` would reference the instances, not the template. This is entangled with [3.10]. **Resolve [3.10] first.**

**[3.13]** **JobAssessment field cleanup.** domain.md has removed `questions: Answer[]` from JobAssessment and simplified it to `locations`, `risks: Note[]`, `notes: Note[]`. The source code (`job.ts`) still has the old shape. This is a breaking change to the assessment model — answers are now captured at the workflow instance/task level, not aggregated at the assessment root. **Confirm this is intentional before code regeneration.**

**[3.14]** **Job entity cleanup.** domain.md now shows `Job` without `serviceId` (removed) and with `notes: Note[]` added. Source code still has `serviceId: ID`. Confirm `serviceId` removal is intentional — if service is now implied through the workflows on the assessment, it may be redundant. **Confirm before code regeneration.**

**[3.15]** **Summary: domain.md is the SSoT. Source code (`source/domain/`) needs full regeneration to match.** The adapter code (`workflow-adapter.ts` in particular) references fields (`serviceId`, `effectiveFrom`, `steps`, `payload`) that no longer exist in the domain. All adapters need to be regenerated from scratch once domain.md decisions are resolved.

---

## 4. architecture-core TODOs

**[4.1]** **[4.1.1] clarification ("huh?"):** The original note said "CONSTITUTION section 4 has a TODO to move to architecture-core, and architecture-core 4.1 is the Components table — no conflict." Your pushback: there may be contexts (UX app extension, test mocking) where the API namespace is extended or replaced. This is valid — the invariant that "all apps consume the single shared `@ux-api`" needs a carve-out:

> The shared `@ux-api` namespace is the default. Individual UX packages may extend it with domain-specific methods (e.g., derived queries, composed operations). Test contexts may substitute mock implementations conforming to the same contracts.

**[4.2]** This carve-out should be explicit in `arch-core` section 5 and `arch-ux` section 4.1 rather than leaving it as an unstated exception.

---

## 5. architecture-back

### 5.1 Section 4.1.4 — Seed Migration IDs

**[5.1.1]** Agreed: seed migrations must use pre-generated UUID v7 values as string literals, not `gen_random_uuid()`. Example corrected:

```sql
INSERT INTO services (id, name, sku, category, created_at, updated_at) VALUES
  ('01952fa0-0001-7000-8000-000000000001', 'Pesticide, Herbicide', 'A-CHEM-01', 'aerial-drone-services', now(), now());
```

**[5.1.2]** The architecture-back doc example must be updated to reflect this. Any coding engine following the old example will silently introduce v4 UUIDs.

### 5.2 Section 5.1 — Adapters Are Stale

**[5.2.1]** The point is not about adapter location — it's that **the adapter implementations are wrong**. Specifically: every adapter's `from{Abstraction}` function includes a `payload` field that no longer exists in the domain. The `workflow-adapter.ts` also maps `serviceId`, `effectiveFrom`, `steps`, and `locationsRequired` — none of which exist in the current `Workflow` abstraction.

**[5.2.2]** Adapters must be regenerated from scratch once domain decisions in item 3 are resolved. Do not patch — regenerate.

### 5.3 Generate Adapters From Scratch

**[5.3.1]** This is the implementation task that follows [5.2]. It is blocked on domain stabilization (item 3). Order: resolve domain TODOs → update domain.md → regenerate source/domain → regenerate adapters.

---

## 6. Rewrite foundation/style-guide

**[6.1]** The current style-guide does not adequately capture the implicit conventions evident across the codebase: naming patterns, file structure, comment style, code tone, and the specific header format established in `core/api`.

**[6.2]** The risk is real: without an explicit, current style-guide, each coding session (each AI agent invocation) will produce subtly inconsistent code. Accumulated inconsistency becomes drift.

**[6.3]** Scope of rewrite: naming conventions, file header format (the box-drawing style established in `http-handler.ts`), file layout order (header → imports → public exports → private implementation), comment conventions (JSDoc on public exports, inline for private), code tone (explicit over clever, no defensive programming, fast-fail).

**[6.4]** The style-guide rewrite is a prerequisite for generating consistent `core/api` file headers (item 7). **Recommended order: style-guide first, then core/api headers.**

---

## 7. core/api

### 7.1 File Layout and Naming

**[7.1.1]** Ted has renamed files and added placeholders. The established file layout is canonical:

```
NEW FILE HEADER   (box-drawing comment block: purpose, exports, examples)
IMPORTS
PUBLIC EXPORTS
PRIVATE IMPLEMENTATION
```

**[7.1.2]** All files in `source/core/api/` must follow this layout. File headers are currently stubs (TODO). Filling them in is the primary documentation task for this layer.

**[7.1.3]** Key distinction now in place: **makers** (factory functions that produce API clients) vs. **wrappers** (handler adapters like `wrapHttpHandler`). These are architecturally different and naming must reflect it. Makers live in `make-*.ts`; wrappers live in `wrap-*.ts` or `*-handler.ts`.

### 7.2 User as Steel Thread

**[7.2.1]** User is the chosen abstraction for the vertical slice validating `ux-api` + `core-api`. The slice covers:

- Unit test → domain types
- Remote User via Supabase maker
- Local User via IndexedDB maker
- Supabase business rule (e.g., a user-related orchestration operation)

**[7.2.2]** Get this right first. All other abstractions are generated from the same pattern once validated.

### 7.3 API Contracts Live in ux-api, Not core-api

**[7.3.1]** `core/api` is general purpose — contracts, makers, and wrappers that are domain-agnostic. Domain-specific API contracts (`AuthApiContract`, `UserApiContract`, etc.) belong in `source/ux/api/`.

**[7.3.2]** `core/api` exports: `ApiCrudContract`, `ApiBusRuleContract`, `ApiError`, makers, wrappers, http primitives. Nothing domain-specific.

### 7.4 Auth API Contract

**[7.4.1]** Auth requires a dedicated contract. Logon screens exist for both Admin and Ops apps. Customer uses passwordless (expiring access codes via email/SMS). These are distinct auth flows but can share a contract interface.

**[7.4.2]** Proposed shape (lives in `source/ux/api/`):

```typescript
interface AuthApiContract {
  logon(credentials: LogonInput): Promise<Session>
  logout(): Promise<void>
  forgotPassword(email: string): Promise<void>
  requestAccessCode(contact: string): Promise<void> // customer passwordless
  verifyAccessCode(contact: string, code: string): Promise<Session>
}
```

**[7.4.3]** The underlying implementation wraps Supabase Auth SDK calls. The contract is the seam — test contexts can substitute a mock. **Confirm contract shape before implementation.**

---

## 8. README & CONSTITUTION

**[8.1]** README section 2 (Local Configuration) discussion of `Config` is wrong. Needs correction once arch-core config section is confirmed accurate. Flag for update after arch-core pass.

**[8.2]** The CONSTITUTION's primary purpose is to enforce the **Three-Role Model (3RM)** for SwarmAg system development: Chief Architect, Architect AI, and Coding Engine AI. It exists primarily to keep AI agents honest, constrained, and conforming — not as a general engineering philosophy document.

**[8.3]** Current CONSTITUTION is close. Ted yields judgment on final structure. Key elements to preserve: role definitions and authority boundaries, agenda discipline, the prohibition on AI agents modifying architectural documents without explicit directive, and "silence is not consent."

**[8.4]** CONSTITUTION section 4 (Architectural Law, currently TODO'd for move to arch-core) should be resolved: move the content to arch-core, leave only a reference in the CONSTITUTION pointing there.

---

## 9. Sequenced Work Plan

This is the agreed execution sequence for completing the documentation-to-code generation pipeline.

### Phase 1 — Stabilize Documentation (Architect AI + Chief Architect)

**[9.1]** Resolve open domain decisions: [3.4], [3.6], [3.8], [3.9], [3.10], [3.11], [3.12], [3.13], [3.14].

**[9.2]** Update `domain.md` to reflect resolved decisions — solution space, abstractions table, section 2.4 join tables, data-dictionary.

**[9.3]** Update `arch-core`: remove all "offline-first" language ([2.6]), add design principle + capabilities language ([2.4]), fix section 5.1 API namespace framing ([4.1], [4.2]), move CONSTITUTION section 4 content here ([8.4]).

**[9.4]** Update `arch-back`: fix seed migration UUID example ([5.1.1]), clarify adapter ownership ([5.2.1]).

**[9.5]** Rewrite `style-guide` ([6.3]).

**[9.6]** Fix README Config section ([8.1]).

### Phase 2 — Generate domain + migrations (Coding Engine)

**[9.7]** Create a preserved prompt in `documentation/prompts/` sufficient to regenerate all of `source/domain/` (abstractions, adapters, protocols, validators) and `source/back/migrations/` (schema + RLS + seed data) from the documentation alone.

**[9.8]** Execute the prompt. Review output against domain.md.

### Phase 3 — core/api (Coding Engine)

**[9.9]** Update `arch-ux` to the point where a prompt can regenerate `source/ux/api/` including complete file headers.

**[9.10]** Execute the prompt. Review output.

### Phase 4 — User Steel Thread (Coding Engine)

**[9.11]** Implement User CRUD client for Supabase maker.

**[9.12]** Implement User CRUD client for IndexedDB maker.

**[9.13]** Write unit tests exercising both clients against the `ApiCrudContract` interface.

### Phase 5 — Additional API Contracts (Architect AI + Coding Engine)

**[9.14]** Define and review remaining domain-specific contracts (`AuthApiContract`, others as identified).

**[9.15]** Implement contracts.

### Phase 6 — UX Bootstrap (Architect AI + Chief Architect)

**[9.16]** Ted gets oriented in the SolidJS + TanStack + Kobalte stack.

**[9.17]** Implement shared login component (used by Admin and Ops apps).

**[9.18]** Implement home/dashboard page for Admin app.

**[9.19]** Implement home/dashboard page for Ops app.

---

_End of session notes. Return with domain decisions ([3.x] open items) to unblock Phase 1 completion._
