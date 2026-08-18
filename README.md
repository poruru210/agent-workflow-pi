# agent-workflow-pi

Personal Pi configuration. The repository is intended to be the Pi agent directory itself (`~/.pi/agent`), not a separately installed workflow product.

## Design

Pi remains the runtime and user-facing harness. The detailed workflow stays normative as one file at `workflow/global-workflow.md`; it is not split or reimplemented as a TypeScript workflow engine. `AGENTS.md` is the bootstrap plus the small Pi runtime binding.

Delegated execution uses `pi-subagents` directly. This repository does not wrap or reimplement its child execution, workflowScript orchestration, lifecycle, cancellation, usage accounting, session handling, acceptance machinery, or diagnostics.

The only custom workflow extension is `extensions/workflow/index.ts`:

- `workflow_models` — inspect the live Pi model catalog with hard filters and pagination, including context/modality/reasoning/thinking-level/price metadata for per-job selection.

```text
parent Pi
  ├─ AGENTS.md
  │    └─ section-scoped workflow/global-workflow.md
  ├─ workflow_models
  │    └─ live model capability / thinking / price metadata
  ├─ subagent  (pi-subagents)
  │    ├─ { agent, task } for one bounded child
  │    ├─ workflowScript only when real sequence/parallel orchestration is useful
  │    ├─ role from agents/<role>.md
  │    └─ runtime lifecycle / usage / cancellation handled by pi-subagents
  └─ mcp  (pi-mcp-adapter)
       └─ lazy MCP discovery for the parent (Semble initially)
```

The boundary is deliberate:

- Markdown policy decides direct vs delegated execution, T0/T1/T2, audit requirements, evidence, and completion.
- `pi-subagents` owns subagent runtime mechanics and its native runtime contracts.
- `workflow_models` exists only because the workflow chooses models dynamically per job rather than keeping a fixed role→model table.
- No separate workflow engine, delegation facade, performance database, watchdog policy, or completion hook is added in the first version.

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
│  ├─ subagent/config.json      # pi-subagents compact parent-facing guidance
│  └─ workflow/index.ts         # workflow_models only
└─ workflow/
   └─ global-workflow.md        # detailed policy source of truth
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
- `pi-subagents@0.50.0`

`extensions/subagent/config.json` uses pi-subagents' supported `toolDescriptionMode: "compact"`; this reduces parent prompt overhead without replacing the package's safety guidance. Pi auto-discovers `extensions/workflow/index.ts`; `mcp.json` defines Semble.

## Delegation with pi-subagents

The parent uses the installed `subagent` tool directly. There is intentionally no workflow-specific delegation facade.

Prefer the simplest native execution shape:

- one bounded job: `{ agent, task }`;
- actual sequence/parallel dependency: `workflowScript`;
- management/status/doctor: native `action` commands.

Workflow role files use pi-subagents frontmatter and do not pin models. `acceptanceRole` declares writer vs read-only semantics so package acceptance inference does not depend on custom role names.

All custom workflow roles use fresh conversation context, do not inherit the parent's skills catalog, and deliberately set `inheritProjectContext: false`. In Pi this prevents the child from reloading both the global workflow bootstrap and ancestor project context. Project-specific rules that matter to a job must therefore be included in its Job Lease or passed as explicit reads. This keeps the child bounded without asking it to recursively interpret the parent workflow.

Ambient child extensions remain disabled. Code-centric read-only roles use Semble through their bounded `bash` allowlist when semantic discovery is useful.

`bash` is not an operating-system read-only sandbox. The read-only roles restrict it by role contract and Job Lease. Do not add a permission subsystem merely to restate that contract; if representative work demonstrates that hard command enforcement is necessary, use an existing Pi mechanism rather than building one here.

Each delegated turn still carries the bounded Job Lease required by `global-workflow.md`. Runtime completion or package acceptance status is evidence about the child run; it is not, by itself, the workflow's semantic PASS.

## Dynamic model selection

`workflow_models` may be called before the delegation value decision when live availability/capability/price materially affects whether delegation is worthwhile. Catalog inspection itself is not delegation.

The policy remains authoritative:

1. inspect live candidates when needed;
2. establish minimum capability sufficiency for the concrete Job Lease;
3. choose model and reasoning level separately, using the live supported thinking levels;
4. compare direct execution and delegation using risk-adjusted total cost;
5. if delegation is useful, launch the bounded job through pi-subagents.

Price and model names are metadata, not intelligence rankings. There is no fixed role→model table or local model-performance database.

## Code search / Semble

`pi-mcp-adapter` exposes MCP to the parent through a compact proxy. The initial server is Semble:

```text
uvx --from semble[mcp]==0.5.5 semble
```

Child roles currently keep Semble simple by using its CLI through `bash`:

```bash
uvx --from "semble[mcp]==0.5.5" semble search "<query>" .
```

Prefer Semble for conceptual/behavioral discovery and grep for exhaustive literal occurrence coverage. A future direct-MCP child configuration is only justified if it measurably improves safety or cost without adding setup fragility.

## Validation order

Do not begin with an expensive natural-language E2E. Validate from cheapest to most diagnostic:

1. restart Pi and run `/subagents-doctor`;
2. explicitly launch one cheap read-only child and one bounded writer/reviewer smoke as needed;
3. confirm `workflow_models` reports expected live model/thinking metadata;
4. only then run a natural-language E2E with no harness hints.

For harness-isolation E2E, use a fixture outside the user's home-directory ancestor chain (for example `D:\\pi-harness-e2e`) so an unrelated `~/AGENTS.md` is not silently added to Pi's project context.

## Evolution rule

Use Pi and pi-subagents as designed. Add a workflow hook, permission layer, custom execution API, or narrower facade only after a representative E2E demonstrates a concrete gap that the existing runtime cannot cleanly cover.

Measure outcome quality, mandatory independent-audit execution, duplicate reasoning/review loops, parent/child turns, token/cache usage, total cost, and convergence. Do not optimize architecture by counting mechanisms or tool parameters in isolation.
