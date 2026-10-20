# EFFORT.md: Milestones, Reconciliation, Deferrals, Enablers — Brief

**Active, draft.** Recorded 2026-10-19 from a CA + AI Architect session. It rides along with the
enablers of roadmap §5 Mechanical Productions: it makes nothing there copy-ready, but `EFFORT.md`
should describe the method as it is now practiced, since the repository is shown to engineering
peers as an example of governed AI-assisted development. Absorbs the backlog entry "`EFFORT.md`
does not codify roadmap reconciliation, milestones, or deferrals". Awaits CA review and the
production gate.

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

4. **Enablers.** A milestone lists its enablers ahead of its features: work that delivers no
   feature itself but makes the features buildable or copy-ready. Enablers are briefs or backlog
   entries like any other work, and the milestone closes only when both lists are done. First
   used in roadmap §5.

## Open

1. **What a reconciliation checks,** in both directions: backlog entries the roadmap should carry,
   and roadmap items whose dependencies have landed.
2. **How a backlog entry records that the roadmap has placed it,** as §4 does for a brief.
3. **What a milestone verification pass consists of** beyond its briefs' own verification. Roadmap
   §4 Notes Editor closed on the CA's validation in the app.
4. **Whether the rule that drafts are edited in place until hand-off, then amended and marked,
   belongs in §4.**
5. **Whether a brief may be withdrawn as superseded** when the CA makes the change directly, as
   the authority chain brief was on 2026-10-19; §4 already allows withdrawal, but not this path
   by name.

## Production scope

Operating mode: **Foundation** (governance document). `EFFORT.md` §3, §4, and §7, with a version
bump and an Amendment Record row; the roadmap's preamble ("Format per entry") gains the enablers
and features layout. The CA authorizes the exact text before it is applied.

**Out of scope:** CONSTITUTION, AGENTS, CONVENTIONS.

_End of Brief_
