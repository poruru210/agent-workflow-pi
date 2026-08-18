# agent-workflow-pi

Personal Pi configuration. This repository is intended to be the Pi agent directory itself (`~/.pi/agent`).

## Design principle

The workflow came from a Codex-oriented implementation where most control had to be expressed through `AGENTS.md` and a large Markdown workflow because the harness itself could not be changed. On Pi, that implementation mechanism is not sacred.

What remains authoritative is the **workflow semantics** in `workflow/global-workflow.md`: objectives, work-definition and baseline rules, phase ordering, delegation gates, execution-versus-verification allocation, T0/T1/T2 evidence routes, blind-first independence, snapshot/release-candidate identity, early/final/pre-action audit semantics, correction/convergence behavior, and completion conditions. Pi-specific mechanisms may replace Codex-specific mechanisms only when those semantics remain intact.

```text
workflow/global-workflow.md
  normative workflow semantics
             │
             ▼
AGENTS.md
  thin Pi bootstrap + semantic-to-runtime mapping
             │
             ├───────────────┐
             ▼               ▼
extensions/workflow       pi-subagents
  runtime facts            child runtime
  model preference         workflowScript / runs
  live model catalog       lifecycle / artifacts
             │               │
             └───────┬───────┘
                     ▼
                  child Pi
```

The goal is **not** to translate the workflow into a TypeScript state machine. Judgment-bearing gates such as delegation value, risk, T0/T1/T2, materiality, evidence sufficiency, and Go/No-Go remain in the workflow. Pi/SDK code is used for deterministic runtime facts and native execution boundaries.

## Responsibility boundary

### `workflow/global-workflow.md`

The sole detailed source of truth for workflow semantics. It is deliberately not rewritten as a Pi-specific workflow engine.

### `AGENTS.md`

Only the bootstrap and Pi runtime mapping. It tells the parent how semantic concepts map onto Pi mechanisms and how to load the detailed workflow by phase. It must not accumulate duplicate copies of workflow policy to fix individual E2E symptoms.

### `extensions/workflow/index.ts`

A small Pi-native runtime adapter, not an orchestrator. It currently does two things:

1. exposes `workflow_models`, which returns live model/capability/thinking/price facts plus the current parent model and configured preferred subagent model;
2. injects the configured preferred subagent model into the parent system prompt as a runtime preference.

It does not decide delegation, audit requirements, evidence routes, or completion.

### `pi-subagents`

Owns child discovery, native `workflowScript` execution, one-child and multi-child scheduling, lifecycle, artifacts, model overrides, recovery, acceptance machinery, and usage reporting. This repository does not wrap those mechanics.

If a future deterministic integration needs the exact resolved child contract, use the public `pi-subagents/preflight` API. If an extension itself ever needs to launch a child, use the public structured `pi-subagents/delegation` API rather than introducing a custom launcher. Those APIs are preferred seams, but are not added merely because they exist.

## Runtime model preference

`workflow/runtime.json` may contain:

```json
{
  "preferredSubagentModel": "openai-codex/gpt-5.6-luna"
}
```

Semantics:

- an explicit user instruction for a particular job wins;
- otherwise, the configured preferred model is preferred when it is available and capability-sufficient for that Job Lease;
- the preference may be bypassed for concrete capability, modality/context, availability, T2/diversity, or other workflow-mandated reasons;
- if the setting is absent or null, subagent model selection is fully dynamic;
- the preferred model is **not** a fixed intelligence ranking and does not weaken minimum capability requirements.

The current personal preference is `openai-codex/gpt-5.6-luna` so well-bounded jobs do not drift to unfamiliar models merely because they appear in the catalog.

### Thinking / effort

Thinking is always a separate per-job decision. No role or preferred model pins a permanent effort level. `workflow_models` reports each model's live `supportedThinkingLevels`; the parent chooses the lowest sufficient level for the current Job Lease under the model/reasoning gate in `global-workflow.md`.

Therefore a selected model change causes a fresh effort decision. A requested `medium` is not blindly carried onto a model that only exposes `low/high/max`, and a model that supports broader effort levels is not permanently stuck at one level.

## Delegation

The parent uses the installed `subagent` tool directly. There is no workflow-specific delegation facade.

Configured semantic roles are:

- `workflow-researcher`
- `workflow-implementer`
- `root-cause-reviewer`
- `early-auditor`
- `workflow-tester`
- `final-auditor`
- `pre-action-auditor`

These are **role contracts**, not copies of the workflow. The exact claims, scope, evidence, authority, identity, risk vectors, and stopping conditions come from the Job Lease created by the parent under `global-workflow.md`.

Custom roles use fresh/minimal context and do not recursively inherit the global workflow. This preserves independence and prevents child sessions from reinterpreting the entire parent policy. Project-specific constraints required by a child must therefore be carried in the Job Lease or supplied as explicit reads.

A parent-direct implementation is valid when the original delegation-opportunity gate says delegation overhead exceeds its benefit. A writer child is valid when the same gate says it provides positive risk-adjusted value. Worker count is never a quota.

## Review output and artifacts

Read-only audit roles still use `bash` for bounded Git/hash/code inspection, so pi-subagents considers them mutation-capable for output handling. For an audit result consumed immediately by the parent, launch the child with `output:false`; the inline result is consumed directly while normal lifecycle/debug artifacts remain enabled. Durable named output is used only when a later stage genuinely needs a stable file reference.

This is a Pi runtime workaround for the observed Windows output-path issue, not a workflow semantic rule.

## Code search

`pi-mcp-adapter` exposes MCP to the parent; the initial server is Semble. Child roles may use Semble CLI through bounded `bash` where semantic discovery is actually necessary. Grep remains appropriate for exhaustive literal coverage.

Do not add another search abstraction unless representative tasks show a real gap.

## Pi SDK usage rule

Use Pi/SDK mechanisms when they can make a **deterministic runtime fact or boundary** more reliable or cheaper than prompt prose. Examples include:

- live model registry and supported thinking levels;
- user runtime preference injection via `before_agent_start`;
- child launch-contract resolution through `pi-subagents/preflight` when decision-bearing;
- structured extension-to-child delegation through `pi-subagents/delegation` if an extension truly needs to own a launch;
- Pi lifecycle/tool hooks when a concrete, repeated failure shows that prompt-only enforcement is insufficient.

Do **not** use SDK hooks merely to duplicate semantic judgment already defined by the workflow. In particular, avoid a custom phase engine, delegation quota, model-performance database, permission subsystem, or mutation watchdog unless a measured representative gap justifies it.

## Validation philosophy

Evaluate the Pi port against the original workflow semantics, not against the original Codex implementation technique.

A change is good only when it preserves required outcome/acceptance quality and workflow assurance while improving or maintaining risk-adjusted total cost, convergence, diagnosability, and independence. Passing one E2E is not proof of general superiority.

When an E2E exposes a problem, diagnose in this order:

1. Did the behavior violate the original workflow semantics?
2. If yes, is the cause missing/ambiguous semantic policy, or failure to map/enforce an existing rule on Pi?
3. If the semantic rule already exists, prefer a Pi-native mapping/runtime fix rather than duplicating the rule in `AGENTS.md`.
4. Add an SDK/runtime mechanism only when it closes a concrete gap more cleanly than native Pi/pi-subagents behavior.
5. Re-test the affected representative path, then stop once the decision-bearing gap is closed.

## Layout

```text
.
├─ AGENTS.md
├─ settings.json
├─ mcp.json
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
│  └─ workflow/index.ts
└─ workflow/
   ├─ global-workflow.md
   └─ runtime.json
```

`settings.json` pins `pi-mcp-adapter@2.26.0` and `pi-subagents@0.50.0`. Pi credentials, sessions, package caches, and runtime state are ignored by Git.
