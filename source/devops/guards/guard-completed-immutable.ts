/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Completed-immutable guard                                                    ║
║ Fails a change that modifies a document already closed in effort/completed/. ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
A path under effort/completed/ is a permanent historical record once it exists
there — EFFORT.md §2. This guard inspects the staged diff and fails if any
path under effort/completed/ was already present at HEAD and is now changed
or deleted. A path arriving in effort/completed/ for the first time in this
commit is not a violation, even when it rewrites its own closing framing in
the same commit — that is the ordinary close pattern EFFORT.md §4 describes.

Content guards inspect what a file currently says; this one inspects whether
a file changed at all, which needs git rather than a file read. Found
necessary 2026-09-12: a core-namespace rename's reference-update pass
silently rewrote six closed briefs to use terminology that did not exist
when they were written, and nothing caught it until read by hand.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(none — run as a script, exits 1 on violation)
*/

import { guardFail, guardPass } from '@devops/guards/guard-utils.ts'

const NAME = 'Completed-immutable'
const WATCHED_PREFIX = 'effort/completed/'

const git = async (...args: string[]): Promise<{ success: boolean; stdout: string }> => {
  const { success, stdout } = await new Deno.Command('git', { args }).output()
  return { success, stdout: new TextDecoder().decode(stdout) }
}

/** Staged paths that differ from HEAD — added, changed, or deleted. */
const stagedPaths = async (): Promise<string[]> => {
  const { stdout } = await git('diff', '--cached', '--name-only')
  return stdout.split('\n').map(line => line.trim()).filter(Boolean)
}

/** True when the given path already existed at HEAD. */
const existedAtHead = async (path: string): Promise<boolean> => {
  const { success } = await git('cat-file', '-e', `HEAD:${path}`)
  return success
}

const main = async (): Promise<void> => {
  const watched = (await stagedPaths()).filter(path => path.startsWith(WATCHED_PREFIX))
  const existing = await Promise.all(watched.map(existedAtHead))
  const violations = watched
    .filter((_, index) => existing[index])
    .map(path =>
      `${path} already exists in effort/completed/ at HEAD — closed documents are historical record, not editable`
    )

  if (violations.length > 0) {
    guardFail(
      NAME,
      violations,
      'A closed document changed after it closed. If a bulk edit (rename, reference update) touched it incidentally, unstage that hunk and revert it — a rename pass must exclude effort/completed/. If this is a deliberate correction, say so in the commit message; the guard cannot tell the two apart on its own.'
    )
  }

  guardPass(NAME)
}

await main()
