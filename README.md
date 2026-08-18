# agent-workflow-pi

Personal Pi configuration intended to live as the Pi agent directory (`~/.pi/agent`).

The repository provides an **opt-in, evidence-driven engineering workflow** on top of Pi. Its purpose is to preserve the original workflow's objective, evidence, authority, and phase boundaries without turning Pi into a custom multi-agent runtime.

## Core design

`workflow/global-workflow.md` owns workflow semantics. `skills/agent-workflow/SKILL.md` owns the compact/normal bootstrap. Pi, `pi-subagents`, and `pi-review` own generic execution mechanics.

```text
explicit /workflow
        │
        ▼
agent-workflow skill
  compact eligibility
        │
        ├─ COMPACT ──> parent direct answer
        │
        └─ NORMAL
             │
             ▼
     workflow/global-workflow.md
       semantic source of truth
             │
             ▼
          parent Pi
     architecture / contracts
     decomposition / model choice
     evidence integration / Go-No-Go
             │
      ┌──────┴──────────────────────────┐
      │                                 │
      ▼                                 ▼
Pi-native execution               candidate-bearing change
(parent / pi-subagents /                  │
native tools as appropriate)              ▼
                                   Early Audit Gate
                                          │
                                     verification
                                          │
                                          ▼
                                   Final Audit Gate
                                          │
                                          ▼
                                    completion eligible
```

The workflow does **not** define a semantic `worker`, `reviewer`, `researcher`, or other SubAgent role. Named Pi agents are capabilities the parent may choose when they satisfy the current bounded job contract.

## Explicit activation and compact bootstrap

Normal Pi use remains normal Pi use. Activate the workflow with:

```text
/workflow <request>
```

The command loads `skills/agent-workflow/SKILL.md`. Compact mode is allowed only when every original compact condition is affirmatively true: short, single-purpose, read-only, low-risk, no change/test/audit/delegation/external action/correction/release decision, no volatile identity dependency, and no material harm from a wrong answer. Any false or uncertain condition enters the normal workflow.

This prevents the workflow machinery itself from becoming the objective for trivial read-only work.

## Boundary-first execution

The parent retains whole-task decisions: objective/acceptance, scope/risk, architecture/responsibility boundaries, planned semantic delta, preservation contract, decomposition, model/reasoning choice, evidence integration, snapshot/release identity, finding materiality, correction scope, and Go/No-Go.

Available execution mechanisms include builtin `scout`, `researcher`, `worker`, `reviewer`, `oracle`, `delegate`, native `acceptance.verify` / `gate`, direct parent execution, and the pinned `pi-review` extension. The parent chooses among them; running a particular named mechanism does not itself satisfy a semantic phase. Workflow-only tools are disabled outside explicit workflow activation and enabled before the activated agent turn.

## Required Early / Final Audit Gate

Candidate-bearing normal-workflow changes have two mandatory independent code-audit gates:

```text
implementation/correction complete
          ↓
implementation snapshot frozen
          ↓
EARLY AUDIT GATE
          ↓
findings integrated/dispositioned
          ↓
verification / integration
          ↓
release candidate frozen
          ↓
FINAL AUDIT GATE
          ↓
parent Go/No-Go
```

`extensions/workflow/audit-gate.ts` is the small mechanical interlock for these two gates. It intentionally does not implement the rest of the workflow as a state machine.

### What the Gate enforces

For each audit attempt it:

- freezes a Git candidate identity covering HEAD, tracked diff/status, and untracked-file hashes;
- records the parent-selected audit model and reasoning;
- invokes the pinned `pi-review` in `--fresh` mode;
- applies the selected model/reasoning **after** the fresh review branch is created;
- reduces review tools to `read` + `bash` and blocks other tool calls;
- detects persistent candidate mutation after each review shell result and at audit completion;
- consumes `pi-review:started`, `pi-review:settled`, and `pi-review:ended` lifecycle events;
- persists the complete independent review output and identity/model/verdict evidence;
- closes a gate only for an unchanged candidate, `correct` verdict, expected fresh/return lifecycle, and matching effective model/reasoning;
- refuses Final until Early is closed for the exact same current identity.

Receipts are identity-bound rather than manually invalidated. If a correction changes the candidate, the prior receipt no longer matches and is stale automatically.

When `/workflow` changes the Git candidate, an `agent_settled` interlock prevents silent completion. Open gates cause a continuation requiring the missing audit; once both ordered receipts are closed, the parent must integrate the evidence, finish the semantic Go/No-Go judgment, and explicitly call `workflow_audit_gate action=complete`. That final call rechecks the unchanged current identity, so any post-Final edit makes the receipts stale again.

The Gate does **not** decide finding materiality, verification sufficiency, semantic acceptance, review-target coverage, or Go/No-Go. Those remain parent decisions under `global-workflow.md`. Identity binding proves which candidate existed during the audit; the parent must ensure the selected `pi-review` target covers the scope claimed by that audit.

The current mechanical identity adapter requires a Git working tree. Non-Git tasks still use the semantic workflow but do not receive this Git identity interlock.

## pi-review fork

This configuration pins the generic integration-enabled fork:

```text
git:github.com/poruru-code/pi-review@15c1ddb3211ca781f64b537e47ca70518fbd8c31
```

The fork remains generic: it publishes machine-readable review lifecycle events, review IDs, strict verdicts, and selector-free `--fresh` / `/end-review` actions. It contains no Early/Final/workflow-specific concepts. Those meanings live only in this repository.

## Research and implementation mechanisms

Use Pi-native mechanisms only when they improve the critical path, quality, independence, or context efficiency.

- `scout`: fast local reconnaissance.
- `researcher` + `pi-web-access`: official docs/spec/upstream/web evidence.
- `worker`: generic bounded execution when delegation is useful.
- `reviewer`: generic fresh independent review/challenge when appropriate outside or in addition to the dedicated Early/Final gate.
- `oracle` / `delegate`: when their generic semantics fit.

These are not mandatory workflow phases or a fixed routing table.

Builtin `scout`/`researcher` can create default `context.md`/`research.md` files. Workflow calls should normally use `output: false` or an explicit non-candidate artifact path when those defaults would dirty the candidate.

## Verification without expensive log ingestion

Verification is separate from audit. After the applicable Early Gate, prefer native deterministic `acceptance.verify` or `gate` where possible. Use a low-cost capability-sufficient carrier only when a SubAgent is useful; do not inherit the parent model by accident.

For verbose/full/E2E commands, store full output outside candidate-bearing files and return concise status/counts/failures/bounded tail/path/identity. Preserve failed logs for triage; do not repeatedly ingest successful full logs.

## `workflow_models`

`extensions/workflow/index.ts` exposes `workflow_models`, a live **fact surface** for available models, context/modality/reasoning capability, supported thinking levels, price metadata, session scope, current parent model, and preference hints.

It does not rank model quality, decide capability sufficiency, or select the model. The parent chooses a concrete model/reasoning per bounded job. Audit reasoning should not be reduced merely to save tokens when stronger reasoning is likely to reduce missed findings or repeated correction rounds.

## Pi runtime ownership

`pi-subagents` owns generic child discovery, lifecycle, worktrees, missions/artifacts, native acceptance, execution, and operational fallback. This repository does not add another launcher, scheduler, DAG language, mission format, worktree manager, acceptance engine, or generic SubAgent state machine.

`pi-review` owns generic code-review behavior. This repository consumes its public lifecycle seam rather than copying its reviewer prompt or embedding workflow semantics into the fork.

## Layout

```text
.
├─ AGENTS.md
├─ README.md
├─ settings.json
├─ mcp.json
├─ prompts/
│  └─ workflow.md
├─ skills/
│  └─ agent-workflow/
│     └─ SKILL.md
├─ extensions/
│  ├─ subagent/
│  │  └─ config.json
│  └─ workflow/
│     ├─ index.ts
│     └─ audit-gate.ts
└─ workflow/
   └─ global-workflow.md
```

## Setup

For a fresh Pi user directory:

```bash
git clone https://github.com/poruru210/agent-workflow-pi ~/.pi/agent
```

If `~/.pi/agent` already contains credentials, sessions, package caches, or machine-local overrides, preserve them. `auth.json`, runtime sessions/state/caches, logs, environment files, and local-only overrides are intentionally not repository content.

`settings.json` pins the runtime packages this configuration depends on. Dependency upgrades should trigger a targeted recheck of the native seams used by this repository rather than a wholesale rewrite of the workflow.
