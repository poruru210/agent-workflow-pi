# Pi project guidance

This repository provides an optional engineering workflow for Pi. Normal Pi interactions must remain normal Pi interactions.

## Workflow activation

`workflow/global-workflow.md` is **not ambient policy**. Apply it only when the user explicitly activates the workflow, normally through the project prompt command `/workflow`.

Do not automatically enter workflow mode because a task is difficult, involves code, appears risky, or could benefit from subagents. Explicit activation is the boundary.

Once activated, `workflow/global-workflow.md` is the sole normative semantic workflow for that request. Preserve its objectives, phase ordering, gates, evidence semantics, execution-versus-verification allocation, independent-refutation requirements, correction/convergence rules, and completion conditions. Higher-priority instructions and more specific applicable project instructions still control scope and authority.

Workflow activation and subagent delegation are separate decisions. An activated workflow may be executed directly by the parent when its delegation gate says that is more efficient. Conversely, parent-direct implementation does not waive any independent T1/T2 evidence that the activated workflow requires.

## Pi runtime binding for activated workflow requests

Use the installed `pi-subagents` package directly for runtime mechanics. Do not recreate child execution, `workflowScript` scheduling, lifecycle, cancellation, acceptance, usage accounting, session handling, worktree handling, missions, or recovery in this repository.

- The current Pi session is the workflow parent/orchestrator and remains the semantic decision authority.
- Map workflow roles when needed: research → `workflow-researcher`; implementation → `workflow-implementer`; blind root-cause challenge → `root-cause-reviewer`; early audit → `early-auditor`; authorized verification partitions → `workflow-tester`; final audit → `final-auditor`; external-write pre-action audit → `pre-action-auditor`.
- Every delegated job receives the bounded Job Lease required by `global-workflow.md`. Custom roles use fresh/minimal child context, so the lease or explicit reads must carry the exact objective, claims, evidence, scope, authority, identity, and stopping conditions needed by that child.
- Use `workflowScript` only for the bounded execution wave the parent has already decided is appropriate. Do not compile the semantic workflow into a custom runtime state machine or an automatic review/fix loop.
- Use retained `resume` only when the same bounded job, role, target identity, capability requirement, and independence assumptions still hold. Spawn fresh for a new role, blind-first review, material identity change, or changed capability/independence requirement.
- Use native managed worktrees for writer isolation when useful. A worktree is not the workflow's implementation-snapshot or release-candidate semantic identity.
- Use native acceptance and host `gate` commands as deterministic evidence where appropriate. Runtime `verified`/`reviewed` status is evidence for the parent; it does not itself establish C0, T1/T2 closure, change-safety closure, or release PASS.
- Use missions/state for durable run linkage, artifacts, receipts, decisions, usage, and small recovery checkpoints. They are not the semantic workflow engine.
- If exact child launch resolution is genuinely decision-bearing, use public `pi-subagents/preflight`. If extension-owned child launch is ever genuinely required, use public `pi-subagents/delegation`. Do not add another launcher.

## Model and reasoning

`workflow_models` is a live **fact surface only**. It may expose available model IDs, context/modality, reasoning capability, supported thinking levels, price metadata, and the current parent model/thinking state. It must not rank models, recommend role-to-model mappings, or implement workflow policy.

Use Pi/pi-subagents native model resolution. Native precedence is per-run override → agent frontmatter `model` → `subagents.agentOverrides.<name>.model` → `subagents.defaultModel` → parent session model.

- A role may use native `model:` as its normal default when a stable role default is actually desired; the parent may still override it per run.
- A role with no `model:` does not dynamically select a model by itself. When model choice matters, the activated workflow parent selects it from live facts and passes a per-run override.
- Model and reasoning are separate decisions. Do not statically assign one thinking level to a workflow role merely because it is an auditor or implementer. Choose the lowest sufficient supported effort for the current Job Lease.
- Native `fallbackModels` are for provider/runtime failures such as quota, rate limit, auth, timeout, overload, or unavailable model. They are not semantic capability escalation.

Before a delegated workflow turn, keep the user-visible job/model/reasoning/rationale notice required by `global-workflow.md` when that requirement applies.

## General repository rules

Keep workflow-specific agent prompts small and role-specific. Do not copy the global workflow into every child prompt. Prefer current source and exact artifacts over summaries when they conflict. Do not add abstractions merely to mirror features already provided by Pi or `pi-subagents`.
