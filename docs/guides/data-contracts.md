# Data Contracts Guide

**How to design and audit structured data contracts across system boundaries.** This guide defines the shared rules for API contracts, LLM schemas, persistence schemas, events, configuration, DTOs, and other structured interfaces. Boundary-specific rules live in [`llm-contracts.md`](llm-contracts.md) and [`api-and-persistence-schemas.md`](api-and-persistence-schemas.md).

The goal is not merely to make each schema valid in isolation. The goal is to keep ownership explicit, data flow minimal, transformations intentional, and duplicated contract definitions under control.

## 1. Start with ownership

Before adding or changing a field, identify:

- **Origin** — where the value first appears.
- **Canonical owner** — which component has authority to determine its value.
- **Consumers** — which downstream components actually need it.
- **Mutation authority** — which component may legitimately change it.
- **Persistence need** — whether it must be stored, derived, or only carried temporarily.

Do not resolve duplicated contracts by arbitrarily choosing one copy to keep. Establish the canonical owner first, then make other representations explicit projections where possible.

A component should not be asked to reproduce a value it does not own merely so that the value can continue through the pipeline.

## 2. Trace field lineage end to end

Review important fields across the complete data flow rather than one schema file at a time.

```text
Origin
  → domain/internal model
  → API or event boundary
  → LLM boundary, if any
  → application result
  → persistence
```

Record only the stages that actually exist.

For every transition, ask:

- Why must this field cross this boundary?
- Is its meaning unchanged?
- Is it renamed, normalized, cast, or derived?
- Is ownership changing intentionally?
- Can the consumer obtain it directly from the canonical source?
- Can the value be reconstructed deterministically from authoritative state?

A transformation without a clear semantic or boundary reason is a candidate for removal.

## 3. Distinguish canonical data, projections, and duplication

When the same concept appears in several schemas, classify each declaration as one of:

1. **Canonical** — the authoritative definition.
2. **Projection** — an intentionally smaller or transformed boundary representation.
3. **Generated** — mechanically derived from another contract.
4. **Independent by necessity** — separately maintained because the boundary genuinely differs.
5. **Accidental duplication** — another manually maintained definition of the same contract.

Accidental duplication should normally be consolidated or generated from a canonical source.

If separate declarations must remain, document why divergence is legitimate and how consistency is checked.

Do not confuse reuse with coupling. API, LLM, and persistence layers may need different projections of the same semantic concept. The goal is one authoritative meaning, not one giant model shared by every framework and transport.

## 4. Search for redundant representations

A field is suspicious when the same fact can already be recovered without loss from authoritative state.

Common cases include:

- a value copied through several DTOs without transformation;
- a field derivable from other canonical fields;
- multiple writable fields representing the same state;
- the same enum or default maintained manually in several layers;
- a field crossing a boundary even though the consumer already has access to its owner.

For example, avoid independently writable representations such as:

```text
status = "approved"
is_approved = true
decision = "accept"
```

Prefer one canonical representation and deterministic projections.

Derived or denormalized values are allowed when they serve an explicit need such as query performance, historical snapshotting, compatibility, or expensive recomputation. When they exist, define how they stay consistent with their source.

## 5. Keep logical objects coherent

Investigate cases where one logical object is fragmented across unrelated contracts or stages.

Typical warning signs:

- several DTOs contain overlapping subsets of the same concept;
- downstream code reconstructs an object from outputs that were unnecessarily split upstream;
- the same concept uses different names or enum vocabularies across boundaries;
- multiple stages repeatedly serialize and deserialize the same data with no semantic change.

Do not merge contracts merely to reduce file count. Separate contracts are appropriate when they have materially different ownership, lifecycle, consumers, security boundaries, retry behavior, or compatibility requirements.

The objective is **coherent responsibility**, not the smallest possible number of schemas.

## 6. Audit contract declarations repository-wide

When changing a meaningful structured contract, search for alternate declarations and consumers of the same concept.

Common surfaces include:

- API request and response schemas;
- OpenAPI or JSON Schema;
- typed DTOs and internal models;
- validators and serializers;
- ORM models and SQL migrations;
- LLM tool/function or structured-output schemas;
- prompt-embedded JSON examples;
- event payloads;
- configuration schemas;
- fixtures and test factories;
- generated metadata, clients, or introspection output.

Search both by identifier and by semantic meaning. Different names can still represent the same fact, and identical names can have different ownership.

## 7. Check contract drift

For every surviving representation of the same concept, compare:

- field names and aliases;
- types;
- required/optional status;
- null semantics;
- defaults;
- enum literals;
- constraints;
- ownership and writer authority;
- documented meaning.

A green parser or test suite does not prove that duplicated contracts still agree.

When several independently maintained declarations represent one semantic contract, either derive them from a canonical source or verify their equivalence explicitly.

## 8. Prefer deleting duplicate responsibility over synchronizing it

When two components unnecessarily own the same fact, the preferred repair is usually to remove one component's ownership rather than add synchronization logic.

Bad:

```text
Component A owns status
Component B also produces status
Validation checks that both values match
```

Better:

```text
Component A owns status
Component B produces only the information it actually owns
Application code combines the results
```

Synchronization is justified when multiple representations genuinely serve different boundaries. It should not preserve accidental co-ownership.

## 9. Respect dependency direction

Canonical domain rules and semantic contracts should not depend on HTTP frameworks, ORM implementations, LLM provider SDKs, serializers, or storage drivers.

Boundary adapters may depend inward on domain contracts. Provider-specific or framework-specific constraints belong at their respective boundaries.

If an external provider requires a special schema representation, adapt the canonical contract at that boundary rather than making the domain contract provider-shaped.

## 10. Contract audit procedure

For a non-trivial schema change or suspected duplication:

1. **Name the affected logical concept.** Start from meaning, not a file list.
2. **Identify origin and canonical owner.** Resolve ambiguous ownership before redesigning fields.
3. **Search all declarations and consumers.** Include tests, fixtures, prompts, generated surfaces, and persistence.
4. **Trace field lineage.** Record why each important boundary crossing exists.
5. **Classify representations.** Mark canonical, projection, generated, intentionally independent, derived, or accidental duplicate.
6. **Find redundant responsibility.** Look for derivable values, duplicate state, unnecessary transformations, and avoidable boundary crossings.
7. **Compare surviving contracts for drift.** Check names, types, nullability, defaults, enums, constraints, and semantics.
8. **Design the smallest correct ownership model.** Remove unnecessary responsibility without collapsing legitimate boundary separation.
9. **Verify every affected surface.** Follow the repository's artifact-specific verification rules.

Use a temporary field inventory when the flow is complex:

| Field / concept | Origin | Canonical owner | Boundaries crossed | Derived? | Other declarations | Reason |
| --- | --- | --- | --- | --- | --- | --- |

The inventory is a reasoning tool, not mandatory permanent documentation for every small change.

## 11. Red flags

Investigate when:

- nobody can identify the authoritative representation;
- one schema change requires editing many structurally equivalent declarations;
- two writable fields encode the same state;
- a field repeatedly changes names without a domain reason;
- defaults or enums are independently maintained in several layers;
- a value crosses a boundary only to be returned unchanged;
- multiple transformations occur without changing meaning;
- tests validate one declaration while equivalent copies remain unchecked.

A red flag is not automatically a defect. It means the duplication or boundary needs an explicit reason.

## 12. Verification expectations

A structured-contract change is complete only when, as applicable:

- canonical ownership remains unambiguous;
- removed fields are not required by downstream consumers;
- surviving projections still match canonical semantics;
- enum, null, default, and constraint behavior remains consistent;
- generated or introspected schema surfaces reflect the change;
- public compatibility is intentionally preserved or intentionally changed;
- persistence migrations preserve required data;
- tests exercise both accepted and rejected boundary cases.

For LLM-specific ownership and call-shape rules, follow [`llm-contracts.md`](llm-contracts.md). For API and database-specific rules, follow [`api-and-persistence-schemas.md`](api-and-persistence-schemas.md).

---

**These guidelines are working if:** every important field has an identifiable owner, schema changes create fewer duplicated declarations, boundary transformations are easy to explain, and the same fact is not accidentally owned by several components.