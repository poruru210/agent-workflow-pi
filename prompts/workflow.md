---
description: Run a request under the evidence-driven engineering workflow
argument-hint: "<request>"
---

This command explicitly activates the engineering workflow for the request below.

Read `~/.pi/agent/workflow/global-workflow.md` as the normative workflow for this request. Inspect its heading structure once, then load the sections required for the current work type and gate. Preserve its objectives, authority boundaries, phase ordering, evidence semantics, independent-refutation requirements, correction/convergence rules, and completion conditions.

Activation does not imply subagent delegation. Apply the workflow's own execution-allocation and delegation-opportunity gates: perform work directly in the current parent Pi when that is the lower risk-adjusted total cost, and use `pi-subagents` only when delegation, parallelism, specialization, or independent evidence is justified. A parent-direct route does not waive required T1/T2 independence.

Use Pi and `pi-subagents` native runtime mechanisms rather than recreating them. Treat child completion, mission state, acceptance status, or test PASS as evidence only; the current parent remains responsible for semantic phase and Go/No-Go decisions.

Request:
$@
