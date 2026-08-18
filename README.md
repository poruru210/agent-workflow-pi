# agent-workflow-pi

Personal Pi configuration intended to live as the Pi agent directory (`~/.pi/agent`).

The repository provides an **opt-in, evidence-driven engineering workflow** on top of Pi and `pi-subagents`.

## Core design

The original workflow came from a less extensible harness, so much of its orchestration had to be expressed as prompt policy. On Pi, the mechanism should be simpler while preserving the workflow semantics.

The final responsibility split is:

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

The repository does **not** implement a second workflow engine around Pi.

## Explicit activation

`workflow/global-workflow.md` is not ambient policy for every Pi interaction.

Normal Pi use remains normal Pi use. The engineering workflow is activated explicitly with the Pi prompt template:

```text
/workflow <request>
```

`prompts/workflow.md` expands into a prompt for the **current parent Pi**. It tells that parent to apply `workflow/global-workflow.md` to the supplied request. It does not itself launch a subagent.

Do not add heuristics that automatically activate the workflow because a task is difficult, involves code, looks risky, or appears to benefit from delegation. Explicit user activation is the boundary.

Using Pi's native `subagent` capability outside an activated workflow is also just ordinary Pi usage; it does not implicitly enable this engineering workflow.

### Activation is not delegation

Once `/workflow` is activated, the workflow's own delegation-opportunity and execution-allocation gates decide how work is performed.

A valid activated run may therefore use:

- parent-direct execution only;
- one delegated child;
- parallel delegated children;
- a mixture of direct and delegated work where the phases are independent and the workflow permits it.

If delegation overhead exceeds its expected risk-adjusted benefit, the parent performs the work directly while still following the activated workflow's objective, evidence, phase, and completion rules.

Conversely, parent-direct implementation does not waive independent evidence. If the workflow requires T1/T2 independent review, a separate independent reviewer or mechanism is still required.

## Semantic source of truth

`workflow/global-workflow.md` remains the detailed semantic policy after explicit activation. It owns concepts such as:

- primary objective, minimum required outcome, and prohibited substitute outcomes;
- work definition, scope, authority, and preservation constraints;
- risk classification and baseline applicability;
- C0 acceptance-set completeness;
- result key and independent-refutation key;
- T0 / T1 / T2 Evidence Route and R/F/C/E/D/O risk vectors;
- root-cause (`RC`) and verification-escape (`VER`) reasoning;
- test-system root cause (`TEST-RC`);
- intervention (`INT`), change-safety (`CHG`), and continuity (`CONT`) packets;
- U0 / U1 verification populations and test-intervention history;
- implementation snapshot and release-candidate semantics;
- Evidence Dependency Map and evidence reuse;
- early audit, final audit, and pre-action audit semantics;
- finding reachability, change causation, materiality, and harm classification;
- correction/convergence and audit/test re-entry;
- external-write readiness, freshness, post-action verification, and recovery;
- completion and Go / No-Go.

These are semantic/evidence concepts. They are not converted into TypeScript classes or a custom phase state machine merely because they have names and transitions in the policy.

## `AGENTS.md`

`AGENTS.md` is intentionally thin.

It defines only stable Pi-side binding rules and the explicit activation boundary. It no longer mandates `global-workflow.md` for every Pi task.

It also records the key rule that workflow activation and delegation are separate decisions.

## Pi runtime mechanics

The installed `pi-subagents` package owns runtime mechanics:

- agent discovery and precedence;
- `workflowScript`, `runs.run`, and `runs.all`;
- sequential and parallel child execution;
- child lifecycle, status, wait, interrupt, stop, and retained resume;
- managed worktree isolation and handoff artifacts;
- missions, run linkage, artifacts, receipts, and usage records;
- acceptance checks and host-side verification commands;
- supervisor communication;
- native model resolution and per-run overrides;
- provider/runtime fallback handling.

This repository must not add a custom launcher, scheduler, lifecycle manager, mission clone, worktree manager, acceptance engine, or workflow state machine around those functions.

### `workflowScript`

`workflowScript` is execution machinery for a bounded child wave, not the semantic workflow itself.

The parent first decides the current phase/gate. It then launches only the child work needed for that phase. A giant script that automatically loops through implementation, review, repair, test, and release until it sees PASS would bypass semantic correction/convergence decisions and is therefore not the target design.

## Job Lease and child identity

Every delegated workflow job receives a bounded Job Lease containing the decision-bearing information needed by that child, such as:

- objective / acceptance IDs;
- phase and role;
- exact target / snapshot / evidence identity;
- scope, exclusions, and authority;
- expected output and evidence;
- Evidence Route / risk vector where relevant;
- selected model/reasoning configuration;
- stopping and escalation conditions;
- parent integration method.

Use retained `resume` only when the same bounded job remains valid: same purpose, role, target identity, scope, capability requirement, and independence assumptions.

Spawn a fresh child when those semantics change, including implementation → audit, diagnosis → correction, early → final audit, a new blind-first challenge, materially changed target identity, changed independence requirement, or changed capability contract.

## Workflow-specific roles

The configured roles are native Pi agent definitions, not runtime subsystems:

- `workflow-researcher`
- `workflow-implementer`
- `root-cause-reviewer`
- `early-auditor`
- `workflow-tester`
- `final-auditor`
- `pre-action-auditor`

Their prompts remain small and role-specific. They do not contain copies of the global workflow. Concrete objective, evidence, scope, identity, authority, and stopping conditions come from the Job Lease.

These custom roles intentionally use fresh/minimal context where boundedness or independence matters.

## Model and reasoning selection

Model policy remains a parent semantic decision. Model resolution/execution uses Pi and `pi-subagents` native mechanisms.

Native precedence is:

```text
per-run override
    ↓
agent frontmatter model
    ↓
subagents.agentOverrides.<name>.model
    ↓
subagents.defaultModel
    ↓
parent session model
```

A role may use native `model:` as a normal default when a stable role default is actually desired. Per-run override still wins.

A role with no `model:` does not dynamically select the best model by itself; it eventually inherits a configured/default/parent model. When the activated workflow needs an explicit capability choice, the parent selects from current live facts and supplies a per-run override.

Model and reasoning are separate decisions. Workflow roles do not statically pin one thinking level just because they are auditors or implementers. The parent chooses the lowest sufficient supported effort for the current Job Lease.

Native `fallbackModels` are for provider/runtime failures such as quota, rate limit, authentication, timeout, overload, or unavailable model. They are not a semantic escalation mechanism for a weak or incorrect result.

## `workflow_models`

`extensions/workflow/index.ts` exposes one deliberately small custom tool: `workflow_models`.

Its purpose is only to expose **live model facts** that are useful to the activated parent workflow and are not otherwise available in one comparable catalog.

It may report:

- available provider/model IDs;
- context window and maximum output metadata;
- input modality;
- reasoning capability;
- supported thinking levels derived using Pi/pi-subagents-compatible registry semantics;
- price metadata from the live registry;
- current parent model / thinking state.

It does **not**:

- implement `workflowPreferredModel`;
- scan role files for custom model preferences;
- rank model quality;
- map roles to models;
- infer intelligence from model names such as mini/flash/pro;
- decide delegation;
- decide semantic fallback or escalation.

The parent consumes facts and applies the activated workflow's model/reasoning gate.

## Acceptance and deterministic evidence

Use native acceptance and `gate` where they establish deterministic runtime facts economically.

For example, a host-run test command passing against the tracked workspace is stronger evidence than a child merely claiming it ran the command.

But:

```text
runtime verified/reviewed
    ≠ C0 PASS
    ≠ blind-first PASS
    ≠ T1/T2 semantic closure
    ≠ change-safety closure
    ≠ release PASS
```

Acceptance status is evidence consumed by the parent; it does not replace the workflow's semantic gates.

## Missions and state

Missions are durable recovery/receipt records rather than the semantic workflow engine.

Use native mission/state facilities for run identities, lifecycle, artifacts, decisions, receipts, usage, recovery after restart/compaction, and small durable checkpoints where useful.

Do not mirror the entire semantic workflow into a second persistent state machine.

## Worktrees and snapshots

Managed worktrees solve writer isolation and patch handoff. They are not equivalent to the workflow's implementation snapshot or release candidate.

Workflow snapshot identity can include source/worktree state, configuration, dependencies, toolchain inputs, generated artifacts, package/runtime/environment identity, work-definition version, and evidence identity. The parent decides when those semantics are sufficiently fixed.

## Public pi-subagents seams

Use `pi-subagents/preflight` only when exact resolved child launch-contract details are genuinely decision-bearing.

Use `pi-subagents/delegation` only if a custom extension truly needs to own a child launch. Normal activated workflow execution should use the ordinary `subagent` / `workflowScript` path instead.

Neither API is a reason to add another workflow runtime.

## Code search

`pi-mcp-adapter` exposes configured MCP tools to the parent; this repository currently configures Semble. Workflow roles can also use bounded read-only CLI discovery where their role permits it.

Do not add another search abstraction unless representative work demonstrates a real gap.

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
│  └─ workflow/index.ts              # workflow_models live facts only
└─ workflow/
   └─ global-workflow.md             # normative only after explicit activation
```

`settings.json` currently pins `pi-mcp-adapter@2.26.0` and `pi-subagents@0.50.0`. The Pi binding in this repository is designed against the installed `pi-subagents@0.50.0` behavior; upgrading that package should trigger a targeted recheck of the native seams this repository relies on.
