# API and Persistence Schemas Guide

**How to design API and database schemas without confusing transport, domain, and persistence ownership.** This guide specializes the shared rules in [`data-contracts.md`](data-contracts.md) for public/internal APIs and persistent storage.

API DTOs and database models may represent the same domain concept differently. The goal is not identical shapes. The goal is explicit ownership, intentional projections, stable semantics, and no accidental second source of truth.

## 1. Separate boundary ownership from domain ownership

For every API or persistence field, identify who is allowed to choose its value.

Common ownership classes include:

- client-owned input;
- server-owned state;
- domain-derived value;
- persistence-managed value;
- externally assigned identifier;
- historical snapshot.

Do not expose a field as writable merely because it exists in an internal or database model.

Server-generated IDs, audit timestamps, authoritative workflow state, and other server-owned values should not normally be accepted as client-controlled request fields unless the contract explicitly delegates that authority.

## 2. API schemas are projections, not storage dumps

Expose fields because callers need them, not because the ORM or internal model contains them.

Avoid automatically mirroring persistence models into request and response contracts.

An API projection may legitimately:

- omit internal fields;
- rename a concept for public clarity;
- flatten or group data;
- expose a derived representation;
- hide storage-specific normalization;
- preserve compatibility while internals change.

Every difference should serve the API boundary rather than emerge accidentally from duplicate models.

## 3. Distinguish omitted, null, default, and empty

Do not treat these as equivalent unless the contract explicitly says they are.

For request fields, define whether:

- omission means "leave unchanged";
- `null` means "clear the value";
- a default is applied;
- an empty string/list/object has distinct meaning.

For persisted fields, define whether nullability represents a real domain state or merely an implementation convenience.

Ambiguous null/default semantics become contract drift when API validation, application logic, ORM behavior, and database constraints interpret them differently.

## 4. Give defaults one authoritative meaning

A default duplicated independently in API code, application code, ORM definitions, and database DDL is a drift risk.

Identify which layer owns the semantic default.

Other layers may repeat the value for enforcement or compatibility, but they must not independently redefine its meaning.

When duplicated enforcement is intentional, verify equivalence in tests or generated schema checks.

## 5. Define ID and timestamp ownership

For every identifier, state who creates it and when.

Avoid several layers independently generating the same conceptual ID.

For timestamps, define what event the timestamp represents. Distinguish, as applicable:

- request receipt time;
- domain event time;
- application processing time;
- database insertion time;
- last update time;
- externally supplied occurrence time.

Do not use one ambiguous `timestamp` field to represent several clocks.

## 6. Keep enums and constrained values aligned

The same semantic enum may appear in:

- API schema;
- application/domain code;
- database constraints;
- generated clients;
- configuration;
- LLM schemas.

Identify the canonical vocabulary and treat other appearances as projections or enforcement copies.

Search for equivalent but diverging literals such as:

```text
approved / accepted / accept / yes
```

Do not add translation layers unless the boundary actually requires a different vocabulary. When translation is required, define and test the mapping explicitly.

## 7. Use the database for persistence invariants

Persisted invariants that the database can reliably enforce should not depend only on application convention.

Depending on the system, this includes:

- primary keys;
- uniqueness;
- foreign-key relationships;
- nullability;
- check constraints;
- transactional consistency.

Application validation is still useful for better errors and earlier rejection, but it should not be the only protection for invariants that must hold in stored state.

Do not delegate uniqueness, referential integrity, or mechanical persistence constraints to an LLM.

## 8. Treat derived and denormalized storage as explicit duplication

A persisted field that can be deterministically derived from canonical data is a second representation and needs a reason.

Legitimate reasons include:

- query or indexing performance;
- immutable historical snapshots;
- compatibility with an external contract;
- expensive recomputation;
- analytical workloads.

When storing derived or denormalized data, define:

- canonical source fields;
- writer/update mechanism;
- consistency expectation;
- repair or rebuild strategy;
- whether historical values intentionally survive later source changes.

Do not store a derived value merely because it is convenient during implementation.

## 9. Keep persistence models out of public contracts

Database table structure is an implementation detail unless explicitly defined as a product contract.

Avoid leaking:

- internal surrogate keys;
- join-table layout;
- ORM relationship artifacts;
- storage-specific status flags;
- provider-specific columns;
- migration-era compatibility fields.

Likewise, do not distort normalized persistence design solely to mirror a public API response shape when an application projection can perform the mapping cleanly.

## 10. Plan compatibility separately from internal cleanup

A schema that is redundant internally may still be part of a public or persistent compatibility obligation.

Before deleting or renaming a field, determine:

- whether external clients consume it;
- whether stored historical rows depend on it;
- whether generated clients or integrations expose it;
- whether migrations must backfill or transform existing data;
- whether old and new versions must coexist temporarily.

Do not use "duplicate" as sufficient justification for an incompatible API or migration change.

Prefer an explicit deprecation/migration path when compatibility matters.

## 11. Migration rules

When changing persistent schemas:

- define the old and new invariant;
- account for existing rows, not only new writes;
- make null/default changes explicit;
- verify backfills and transformations;
- consider rollback or forward-fix behavior where the project requires it;
- avoid relying on application deployment order unless that order is part of the release contract;
- update schema/introspection artifacts that consumers use.

A migration is not complete because the DDL executes. Verify that existing data still satisfies the intended contract.

## 12. API schema audit checklist

For a meaningful API contract change:

1. Identify the client-visible semantic concept.
2. Mark each field as client-owned, server-owned, derived, or read-only projection.
3. Confirm request fields do not accidentally delegate server authority.
4. Check omitted/null/default/empty semantics.
5. Search for duplicate DTOs, serializers, OpenAPI definitions, validators, examples, and generated clients.
6. Confirm enum and constraint mappings.
7. Identify compatibility obligations before removal or rename.
8. Verify both accepted and rejected request cases and affected response shapes.

## 13. Persistence schema audit checklist

For a meaningful database schema change:

1. Identify the authoritative writer for every affected field.
2. Check nullability, defaults, IDs, timestamps, uniqueness, and relationships.
3. Identify derived or denormalized values and their consistency mechanism.
4. Search ORM models, migrations, raw SQL, fixtures, test factories, and introspection outputs for duplicate definitions.
5. Compare application and database constraints for drift.
6. Define migration behavior for existing rows.
7. Verify persisted invariants after migration, not only schema creation.

## 14. Red flags

Investigate when:

- request schemas allow clients to set server-owned state without a clear reason;
- API models mirror large ORM models field-for-field;
- the same default is separately hard-coded in several layers;
- API and DB enums contain near-equivalent but different literals;
- one fact is writable through several columns or fields;
- an ambiguous timestamp has several possible meanings;
- a derived field is stored without a consistency mechanism;
- database invariants exist only in application convention;
- removing an "internal duplicate" unexpectedly breaks external consumers;
- a migration validates new rows but ignores incompatible historical data.

A red flag requires explanation, not automatic normalization. API and persistence boundaries often differ legitimately.

---

**These guidelines are working if:** clients control only what they are meant to control, persistence invariants have clear enforcement, defaults and enums do not drift across layers, migrations preserve intended semantics, and API/storage shapes can evolve independently without creating competing sources of truth.