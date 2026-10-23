# LLM Contracts Guide

**How to keep LLM structured inputs and outputs limited to genuine model work.** This guide specializes the ownership and lineage rules in [`data-contracts.md`](data-contracts.md) for prompts, tool/function schemas, structured outputs, and multi-call LLM pipelines.

The central rule is simple: **do not use an LLM as a data transport layer.**

## 1. Classify every value before designing the schema

For an LLM boundary, classify each value as one of three kinds.

### Deterministic data

Values that application code, an existing source of truth, or a deterministic calculation can provide exactly.

Examples:

- IDs and keys;
- timestamps;
- stored database values;
- request metadata;
- existing enum states;
- values copied from an earlier stage;
- counts, hashes, ordering, formatting, and other mechanical transformations.

Deterministic values should normally be preserved, generated, validated, or merged by code rather than emitted by the model.

### Inferential data

Values for which the model is performing actual semantic work.

Examples:

- classification;
- extraction from unstructured text;
- semantic matching;
- summarization;
- judgment;
- natural-language generation.

These are the primary candidates for LLM output fields.

### Context-only data

Values the model needs in order to infer something but does not need to return.

Examples:

- source identifiers used later to associate a result;
- record metadata;
- prior deterministic state;
- reference text;
- earlier outputs needed only as reasoning context.

Context-only values may belong in the input while remaining absent from the output.

## 2. Do not round-trip known data through the model

If application code already knows a value before the call, do not require the model to reproduce it merely so downstream code can recover it.

Avoid:

```text
server.document_id
  → LLM input document_id
  → LLM output document_id
  → server
```

Prefer:

```text
server.document_id ───────────────┐
                                 ├→ merged application result
source text → LLM → inference ───┘
```

This rule applies even when the model appears to echo the value reliably. A value does not become model-owned because the schema asks the model to repeat it.

## 3. Use the reconstruction test

For every LLM output field, ask:

> If the model did not return this field, could the application reconstruct it exactly from information it already has?

If yes, the field normally does not belong in the model output.

Then ask:

> Does this field represent or materially support the semantic task assigned to the model?

If no, remove it unless an external provider or protocol imposes a documented requirement.

## 4. Keep deterministic work outside the model

Use application code rather than an LLM for operations that can be defined exactly, including:

- copying known values;
- generating identifiers;
- timestamps;
- counting;
- sorting;
- hashing;
- joining records;
- renaming fields;
- fixed formatting;
- enum mapping with deterministic rules;
- referential-integrity checks;
- validation that does not require semantic interpretation.

Do not ask a second model call to reformat already structured output when deterministic transformation is sufficient.

## 5. Preserve context outside the call

When deterministic context must accompany an inferential result, keep it in application state and merge it after validation.

Do not rely on the model to preserve association keys, source metadata, or prior state unless producing or transforming those values is itself the semantic task.

Treat model output as untrusted until schema and semantic validation succeed. Do not let an LLM become the canonical source of a value that originated elsewhere.

## 6. Audit repeated context consumption

When adding or changing a model call, inspect adjacent calls that consume the same source material.

Investigate patterns such as:

```text
Call A: extract entity
Call B: classify the same entity
Call C: normalize the same entity
```

Potential consolidation is worth considering when calls:

- repeatedly consume the same large context;
- reconstruct different pieces of the same logical object;
- pass model output directly into the next model with little or no deterministic processing;
- perform overlapping semantic analysis;
- share the same lifecycle and failure policy.

The goal is not minimum call count. Keep calls separate when they genuinely require different failure isolation, retry policy, security boundary, model capability, latency profile, ownership, or lifecycle.

## 7. Keep structured outputs minimal

An LLM output schema should contain the smallest set of fields needed to express the model's semantic result.

Inspect outputs for:

- input values echoed unchanged;
- metadata reproduced from context;
- deterministic derived values;
- multiple fields expressing the same judgment;
- provider-specific fields leaking into domain contracts;
- explanatory text that no downstream consumer uses.

If the model must quote, locate, or cite source material, distinguish genuine extraction from simple input echoing and document why the returned representation is necessary.

## 8. Keep enum and literal ownership explicit

Structured LLM outputs often duplicate enums already defined elsewhere.

For every enum or constrained literal set, identify whether it is:

- a canonical domain vocabulary;
- an LLM-specific projection of that vocabulary;
- a provider-format requirement.

Do not silently create a second vocabulary with equivalent meanings such as `approve`, `accepted`, and `yes` across different model calls.

If provider limitations require a transformed representation, isolate the mapping at the provider boundary and test it.

## 9. Audit multi-call object construction

A single logical object should not be assembled from several overlapping model responses without a reason.

Investigate when:

- several calls return overlapping fields;
- one call repeats facts inferred by another;
- downstream code reconciles conflicting model-owned copies;
- identical context is repeatedly serialized for neighboring calls;
- model A's structured output is sent to model B only to change representation.

When safe, prefer one coherent inference contract. When calls remain separate, give each call a non-overlapping responsibility and define which output owns each inferred fact.

## 10. Provider boundaries are adapters

Provider-specific structured-output restrictions should not redefine the domain contract.

Keep provider SDK types, tool-call envelopes, schema dialect limitations, and special formatting at the adapter boundary. Translate between the canonical semantic contract and the provider representation explicitly.

Do not let a provider's schema limitations force unrelated application layers to adopt provider-shaped models.

## 11. LLM contract audit checklist

For a meaningful LLM schema change:

1. Identify the semantic task of the call in one sentence.
2. Classify each input/output field as deterministic, inferential, or context-only.
3. Remove output fields that can be reconstructed exactly from existing state.
4. Trace IDs, metadata, state, and other deterministic values around the call rather than through it.
5. Search adjacent calls for repeated context and overlapping responsibility.
6. Check whether deterministic code can replace any model transformation.
7. Confirm enum/literal ownership and provider mappings.
8. Validate the model output before merging it into authoritative application state.
9. Verify downstream consumers still receive the deterministic context they need.
10. Test accepted and rejected structured-output cases and any affected public/introspection schema surfaces.

## 12. Red flags

Investigate when:

- an LLM output contains the same ID supplied in its input;
- source metadata is returned unchanged;
- a model emits timestamps, hashes, counts, orderings, or deterministic mappings;
- two model calls independently infer the same field;
- the same source context is sent repeatedly to adjacent calls;
- one model call only reformats another model's structured output;
- downstream code compares two model-produced copies of what should be one fact;
- a model output becomes authoritative for data that originated from the server or database;
- nobody can explain why a non-inferential field is present in the output schema.

A red flag requires investigation, not automatic consolidation. Preserve separation when it represents a real boundary.

---

**These guidelines are working if:** model outputs mostly contain genuine inference, deterministic state remains under deterministic ownership, repeated context consumption is intentional, and each LLM call has a clear non-overlapping semantic responsibility.