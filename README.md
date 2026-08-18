# agent-workflow-pi

Personal Pi configuration intended to live as the Pi agent directory (`~/.pi/agent`).

The repository provides an **opt-in, evidence-driven engineering workflow** on top of Pi and `pi-subagents`.

## Core design

`workflow/global-workflow.md` owns workflow semantics. Pi and `pi-subagents` own execution mechanics and generic agent personas. This repository adds only the workflow-specific binding that is not already native.

```text
explicit /workflow activation
        │
        ▼
workflow/global-workflow.md
  semantic source of truth
        │
        ▼
current parent Pi
  architect / orchestrator / integrator
  objective / risk / architecture
  responsibility boundaries + change contract
  Job Leases + model/reasoning selection
  evidence integration + Go/No-Go
        │
        ├──────────────────────────────────────────────┐
        ▼                                              ▼
 tiny/integration work                    pi-subagents builtins/native gates
                                          scout / researcher / worker / reviewer
                                          acceptance.verify / gate
        │                                              │
        └───────────────────────┬──────────────────────┘
                                ▼
                         parent semantic gate
```

## Explicit activation

`workflow/global-workflow.md` is not ambient policy. Normal Pi use remains normal Pi use. Activate the engineering workflow explicitly with:

```text
/workflow <request>
```

Using Pi's native `subagent` capability outside `/workflow` does not implicitly activate this engineering workflow.

## Parent / worker responsibility boundary

The parent retains whole-task decisions: objective/acceptance, risk/scope, architecture/responsibility boundaries, planned semantic delta, preservation contract, decomposition/Job Leases, model/reasoning choice, evidence integration, snapshot/release identity, finding materiality, and Go/No-Go.

For non-trivial candidate-bearing implementation, repair, or migration, the normal writer is the **builtin `worker`**. Give it one coherent bounded package for tightly coupled runtime, public types, focused tests, and documentation. Split only at genuinely independent ownership/integration boundaries.

The worker owns ordinary local implementation design inside the approved lease. If the frozen objective, architecture/responsibility boundary, semantic delta, preservation contract, scope, or authority must materially change, it escalates instead of silently redesigning the task.

Parent-direct candidate editing is an exception for genuinely tiny/mechanical edits, formatter-only corrections, narrow integration/conflict resolution, unavailable/inapplicable delegation, or cases where no coherent writer lease can be formed without the parent effectively doing the same implementation work. Immediate wall-clock savings alone are not enough to bypass the writer boundary.

## Reuse pi-subagents builtins

No workflow-specific agent persona is currently kept in this repository. Runtime roles come from `pi-subagents`:

| Workflow need | Runtime mechanism | Notes |
|---|---|---|
| Fast local code reconnaissance | builtin `scout` | Compressed local context when it preserves parent context. |
| Official docs/specs/upstream/web research | builtin `researcher` + `pi-web-access` | Prefer primary/current sources; useful during design and compatibility work. |
| Candidate-bearing implementation/correction | builtin `worker` | Fresh context + bounded writer Job Lease. |
| Blind root-cause challenge | builtin `reviewer` | Fresh context + root-cause Job Lease. |
| Early implementation audit | builtin `reviewer` | Fresh context + early-audit Job Lease. |
| Deterministic focused/full/E2E/static verification | native `acceptance.verify` / `gate` | Carried by a fresh no-edit low-cost `worker` run; verbose logs go to artifacts. |
| Adaptive test-failure triage | builtin `worker` | Fresh no-edit diagnostic lease; low-cost model; only when needed. |
| Final release-candidate audit | builtin `reviewer` | Fresh context + final-audit Job Lease. |
| External-write pre-action audit | builtin `reviewer` | Fresh context + pre-action Job Lease. |

Generic personas remain upstream-owned. Do not eject/copy them merely to add workflow terminology.

## Research

Use builtin `scout` for local code reconnaissance.

Use builtin `researcher` for official documentation, specifications, upstream issues/PRs, compatibility information, and other web evidence. `pi-web-access` supplies the builtin researcher's web tools. Research output is design input; the parent remains architecture/contract authority.

This prevents the parent from carrying large upstream searches and long source material in its own context when a concise sourced handoff is enough.

## Reviewer independence

Independent review uses builtin `reviewer` with explicit `context: "fresh"`.

Supply before blind-first review:

- original requirement/source of truth;
- parent-approved architecture/responsibility boundary;
- acceptance criteria and preservation contract;
- baseline and exact snapshot/release-candidate identity;
- raw diff/identity-bound evidence;
- scope, risk vectors, and leased claims.

Withhold until initial findings are fixed:

- implementer rationale;
- parent PASS/causal conclusion;
- prior reviewer conclusions;
- later test conclusions unless raw test evidence is itself the phase input.

The reviewer must finish every safely reviewable leased claim/risk vector even after finding a blocker. The goal is one strong bounded review that returns the complete finding set for that snapshot, followed by a correction batch and only the necessary differential re-review.

Audit reasoning is not reduced merely to save tokens when stronger reasoning is likely to reduce missed findings and repeated review/fix rounds.

## Verification without expensive log ingestion

Verification remains a separate semantic phase; do not move full behavioral tests before an early-audit gate when the workflow requires that order.

For deterministic verification:

1. freeze/confirm the candidate identity required by the workflow;
2. launch a fresh **no-edit builtin `worker`** using an explicitly selected low-cost capability-sufficient model and reasoning level;
3. attach one `gate` command or a matrix of native `acceptance.verify` commands;
4. redirect verbose/full/E2E stdout/stderr to run/mission/temp artifacts outside candidate-bearing files;
5. return only concise exit/status, counts, failed-test names, a bounded tail, artifact path, and useful identity/hash data;
6. do not load successful full logs into the parent or reviewer context.

If a deterministic partition FAILs or is BLOCKED, preserve the full artifact. Launch a fresh cheap no-edit `worker` only when adaptive triage is useful. Give that child the artifact path plus minimal metadata; it may inspect the log and run bounded diagnostics but may not edit the candidate. The parent then classifies product failure vs test/setup/environment failure vs UNPROVEN and decides whether a correction lease is needed.

This deliberately spends model reasoning on architecture and independent audit, not on repeatedly ingesting successful E2E output.

Native acceptance/gate evidence does not itself establish C0 PASS, T1/T2 closure, change-safety closure, or release PASS; those remain parent semantic decisions.

## Job Lease and child identity

Every delegated workflow job receives a bounded Job Lease containing the decision-bearing information needed by that child: semantic phase/role, objective/acceptance IDs, target/evidence identity, scope/authority, design constraints where relevant, required evidence/risk vectors, selected model/reasoning, stopping conditions, and parent integration method.

Use explicit fresh context for independent workflow children unless a concrete same-job reason requires otherwise. Use retained `resume` only while the same bounded job, role, target identity, capability requirement, and independence assumptions remain valid.

## Model preferences and reasoning

`extensions/workflow/index.ts` exposes workflow-only ordered preference hints for the reused builtin `scout`, `researcher`, `worker`, and `reviewer`. The current first candidate is Luna for all four, but this is not a pin or native fallback chain.

The parent evaluates capability, modality/context, independence/diversity, current availability, and cost before every launch and passes a concrete model explicitly.

Reasoning is selected per Job Lease. Builtin thinking values are defaults, not workflow pins. Broad independent audits may justify high reasoning. Deterministic verification carriers and routine failure triage normally use a low-cost model and only the reasoning needed for their bounded work.

Before each delegated turn, report semantic job/phase, runtime agent, concrete selected provider/model, selected reasoning, and rationale. After terminal state, report selected model, selected reasoning, effective model, effective reasoning, and fallback status. If effective reasoning remains unavailable after one native status inspection, report `effective reasoning: UNPROVEN`.

## Pi runtime mechanics

`pi-subagents` owns agent discovery, `workflowScript`, child lifecycle/status/wait/stop/resume, worktrees, missions, receipts/artifacts/usage, native acceptance/gates, supervisor coordination, model execution, and operational fallback.

This repository must not add a custom launcher, scheduler, lifecycle manager, mission clone, worktree manager, acceptance engine, delegation scorecard, or workflow state machine around those functions.

## `workflow_models`

The `workflow_models` fact surface reports live model/catalog/session facts and workflow preference hints for reused builtins. It does **not** rank model quality, decide capability sufficiency, choose models, decide delegation, or perform semantic fallback.

## Layout

```text
.
├─ AGENTS.md
├─ README.md
├─ settings.json
├─ mcp.json
├─ prompts/
│  └─ workflow.md
├─ extensions/
│  ├─ subagent/config.json
│  └─ workflow/index.ts
└─ workflow/
   └─ global-workflow.md
```

`settings.json` pins `pi-mcp-adapter@2.26.0`, `pi-subagents@0.50.0`, `pi-web-access@0.16.0`, and `pi-effort` at Git commit `06183a6276d98ac039e52678273e9f8342552f9c`. Dependency upgrades should trigger a targeted recheck of the builtin roles and native seams this repository relies on.
