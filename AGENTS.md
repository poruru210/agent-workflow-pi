# Pi project guidance

This repository provides an **optional** evidence-driven engineering workflow for Pi. Normal Pi interactions must remain normal Pi interactions.

## Workflow activation and semantic authority

`workflow/global-workflow.md` is not ambient policy. Apply it only when the user explicitly activates the workflow, normally with `/workflow` (or explicitly invokes the `agent-workflow` skill).

On activation, read `skills/agent-workflow/SKILL.md` first. The skill restores the original compact-vs-normal bootstrap. Compact work does not instantiate normal-workflow machinery. If any compact condition is false or uncertain, enter the normal branch and treat `workflow/global-workflow.md` as the normative semantic source of truth for objective/acceptance, authority, baseline, phase ordering, evidence, audit, correction/convergence, and Go/No-Go.

This file is only the Pi-specific runtime binding. Do not translate the semantic workflow into a second policy engine.

The current parent Pi remains the whole-task semantic authority: objective/acceptance, scope/risk, architecture and responsibility boundaries, planned semantic delta, preservation contract, decomposition, model/reasoning selection, evidence integration, finding materiality, correction decisions, snapshot/release-candidate identity, and final Go/No-Go.

## Boundary-first runtime model

The workflow fixes **what must remain true**, not which named SubAgent must execute a phase. Pi, `pi-subagents`, `pi-review`, and other installed extensions are execution mechanisms. The parent chooses among them under the current bounded job contract.

Available Pi-native mechanisms include:

- builtin `scout` for fast local reconnaissance;
- builtin `researcher` + `pi-web-access` for web/docs/spec/upstream research;
- builtin `worker` for bounded implementation, diagnosis, verification carriers, or other execution work;
- builtin `reviewer` for a fresh independent review/challenge when that generic role fits;
- builtin `oracle` / `delegate` when their generic semantics fit the bounded job;
- native `acceptance.verify` / `gate` for deterministic verification;
- pinned `poruru-code/pi-review` for the code-review lifecycle consumed by the required Early/Final Audit Gate;
- direct parent execution when that best preserves the semantic contract and total efficiency.

These are capabilities, not semantic phase names. Do not infer that a workflow phase is satisfied merely because a particular agent/tool ran.

### Delegation and implementation

The parent manages the critical path and chooses direct, delegated, or parallel execution by total efficiency inside the workflow boundaries. Use delegation when it materially improves elapsed time, total work, quality, independence, or misjudgment risk. Do not delegate merely because a slot exists.

For a delegated job, pass a bounded Job Lease containing the exact objective/acceptance IDs, scope/authority, approved design constraints where relevant, target/evidence identity, required evidence/risk vectors, selected model/reasoning, stopping conditions, and parent integration method. Generic SubAgent methodology stays upstream-owned; do not copy builtin personas into this repository just to add workflow terminology.

For candidate-bearing work, preserve writer/auditor independence. The parent may implement directly when appropriate under the normative workflow, but an implementation explanation or self-review never substitutes for the required independent audit gates.

## Required Early/Final Audit Gate

Candidate-bearing normal-workflow changes have two mandatory mechanical gates:

1. **Early Audit Gate** after implementation/correction is complete and the implementation snapshot is frozen, before behavioral verification/finalization.
2. **Final Audit Gate** after verification/integration and release-candidate freeze, before candidate-bearing workflow completion.

`extensions/workflow/audit-gate.ts` implements only this missing enforcement layer. It is intentionally not a generic workflow state machine.

The gate uses the pinned `pi-review` lifecycle and records identity-bound receipts. The parent chooses the audit model and reasoning before each `begin`; the extension does not rank models or implement a role→model table.

Mechanical properties:

- `/workflow` activation records the current Git candidate identity as a baseline when available.
- `workflow_audit_gate begin` freezes the exact current Git candidate identity and starts `/review ... --fresh`.
- the review branch receives the parent-selected model/reasoning after tree navigation, so review execution is not accidentally inherited from an earlier branch point;
- active review tools are reduced to `read` + `bash`; any other tool call is blocked;
- identity is checked after each review shell result and again at review completion; any persistent candidate mutation invalidates the attempt;
- the complete `pi-review` response, verdict, target, model/reasoning facts, candidate identity, and failure reasons are persisted as audit evidence;
- a gate closes only for `pi-review` verdict `correct`, unchanged candidate identity, expected fresh/return lifecycle, no blocked write attempt, and matching effective model/reasoning;
- Final cannot start until Early is closed for the exact same current identity;
- after any correction or other candidate change, old receipts no longer match the current identity and are therefore stale without a bespoke invalidation graph;
- if a `/workflow` request changes the Git candidate, an `agent_settled` interlock refuses silent completion until both required gates are closed in order for the exact current identity and the parent explicitly calls `workflow_audit_gate action=complete` after semantic evidence integration/Go-No-Go;
- `complete` rechecks the current identity and ordered receipts. Any post-Final candidate change makes the old receipts stale and prevents completion.

The gate does **not** decide whether findings are material, whether a correction is semantically required, whether verification is sufficient, or whether the release is Go. A mechanically closed gate is evidence for the parent, not semantic authority. The parent must also ensure that the chosen `pi-review` target actually covers the candidate scope claimed by the audit; the identity binding proves which candidate was present, not semantic target coverage.

The current mechanical identity adapter requires a Git working tree. Non-Git work still follows the semantic policy but does not receive this Git identity interlock until a different identity provider is explicitly added.

### Audit contract and blind-first independence

Before an Early/Final `begin`, give the audit only the authoritative material needed to judge the target:

- original requirement/source of truth;
- approved architecture/responsibility boundary;
- acceptance criteria;
- preservation contract and relevant baseline;
- exact snapshot/release-candidate context;
- review scope, claims, and risk vectors.

Do not include implementer rationale, the parent's PASS conclusion, or prior reviewer conclusions before the independent finding set is fixed. The review must complete the safely reviewable scope rather than stopping after the first blocker.

If the audit returns required correction or `unknown`, keep the gate open. Integrate the complete finding set, correct coherently, and re-establish only the evidence invalidated by the resulting candidate change. Do not automatically launch fix/review loops inside the extension.

## Context and artifact boundaries

Use explicit fresh context for independent SubAgent work when independence matters. Project instructions may remain inherited where appropriate, but do not implicitly fork parent conclusions into a blind-first review.

Builtin `scout`/`researcher` default output files can dirty candidate worktrees. Override them when necessary: normally `output: false` for concise results, or an explicit non-candidate artifact with `outputMode: "file-only"` for large briefs. Disable progress files for short-lived read-only runs unless durable progress is intentionally useful.

Use missions/artifacts/receipts for durable runtime linkage and recovery where useful, but they are not the semantic workflow engine. Keep verbose logs outside candidate-bearing files.

## Research

Use local reconnaissance or external research only when it contributes to the objective, acceptance, diagnosis, design, compatibility, or risk decision. Prefer primary/official/current sources for external facts. Research output is design input; the parent remains authority and should not repeat the same broad search merely to reproduce a child's source collection.

## Verification

Verification remains a separate evidence layer from independent audit. Respect the ordering in `global-workflow.md`: when Early Audit gates behavioral verification, do not run full verification before that gate merely because it is convenient.

For deterministic verification, prefer native `acceptance.verify` for multiple explicit commands and `gate` for a single deterministic command. If a SubAgent carrier is useful, choose a fresh no-edit capability-sufficient run and a model/reasoning level appropriate to the bounded execution task. Do not inherit an expensive parent model by accident.

For verbose/full/E2E commands, preserve complete stdout/stderr in a non-candidate artifact and return concise status/counts/failures/bounded tail/path/identity. Do not stream successful full logs into parent or auditor context. On FAIL/BLOCKED, preserve the raw artifact and use adaptive triage only when it adds information value.

Native `verified`/`reviewed` status, test PASS, and audit Gate PASS are evidence layers. None independently establish C0, T1/T2 closure, change-safety closure, or Go/No-Go.

## Runtime ownership

`pi-subagents` owns generic agent discovery, child lifecycle/status/wait/stop/resume, managed worktrees, missions/artifacts, native acceptance, model execution, and operational fallback. Do not add another launcher, scheduler, DAG language, mission clone, worktree manager, acceptance engine, delegation scorecard, or generic agent state machine.

`pi-review` owns its generic review UX/rubric and publishes review lifecycle events. Do not fork workflow concepts back into `pi-review`; the workflow-specific meaning of Early/Final gates stays in this repository.

The workflow extension should remain narrowly scoped to live model facts plus the identity-bound audit gate/interlock that Pi does not natively provide. Workflow-only tools are disabled outside an active explicit workflow and enabled at `/workflow`/`/skill:agent-workflow` input before the agent turn.

## Model and reasoning

`workflow_models` is a live **fact surface only**. It may expose available model IDs, context/modality/reasoning capability, supported thinking levels, price metadata, current parent model/thinking state, session scope, and ordered preference hints. It must not rank model quality or choose a model.

Workflow preferences are hints, not pins or fallback chains. For each bounded delegated or audit job:

1. honor an explicit compatible user model instruction;
2. otherwise choose from current available models based on capability, context/modality, independence/diversity needs, and risk-adjusted cost;
3. select reasoning separately;
4. pass the concrete model/reasoning to the execution mechanism.

Do not lower independent-audit reasoning merely to save tokens when stronger reasoning is likely to reduce missed findings and repeated review/fix rounds. Deterministic verification and routine triage should normally use only the reasoning needed for that bounded job.

Native fallback models are operational provider/runtime fallback only; they do not redefine semantic model sufficiency.

## General repository rules

- Keep local/private `settings.json` overrides and credentials out of Git.
- Prefer current source and exact artifacts over summaries when they conflict.
- Do not copy `worker`, `reviewer`, `scout`, `researcher`, `oracle`, or `delegate` prompts into this repository merely to add workflow labels.
- Do not encode semantic phases as a fixed SubAgent routing table.
- Do not add abstractions merely to mirror features already provided by Pi, `pi-subagents`, or `pi-review`.
