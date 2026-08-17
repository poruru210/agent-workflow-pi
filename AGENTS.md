## Global workflow bootstrap

Before substantive task action, first classify whether the compact branch is allowed. Compact is allowed only when all of these are affirmatively true: the task is short, single-purpose, read-only, and low-risk; it needs no implementation, file or setting change, diagnostic/test execution, formal code review or audit beyond the detailed policy's low-risk simple-review exception, external-action planning, external write, delegation, multi-agent work, correction cycle, release/operation decision, or persistent checkpoint; its answer will not authorize or materially influence an external action or material decision; it does not depend on volatile identity/freshness; and a wrong answer cannot cause material medical, financial, security, safety, privacy, legal, production, or irreversible harm. For compact work, record only `objective/question, target/source, source time or version, allowed scope, answer and limits`.

If any condition is false or uncertain, or the work grows beyond that compact record, read `~/.pi/agent/workflow/global-workflow.md` completely before the next substantive action and follow it as the detailed source of truth. Higher-priority instructions and more specific applicable project instructions still control scope and permissions.

### Pi workflow harness

The parent Pi process owns orchestration, phase transitions, evidence integration, correction convergence, and Go/No-Go. `extensions/workflow/index.ts` is a small Pi-native harness: it exposes the live model catalog and runs bounded child Pi SDK sessions. It does not replace the detailed workflow with a second policy engine.

Before every delegated job:

1. Freeze or update the versioned Job Lease required by the detailed workflow.
2. Call `workflow_models` with the Job Lease's hard requirements where known. Use the live Pi catalog to eliminate incompatible models by current availability, context, modality, and reasoning support. Apply the detailed workflow's model-selection gate: establish capability sufficiency before optimizing risk-adjusted cost. Do not use a fixed role-to-model map, and do not infer quality from price or model name alone.
3. Choose reasoning separately from the model.
4. Show the user the job/purpose, selected `provider/model`, requested reasoning level, and short rationale before delegation.
5. Call `workflow_delegate` with the exact role, model, reasoning level, working directory, Job Lease id/version, and complete bounded Job Lease text. Put multiple jobs in one call only when they are independent and safe to run concurrently; dependent jobs require separate calls after integrating prior evidence.

`workflow_delegate` creates in-memory child Pi sessions through the Pi SDK. Child context files, skills, prompt templates, themes, and ambient extensions are disabled. The selected `agents/<role>.md` supplies the child role prompt and tool allowlist. Therefore the Job Lease must contain the exact bounded objective, scope, authority, target/snapshot/evidence identity, required context, expected result/evidence, and stopping conditions the child needs. Do not rely on the child inheriting this global workflow. Child sessions cannot invoke this workflow harness recursively.

The harness returns child output plus turn/token/cache/cost usage. Treat those metrics as routing/efficiency evidence, not correctness evidence. Correctness and completion still require the gates and evidence defined by the detailed workflow.

### Code search

The parent `mcp` proxy provides MCP tools on demand. Prefer Semble semantic search for conceptual or behavioral code discovery in unfamiliar code, then go directly to the returned file/line ranges. Code-centric read-only child roles (`workflow-researcher`, `root-cause-reviewer`, `early-auditor`, `final-auditor`, and code/configuration cases of `pre-action-auditor`) may independently use the pinned Semble CLI through their existing read-only `bash` tool instead of inheriting the parent's MCP extension. Use literal grep when exhaustive exact-occurrence coverage is required. Do not repeat the same search through Semble and grep without a specific reason. Semble may update its own cache but must not modify the target repository.
