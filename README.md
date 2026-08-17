# agent-workflow-pi

Personal Pi configuration. The repository is intended to be the Pi agent directory itself (`~/.pi/agent`), not a separately installed workflow product.

## Design

Pi remains the runtime and user-facing harness. The detailed workflow stays normative as one file at `workflow/global-workflow.md`; it is not split or reimplemented as a TypeScript workflow engine. `AGENTS.md` is the bootstrap plus the small Pi runtime binding that maps runtime-specific orchestration terms onto Pi.

Delegated execution uses the existing `pi-subagents` package directly. This repository does not wrap or reimplement its child-session execution, parallelism, chaining, cancellation, lifecycle, usage accounting, or acceptance machinery.

The only custom workflow extension is `extensions/workflow/index.ts`, which exposes one narrow tool:

- `workflow_models` — inspect the live Pi model catalog with hard filters and pagination, including capability and price metadata used by the workflow's model/delegation decision.

```text
parent Pi
  ├─ AGENTS.md
  │    └─ compact or workflow/global-workflow.md
  ├─ workflow_models
  │    └─ live availability / context / reasoning / modality / price metadata
  ├─ subagent  (pi-subagents)
  │    ├─ role from agents/<role>.md
  │    ├─ per-run model + thinking when selected
  │    ├─ fresh/fork context and bounded child execution
  │    └─ usage / lifecycle / cancellation handled by pi-subagents
  └─ mcp  (pi-mcp-adapter)
       └─ lazy MCP discovery for the parent (Semble initially)
```

The boundary is deliberate:

- Markdown policy decides direct vs delegated execution, T0/T1/T2, audit requirements, evidence, and completion; Pi-specific runtime terms are interpreted by the binding in `AGENTS.md`.
- `pi-subagents` owns subagent runtime mechanics.
- `workflow_models` supplies live model metadata when availability/capability/price affect the decision.
- No fixed role→model map is kept in this repository.

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
│     └─ index.ts              # workflow_models only
└─ workflow/
   └─ global-workflow.md       # detailed policy source of truth
```

Pi credentials, sessions, package caches, and runtime state are ignored by Git.

## Setup

For a fresh Pi user directory:

```bash
git clone https://github.com/poruru210/agent-workflow-pi ~/.pi/agent
```

If `~/.pi/agent` already contains credentials or sessions, preserve those files and place this repository there without deleting runtime state. `auth.json`, `sessions/`, `npm/`, `git/`, and `state/` are intentionally untracked.

`settings.json` pins and loads:

- `pi-mcp-adapter@2.26.0`
- `pi-subagents@0.40.0`

Pi auto-discovers `extensions/workflow/index.ts`; `mcp.json` defines Semble.

## Delegation with pi-subagents

The parent uses the installed `subagent` tool directly. There is intentionally no workflow-specific delegation facade in the first version.

Workflow role files use `pi-subagents` agent frontmatter. They do not pin a model, so the parent can choose a currently appropriate model per job. They default to:

- `systemPromptMode: replace`
- `inheritProjectContext: false`
- `inheritSkills: false`
- `defaultContext: fresh`
- no ambient child extensions (`extensions:` is empty)

This keeps researcher/reviewer/auditor jobs independent from the parent workflow context and prevents recursive orchestration unless a future role explicitly needs it. Read-only roles that retain `bash` disable `pi-subagents`' implementation completion guard because their job is verification, not implementation.

Each delegated turn must still carry the bounded Job Lease required by `global-workflow.md`. Runtime completion is not semantic PASS; the parent integrates the returned evidence under the workflow's normal gates.

`pi-subagents` is intentionally used with its normal model-facing tool surface in this first version. We do not pre-emptively reduce its schema. If representative E2E tasks show measurable tool-selection confusion, context overhead, or unnecessary orchestration, a narrower facade can be added later based on evidence.

## Dynamic model selection

`workflow_models` may be called before the delegation value decision when live availability/capability/price materially affects whether delegation is worthwhile. Catalog inspection itself is not delegation.

The policy remains authoritative:

1. inspect live candidates when needed;
2. establish minimum capability sufficiency for the concrete Job Lease;
3. compare direct execution and delegation using risk-adjusted total cost;
4. if delegation is useful, choose model and reasoning separately;
5. start the bounded job through `pi-subagents`.

Price and model names are metadata, not intelligence rankings. There is no fixed role→model table or local model-performance database.

## Code search / Semble

`pi-mcp-adapter` exposes MCP to the parent through a compact proxy. The initial server is Semble:

```text
uvx --from semble[mcp]==0.5.5 semble
```

Workflow child roles intentionally have no ambient extensions. Code-centric read-only roles that need independent semantic discovery use Semble directly through their existing `bash` allowlist:

```bash
uvx --from "semble[mcp]==0.5.5" semble search "<query>" .
```

This applies to `workflow-researcher`, `root-cause-reviewer`, `early-auditor`, `final-auditor`, and to `pre-action-auditor` for code/configuration repositories. Semble may update its own cache but must not modify the audited target. Use grep when exhaustive literal occurrence coverage is required.

## Evolution rule

Do not add a workflow engine, run database, completion hook, permission layer, or delegation facade merely because Pi can support one. Add machinery only after a representative E2E demonstrates a concrete gap that cannot be handled cleanly by the product-neutral policy plus existing Pi/pi-subagents mechanisms.

The first measurements should focus on outcome quality, independent-audit execution, duplicate reasoning/review loops, parent/child turns, token/cache usage, total cost, and convergence—not on minimizing the number of tool parameters by assumption.
