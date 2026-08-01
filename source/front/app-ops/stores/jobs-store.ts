/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Jobs store                                                                   ║
║ Ops-only IDB job manifest store.                                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
Holds lightweight JobManifest entries for jobs cloned to this device. Backed
by SolidJS createStore. Reads from IDB only — no Supabase calls. Full job
aggregates are read from IDB on demand by the workflow engine only.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
jobsStore  Reactive read store; exposes jobs array and isLoaded flag.
loadJobs   Load the job manifest from local IndexedDB storage.

CA NOTE -- THIS MUST BE REFACTORED TO FOLLOW THE CONVENTIONS OF THE REST OF THE CODEBASE.
           SEE ux/stores
*/

import type { JobManifest } from '@front/ux/views/job-views.ts'
import { createStore } from '@solid-js/store'

/** Ops job manifest store shape. */
type JobsStore = {
  jobs: JobManifest[]
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
