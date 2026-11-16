# EFFORT.md: Milestones, Reconciliation, Deferrals, Enablers — Brief

**Closed 2026-10-20.** `EFFORT.md` 1.2 (`94a8da2`) codifies the four decisions and the draft rule
(Open 4). Recorded 2026-10-19 from a CA + AI Architect session. It rides along with the
enablers of roadmap §5 Mechanical Productions: it makes nothing there copy-ready, but `EFFORT.md`
should describe the method as it is now practiced, since the repository is shown to engineering
peers as an example of governed AI-assisted development. Absorbs the backlog entry "`EFFORT.md`
does not codify roadmap reconciliation, milestones, or deferrals".

`EFFORT.md` is a governance file: its edits need the CA's explicit authorization and are committed
with the governance-gate bypass.

## What triggered it

`EFFORT.md` §3 says the roadmap "draws its content from the backlog … and from user stories" and
§7 defines milestones, but neither says how the roadmap is kept in step with them. On 2026-10-08
the CA went to ask for a backlog/roadmap reconciliation and found no protocol to follow. The same
day's ad hoc reconciliation found §1's Notes Editor dependencies satisfied but still listed, and a
§1 condition ("build it before §5, or move it") due before §5 starts. The CA also observed that
backlog additions slow while briefs are produced and closed in-effort: findings land in
amendments, out-of-scope lines, and "not taken" notes, and some were recorded only in briefs that
then closed into frozen `effort/completed/`.

On 2026-10-19 the roadmap gained its first enablers (§5), named after large-scale agile practice,
where work that delivers no feature but makes features possible is scheduled ahead of them.

## Decisions (CA)

From 2026-10-08:

1. **Deferrals at closure.** Before a brief moves to `effort/completed/`, every deferred or
   not-taken item either becomes a backlog entry, joins a pending brief, or is explicitly dropped.
2. **Milestones.** Each numbered roadmap section is a milestone (§7).
3. **Reconciliation happens when a milestone closes.**

From 2026-10-19:

4. **Enablers.** A milestone lists its enablers ahead of its features: work the features depend
   on, making them buildable or copy-ready, whatever else it delivers. Enablers are briefs or backlog
   entries like any other work, and the milestone closes only when both lists are done. First
   used in roadmap §5.

## Open, settled 2026-10-20

1. **What a reconciliation checks.** Dropped: practiced throughout, never needed describing.
2. **How a backlog entry records its roadmap placement.** Dropped: never needed.
3. **What a milestone verification pass consists of.** Dropped: §7 requires one; its form is
   judgment.
4. **The draft rule.** Resolved: §4 "Edit a draft; amend a dispatched brief."
5. **Withdrawal as superseded.** Dropped: §4 already allows it.

## Production

CA and AI Architect, 2026-10-20: `EFFORT.md` 1.2, §4 The Brief and §7 Milestones, with the
Amendment Record row; the roadmap preamble names Enablers, Features, and Rides along (`ba361a7`).
Ride-along work, practiced for over a month, joined §7 with the enablers.

## Design history

- **Enablers deliver features too.** Decision 4 first defined an enabler as work that delivers no
  feature itself. The CA corrected it: an enabler is defined by what the features depend on, not
  by what it withholds.

_End of Brief_
