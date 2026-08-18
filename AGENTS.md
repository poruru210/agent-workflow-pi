# Pi project guidance

This repository provides an optional engineering workflow for Pi. Normal Pi interactions must remain normal Pi interactions.

## Workflow activation

`workflow/global-workflow.md` is **not ambient policy**. Apply it only when the user explicitly activates the workflow, normally through `/workflow`.

Do not enter workflow mode merely because a task is difficult, involves code, appears risky, or could benefit from subagents. Ordinary native `subagent` use outside an activated workflow does not activate this engineering workflow.

Once activated, `workflow/global-workflow.md` is the normative semantic workflow for objectives, phase ordering, gates, evidence semantics, independent-refutation requirements, correction/convergence, and completion. This file supplies the Pi-specific runtime/responsibility binding: who retains architectural authority and which native `pi-subagents` mechanisms execute bounded work.

The parent remains the semantic authority. Non-trivial candidate-bearing implementation/repair/migration is normally delegated after the parent fixes the architecture and change contract. Parent-direct implementation is an exception and never waives required T1/T2 independence.

## Pi runtime binding for activated workflow requests

Use `pi-subagents` directly for runtime mechanics and reuse its builtin agents where their generic role already matches the workflow. Do not recreate generic worker/reviewer/scout/researcher personas, child scheduling, lifecycle, acceptance, missions, worktrees, or recovery in this repository.

- The current Pi session is the workflow parent/orchestrator and remains the semantic decision authority.
- The parent owns whole-task architecture and integration: objective/acceptance, risk/scope, planned semantic delta, preservation contract, public/component responsibility boundaries, work decomposition, Job Leases, model/reasoning selection, evidence integration, implementation-snapshot/release-candidate identity, finding materiality, and Go/No-Go.

Runtime mapping:

- fast local code reconnaissance → builtin `scout`;
- external/web research, official documentation, specifications, upstream issues/PRs, compatibility/current-source research → builtin `researcher` backed by `pi-web-access`;
- candidate-bearing implementation/repair/migration → builtin `worker`;
- blind root-cause challenge → builtin `reviewer` with a root-cause Job Lease;
- early implementation audit → builtin `reviewer` with an early-audit Job Lease;
- deterministic verification partitions → native `acceptance.verify` / `gate`, normally carried by a fresh no-edit builtin `worker` run using an explicitly selected low-cost capability-sufficient model;
- adaptive test-failure triage when deterministic verification fails or is blocked → fresh builtin `worker` with a no-edit diagnostic Job Lease and a low-cost capability-sufficient model;
- final release-candidate audit → builtin `reviewer` with a final-audit Job Lease;
- external-write pre-action audit → builtin `reviewer` with a pre-action Job Lease.

Prefer the builtin agent itself over copying/ejecting it. Generic agent methodology stays upstream-owned by `pi-subagents`; this repository supplies only workflow-specific Job Lease content, model selection, evidence identity, and semantic phase rules.

### Context and responsibility boundaries

For workflow `worker`, `scout`, and `researcher` runs, use explicit `context: "fresh"` unless a concrete same-job reason requires forked context. The Job Lease carries the exact objective, approved design/constraints, scope, evidence needs, authority, and stopping conditions required by the child.

For every independent `reviewer` run, explicitly use `context: "fresh"`. Project instructions may remain inherited, but the parent conversation and prior reviewer conclusions must not be implicitly forked into the child.

For non-trivial candidate-bearing implementation, the normal writer is builtin `worker`. Keep tightly coupled runtime, public types, focused tests, and user documentation for the same change in one coherent worker package. Split only at genuinely independent ownership/integration boundaries.

The worker owns local implementation choices inside the approved package. If the frozen objective, architecture/responsibility boundary, semantic delta, preservation contract, scope, or authority must materially change, use supervisor escalation or return the design conflict to the parent rather than silently redefining the task.

Parent-direct candidate edits are reserved for genuinely tiny/mechanical changes, formatter-only corrections, narrow integration/conflict resolution, unavailable/inapplicable delegation, or cases where no coherent writer lease can be formed without the parent effectively doing the same implementation work. Tight coupling, shared API signatures, prior parent research, or immediate wall-clock savings are not sufficient by themselves.

### Research

Use builtin `scout` when fast local recon can identify entry points, data flow, consumers, risks, and likely change surfaces while preserving parent context.

Use builtin `researcher` when the task benefits from web/docs/upstream evidence. Prefer primary/official sources and current evidence. Research output is design input, not authority; the parent decides architecture and contracts. Do not make the parent reproduce large upstream searches merely to re-prove the researcher's source collection.

### Independent review

A reviewer Job Lease must distinguish **authoritative contract/raw evidence** from **withheld conclusions**.

Give the reviewer the original requirement/source of truth, parent-approved architecture/responsibility boundary, acceptance criteria, preservation contract, exact baseline/snapshot/RC identity, raw diff or identity-bound evidence, scope, and leased claims.

Before blind-first findings are fixed, do not supply the implementer's rationale, the parent's PASS/causal conclusion, prior reviewer conclusions, or later test conclusions except when raw test evidence is itself the phase input. After blind-first findings are fixed, reconcile against the evidence required by that phase.

A reviewer must complete the bounded leased review scope rather than terminating discovery after the first blocker. Inspect every leased claim/risk vector that remains safely reviewable and return the complete finding set for that snapshot. Stop when every leased claim has a supported PASS, required-correction, or UNPROVEN disposition; do not gather redundant evidence after closure.

The parent owns mechanical identity preparation when needed: freeze hashes, produce raw diffs/manifests, and pass exact artifacts. Mechanical identity proof is not a semantic review substitute.

### Verification and large logs

Respect workflow phase ordering. If behavioral verification is gated behind early audit, do not attach full verification to the implementation run and thereby execute it before the early-audit gate.

For deterministic verification after the applicable audit gate:

- prefer native `acceptance.verify` for multiple explicit commands and `gate` for a single deterministic command;
- use a dedicated fresh no-edit builtin `worker` as the verification carrier when a subagent run is needed, with an explicitly selected low-cost capability-sufficient model/reasoning level rather than inheriting the parent model;
- the verification carrier must not modify candidate-bearing files or weaken U0/U1 cases, thresholds, fixtures, or oracles;
- for verbose/E2E commands, redirect complete stdout/stderr to a run/mission/temp artifact outside candidate-bearing files and return only concise status, counts, failed-test names, a bounded diagnostic tail, artifact path, and hash/identity when useful;
- do not stream large successful logs into the parent or reviewer context;
- on PASS, treat native verification status plus concise identity-bound evidence as sufficient execution evidence unless the semantic workflow requires more;
- on FAIL/BLOCKED, preserve the full log artifact and launch a fresh cheap no-edit diagnostic `worker` only when adaptive triage is useful. Give it the artifact path and minimal surrounding metadata, not the entire log inline. It may run bounded diagnostic commands but must not edit the candidate under a verification/triage lease;
- the parent classifies the result (product failure, test/setup failure, environment failure, or UNPROVEN) and decides whether a correction lease is required.

Native `verified`/`reviewed` status is evidence for the parent. It does not itself establish C0, T1/T2 closure, change-safety closure, or release PASS.

### Runtime ownership

Every delegated job receives the bounded Job Lease required by `global-workflow.md`. Use `workflowScript` only for an execution wave the parent has already semantically decided; do not compile the workflow into an automatic review/fix loop.

Use retained `resume` only when the same bounded job, role, target identity, capability requirement, and independence assumptions still hold. Spawn fresh for a new role, blind-first review, material identity change, or changed capability/independence requirement.

Use native managed worktrees for writer isolation when useful. Use missions/state for durable linkage, artifacts, receipts, decisions, usage, and recovery checkpoints. Neither is the semantic workflow engine.

If exact launch resolution is decision-bearing, use public `pi-subagents/preflight`. Do not add another launcher, acceptance engine, delegation scorecard, or workflow state machine.

## Model and reasoning

`workflow_models` is a live **fact surface only**. It may expose available model IDs, context/modality, reasoning capability, supported thinking levels, price metadata, the current parent model/thinking state, and ordered workflow preference hints for reused builtin roles. It must not rank model quality, decide capability sufficiency, or implement workflow policy.

Workflow preferences are ordered hints, not pins, ceilings, or native fallback chains. The parent evaluates candidates under the exact Job Lease and passes a concrete model as a per-run override.

For each delegated workflow job:

1. Honor an explicit compatible user model instruction.
2. Otherwise inspect the role's ordered workflow preferences and choose the first currently available, capability-sufficient candidate compatible with modality/context, independence, and diversity requirements.
3. Skip unavailable/insufficient candidates.
4. If no preferred candidate is suitable, select dynamically from the live catalog.

Reasoning is also per Job Lease. Builtin thinking values are runtime defaults, not workflow pins; explicitly pass the selected reasoning when the workflow has made that decision.

Do not lower independent-audit reasoning merely to save tokens when stronger reasoning is likely to reduce missed findings and review/fix rounds. Conversely, deterministic verification carriers and routine failure triage should normally use a low-cost model and only the reasoning needed for their bounded task.

Native `fallbackModels` are operational provider/runtime fallback only.

Before each delegated workflow turn, show the semantic job/phase, runtime agent, concrete selected provider/model, selected reasoning, and rationale. After terminal state, report selected model, selected reasoning, effective model, effective reasoning, and fallback status. If effective reasoning is unavailable after one native status inspection, report `effective reasoning: UNPROVEN`.

## General repository rules

Do not copy builtin `worker`, `reviewer`, `scout`, `researcher`, `oracle`, or `delegate` prompts into this repository merely to add workflow terminology. Do not copy the global workflow into child prompts. Prefer current source and exact artifacts over summaries when they conflict. Do not add abstractions merely to mirror features already provided by Pi or `pi-subagents`.
