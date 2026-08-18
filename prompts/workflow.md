---
description: Run a request under the evidence-driven engineering workflow
argument-hint: "<request>"
---

This command explicitly activates the engineering workflow for the request below.

Read `~/.pi/agent/workflow/global-workflow.md` as the normative semantic workflow for this request. Inspect its heading structure once, then load only the sections required for the current work type and gate. Preserve its objectives, authority boundaries, phase ordering, evidence semantics, independent-refutation requirements, correction/convergence rules, and completion conditions. Apply the Pi-specific responsibility/runtime binding from `~/.pi/agent/AGENTS.md`.

Keep the current parent Pi as architect/orchestrator/integrator. Reuse `pi-subagents` builtins instead of custom copies: `scout` for local recon, `researcher` for web/docs/upstream research, `worker` for non-trivial candidate-bearing implementation and bounded no-edit verification/triage execution, and `reviewer` for independent root-cause/early/final/pre-action review. Use explicit fresh context for workflow children unless the same bounded job has a concrete reason to require forked context. Parent-direct candidate edits remain limited to the exceptions defined in `AGENTS.md`.

For independent review, give the builtin `reviewer` the authoritative requirement/design contract and exact identity-bound raw evidence required by its phase, but preserve blind-first independence by withholding implementer rationale, parent conclusions, and prior reviewer conclusions until initial findings are fixed. Do not stop the leased review after the first blocker; complete every safely reviewable leased claim/risk vector before returning the finding set.

Respect verification phase ordering. After the applicable early-audit gate, prefer native `acceptance.verify` / `gate` for deterministic test partitions. Carry verification in a fresh no-edit builtin `worker` run with an explicitly selected low-cost capability-sufficient model rather than inheriting the parent model. Redirect verbose/E2E output to artifacts and return only concise status/counts/failures/bounded tail/path/identity. If verification fails or is blocked, preserve the full log and use a fresh cheap no-edit `worker` for adaptive triage only when useful; do not load full logs into the parent context by default.

Treat child completion, mission state, native acceptance status, or test PASS as evidence only. The current parent remains responsible for semantic phase, integration, finding materiality, correction decisions, and Go/No-Go.

Request:
$@
