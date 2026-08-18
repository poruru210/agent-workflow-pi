# agent-workflow-pi

Personal Pi configuration intended to live as the Pi agent directory (`~/.pi/agent`).

The repository provides an **opt-in, evidence-driven engineering workflow** on top of Pi and `pi-subagents`.

## Core design

`workflow/global-workflow.md` owns workflow semantics. Pi and `pi-subagents` own execution mechanics and generic agent personas. This repository should add only the workflow-specific binding that is not already native.

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
        ├────────────────────────────────────────┐
        ▼                                        ▼
 tiny/integration work                    pi-subagents builtins
                                          scout / worker / reviewer
                                          + custom roles only where needed
        │                                        │
        └──────────────────┬─────────────────────┘
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

The parent retains whole-task decisions:

- user objective and acceptance conditions;
- risk and scope;
- whole-task architecture and public/component responsibility boundaries;
- planned semantic delta and preservation contract;
- work decomposition and Job Leases;
- model/reasoning selection;
- child-result integration;
- implementation-snapshot and release-candidate identity;
- finding materiality and Go/No-Go.

For non-trivial candidate-bearing implementation, repair, or migration, the normal writer is the **builtin `worker`**. Give it a coherent bounded package, normally including tightly coupled runtime, public types, focused tests, and documentation for the same change. Use multiple writer packages only when ownership/integration boundaries are genuinely independent.

The worker decides local implementation details inside the approved lease. If it discovers that the frozen objective, architecture/responsibility boundary, semantic delta, preservation contract, scope, or authority must materially change, it escalates the decision instead of silently redesigning the task.

Parent-direct candidate editing is an exception for genuinely tiny/mechanical edits, formatter-only corrections, narrow integration/conflict resolution, unavailable/inapplicable delegation, or cases where a coherent writer lease cannot be formed without the parent effectively doing the same implementation work. Immediate wall-clock savings alone are not enough to bypass the writer boundary.

## Reuse pi-subagents builtin agents

The workflow intentionally reuses generic builtin personas rather than cloning them into workflow-specific copies.

| Workflow need | Runtime agent | Notes |
|---|---|---|
| Fast local code reconnaissance | builtin `scout` | Use when compressed code context would preserve parent context. |
| Bounded research using the current Semble/bash evidence surface | `workflow-researcher` | Kept because its required tool surface is not the bundled web-researcher contract. |
| Candidate-bearing implementation/repair/migration | builtin `worker` | Run with explicit fresh context and a bounded Job Lease. |
| Blind root-cause challenge | builtin `reviewer` | Phase-specific Job Lease; fresh context. |
| Early implementation audit | builtin `reviewer` | Phase-specific Job Lease; fresh context. |
| Verification partitions | `workflow-tester` | No equivalent builtin role currently used. |
| Final release-candidate audit | builtin `reviewer` | Phase-specific Job Lease; fresh context. |
| External-write pre-action audit | builtin `reviewer` | Phase-specific Job Lease; fresh context. |

Generic `worker`/`reviewer` behavior stays upstream-owned by `pi-subagents`. Do not eject or copy those prompts merely to add workflow terminology.

### Reviewer independence

Builtin `reviewer` already provides general review discipline and high-reasoning review behavior. The workflow adds phase semantics through the Job Lease rather than a duplicate persona.

Independent reviewer runs use explicit `context: "fresh"`. Project instructions may still be inherited, but the parent conversation and prior reviewer context are not implicitly forked into the child.

The Job Lease separates two classes of input:

**Authoritative contract/raw evidence supplied before blind-first review**

- original requirement/source of truth;
- parent-approved architecture/responsibility boundary;
- acceptance criteria and preservation contract;
- baseline and exact snapshot/release-candidate identity;
- raw diff or other identity-bound evidence;
- scope, risk vectors, and leased claims.

**Conclusions withheld until initial findings are fixed**

- implementer rationale;
- parent PASS or causal conclusion;
- prior reviewer conclusions;
- test conclusions except where raw test evidence is required by the phase.

The reviewer should finish every safely reviewable leased claim before returning, even after finding a blocker. This is intended to produce a complete finding set per snapshot and reduce repeated `review → fix → review → fix` cycles.

Because builtin `reviewer` is read-only, the parent may mechanically prepare hashes and a raw diff/snapshot manifest. Mechanical identity proof remains separate from semantic review.

## Semantic source of truth

After activation, `workflow/global-workflow.md` remains authoritative for objectives, work definition, risk, baseline, C0, T0/T1/T2, RC/VER/TEST-RC/INT/CHG/CONT, U0/U1, implementation snapshots, release-candidate identity, evidence dependencies, audits, convergence, external-write readiness, and completion.

These are semantic/evidence concepts. They are not converted into a custom TypeScript state machine.

## Pi runtime mechanics

The installed `pi-subagents` package owns:

- builtin agent discovery and precedence;
- `workflowScript`, `runs.run`, and `runs.all`;
- child lifecycle, status, wait, stop, and retained resume;
- managed worktrees and handoff artifacts;
- missions, receipts, artifacts, and usage;
- acceptance and host-side gates;
- supervisor coordination;
- native model execution and operational fallback.

This repository must not add a custom launcher, scheduler, lifecycle manager, mission clone, worktree manager, acceptance engine, delegation scorecard, or workflow state machine around those functions.

## Job Lease and child identity

Every delegated workflow job receives a bounded Job Lease containing the decision-bearing information needed by that child: semantic phase/role, objective and acceptance IDs, target/evidence identity, scope and authority, architecture/responsibility boundaries where relevant, planned semantic delta and preservation contract for candidate-bearing work, required evidence/risk vectors, selected model/reasoning, stopping conditions, and parent integration method.

Use explicit fresh context for workflow `worker` and independent `reviewer` runs unless a concrete same-job reason requires otherwise. Use retained `resume` only while the same bounded job, role, target identity, capability requirement, and independence assumptions remain valid.

## Model preferences and reasoning

Workflow model preferences remain ordered, editable hints rather than model pins. Custom workflow roles may declare `workflowPreferredModels` in frontmatter. Reused builtin runtime roles (`worker` and `reviewer`) receive equivalent workflow-only preference metadata from the `workflow_models` fact surface without changing the bundled agent definitions.

Current preferred candidate for both reused builtins is:

```text
openai-codex/gpt-5.6-luna
```

The parent still evaluates capability, modality/context, independence/diversity, and current availability before every launch and passes the selected concrete model explicitly. Native `fallbackModels` are only for provider/runtime failure.

Reasoning is selected per Job Lease. Builtin thinking values are defaults, not workflow pins. Independent audit reasoning should not be reduced merely to save tokens when stronger reasoning is likely to reduce missed findings and repeated review/fix rounds. Broad initial early/final/root-cause/pre-action reviews may justifiably use high reasoning; genuinely narrow differential re-reviews may use less when sufficient.

## `workflow_models`

`extensions/workflow/index.ts` exposes a small fact surface containing:

- live provider/model IDs;
- context/output/modality/reasoning metadata;
- supported thinking levels;
- live price metadata;
- current parent model/thinking state;
- ordered session model scope;
- ordered workflow model preferences for custom roles and reused builtin `worker`/`reviewer`.

It does **not** decide capability sufficiency, rank model quality, choose a model, decide delegation, or perform semantic fallback.

Before each delegated turn, report the semantic job/phase, runtime agent, concrete selected provider/model, selected reasoning, and rationale. After a terminal result, report selected model, selected reasoning, effective model, effective reasoning, and fallback status. If effective reasoning is unavailable after one native status inspection, report `effective reasoning: UNPROVEN` rather than inferring it.

## Acceptance, missions, and worktrees

Native acceptance and host `gate` commands provide deterministic execution evidence where appropriate, but runtime `verified`/`reviewed` does not automatically establish C0 PASS, T1/T2 closure, change-safety closure, or release PASS.

Missions/state are durable recovery and receipt mechanisms, not the semantic workflow engine. Managed worktrees solve writer isolation and patch handoff; they are not the workflow's implementation snapshot or release candidate.

## Layout

```text
.
├─ AGENTS.md
├─ README.md
├─ settings.json
├─ mcp.json
├─ prompts/
│  └─ workflow.md
├─ agents/
│  ├─ workflow-researcher.md          # custom tool surface still required
│  └─ workflow-tester.md              # custom verification role
├─ extensions/
│  ├─ subagent/config.json
│  └─ workflow/index.ts               # live facts + workflow model preferences
└─ workflow/
   └─ global-workflow.md               # normative only after explicit activation
```

`settings.json` pins `pi-mcp-adapter@2.26.0`, `pi-subagents@0.50.0`, and `pi-effort` at Git commit `06183a6276d98ac039e52678273e9f8342552f9c`. Upgrading those dependencies should trigger a targeted recheck of the builtin roles and native seams this repository relies on.
