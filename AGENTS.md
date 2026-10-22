# AGENTS.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Scope:** This file is intended for Codex-based contributors working in this repository.

**Tradeoff:** These guidelines bias toward caution over speed, but not ceremony over evidence. For trivial tasks, use judgment.

**Proportionality:** Match investigation, documentation, and verification effort to the risk and scope of the requested change. Use the cheapest check that can reasonably falsify the change, and escalate only when the affected surface or evidence warrants it. Mechanical or obviously local changes do not require repo-wide searches, unrelated document reads, broad test suites, mutation testing, or project-state records unless they materially affect those surfaces or the user explicitly requests deeper verification. Specific "always" rules below apply only when their triggering condition is met.

## Documentation Language

- Guides and instruction documents are written in English.
- Project records created or materially updated by a worker must be written in
  Korean, including phase plans, decision briefs, HANDOFF, work logs,
  verification records, changelog entries, and research records.
- Preserve literal external proper names, quotations, URLs, commands, code
  identifiers, and structured-contract values as needed; write their
  surrounding explanation in the document's required language.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.
- If you detect a contradiction within a spec doc, or across spec docs, that materially affects the requested task, surface the contradiction to the user and ask which side is canonical. Never silently pick a side. Unrelated contradictions may be noted without blocking the current task.
- At the start of a project (or when entering an unfamiliar repo), check whether a spec-precedence tree for conflicting sources exists. If it's absent, recommend defining one before deeper work — without it, future spec conflicts collapse into ad-hoc judgment calls.

### Workflow reference

For phase planning, index maintenance, and owner decision briefs, follow [`docs/guides/phase-and-decision-briefs.md`](docs/guides/phase-and-decision-briefs.md).

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Dependency direction

- Keep domain rules and structured contracts independent of transports, frameworks, storage, and provider SDKs.
- Let adapters and runtime wiring depend inward on those contracts; do not add reverse imports from the domain for convenience.
- Put unavoidable external dependencies at the boundary and reuse an existing boundary before introducing another one.

### Data contracts and schemas

- Before adding or materially changing a structured contract, identify the canonical owner and source of truth for the affected values and audit the affected data flow for duplicated declarations, redundant or derivable fields, conflicting representations, and unnecessary boundary crossings.
- For shared ownership, field-lineage, duplication, projection, and end-to-end contract-audit rules, follow [`docs/guides/data-contracts.md`](docs/guides/data-contracts.md).
- For LLM input/output schemas, tool/function schemas, or multi-call LLM pipelines, follow [`docs/guides/llm-contracts.md`](docs/guides/llm-contracts.md). Do not route deterministic or already-known data through an LLM merely to reproduce, preserve, format, or transport it.
- For LLM call placement, prompt ownership/composition, orchestration flow, and `Prompt/README.md` visualization, follow [`docs/guides/llm-orchestration.md`](docs/guides/llm-orchestration.md). Every LLM call must be traceable to a named prompt artifact under the owning module's `Prompt/` directory, and multi-prompt composition must be explicit in orchestration code.
- For API request/response schemas, DTOs, persistence models, database constraints, defaults, and migrations, follow [`docs/guides/api-and-persistence-schemas.md`](docs/guides/api-and-persistence-schemas.md).
- Read the guide or guides that match the affected boundary directly; do not load unrelated specialized guides by default.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

### Pattern sweep before declaring fix complete

For a behavioral defect, spend up to ~30 seconds looking for the same root-cause pattern in adjacent functions / files before marking the fix done. This is bounded discovery, not permission to recursively expand the task.

- Search for the symptom signature (function call, magic value, naive UTC, etc.) only as broadly as is useful within the time budget.
- Inspect the most relevant matches. If the search reveals a larger family of issues, report or track the pattern rather than auditing every occurrence unless the user asked for that broader scope.
- Fix another occurrence inline only when it is clearly the same defect and scope-trivial; otherwise leave it untouched and report it with `file:line` when useful.
- Use `git blame` only when historical intent would materially change the decision to fix, leave, or escalate a match. Do not run it mechanically for every search result.

### Two-directional regression guards

A regression test should fail in *both* directions, not just one.

- **Under-strict guard**: if the pre-fix bug is reintroduced, the test must re-fail.
- **Over-strict guard**: if an over-correction breaks a normal case (e.g. someone applies `+1` where the original cancelation was intentional), the test must also fail.
- State both directions in the test docstring or assertion names so future readers (and future-you) can see what's being locked.

### Minimum Verification by Artifact Type

- **Mechanical documentation-only changes** (typos, formatting, wording with no semantic effect): inspect the changed hunk and immediate context, then review the diff. Do not widen into unrelated links, documents, or broad test suites unless the edit affects them.
- **Semantic documentation changes**: verify affected links, references, stated versions, and precedence claims where applicable; run repository-supported diff or formatting checks.
- **Code changes**: when behavior changes, add or update regression tests first; run focused tests for the changed behavior, then the relevant broader suite once when the affected surface warrants it.
- **Public interfaces or structured contracts**: when changing CLI output, APIs, configuration formats, schemas, generated metadata, or similar contracts, verify the behavioral tests and any affected examples, validation artifacts, introspection output, or contract files that exist in the project.
- If a named verification surface does not exist in the current project, state that clearly and use the closest available verification rather than adding unrequested infrastructure.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

## 5. Work Logs & Handoff

**Update project records when the task materially changes implementation state, requirements, decisions, active work, or information needed by the next worker.** Do not create record churn for purely mechanical edits such as typo fixes, formatting-only changes, or equivalent no-behavior changes.

- How to write the work log, user decisions, HANDOFF.md, and CHANGELOG.md when an update is warranted: see [`docs/guides/records-and-handoff.md`](docs/guides/records-and-handoff.md).
- Independent verification of another worker's slice: see [`docs/guides/verification.md`](docs/guides/verification.md).

## 6. Commits / Git Workflow

**Commit completed work in logical, reviewable increments as the task naturally requires. Use checkpoint commits when mutation testing or other destructive verification is planned. Never push. Don't branch unless asked.**

- **Commit normal work when a coherent unit is complete and verified. Use as many commits as the task naturally needs.** One commit is appropriate for a single cohesive change; multi-part work may need several. Do not force unrelated or independently reviewable work into one catch-all commit, and do not create meaningless micro-commits. Unless the user explicitly asks otherwise, commit your own completed changes without waiting for a separate `commit` instruction.

Mutation testing is not a default requirement for every implementation change. It is required when explicitly performing independent verification, or when the task or governing spec specifically requires proving that a regression guard bites. When mutation testing is required, temporarily reverting a fix (or mutating code) can confirm a test re-fails; the checkpoint rules below exist to make that destructive verification safe. A forgotten restore silently destroys or reverts the fix, and uncommitted working-tree state is not recoverable.

- **When destructive verification is planned, commit a checkpoint directly to the current branch (`main` by default)** before the first mutation. For routine edits that do not need mutation testing, do not create checkpoint commits merely to satisfy ceremony.
- **★ Commit your work *before* you mutate. Never the other way round.** The order is: **commit the change → mutate → restore → verify the tree is clean.** Only the mutation itself stays uncommitted; everything it sits on top of must already be in a commit. `git checkout -- <path>` restores to HEAD, so on a dirty tree it does not undo the mutation — it **deletes whatever was not committed yet**.
  - **Pre-flight gate: `git status --short` must be empty before the first mutation.** If it is not, commit first. This is a command to run, not a habit to remember — it has been skipped nine times in this repo so far (2026-07-26 through 2026-08-04), eight of them by implementers who had just written the very code they lost, and in three of those the same worker repeated it inside one day.
  - **When you must not commit** — a verifier auditing someone else's uncommitted tree — do not use `git checkout` at all: take a `cp` backup, revert with a reverse edit, and compare bytes afterwards. Full procedure and both branches: [`docs/guides/verification.md`](docs/guides/verification.md) §"Mutation testing".
- **Never `push`.** The owner pushes themselves.
- **Do not create a branch** unless explicitly asked. The default is solo work directly on `main`.
