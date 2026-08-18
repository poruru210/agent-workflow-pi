# Pi project guidance

This repository provides an optional engineering workflow for Pi. Normal Pi interactions must remain normal Pi interactions.

## Workflow activation

`workflow/global-workflow.md` is **not ambient policy**. Apply it only when the user explicitly activates the workflow, normally through the Pi prompt command `/workflow`.

Do not automatically enter workflow mode because a task is difficult, involves code, appears risky, or could benefit from subagents. Explicit activation is the boundary. Likewise, an ordinary use of Pi's native `subagent` capability outside an activated workflow does not by itself activate this engineering workflow.

Once activated, `workflow/global-workflow.md` is the sole normative semantic workflow for that request. Preserve its objectives, phase ordering, gates, evidence semantics, execution-versus-verification allocation, independent-refutation requirements, correction/convergence rules, and completion conditions. Higher-priority instructions and more specific applicable project instructions still control scope and authority.

Workflow activation and subagent delegation are separate decisions. The parent remains the semantic authority and may still perform direct work where appropriate, but non-trivial candidate-bearing implementation/repair/migration is normally delegated as one bounded writer package after the parent has fixed the architecture and change contract. Parent-direct implementation remains an exception and never waives any independent T1/T2 evidence that the activated workflow requires.

## Pi runtime binding for activated workflow requests

Use the installed `pi-subagents` package directly for runtime mechanics. Do not recreate child execution, `workflowScript` scheduling, lifecycle, cancellation, acceptance, usage accounting, session handling, worktree handling, missions, or recovery in this repository.

- The current Pi session is the workflow parent/orchestrator and remains the semantic decision authority.
- The parent owns whole-task architecture and integration: user objective and acceptance conditions, risk and scope, planned semantic delta, preservation contract, public/component responsibility boundaries, work decomposition, Job Leases, model/reasoning selection, child-result integration, implementation-snapshot and release-candidate identity, finding materiality, and Go/No-Go decisions.
- Map workflow roles when needed: research → `workflow-researcher`; implementation → `workflow-implementer`; blind root-cause challenge → `root-cause-reviewer`; early audit → `early-auditor`; authorized verification partitions → `workflow-tester`; final audit → `final-auditor`; external-write pre-action audit → `pre-action-auditor`.
- For a non-trivial candidate-bearing implementation, repair, or migration, the normal writer is `workflow-implementer`. Give one implementer a coherent package spanning all tightly coupled surfaces of the same change (for example runtime, public types, focused tests, and user documentation) rather than treating that coupling as a reason for parent-direct editing.
- The implementer owns local design choices inside the approved package. It may choose helper placement, internal control flow, fixtures, naming, and other implementation details that do not materially alter the frozen objective, architecture/responsibility boundary, planned semantic delta, preservation contract, scope, or authority. If a material higher-level design change is required, the implementer must stop that part and return the conflict/proposed deviation to the parent for a new decision or lease rather than silently redefining the task.
- Parent-direct candidate edits are reserved for genuinely tiny/mechanical changes, formatter-only corrections, narrow integration glue or conflict resolution, delegation that is unavailable/inapplicable, or cases where a coherent bounded writer lease cannot be formed without the parent effectively performing the same implementation work. “The files share one API signature”, “the parent already researched the seam”, or “the change is tightly coupled” are not sufficient by themselves to make a non-trivial implementation parent-direct.
- Research delegation remains benefit-driven: use `workflow-researcher` when bounded exploration can reduce uncertainty, run in parallel with parent architectural work, or provide useful independent source coverage. Research output is design input, not authority; the parent decides the architecture and contract.
- Every delegated job receives the bounded Job Lease required by `global-workflow.md`. Custom roles use fresh/minimal child context, so the lease or explicit reads must carry the exact objective, claims, evidence, scope, authority, identity, and stopping conditions needed by that child.
- Use `workflowScript` only for the bounded execution wave the parent has already decided is appropriate. Do not compile the semantic workflow into a custom runtime state machine or an automatic review/fix loop.
- Use retained `resume` only when the same bounded job, role, target identity, capability requirement, and independence assumptions still hold. Spawn fresh for a new role, blind-first review, material identity change, or changed capability/independence requirement.
- Use native managed worktrees for writer isolation when useful. A worktree is not the workflow's implementation-snapshot or release-candidate semantic identity.
- Use native acceptance and host `gate` commands as deterministic evidence where appropriate. Runtime `verified`/`reviewed` status is evidence for the parent; it does not itself establish C0, T1/T2 closure, change-safety closure, or release PASS.
- Use missions/state for durable run linkage, artifacts, receipts, decisions, usage, and small recovery checkpoints. They are not the semantic workflow engine.
- If exact child launch resolution is genuinely decision-bearing, use public `pi-subagents/preflight`. If extension-owned child launch is ever genuinely required, use public `pi-subagents/delegation`. Do not add another launcher.

Do not add an elaborate delegation scorecard or numeric threshold. For non-trivial candidate-bearing work the default above is enough; the parent records a short concrete exception reason only when it keeps the write itself. Reconsider allocation when the change package or architecture materially changes, but do not re-run the decision at every edit.

## Model and reasoning

`workflow_models` is a live **fact surface only**. It may expose available model IDs, context/modality, reasoning capability, supported thinking levels, price metadata, the current parent model/thinking state, and each workflow role's ordered declarative `workflowPreferredModels`. It must not rank model quality, decide capability sufficiency, or implement workflow policy.

`workflowPreferredModels` is workflow-only preference metadata expressed as an ordered list. It is deliberately not Pi/pi-subagents native `model:` frontmatter and does not participate automatically in native model resolution. The list contains preferred candidates, not pins, ceilings, or an operational fallback chain. The activated parent evaluates the candidates under the current Job Lease before every launch.

For each delegated workflow job, select the concrete model as follows:

1. Honor an explicit user model instruction for that job when it is compatible with higher-priority constraints.
2. Otherwise inspect that role's `workflowPreferredModels` in order and choose the first candidate that is currently available, capability-sufficient for the exact Job Lease, and compatible with workflow requirements such as modality/context, independence, or T2 model diversity.
3. If a preferred candidate is unavailable or capability-insufficient, continue to the next preferred candidate rather than treating the preference as a waiver.
4. If no preferred candidate is suitable, or the role has no preference list, select dynamically from the full live model catalog using the workflow's capability, risk, evidence, diversity, and cost criteria.

The parent may intentionally choose outside the preference list when a workflow requirement justifies it. For example, a T2 lane may need model diversity even when the first preferred candidate is otherwise sufficient. When bypassing an available higher-priority preferred candidate, state the concrete decision-bearing reason.

Once the parent has selected a model, pass that concrete model as a per-run override for the child. Do not leave an activated workflow child to implicit parent-model inheritance or describe the selected model only as `inherit`, `default`, or `parent`.

**Reasoning/effort is fully dynamic and independent of `workflowPreferredModels`.** The preference list contains models only and must not encode a thinking level. For every Job Lease, choose the lowest sufficient reasoning level supported by the selected model using the workflow's ambiguity, depth, harm, evidence, and verification criteria. If the model changes for any reason, make a fresh effort decision; never carry a previous effort level forward merely because it was used with another model or another job.

Native `fallbackModels` remain an operational provider/runtime fallback for quota, rate limit, authentication, timeout, overload, or unavailable model. They are not the semantic preference list and are not semantic capability escalation. If runtime fallback occurs, the actual model may differ from the selected model.

Before every delegated workflow turn, show the user the bounded job/role, the **concrete selected provider/model**, the selected reasoning level, and the rationale. Never use only `parent inherited` or equivalent as the model disclosure.

After every delegated workflow turn reaches a terminal state, report all five runtime-identity fields: **selected model, selected reasoning, effective model, effective reasoning, and fallback status**. Prefer effective metadata already returned by `pi-subagents`; otherwise inspect the native run status once. If runtime status exposes `model`, `thinking`, or `attemptedModels`, use those values rather than inferring from the absence of an error or mismatch notification. If effective reasoning is not exposed after that one status inspection, report `effective reasoning: UNPROVEN` together with the accepted selected reasoning; do not silently equate accepted configuration with observed runtime identity. If fallback or any effective value differs from the selected value, disclose the difference explicitly. This disclosure rule does not by itself require a respawn when the accepted configuration remains valid under `global-workflow.md`; semantic acceptance still follows the workflow's evidence rules.

## General repository rules

Keep workflow-specific agent prompts small and role-specific. Do not copy the global workflow into every child prompt. Prefer current source and exact artifacts over summaries when they conflict. Do not add abstractions merely to mirror features already provided by Pi or `pi-subagents`.
