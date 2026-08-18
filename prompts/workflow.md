---
description: Run a request under the evidence-driven engineering workflow
argument-hint: "<request>"
---

This command explicitly activates the engineering workflow for the request below.

Read `~/.pi/agent/workflow/global-workflow.md` as the normative workflow for this request. Inspect its heading structure once, then load the sections required for the current work type and gate. Preserve its objectives, authority boundaries, phase ordering, evidence semantics, independent-refutation requirements, correction/convergence rules, and completion conditions.

Activation does not imply that every task uses subagents. Keep the current parent Pi as the architect/orchestrator/integrator. For candidate-bearing implementation, repair, or migration that is more than a trivial mechanical edit, delegate one coherent bounded write package to `workflow-implementer` by default after the parent has fixed the objective, acceptance conditions, architecture/responsibility boundaries, planned semantic delta, preservation contract, scope, and Job Lease. Strong coupling across runtime, types, tests, and documentation is normally a reason to keep those surfaces in one implementer package, not a reason for the parent to write them itself. Parent-direct candidate edits are the exception: genuinely tiny/mechanical edits, formatter-only corrections, narrow integration/conflict resolution, unavailable/inapplicable delegation, or cases where no coherent bounded writer lease can be formed without the parent effectively doing the same implementation work. Research, testing, and audit allocation still follows the workflow's own gates, and parent-direct work never waives required T1/T2 independence.

Use Pi and `pi-subagents` native runtime mechanisms rather than recreating them. Treat child completion, mission state, acceptance status, or test PASS as evidence only; the current parent remains responsible for semantic phase, integration, and Go/No-Go decisions.

Request:
$@
