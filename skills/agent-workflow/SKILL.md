---
name: agent-workflow
description: Evidence-driven engineering workflow for investigation, implementation, defect repair, maintenance, testing, independent audit, external actions, and release decisions. Use when /workflow explicitly activates the workflow; it preserves objective, evidence, authority, and phase boundaries while leaving execution mechanisms and model choice to the parent Pi.
disable-model-invocation: true
---

# Agent Workflow

`workflow/global-workflow.md` is the detailed semantic source of truth. This skill is the bootstrap and Pi-facing phase contract; it does not replace or summarize away the normative policy.

## Bootstrap

Use the compact branch only when **every** condition is affirmatively true:

- short;
- single-purpose;
- read-only;
- low-risk;
- no implementation or file/setting change;
- no diagnostic/test execution;
- no formal audit;
- no external-action planning or write;
- no delegation or multi-agent work;
- no correction cycle;
- no release/operation decision;
- no durable checkpoint requirement;
- no volatile identity/freshness dependency;
- the answer will not authorize or materially influence an external action or material decision; and
- a wrong answer cannot cause material medical, financial, security, safety, privacy, legal, production, or irreversible harm.

If any condition is false or uncertain, enter the normal workflow before substantive action. Do not create durable workflow state for a compact read-only answer merely because `/workflow` was invoked.

## Compact branch

Keep the parent direct. Record only the objective/question, authoritative target/source, relevant source version/time, allowed scope, answer, and material limits. Do not instantiate normal-workflow audit, delegation, verification, or correction machinery when it adds no boundary protection.

## Normal branch

Inspect the heading structure of `workflow/global-workflow.md`, load the sections required by the current task and gate, and preserve its objective/acceptance, authority, baseline, phase ordering, evidence, correction/convergence, and Go/No-Go semantics.

The workflow fixes **jobs and boundaries, not agent names**. The parent chooses the execution mechanism, SubAgent (if any), model, reasoning level, and parallelism that satisfy the current bounded contract. Pi/pi-subagents runtime mechanics are implementation details, not workflow phases.

### Required candidate-bearing audit gates

For candidate-bearing implementation, repair, migration, or other persistent local change under the normal workflow:

1. Finish the coherent implementation/correction package and freeze the implementation snapshot.
2. Run the **Early Audit Gate** before behavioral verification/finalization.
3. Integrate and disposition the complete finding set. If correction changes the candidate, the old identity-bound audit evidence is stale and the affected early audit must be re-established.
4. Run verification in the phase/order required by `global-workflow.md`; preserve raw evidence and reuse unaffected evidence rather than blindly repeating everything.
5. Freeze the release candidate.
6. Run the **Final Audit Gate** on that exact release-candidate identity.
7. After the final gate, integrate the evidence and complete the semantic finding disposition and Go/No-Go judgment without changing the frozen candidate.
8. Call `workflow_audit_gate` with `action=complete` before claiming candidate-bearing workflow completion. The completion interlock remains open until this explicit close succeeds.

Use `workflow_audit_gate` for these two mechanical gates and the final mechanical completion interlock. It binds each audit attempt to the current Git candidate identity, consumes the pinned `pi-review` lifecycle, constrains the review runtime to read/bash inspection, records the independent output, and closes a gate only when its mechanical conditions hold. `final` cannot start until `early` is closed for the exact same current identity. A later candidate change makes older receipts stale by identity mismatch.

Before `begin`, the parent must choose a capability-sufficient audit model and reasoning level. Do not lower audit reasoning merely to save tokens when stronger reasoning is likely to reduce missed findings or repeated review/fix cycles. Model diversity is useful for independent refutation but is a parent judgment, not a hard-coded role→model map.

The audit contract passed to `workflow_audit_gate` should contain the authoritative requirement/source of truth, approved architecture/responsibility boundary, acceptance criteria, preservation contract, baseline/snapshot identity context, review scope, and relevant risk vectors. Preserve blind-first independence: do not include implementer rationale, the parent's PASS conclusion, or prior reviewer conclusions before the independent finding set is fixed.

A mechanically closed audit gate is **evidence**, not semantic authority. The parent still decides finding validity/materiality, change-induced risk, evidence sufficiency, correction scope, verification interpretation, and Go/No-Go.

### Other independent work

Root-cause challenge, pre-action audit, research, implementation, verification carriers, and other bounded jobs are not tied to a particular SubAgent name. Use Pi-native mechanisms that preserve the required read/write authority, fresh/blind context, capability, and evidence contract. `AGENTS.md` describes available mechanisms and practical defaults without redefining the semantic workflow.
