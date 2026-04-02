/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Jobs store                                                                   ║
║ Ops-only IDB job manifest store.                                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Holds lightweight JobSummary entries for jobs cloned to this device. Backed
by SolidJS createStore. Reads from IDB only — no Supabase calls. Full job
aggregates are read from IDB on demand by the workflow engine only.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
jobsStore  Reactive read store; exposes jobs array and isLoaded flag.
loadJobs   Load the job manifest from local IndexedDB storage.
*/

import { createStore } from '@solid-js/store'
import type { JobSummary } from '@ux/common/views/job.ts'

/** Ops job manifest store shape. */
type JobsStore = {
  jobs: JobSummary[]
  isLoaded: boolean
}

const [jobsStore, setJobsStore] = createStore<JobsStore>({
  jobs: [],
  isLoaded: false
})

export { jobsStore }

/** Load the job manifest from local IndexedDB storage. */
export const loadJobs = (): Promise<void> => {
  // TODO: replace with api.JobsLocal read when client maker is implemented
  setJobsStore({ jobs: [], isLoaded: true })
  return Promise.resolve()
}
