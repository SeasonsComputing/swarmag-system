# Materials — Discovery Brief

**Discovery, open.** Drafted 2026-11-21 from a CA + AI Architect session: seed spraying does not fit
`Chemical`. Strict scrutiny: it changes domain meaning.

## The question

What does a job dispense — chemicals, seed, feed, paint — and how do assessment, planning, and
compliance treat it?

## Findings

1. **The catalog dispenses more than chemicals** (`documentation/domain/domain-seed-data.md`):
   A-SEED-01 seed and A-FEED-01 pond feeding from a granular hopper, A-PAINT-01 commercial
   greenhouse painting, beside the herbicide, pesticide, and fertilizer services.
2. **`Chemical` already holds unregulated materials** (`source/domain/abstractions/chemical.ts`):
   it is a "regulated material record", yet its usages include `fertilizer` and `adjuvant`, which
   carry no EPA registration.
3. **Assessment selects kinds; planning assigns products** (CA): assessment selects the kind of
   material and, optionally, the product; planning assigns the product from inventory, with amounts
   and target area.
4. **Herbicides, insecticides, fungicides, and algaecides are all pesticides** (FIFRA; to confirm
   with the state): a pesticide carries an EPA registration number, a signal word, restricted-use
   status, and a re-entry interval, and applying it requires a licensed applicator; restricted-use
   products add record keeping.
5. **The others answer to other rules** (state law; to confirm with the state): fertilizers to
   state fertilizer laws, seed to federal and state seed laws (the tag's germination and purity),
   feed to state feed laws, and adjuvants to registration in some states.
6. **Any product may carry an SDS and labels** (to confirm): fertilizer, paint, and adjuvants carry
   them as pesticides do; product documents are not a pesticide matter.
7. **FAA Part 137 covers aerial dispensing of pesticides, fertilizer, and seed** (14 CFR Part 137;
   to confirm): a drone seeding job is an agricultural aircraft operation as a spraying job is.
   Compliance concerns the operation, not only the material.

## The model

Names are provisional.

### Levels

```
kind      herbicide · seed · fertilizer · feed · paint   ← the class of work; assessment names it
product   "Roundup PowerMAX 3" · "Common Bermuda seed"   ← what is bought; planning assigns it
stock     the drums and bags on the shelf                ← inventory (parking lot P-8)
```

### Kinds

A closed set. Each kind states whether its products are pesticides; `pesticide` is that property,
not a kind.

```ts
export const MATERIAL_KINDS = {
  herbicide: { pesticide: true },
  insecticide: { pesticide: true },
  fungicide: { pesticide: true },
  algaecide: { pesticide: true },
  adjuvant: { pesticide: false },
  fertilizer: { pesticide: false },
  seed: { pesticide: false },
  feed: { pesticide: false },
  paint: { pesticide: false }
} as const
export type MaterialKind = keyof typeof MATERIAL_KINDS
```

### Products

Regulation is optional data on the product, present when its kind is a pesticide. Labels and the
SDS belong to every product. The form (liquid or granular) is the product's: fertilizer comes in
both, and the form decides the spray tank or the hopper, and gallons or pounds.

```ts
type Material = Instantiable & {
  kind: MaterialKind
  name: string
  labels: CompositionMany<Label>
  sdsUrl?: string
  registration: CompositionOptional<Registration>
  notes: CompositionMany<Note>
}

type Registration = {
  epaNumber: string
  signalWord: SignalWord
  restrictedUse: boolean
  reEntryIntervalHours?: number
}
```

### Assessment and plan

```ts
// assessment: the kind, and optionally the product
type JobAssessmentMaterial = {
  assessmentId: AssociationOne<JobAssessment>
  kind: MaterialKind
  materialId: AssociationOptional<Material>
}

// planning: the product, with amounts
type JobPlanMaterial = Instantiable & {
  planId: AssociationOne<JobPlan>
  materialId: AssociationOne<Material>
  amount: number
  unit: JobPlanMaterialUnit
  targetArea?: number
  targetAreaUnit: JobPlanTargetAreaUnit
}
```

## Lands in

- **A domain production brief** — `Material` in place of `Chemical`; `JobAssessmentMaterial`;
  `JobPlanMaterial` in place of `JobPlanChemical`; the abstraction, protocols, dictionary, schema,
  adapter, and validator change together, through genesis.
- **`domain-model.md` §2.1** — services dispense materials; regulation applies to pesticides; the
  core abstractions table names `Material`.
- **The Chemical Manager and the Field Binder** — through that production, as consumers of
  `Chemical`.
- **Parking lot P-8** — stock and inventory.
- **The workflows and jobs discovery brief** (`effort/discovery/2026-11-20-workflows-jobs-brief.md`)
  — "chemical types" and "chemicals from inventory" read as material kinds and materials.

## Open

1. **The name.** "Material" is provisional; "input", the agricultural term, collides in software.
2. **Minimum-risk pesticides.** FIFRA 25(b) products carry no EPA number; whether swarmAg applies
   any, and so whether a pesticide always has a registration.
3. **State registration.** Whether state registration of adjuvants and fertilizers needs data on
   the product.
4. **Part 137.** Whether the operation's certification belongs on the operation, the service, or
   neither.

## Records

- **Kind, product, stock.** Assessment needs the kind and may name the product; planning needs the
  product; inventory is stock.
- **The kinds are a closed set.** They carry meaning the system acts on; a catalog the office edits
  cannot.
- **`pesticide` is a property of a kind.** Under FIFRA, herbicides and the rest are pesticides; a
  `pesticide` kind beside `herbicide` would overlap it.
- **Regulation is optional data, not a type.** A seed product has no registration; the compliance
  record comes from the products that do.

## Design history

- Three shapes were weighed: stretching `Chemical` with `seed` and `feed` usages, sibling
  abstractions per material, and one abstraction with a kind. Stretching bends the compliance
  meaning; siblings multiply with each service line.
- The first sketch kept labels and the SDS inside `Registration`; they belong to every product.

_End of Brief_
