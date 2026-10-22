# Records & Handoff — writing guide

**How to record work in this repo.** Applies to every contributor — Claude Code (via `CLAUDE.md`) and Codex (via `AGENTS.md`). The standing rule is inline in those files (§5): update project records when a task materially changes implementation state, requirements, decisions, active work, or information needed by the next worker. Purely mechanical edits such as typo fixes, formatting-only changes, or equivalent no-behavior changes do not require record churn. This doc is the reference for *how* to write each record when an update is warranted. For independent verification of another worker's slice, see `verification.md` in this same folder.

## Work Log
- Path: `docs/daily_logs/YYYY-MM-DD/work_log.md`
- Follow the style of existing logs in `docs/daily_logs/`
- Update the work log when the task creates durable project context that a later worker would need: implementation changes, decisions, discovered issues, verification results, or changed next steps. Do not add entries solely to record a mechanical edit with no behavioral or project-state effect.

**Required sections when a work-log update is warranted:**
- Goals — specific objectives for the day
- Completed work — for each task: description, files changed, key changes, effect
- Issues found — problem / cause / resolution / outcome
- Decisions — what was decided / why / tradeoffs
- Next steps

**Writing principles:**
- Be specific: not "fixed it" but "what was changed and how"
- Include reasoning: why this approach was chosen
- State the outcome: what effect the change had
- Write immediately after completing work, while details are fresh
- **Mutations go in as a table, not a tally.** `verification.md` §"Mutation
  testing" requires recording *which mutation hit which cell*; the work log is
  where that pairing lands. "5종 전부 재실패" is not reproducible — an
  independent verifier re-deriving the mutations will pick slightly different
  forms and get different cell counts, and then cannot tell whether the gap is
  the mutation's scope or a weak guard (measured: Slice 8.4, 2026-08-04, three
  of five counts diverged for exactly this reason). One row per mutation:
  **the diff applied · the file:line · the cells that failed, by name**.

## User Decisions and Rationale
- When a user's preference, decision, constraint, or rationale affects requirements, scope, architecture, design, behavior, or implementation direction, summarize that decision in `docs/daily_logs/YYYY-MM-DD/work_log.md`.
- Preserve the user's intent, the selected direction, and relevant tradeoffs so later workers can understand why the project took that direction. Do not transcribe the conversation.
- When a user decision directly drives a major design or feature change recorded in `CHANGELOG.md`, include a concise note about that decision and rationale in the changelog entry.
- Do not record conversational decision history in `HANDOFF.md`; keep it focused on current actionable development state.
- If a later request conflicts with a recorded user decision, rationale, or established design direction, identify the conflict and ask the user which direction is now canonical before implementing the conflicting change.

## HANDOFF.md

**HANDOFF.md is a snapshot, not a log. Editing it is mostly *deleting*.**

Purpose: what the next worker needs in order to start working *right now*. If a
line would not change what they do today, it does not belong here. If the task
does not change that current actionable state, leave `HANDOFF.md` untouched.

**There is no length cap — length is a symptom, not the rule.** A long HANDOFF
can be entirely correct, and some entries need detail to be usable. A hard cap
would either block content that earns its place or, worse, invite someone to
meet the number by collapsing paragraphs into one unreadable line. What actually
goes wrong is *duplication of finished work*, and that is what to check for.

**The check is the diff, not the line count.** Before you commit a HANDOFF edit,
look at what you are about to add *and* what you are removing:

```bash
git diff --stat HANDOFF.md      # insertions vs deletions
git diff HANDOFF.md             # read what you added
```

A slice that finished something should not produce a HANDOFF diff of pure
insertions. Finishing work makes earlier lines *stop being true* — if you added
lines and deleted none, name the lines your slice invalidated, or state why
nothing was invalidated. Line count is a lagging indicator; the diff is the
thing you can actually act on before the damage lands.

**Self-audit trigger.** Independently of any single diff, when the file passes
**~200 lines** — and roughly every 100 lines after that — stop before adding
more and audit the whole file:

```bash
wc -l HANDOFF.md
grep -nE 'passed|skipped' HANDOFF.md         # test counts nobody re-measured
grep -nE '`[0-9a-f]{7}`' HANDOFF.md          # verification commit hashes
grep -nE 'PID |[0-9a-f]{8}-[0-9a-f]{4}-' HANDOFF.md   # dead PIDs / job UUIDs
grep -nE '[0-9]{2}:[0-9]{2} KST' HANDOFF.md  # hour-by-hour execution narrative
```

Every hit from those four greps is a deletion candidate by default. Test counts,
verification hashes, PIDs, job UUIDs, and timestamped execution narrative belong
to `work_log.md` and `docs/verifications/`; keeping one here requires a reason
you can state out loud.

Then walk the file section by section and ask:

1. Would this change what the next worker does **today**? If not, delete it.
2. Is this a completion narrative? It is already in `work_log.md`, the SoT
   version log, and `CHANGELOG.md` — delete it here.
3. Is it still true? Dated observations expire; re-check or drop them.
4. Is a long section long because the content genuinely needs it? Then keep it.
   Passing the trigger is not a failure — failing to look is.

Then record the result in the header line of `HANDOFF.md`:

```markdown
> 마지막 자가 검수: YYYY-MM-DD · N줄
```

That line is how the next worker (and you, next time) can tell whether the
trigger is actually being honored instead of quietly scrolling past it.

**The rule that keeps getting broken — read this one twice:**

- **Never record that a slice finished — anywhere in this file, in any shape.**
  Not as a new paragraph, and **not as a sentence appended to the end of an
  existing bullet.** The second form is the one that actually happens: the rule
  used to say "never append a '…완료' paragraph", so workers stopped writing
  paragraphs and started extending bullets instead. The letter of the rule was
  kept and the file grew exactly the same way.
- Finishing a slice is not a status update. Status is what the system *is now*,
  not what you did. "구현됐다", "통과했다", "합격이며 focused N passed" — all of
  these describe an event, and events go to `work_log.md`.
- When you finish a slice that materially changes current project state, the HANDOFF edit is: **delete** what stopped being
  true, **rewrite** the affected section, and put the narrative in `work_log.md`.
  Decide what to delete *before* you write the new text.
- **Never let a new fact sit next to the old one it replaces.** If the section
  you would have to rewrite is long or in another part of the file, rewrite it
  anyway. Stacking the correction somewhere else — a new bullet, a "Next tasks"
  entry — is how the front of the file ends up lying to the next worker.
- Completion narratives already live in three places — `work_log.md`, the SoT
  version log, and `CHANGELOG.md`. A fourth copy here is pure duplication, and it
  is what buries the parts that actually matter.
- Measured failure this rule exists for (2026-07-23): the file had reached **366
  lines, 81 completion markers, and a 4811-character single line**, because
  slice after slice appended its own summary and nobody deleted. Every one of
  those entries was already in the SoT log and CHANGELOG.
- Measured failure of the *narrower* wording (2026-08-25): the file had reached
  **790 lines with zero "완료" paragraphs**, because the growth had moved into
  bullet-tail appends — three bullets alone held 111 lines of accreted narrative,
  and 13 stale test counts from different days sat side by side. Worse than the
  length: the submission-flow section still described the pre-G2-1 behavior while
  the corrected fact had been stacked into "Next tasks" instead of replacing it.

**Never record machine-local observations as project facts.** Ports, container
IPs, absolute host paths, and "the server is up on X" are true of *your* machine
at *this* moment; this project moves between dev machines. State what the repo
guarantees (`docker-compose.yml`, `.env.example`) — or, if you must record an
observation, mark it explicitly: "on this machine, as of <date>".
Measured failure (2026-07-23): HANDOFF recorded Chroma as running on 8001. 8001
was a *different project's* container; following that note would have pointed a
test that creates and deletes collections at another project's vector store.

Belongs here:
- Current system state, active drafts, and anything blocking right now
- Traps and operational gotchas the next person would otherwise walk into
- Open debts and pending owner decisions, with `file:line`
- "Next Tasks" — short, prioritized, immediately actionable
- Project structure map; MCP interface table when tools/resources change

Does not belong here:
- Completed work, past milestones, fixed bugs, superseded hypotheses
- Conversational decision history (that is `work_log.md`)
- Verification narratives (that is `docs/verifications/`)
- Numbers nobody re-measured today

If a newer note supersedes an older one, rewrite the section — never stack both.

## CHANGELOG.md
- Update on major design or feature changes (not every small edit)
- Top table links to daily_logs for detail
