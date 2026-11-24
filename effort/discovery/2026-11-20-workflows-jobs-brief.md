# Workflows and Jobs — Discovery Brief

**Discovery, open.** Drafted 2026-11-20 from a CA + AI Architect session that began on the Workflow
Builder brief and outgrew it. The stories are `effort/project/project-user-stories.md` §2.3–2.9 and
§3.

## The question

How do workflows carry the business from the office to the field and back: how templates are
authored, how a job specializes and assigns them, how the crew runs them, and on which Work Pages
they are built and read?

## Findings

1. **The life of a workflow** (CA):
   1. **The office sets the standard.** An administrator authors standard workflows per kind of
      service: "Drone Obstacle Preflight", "Drone Chemical Preparation", "Mesquite Mitigation
      Procedure". A task such as "Prepare Chemicals" serves aerial and ground preparation alike.
      Standards change rarely: a regulation changes, or a job teaches something.
   2. **Sales assesses.** On site, the rep selects the workflows the job needs; they guide what the
      rep looks at. The rep also selects the kinds of resources the work needs: asset types and
      chemical types. Where this job differs (a stock pond on the east pasture), the rep
      specializes the job's workflow, and only this job's.
   3. **Planning assigns resources.** Assessment chose kinds; planning assigns the actual
      resources: each workflow to a crew member in a role, assets of the chosen types, and
      chemicals from inventory. Assessment selects a seed hopper and a drone; planning assigns
      `DJI_LILLY_B123` and `DJI_FROG_A123`. The pilot runs the preflight; the applicator runs
      chemical preparation. The planner may specialize the workflows further.
   4. **The crew runs.** Each crew member runs their own workflows on their device, offline. Every
      answer is logged with who gave it and when.
   5. **The office reads and learns.** The log is the job report and the compliance record. What a
      job teaches flows back into the standard by an administrator's edit.
2. **Templates, basis, and clone** (`domain-model.md` §2.5): creating and editing Workflows is an
   administrator's; assessment and planning only read them. A Job Workflow has a read-only basis
   Workflow and an optional modified Workflow, always a clone of the basis. At `executing`, the
   manifest resolves each to its modified Workflow or its basis.
3. **Answers carry identity and type** (`source/domain/abstractions/workflow.ts`, `Answer`): an
   Answer holds `questionId` and its Question's `type`. The type keeps the value readable without
   the Question; the id names the Question answered.
4. **A clone gets a new id** (CA; ids are minted by the application, one UUID v7 algorithm). A
   clone is a new record, never a copy of the original's identity.
5. **Assignment is stated but not typed** (`domain-model.md` §2.5 against
   `source/domain/abstractions/job.ts`): the domain model says Job Workflows are assigned to crew
   staff during planning. `JobPlanAssignment` names a plan, a crew member, and a role; nothing
   names a Job Workflow.
6. **Roles exist** (`job.ts`, `JOB_PLAN_ASSIGNMENT_ROLES`): crew lead, pilot, visual observer,
   applicator, equipment operator, technician.
7. **One person holds every office role for now** (CA): administrator, sales, and manager are the
   same person until the business scales.

## The model

### Templates

A Workflow, its Tasks, and their Questions are **templates**: reusable, shared by reference, and
edited by administrators.

- **Edit edits the thing.** An edit to a shared Task reaches every Workflow that uses it.
  Authoring is deliberate and authorized; the reach is intended.
- **A clone is a new record with its own id.** Variation is a clone, never an edit in place.
- **Identity is the version.** The id names the exact Question the crew saw. Changes of meaning
  made by cloning keep history coherent and keep variants distinguishable for comparison.
- **`Workflow.version`** is a label for people. The domain stores it as a nonempty string;
  `major.minor` is the Template Builder's reading of it.

### Jobs

A job specializes templates and never edits one.

- **Job Workflow.** Each workflow a job needs is a Job Workflow. Assessment's modification is the
  basis for planning's.
- **Assignment.** A plan assignment names a crew member, a role, and the Job Workflow they run: one
  assignment per person, per workflow. A job has several workflows because its crew does several
  kinds of work.
- **Manifest.** A crew member's manifest is their assignments' resolved Workflows.
- **Log.** Answers append to the job's log offline and upload as a one-way append (Architecture
  Core §9).

### Work Pages

Workflows are built and read on Work Pages (`ux-design-archetypes.md` §5): a fixed header, a
scrolling body, and a footer that follows it. `ShellFrame` implements the Work Page.

| Work Page                 | Kind    | Body                                      |
| ------------------------- | ------- | ----------------------------------------- |
| Workflow Template Builder | Builder | stack of Tasks, each a stack of Questions |
| Job Builder               | Builder | stack of Job Workflows                    |
| Job report                | Digest  | the job's log, as one document            |

- **Workflow Template Builder.** Administrators author templates. The stack arranges: adding,
  moving, and removing are single link changes and take effect at once. The info panel discloses:
  selecting a card shows its detail, read-only, and launches that record's Manager. The Managers
  author and acquire: the Workflow, Task, and Question Managers edit content and clone; as
  libraries they select or create the item a stack adds. They are reached only from the Template
  Builder.
- **Job Builder.** Assessment and planning build a job's workflows: **pick** the templates the job
  needs, each becoming a Job Workflow; **specialize** a Job Workflow, its clone opening in the same
  stack and info panel one level down; **assign** each Job Workflow to a crew member and role. It
  edits only the job's clones and assignments; templates are read-only to it.
- **Digests.** The dashboard is the business's Digest: widgets for glancing, arranged by
  configuration. A job's report, its chemical application record, and its assessment are Digests of
  the job: read in full, in order, drawn from the job's assessment, plan, crew, chemicals, and log.

### Authorization

Authoring templates is an administrator's; specializing and assigning are assessment's and
planning's; running is the assigned crew member's. While one person holds these roles, the Work
Page they open decides which they are doing: the Template Builder authors, the Job Builder
specializes.

## Lands in

- **`ux-design-archetypes.md` §5** — the Work Page family, Digest and Builder. Landed.
- **The Workflow Template Builder brief** (`effort/active/2026-11-15-workflow-builder-brief.md`,
  M-7) — templates, the Template Builder, the Managers, the version label.
- **The roadmap, M-8** — the Job Builder: pick, specialize, assign. Landed. The Template Builder
  builds the Builder in `front/`; the Job Builder, its second consumer, moves the Builder and the
  stack into `ux/shell` beside `ShellFrame`.
- **A domain production brief** — `JobPlanAssignment` gains
  `jobWorkflowId: AssociationOne<JobWorkflow>`: one assignment per person, per workflow. The
  abstraction, protocols, dictionary, schema, adapter, and validator change together, through
  genesis. `domain-model.md` §2.5 states the mechanism: a plan assignment names the Job Workflow
  its crew member runs.
- **`architecture-front.md`** — `ShellFrame` implements the Work Page archetype, beside the
  authenticated work pages; §11.2.3 names the Job Builder as the editor of a job's workflow clones,
  in place of mounting the canonical builder.

## Open

1. **Clone depth.** Whether a job's clone is deep (new Workflow, Tasks, Questions, and junctions)
   or partial, with the work a merge of the clone over its basis. Partial-and-merge predates the
   records; its intent is to be recovered before deciding.
2. **The Job Builder's entry.** From the job's Assessment and Plan; whether it is one Work Page for
   both phases.
3. **Assignment screen.** The planner works by person (a crew member and their workflows); the data
   is one row per workflow. Whether that screen is the Job Builder's info panel or the plan's.
4. **Reports.** Whether the report visualization prints or exports, as compliance records usually
   must.

## Records

- **Authorization splits the audiences.** Administrators author shared templates; jobs specialize
  by clone. While admin, sales, and manager are one person, the Work Page opened decides which they
  are doing.
- **One assignment per workflow.** The data stays simple; the screen groups by person.
- **No snapshot at `executing`.** Answers' ids and types already keep the log true.

## Design history

- Template-only links (every link a clone) were weighed to stop edits reaching other workflows,
  then a "used in" prompt on save, then a Template | Clone toggle in the header. The domain's own
  split (administrators author templates, jobs specialize clones) settled it: the entry point
  decides.
- A deep snapshot of every workflow at `executing` was proposed to keep logs true, and dropped.
- This brief began as an architecture document, then an active design brief, before discovery
  became its own namespace (EFFORT 1.6).

_End of Brief_
