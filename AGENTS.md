# Pi project guidance

This repository provides an optional engineering workflow for Pi. Normal Pi interactions must remain normal Pi interactions.

## Workflow activation

`workflow/global-workflow.md` is **not ambient policy**. Apply it only when the user explicitly activates the workflow, normally through the Pi prompt command `/workflow`.

Do not automatically enter workflow mode because a task is difficult, involves code, appears risky, or could benefit from subagents. Explicit activation is the boundary. Likewise, an ordinary use of Pi's native `subagent` capability outside an activated workflow does not by itself activate this engineering workflow.

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

`workflow_models` is a live **fact surface only**. It may expose available model IDs, context/modality, reasoning capability, supported thinking levels, price metadata, the current parent model/thinking state, and each workflow role's declarative `workflowPreferredModel`. It must not rank models, decide whether a preference is sufficient, or implement workflow policy.

`workflowPreferredModel` is workflow-only preference metadata. It is deliberately not Pi/pi-subagents native `model:` frontmatter and does not participate automatically in native model resolution. The activated parent evaluates it under the Job Lease before launch.

For each delegated workflow job, select the concrete model in this order:

1. an explicit user model instruction for that job;
2. that role's `workflowPreferredModel`, when it is currently available and capability-sufficient and does not violate a workflow requirement such as T2 model diversity, modality/context needs, or an independence constraint;
3. otherwise, dynamic selection from current live model facts using the workflow's capability, risk, evidence, and cost criteria.

When bypassing an available `workflowPreferredModel`, state the concrete reason. Availability alone is not capability sufficiency, and a declared preference is never a waiver of workflow requirements.

Once the parent has selected a model, pass that concrete model as a per-run override for the child. Do not leave an activated workflow child to implicit parent-model inheritance or describe the selected model only as `inherit`, `default`, or `parent`. This keeps the semantic model choice explicit while still using Pi's native execution path.

Model and reasoning are separate decisions. Choose the lowest sufficient supported reasoning level for the current Job Lease rather than pinning one level by role. For workflowScript paths that encode thinking in the model string, use the selected concrete model-with-thinking form supported by Pi.

Native `fallbackModels` remain an operational provider/runtime fallback for quota, rate limit, authentication, timeout, overload, or unavailable model. They are not semantic capability escalation. If runtime fallback occurs, the actual model may differ from the selected model.

Before every delegated workflow turn, show the user the bounded job/role, the **concrete selected provider/model**, the selected reasoning level, and the rationale. Never use only `parent inherited` or equivalent as the model disclosure.

After the child completes, use Pi/pi-subagents runtime metadata to confirm the effective model and reasoning. Prefer effective metadata already returned by the runtime; otherwise inspect the native run status once. If `attemptedModels` shows fallback or the effective model differs from the selected model, disclose that change explicitly. The runtime's actual model/thinking identity is execution evidence; it does not replace semantic review.

## General repository rules

Keep workflow-specific agent prompts small and role-specific. Do not copy the global workflow into every child prompt. Prefer current source and exact artifacts over summaries when they conflict. Do not add abstractions merely to mirror features already provided by Pi or `pi-subagents`.
