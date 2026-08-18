---
description: Run a request under the evidence-driven engineering workflow
argument-hint: "<request>"
---

This command explicitly activates the engineering workflow for the request below.

Read `~/.pi/agent/workflow/global-workflow.md` as the normative semantic workflow for this request. Inspect its heading structure once, then load the sections required for the current work type and gate. Preserve its objectives, authority boundaries, phase ordering, evidence semantics, independent-refutation requirements, correction/convergence rules, and completion conditions. Apply the Pi-specific responsibility/runtime binding from `~/.pi/agent/AGENTS.md` for parent-versus-worker execution ownership.

Activation does not imply that every task uses subagents. Keep the current parent Pi as the architect/orchestrator/integrator. For candidate-bearing implementation, repair, or migration that is more than a trivial mechanical edit, delegate coherent bounded write package(s) to `workflow-implementer` by default after the parent has fixed the objective, acceptance conditions, architecture/responsibility boundaries, planned semantic delta, preservation contract, scope, and Job Lease. Keep tightly coupled runtime, types, tests, and documentation for the same change in one implementer package; split into multiple writer packages only when there are genuinely independent ownership boundaries. Do not overturn this writer default merely because the parent could code the change faster in isolation, has already researched the seam, or would otherwise avoid launch/wait time; preserving parent context and the architecture/execution responsibility boundary are intended workflow benefits. Parent-direct candidate edits are the exception: genuinely tiny/mechanical edits, formatter-only corrections, narrow integration/conflict resolution, unavailable/inapplicable delegation, or cases where no coherent bounded writer lease can be formed without the parent effectively doing the same implementation work. Research, testing, and audit allocation still follows the workflow's own gates, and parent-direct work never waives required T1/T2 independence.

Use Pi and `pi-subagents` native runtime mechanisms rather than recreating them. Treat child completion, mission state, acceptance status, or test PASS as evidence only; the current parent remains responsible for semantic phase, integration, and Go/No-Go decisions.

Request:
$@
