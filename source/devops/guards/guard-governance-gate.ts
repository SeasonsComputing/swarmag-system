/*
╔══════════════════════════════════════════════════════════════════════════════╗
║ Governance-gate guard                                                        ║
║ Fails a change that touches a meta-tier governance document.                 ║
╚══════════════════════════════════════════════════════════════════════════════╝

PURPOSE
───────────────────────────────────────────────────────────────────────────────
CONSTITUTION.md, AGENTS.md, CONVENTIONS.md, and EFFORT.md each carry a mandatory
admonishment: no AI agent edits them without prior CA authorization. A commit
cannot mechanically distinguish an authorized edit from an unauthorized one, so
this guard fails on any staged change to a watched path, unconditionally. A
genuine, CA-authorized edit is committed with the guard deliberately bypassed
(`--no-verify`) — a human-only act, and the same pattern
guard-completed-immutable.ts already established for a different class of
change nothing should silently pass through.

Found necessary 2026-09-15: an AI Coding Engine, asked to fix one confrontational
sentence in EFFORT.md, generalized that into a tone rewrite across the whole
document and quietly dropped several substantive distinctions along with the
tone — caught only because one line was checked against the source by hand. A
gate at commit time turns that class of silent, self-authorized edit into a
forced, visible decision instead.

PUBLIC
───────────────────────────────────────────────────────────────────────────────
(none — run as a script, exits 1 on violation)
*/

import { guardFail, guardPass } from '@devops/guards/guard-utils.ts'

const NAME = 'Governance-gate'
const WATCHED_PATHS = ['CONSTITUTION.md', 'AGENTS.md', 'CONVENTIONS.md', 'EFFORT.md']

const git = async (...args: string[]): Promise<{ success: boolean; stdout: string }> => {
  const { success, stdout } = await new Deno.Command('git', { args }).output()
  return { success, stdout: new TextDecoder().decode(stdout) }
}

/** Staged paths that differ from HEAD — added, changed, or deleted. */
const stagedPaths = async (): Promise<string[]> => {
  const { stdout } = await git('diff', '--cached', '--name-only')
  return stdout.split('\n').map(line => line.trim()).filter(Boolean)
}

const main = async (): Promise<void> => {
  const violations = (await stagedPaths())
    .filter(path => WATCHED_PATHS.includes(path))
    .map(path => `${path} is staged for change — a meta-tier governance document`)

  if (violations.length > 0) {
    guardFail(
      NAME,
      violations,
      'Every governance document at the repo root carries a mandatory admonishment: no AI agent edits it without prior CA authorization. This guard cannot verify authorization, only visibility — if this change is CA-authorized, commit with --no-verify and note the authorization in the commit message. If it arrived incidentally (a bulk rename or reference-update pass), unstage it and exclude these paths from that pass.'
    )
  }

  guardPass(NAME)
}

await main()
