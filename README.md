# agent-workflow-pi

Personal Pi configuration. The repository is intended to be the Pi agent directory itself (`~/.pi/agent`), not a separately installed workflow product.

## Design

Pi remains the runtime and user-facing harness. This repository adds only the workflow-specific layer that Pi deliberately leaves open to extensions.

The detailed source workflow stays normative as one file at `workflow/global-workflow.md`. It is not split and is not translated wholesale into TypeScript. `AGENTS.md` is a small bootstrap: compact low-risk work stays cheap; substantive work loads the full policy.

A single Pi extension, `extensions/workflow/index.ts`, adds two tools:

- `workflow_models` — query the live Pi model catalog with hard filters and pagination.
- `workflow_delegate` — run one to four bounded Job Leases as isolated in-memory Pi SDK child sessions.

```text
parent Pi
  ├─ AGENTS.md
  │    └─ compact or workflow/global-workflow.md
  ├─ workflow_models
  │    └─ live availability / context / reasoning / modality / price metadata
  ├─ workflow_delegate
  │    ├─ role from agents/<role>.md
  │    ├─ explicit model + thinking
  │    └─ isolated in-memory child Pi session(s)
  │         └─ code-centric researcher/reviewer roles may use Semble CLI via read-only bash
  └─ mcp
       └─ lazy MCP discovery for the parent (Semble initially)
```

The extension intentionally does **not** add a workflow database, generic DAG language, background run manager, duplicate session format, fixed role→model table, or another policy engine. Sequential workflow remains visible to the parent Pi; independent jobs can be parallelized by putting them in one `workflow_delegate` call.

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
│  └─ workflow/
│     └─ index.ts
└─ workflow/
   └─ global-workflow.md
```

Pi credentials, sessions, package caches, and runtime state are ignored by Git.

## Setup

For a fresh Pi user directory:

```bash
git clone https://github.com/poruru210/agent-workflow-pi ~/.pi/agent
```

If `~/.pi/agent` already contains credentials or sessions, preserve those files and place this repository there without deleting runtime state. `auth.json`, `sessions/`, `npm/`, `git/`, and `state/` are intentionally untracked.

Pi auto-discovers `extensions/workflow/index.ts`. `settings.json` loads `pi-mcp-adapter`, and `mcp.json` defines Semble.

## Dynamic model selection

Immediately before delegation, the parent calls `workflow_models` with known hard requirements such as minimum context size, reasoning support, image input, provider, or a search string. Results are paginated instead of dumping the entire model catalog into context.

The full workflow policy remains authoritative for selection:

1. establish minimum capability sufficiency for the concrete Job Lease;
2. eliminate incompatible/unavailable candidates from live Pi metadata;
3. choose reasoning independently;
4. among sufficiently capable candidates, optimize risk-adjusted cost.

Price and model names are not treated as intelligence rankings. There is deliberately no fixed role→model mapping or local model-performance database at this stage.

## Pi SDK subagents

`workflow_delegate` accepts one to four jobs. Jobs in the same call are independent and run concurrently; dependent work is delegated in later calls after the parent integrates prior evidence.

Each job supplies:

- versioned Job Lease id;
- role;
- exact `provider/model`;
- thinking level;
- complete bounded Job Lease text;
- optional working directory.

For each child, the extension uses Pi's own `ModelRuntime`, `createAgentSession`, `SessionManager.inMemory`, and `DefaultResourceLoader`. Ambient context files, skills, prompt templates, themes, and extensions are disabled, so the child does not load the global workflow or recursively become another orchestrator.

The selected role file provides both the role prompt and tool allowlist. A role is therefore just a Markdown file:

```markdown
---
tools: read,bash
---
You are a bounded reviewer. ...
```

Adding a new role does not require changing the TypeScript extension; add another `agents/<role>.md` file with a `tools:` declaration and its bounded instructions.

The child result returned to the parent includes output and turn/input/output/cache/cost usage. Long output is clipped in model context while the complete result remains in tool details. Usage is efficiency/routing evidence only; workflow correctness still comes from the required audit/test/evidence gates.

## Code search / Semble

`pi-mcp-adapter` exposes MCP to the parent through one compact proxy tool and discovers concrete MCP tools on demand. Servers are lazy by default. The initial server is Semble:

```text
uvx --from semble[mcp]==0.5.5 semble
```

Child sessions intentionally do not reload the MCP adapter. Instead, code-centric read-only roles that need independent semantic discovery use Semble directly through their existing `bash` tool:

```bash
uvx --from "semble[mcp]==0.5.5" semble search "<query>" .
```

This applies to `workflow-researcher`, `root-cause-reviewer`, `early-auditor`, `final-auditor`, and to `pre-action-auditor` when the audited target is a code/configuration repository. Semble may write only its own cache; it must not modify the target repository. Use grep when exhaustive literal occurrence coverage is required.

This keeps semantic discovery independent inside researcher/reviewer roles without adding child-side MCP lifecycle, extension selection, or another tool-routing layer.

## Why this boundary

The objective is not to minimize lines of code at any cost. It is to keep Pi's substrate reusable while putting only workflow-specific behavior in the extension.

Pi owns model/auth/session/tool/context mechanics. The custom harness owns dynamic delegation policy and bounded worker execution. The Markdown workflow owns the detailed normative process. More lifecycle machinery should be added only when a concrete workflow requirement cannot be expressed cleanly through these existing layers.
