# agent-workflow-pi

Personal Pi configuration intended to live as the Pi agent directory (`~/.pi/agent`).

The repository provides an **opt-in, evidence-driven engineering workflow** on top of Pi and `pi-subagents`.

## Core design

The workflow semantics remain in `workflow/global-workflow.md`; Pi and `pi-subagents` provide execution mechanics. The repository must not recreate a second workflow engine around Pi.

```text
explicit /workflow activation
        │
        ▼
workflow/global-workflow.md
  semantic source of truth
        │
        ▼
current parent Pi
  objective / risk / phase / evidence judgment
  direct-vs-delegate decision
  model + reasoning selection
  Job Lease construction
  evidence integration
  Go / No-Go
        │
        ├─────────────────────────────┐
        ▼                             ▼
 parent-direct execution         pi-subagents
                             workflowScript / runs
                             agents / worktrees
                             missions / artifacts
                             acceptance / lifecycle
                             resume / supervisor
        │                             │
        └──────────────┬──────────────┘
                       ▼
                parent semantic gate
```

## Explicit activation

`workflow/global-workflow.md` is not ambient policy for every Pi interaction.

Normal Pi use remains normal Pi use. The engineering workflow is activated explicitly with:

```text
/workflow <request>
```

`prompts/workflow.md` expands into a prompt for the **current parent Pi**. It does not itself launch a subagent. Do not add heuristics that automatically activate the workflow because a task is difficult, involves code, looks risky, or appears to benefit from delegation.

Using Pi's native `subagent` capability outside an activated workflow also does not implicitly enable this engineering workflow.

### Activation is not delegation

Once `/workflow` is activated, the workflow's own delegation-opportunity and execution-allocation gates decide how work is performed. A valid run may use parent-direct execution, one child, parallel children, or a mixture where the workflow permits it.

If delegation overhead exceeds its risk-adjusted benefit, the parent works directly. Parent-direct implementation does not waive independent T1/T2 evidence when the workflow requires it.

For a non-trivial exploration or implementation phase, parent-direct is not selected from an unexpanded intuition that the parent is faster. The parent first names at least one ready bounded worker package and compares it against direct work: instruction/lease cost, launch/wait cost, shared-state coordination, integration/reverification, expected wall-clock effect, and quality/risk benefit. If the implementation materially expands in file count, responsibility boundaries, expected duration, blockers, or independent packages, that checkpoint is run again. This makes the decision observable without turning subagent count into a quota.

## Semantic source of truth

After explicit activation, `workflow/global-workflow.md` remains authoritative for objectives, work definition, risk, baseline, C0, T0/T1/T2, RC/VER/TEST-RC/INT/CHG/CONT, U0/U1, implementation snapshots, release-candidate identity, evidence dependencies, audits, convergence, external-write readiness, and completion.

These are semantic/evidence concepts. They are not converted into a custom TypeScript phase machine.

## Pi runtime mechanics

The installed `pi-subagents` package owns runtime mechanics:

- agent discovery and definition precedence;
- `workflowScript`, `runs.run`, and `runs.all`;
- sequential and parallel child execution;
- lifecycle, status, wait, interrupt, stop, and retained resume;
- managed worktrees and handoff artifacts;
- missions, run linkage, receipts, artifacts, and usage;
- acceptance and host-side gates;
- supervisor communication;
- native model execution and per-run overrides;
- operational provider/runtime fallback.

This repository must not add a custom launcher, scheduler, lifecycle manager, mission clone, worktree manager, acceptance engine, or workflow state machine around those functions.

`workflowScript` is bounded execution machinery. The parent decides the semantic phase before launching a wave; a giant automatic review/fix/test loop must not replace workflow convergence judgment.

## Job Lease and child identity

Every delegated job receives a bounded Job Lease containing the decision-bearing information needed by that child: objective/acceptance IDs, phase and role, exact target/evidence identity, scope and authority, expected evidence, risk vector where relevant, selected model, stopping conditions, and parent integration method.

Use retained `resume` only while the same bounded job remains valid. Spawn fresh when role, target identity, independence requirement, or capability contract materially changes.

## Workflow-specific roles

The configured workflow roles are native Pi agent definitions, not runtime subsystems:

- `workflow-researcher`
- `workflow-implementer`
- `root-cause-reviewer`
- `early-auditor`
- `workflow-tester`
- `final-auditor`
- `pre-action-auditor`

Their prompts stay small and role-specific. Concrete objective, evidence, scope, identity, authority, and stopping conditions come from the Job Lease.

## Ordered model preferences, not model pins

Workflow model preference is **per role, ordered, editable, and non-binding**.

A role may declare:

```yaml
workflowPreferredModels:
  - openai-codex/gpt-5.6-luna
  - some-provider/another-model
```

The order expresses preference only. It does **not** mean:

- the first model is always used;
- the list is a capability ceiling;
- models outside the list are forbidden;
- the list is Pi's operational `fallbackModels` chain;
- any reasoning/effort level is implied.

The list can contain one model, several models, or be absent. Users may change the models and their order per role.

For each delegated workflow Job Lease, the parent selects a concrete model as follows:

1. honor an explicit user model instruction when compatible with higher-priority constraints;
2. otherwise examine `workflowPreferredModels` in order and choose the first candidate that is currently available, capability-sufficient, and compatible with the workflow's modality/context, independence, and diversity requirements;
3. skip unavailable or capability-insufficient candidates and continue through the ordered list;
4. if none is suitable, or no preference list exists, select dynamically from the full live catalog.

The parent may also deliberately choose outside the list when the workflow requires it. T2 model diversity is a typical example: one independent lane may need a different model even if the first preferred candidate is otherwise sufficient.

The selected model is then passed as an explicit per-run override. Activated workflow children must not silently fall through to parent-model inheritance.

### Reasoning / effort is fully dynamic

`workflowPreferredModels` contains **models only**. It never pins or recommends a thinking level.

For every Job Lease, the parent independently chooses the lowest sufficient reasoning level supported by the selected model, based on ambiguity, depth, harm, evidence burden, and verification requirements. A model change always triggers a fresh effort decision. Effort from a prior model or prior job is never carried forward automatically.

This preserves the intended split:

```text
preferred model candidates  → ordered hints
capability/risk judgment     → parent semantic decision
reasoning/effort             → fully dynamic per Job Lease
execution                    → native Pi/pi-subagents
```

## `workflow_models`

`extensions/workflow/index.ts` exposes a small `workflow_models` fact surface. It reports live model facts such as:

- available provider/model IDs;
- context window and maximum output metadata;
- input modality;
- reasoning capability;
- supported thinking levels;
- price metadata from the live registry;
- current parent model/thinking state;
- ordered session model scope, when configured, including its priority;
- each workflow role's ordered `workflowPreferredModels`, including role priority, current availability, and matching session priority when present.

For compatibility, the extension also normalizes the legacy scalar `workflowPreferredModel` into the same ordered list representation.

`workflow_models` does **not** decide capability sufficiency, rank quality, select a model, map roles to an intelligence tier, decide delegation, or perform semantic fallback. The activated parent consumes facts and applies `global-workflow.md`.

## Model disclosure and runtime identity

Before each delegated workflow turn, the user should see the bounded job/role, the **concrete selected provider/model**, the selected reasoning level, and the selection rationale. `parent inherited`, `default`, or equivalent is not sufficient disclosure.

After every delegated turn reaches a terminal state, report five fields: **selected model, selected reasoning, effective model, effective reasoning, and fallback status**. Use effective metadata already returned by `pi-subagents`, or inspect native run status once. `pi-subagents@0.50.0` exposes/stores runtime `model`, `thinking`, and `attemptedModels`; those values take precedence over inference from a successful launch or the absence of mismatch notifications. If effective reasoning is still not exposed after one status inspection, report `effective reasoning: UNPROVEN` while retaining the accepted selected reasoning as a separate fact. If fallback or another effective value differs from the selected value, disclose it explicitly.

Native `fallbackModels` remain only for provider/runtime failures such as quota, rate limit, authentication, timeout, overload, or unavailable model. They are not the semantic preference mechanism and do not replace parent capability judgment.

## Acceptance, missions, and worktrees

Native acceptance and host `gate` commands provide deterministic execution evidence where appropriate, but runtime `verified`/`reviewed` is not automatically C0 PASS, T1/T2 closure, change-safety closure, or release PASS.

Missions/state are durable recovery and receipt mechanisms rather than the semantic workflow engine.

Managed worktrees solve writer isolation and patch handoff; they are not equivalent to the workflow's implementation snapshot or release candidate.

## Public pi-subagents seams

Use `pi-subagents/preflight` only when exact resolved launch-contract details are genuinely decision-bearing. Use `pi-subagents/delegation` only if an extension truly needs to own a child launch. Normal activated workflow execution should use native `subagent` / `workflowScript` paths.

## Layout

```text
.
├─ AGENTS.md                         # thin normal-Pi guidance; no ambient workflow
├─ README.md
├─ settings.json
├─ mcp.json
├─ prompts/
│  └─ workflow.md                    # explicit /workflow activation
├─ agents/
│  ├─ workflow-researcher.md
│  ├─ workflow-implementer.md
│  ├─ root-cause-reviewer.md
│  ├─ early-auditor.md
│  ├─ workflow-tester.md
│  ├─ final-auditor.md
│  └─ pre-action-auditor.md
├─ extensions/
│  ├─ subagent/config.json
│  └─ workflow/index.ts              # live facts + ordered preference metadata only
└─ workflow/
   └─ global-workflow.md             # normative only after explicit activation
```

`settings.json` pins `pi-mcp-adapter@2.26.0`, `pi-subagents@0.50.0`, and `pi-effort` at Git commit `06183a6276d98ac039e52678273e9f8342552f9c`. Upgrading any of those dependencies should trigger a targeted recheck of the native seams this repository relies on.
