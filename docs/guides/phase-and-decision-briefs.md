# Phase and Decision Brief Guide

**How to plan dependent work and present owner decisions.** This guide defines a reusable working method. It does not define a product's architecture, contracts, schemas, or source of truth; those remain the responsibility of the project's governing documents.

## Suggested document layout

Use the repository's existing layout when one exists. Otherwise, the following is a simple convention:

```text
docs/
  phases/
    00_index.md
    <phase_id>_<short_slug>.md
  decision_briefs/
    <number>_<short_slug>.md
```

- **Phase index** — `docs/phases/00_index.md`; the entry point for planned and active work.
- **Phase document** — `docs/phases/<phase_id>_<short_slug>.md`; the durable plan for one independently reviewable slice.
- **Decision brief** — `docs/decision_briefs/<number>_<short_slug>.md`; a bounded owner choice linked to a phase.

The paths are examples, not a requirement. What matters is that there is one discoverable index and that phase documents and their briefs link to each other.

## Phase index

Create a phase before starting work that has multiple steps, dependencies, or an independently reviewable outcome. Keep one index that makes sequencing and blockers visible without opening every phase document.

**Recommended columns:**

| ID | Phase | Status | Depends on | Completion evidence | Decision brief |
| --- | --- | --- | --- | --- | --- |
| P01 | Example intake inventory | Planned | — | Inventory reviewed | — |
| P02 | Example execution slice | Waiting for Decision | P01: reviewed inventory | Focused check passes | DB-01 |

Use stable, unique IDs. A useful status set is `Planned`, `In Progress`, `Waiting for Decision`, `Complete`, and `Stopped`. Describe a dependency as the exact output required, rather than merely naming an earlier phase.

Update the index whenever a phase's status, dependency, completion evidence, or linked brief changes.

## Phase document

Each phase document should make its own boundary and success criteria clear. The following is a minimal template:

```markdown
# P01 — Short phase title

## Objective

## Prerequisites

## Scope

## Completion criteria

## Parallel work and exclusions

## Related decision briefs
```

List only work that belongs to the phase. State the exact prerequisite artifacts, the completion evidence, permitted parallel work, and exclusions. Do not treat incomplete research, experimental artifacts, or unqualified inputs as downstream-ready outputs.

## Owner decision briefs

Write a brief only when an owner-level decision blocks implementation and cannot be resolved from existing project guidance, prior decisions, or a quick factual check. Typical examples include an architecture boundary, a contract choice, a scope cut, or a policy direction. Routine implementation details and research findings do not need a brief.

Link a blocking brief from both its phase document and the phase index before starting dependent implementation. Use a short numeric ID such as `DB-01` so the owner can reference it easily.

**Brief template:**

```markdown
# DB-01 — Short decision title

**Status:** Open
**Related phase:** P01

## Decision needed

## Options

| Option | Description | Pros | Cons |
| --- | --- | --- | --- |
| A | ... | ... | ... |
| B | ... | ... | ... |
| C | ... | ... | ... |

## Recommendation + reason

## Follow-up considerations

## Deferred / out of scope

## Resolution
```

List every realistic option. Options must be mutually exclusive and actionable. Label them `A`, `B`, `C`, and so on, so the owner can answer unambiguously. Put the recommendation below the table instead of embedding it in option wording.

## After a decision

Preserve the original option table. In **Resolution**, record the selected option, date, short rationale, and `Resolved` status. Then update the linked phase document and phase index, and apply the decision to the project's designated governing documents and records according to that project's own instructions.

## Verification

For documentation changes, confirm that links resolve, IDs are unique, every linked brief exists, option labels are unambiguous, and phase status is consistent between the index and phase document. Run the repository's supported formatting or diff checks. This guide does not override project-specific record, handoff, or commit rules.
