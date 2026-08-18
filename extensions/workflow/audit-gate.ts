import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { createHash, randomUUID } from "node:crypto";

const WORKFLOW_STATE = "workflow-audit-session-v1";
const AUDIT_RECEIPT = "workflow-audit-receipt-v1";
const REVIEW_STARTED = "pi-review:started";
const REVIEW_SETTLED = "pi-review:settled";
const REVIEW_ENDED = "pi-review:ended";

const THINKING = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;
type Thinking = (typeof THINKING)[number];
type Phase = "early" | "final";
type Verdict = "correct" | "needs_attention" | "unknown";
type ModelRef = { provider: string; id: string };

type Identity = {
  repoRoot: string;
  head: string;
  hash: string;
  statusHash: string;
  diffHash: string;
  untrackedHash: string;
};

type WorkflowState = {
  schemaVersion: 1;
  activationId: string;
  active: boolean;
  cwd: string;
  startedAt: string;
  baseline?: Identity;
  completedAt?: string;
  completionReason?: "explicit-completion" | "superseded-without-candidate-change";
};

type AuditReceipt = {
  schemaVersion: 1;
  activationId: string;
  attemptId: string;
  phase: Phase;
  status: "closed" | "open";
  reasons: string[];
  candidate: Identity;
  reviewArgs: string;
  contract: string;
  selectedModel: ModelRef;
  selectedThinking: Thinking;
  effectiveModel?: ModelRef;
  effectiveThinking?: string;
  reviewId?: string;
  reviewTarget?: unknown;
  verdict?: Verdict;
  reviewAction?: string;
  assistantMessageId?: string;
  responseText?: string;
  responseHash?: string;
  blockedTools: string[];
  identityAfter?: Identity;
  startedAt: string;
  settledAt?: string;
  endedAt?: string;
  finishedAt: string;
};

type ActiveAudit = {
  activationId: string;
  attemptId: string;
  phase: Phase;
  candidate: Identity;
  reviewArgs: string;
  contract: string;
  selectedModel: ModelRef;
  selectedThinking: Thinking;
  parentModel?: ModelRef;
  parentThinking: Thinking;
  parentTools: string[];
  startedAt: string;
  reviewId?: string;
  reviewTarget?: unknown;
  verdict?: Verdict;
  assistantMessageId?: string;
  responseText?: string;
  settledAt?: string;
  endedAt?: string;
  reviewAction?: string;
  effectiveModel?: ModelRef;
  effectiveThinking?: string;
  runtimeApplied: boolean;
  runtimeError?: string;
  blockedTools: string[];
  mutationDetected: boolean;
  endQueued: boolean;
};

type ReviewStarted = { reviewId?: string; target?: unknown; mode?: string };
type ReviewSettled = {
  reviewId?: string;
  verdict?: Verdict;
  settledAt?: string;
  assistantMessageId?: string;
  responseText?: string;
};
type ReviewEnded = {
  reviewId?: string;
  mode?: string;
  action?: string;
  finalVerdict?: Verdict;
  endedAt?: string;
};

const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const modelKey = (model?: ModelRef) => (model ? `${model.provider}/${model.id}` : undefined);
const compact = (value: string) => value.replace(/\s+/g, " ").trim();
const quoteArg = (value: string) => `"${compact(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

function response(payload: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload) }],
    details: payload,
  };
}

function failure(payload: Record<string, unknown>): never {
  throw new Error(JSON.stringify(payload));
}

async function candidateIdentity(pi: ExtensionAPI, cwd: string): Promise<Identity | undefined> {
  const root = await pi.exec("git", ["rev-parse", "--show-toplevel"], { cwd, timeout: 10_000 });
  if (root.code !== 0 || !root.stdout.trim()) return undefined;
  const repoRoot = root.stdout.trim();
  const [head, status, diff] = await Promise.all([
    pi.exec("git", ["rev-parse", "HEAD"], { cwd: repoRoot, timeout: 10_000 }),
    pi.exec("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { cwd: repoRoot, timeout: 20_000 }),
    pi.exec("git", ["diff", "--binary", "--no-ext-diff", "HEAD", "--"], { cwd: repoRoot, timeout: 30_000 }),
  ]);
  if (head.code !== 0 || status.code !== 0 || diff.code !== 0) return undefined;

  const paths = status.stdout
    .split("\0")
    .filter((token) => token.startsWith("?? "))
    .map((token) => token.slice(3))
    .sort();
  const untracked: Array<{ path: string; hash: string }> = [];
  for (const path of paths) {
    const result = await pi.exec("git", ["hash-object", "--no-filters", "--", path], { cwd: repoRoot, timeout: 10_000 });
    untracked.push({ path, hash: result.code === 0 ? result.stdout.trim() : `UNREADABLE:${result.code}` });
  }

  const statusHash = hash(status.stdout);
  const diffHash = hash(diff.stdout);
  const untrackedHash = hash(JSON.stringify(untracked));
  const headSha = head.stdout.trim();
  return {
    repoRoot,
    head: headSha,
    statusHash,
    diffHash,
    untrackedHash,
    hash: hash(JSON.stringify({ head: headSha, statusHash, diffHash, untrackedHash })),
  };
}

function latest<T>(ctx: ExtensionContext, type: string): T | undefined {
  let value: T | undefined;
  for (const entry of ctx.sessionManager.getEntries()) {
    if (entry.type === "custom" && entry.customType === type) value = entry.data as T | undefined;
  }
  return value;
}

function receipts(ctx: ExtensionContext, activationId: string): AuditReceipt[] {
  const result: AuditReceipt[] = [];
  for (const entry of ctx.sessionManager.getEntries()) {
    if (entry.type !== "custom" || entry.customType !== AUDIT_RECEIPT) continue;
    const receipt = entry.data as AuditReceipt | undefined;
    if (receipt?.activationId === activationId) result.push(receipt);
  }
  return result;
}

function receiptFor(all: AuditReceipt[], phase: Phase, identity: string): AuditReceipt | undefined {
  let value: AuditReceipt | undefined;
  for (const receipt of all) {
    if (receipt.phase === phase && receipt.candidate.hash === identity) value = receipt;
  }
  return value;
}

function gate(receipt?: AuditReceipt) {
  if (!receipt) return { state: "open" as const, reason: "no receipt for current candidate identity" };
  if (receipt.status === "open") return { state: "open" as const, attemptId: receipt.attemptId, reasons: receipt.reasons };
  return {
    state: "closed" as const,
    attemptId: receipt.attemptId,
    reviewId: receipt.reviewId,
    verdict: receipt.verdict,
    model: receipt.effectiveModel ?? receipt.selectedModel,
    thinking: receipt.effectiveThinking ?? receipt.selectedThinking,
  };
}

function orderedClosed(all: AuditReceipt[], identity: string) {
  const early = receiptFor(all, "early", identity);
  const final = receiptFor(all, "final", identity);
  const ok =
    early?.status === "closed" &&
    final?.status === "closed" &&
    Date.parse(final.finishedAt) >= Date.parse(early.finishedAt);
  return { early, final, ok };
}

function validateReviewArgs(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return "reviewArgs is required";
  if (/(^|\s)--(?:fresh|current|extra)(?:\s|=|$)/.test(trimmed)) {
    return "reviewArgs must contain only the target; --fresh/--extra are gate-managed";
  }
  const kind = trimmed.split(/\s+/, 1)[0]?.toLowerCase();
  if (!kind || !["uncommitted", "branch", "commit", "folder"].includes(kind)) {
    return "reviewArgs must start with uncommitted, branch, commit, or folder; PR checkout is disallowed inside the identity-bound gate";
  }
  return undefined;
}

function isActivation(text: string) {
  const value = text.trim();
  return /^\/workflow(?:\s|$)/.test(value) || /^\/skill:agent-workflow(?:\s|$)/.test(value);
}

export function registerWorkflowAuditGate(pi: ExtensionAPI) {
  let audit: ActiveAudit | undefined;
  let lastCtx: ExtensionContext | undefined;
  let lastInterlockKey: string | undefined;
  const workflowTools = ["workflow_models", "workflow_audit_gate"] as const;

  function setWorkflowToolsEnabled(enabled: boolean) {
    const active = pi.getActiveTools();
    const set = new Set(active);
    for (const name of workflowTools) enabled ? set.add(name) : set.delete(name);
    const next = [...set];
    if (next.length !== active.length || next.some((name, index) => name !== active[index])) pi.setActiveTools(next);
  }

  async function restoreParentRuntime(current: ActiveAudit): Promise<string | undefined> {
    const ctx = lastCtx;
    if (!ctx) return "parent runtime restore context unavailable";
    const errors: string[] = [];
    try {
      pi.setActiveTools(current.parentTools);
    } catch (error) {
      errors.push(`parent tools restore failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (current.parentModel) {
      try {
        const model = ctx.modelRegistry.find(current.parentModel.provider, current.parentModel.id);
        if (!model) errors.push(`parent model ${modelKey(current.parentModel)} unavailable during restore`);
        else if (!(await pi.setModel(model))) errors.push(`parent model ${modelKey(current.parentModel)} could not be restored`);
      } catch (error) {
        errors.push(`parent model restore failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    try {
      pi.setThinkingLevel(current.parentThinking);
    } catch (error) {
      errors.push(`parent thinking restore failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    return errors.length ? errors.join("; ") : undefined;
  }

  async function finish(ended: ReviewEnded) {
    const current = audit;
    const ctx = lastCtx;
    if (!current?.reviewId || !ctx || ended.reviewId !== current.reviewId) return;

    current.endedAt = ended.endedAt;
    current.reviewAction = ended.action;
    const after = await candidateIdentity(pi, ctx.cwd);
    const reasons: string[] = [];
    if (ended.mode !== "fresh") reasons.push(`review mode ${String(ended.mode)} != fresh`);
    if (ended.action !== "return") reasons.push(`review action ${String(ended.action)} != return`);
    if (current.verdict !== "correct") reasons.push(`review verdict ${current.verdict ?? "missing"} != correct`);
    if (!current.responseText?.trim()) reasons.push("review response evidence unavailable");
    if (!current.assistantMessageId) reasons.push("review assistant message identity unavailable");
    if (!current.reviewTarget) reasons.push("review target evidence unavailable");
    if (!current.settledAt) reasons.push("review settled timestamp unavailable");
    if (!current.endedAt) reasons.push("review ended timestamp unavailable");
    if (ended.finalVerdict !== current.verdict) reasons.push("ended verdict does not match settled verdict");
    if (!current.runtimeApplied) reasons.push("audit runtime was not applied before review execution");
    if (current.runtimeError) reasons.push(current.runtimeError);
    if (modelKey(current.effectiveModel) !== modelKey(current.selectedModel)) {
      reasons.push(`effective model ${modelKey(current.effectiveModel) ?? "UNPROVEN"} != selected ${modelKey(current.selectedModel)}`);
    }
    if (current.effectiveThinking !== current.selectedThinking) {
      reasons.push(`effective thinking ${current.effectiveThinking ?? "UNPROVEN"} != selected ${current.selectedThinking}`);
    }
    if (current.blockedTools.length) reasons.push(`blocked tool attempts: ${[...new Set(current.blockedTools)].join(", ")}`);
    if (current.mutationDetected) reasons.push("candidate mutation detected during audit");
    if (!after) reasons.push("candidate identity after review unavailable");
    else if (after.hash !== current.candidate.hash) reasons.push("candidate identity changed during audit");

    const effectiveModel = current.effectiveModel;
    const effectiveThinking = current.effectiveThinking;
    const restoreError = await restoreParentRuntime(current);
    if (restoreError) reasons.push(restoreError);

    const receipt: AuditReceipt = {
      schemaVersion: 1,
      activationId: current.activationId,
      attemptId: current.attemptId,
      phase: current.phase,
      status: reasons.length ? "open" : "closed",
      reasons,
      candidate: current.candidate,
      reviewArgs: current.reviewArgs,
      contract: current.contract,
      selectedModel: current.selectedModel,
      selectedThinking: current.selectedThinking,
      effectiveModel,
      effectiveThinking,
      reviewId: current.reviewId,
      reviewTarget: current.reviewTarget,
      verdict: current.verdict,
      reviewAction: current.reviewAction,
      assistantMessageId: current.assistantMessageId,
      responseText: current.responseText,
      responseHash: current.responseText ? hash(current.responseText) : undefined,
      blockedTools: [...current.blockedTools],
      identityAfter: after,
      startedAt: current.startedAt,
      settledAt: current.settledAt,
      endedAt: current.endedAt,
      finishedAt: new Date().toISOString(),
    };
    pi.appendEntry(AUDIT_RECEIPT, receipt);
    audit = undefined;

    const reasonText = receipt.reasons.length ? receipt.reasons.map((reason) => `- ${reason}`).join("\n") : "- none";
    pi.sendMessage(
      {
        customType: "workflow-audit-result",
        display: true,
        content:
          `${receipt.phase.toUpperCase()} AUDIT GATE ${receipt.status.toUpperCase()}\n` +
          `Candidate: ${receipt.candidate.hash}\nReview: ${receipt.reviewId ?? "UNPROVEN"}\nReasons:\n${reasonText}\n\n` +
          `Independent review output:\n${receipt.responseText?.trim() || "(unavailable)"}`,
        details: receipt,
      },
      { deliverAs: "followUp", triggerTurn: true },
    );
  }

  pi.events.on(REVIEW_STARTED, (data) => {
    if (!audit) return;
    const event = data as ReviewStarted;
    if (!event.reviewId) {
      audit.runtimeError = "pi-review:started omitted reviewId";
      return;
    }
    if (event.mode !== "fresh") audit.runtimeError = `pi-review started in ${String(event.mode)}, expected fresh`;
    audit.reviewId = event.reviewId;
    audit.reviewTarget = event.target;
  });

  pi.events.on(REVIEW_SETTLED, async (data) => {
    const current = audit;
    if (!current?.reviewId) return;
    const event = data as ReviewSettled;
    if (event.reviewId !== current.reviewId) return;
    current.verdict = event.verdict;
    current.settledAt = event.settledAt;
    current.assistantMessageId = event.assistantMessageId;
    current.responseText = event.responseText;
    if (current.endQueued) return;
    current.endQueued = true;
    const ctx = lastCtx;
    const identity = ctx ? await candidateIdentity(pi, ctx.cwd) : undefined;
    if (!identity || identity.hash !== current.candidate.hash) current.mutationDetected = true;
    pi.sendUserMessage("/end-review return", { deliverAs: "followUp", expandPromptTemplates: true });
  });

  pi.events.on(REVIEW_ENDED, async (data) => {
    await finish(data as ReviewEnded);
  });

  pi.on("session_start", (_event, ctx) => {
    lastCtx = ctx;
    lastInterlockKey = undefined;
    setWorkflowToolsEnabled(latest<WorkflowState>(ctx, WORKFLOW_STATE)?.active === true);
  });
  pi.on("session_tree", (_event, ctx) => {
    lastCtx = ctx;
  });

  pi.on("input", async (event, ctx) => {
    lastCtx = ctx;
    if (event.source !== "extension" && isActivation(event.text)) {
      const state: WorkflowState = {
        schemaVersion: 1,
        activationId: randomUUID(),
        active: true,
        cwd: ctx.cwd,
        startedAt: new Date().toISOString(),
        baseline: await candidateIdentity(pi, ctx.cwd),
      };
      pi.appendEntry(WORKFLOW_STATE, state);
      lastInterlockKey = undefined;
      setWorkflowToolsEnabled(true);
      return { action: "continue" as const };
    }

    // A new ordinary user request ends an unchanged prior workflow activation.
    // Candidate-bearing unfinished work is deliberately not cleared this way.
    if (event.source !== "extension" && !audit) {
      const state = latest<WorkflowState>(ctx, WORKFLOW_STATE);
      if (state?.active) {
        const current = await candidateIdentity(pi, ctx.cwd);
        const unchanged = !state.baseline || !current || current.repoRoot !== state.baseline.repoRoot || current.hash === state.baseline.hash;
        if (unchanged) {
          pi.appendEntry(WORKFLOW_STATE, {
            ...state,
            active: false,
            completedAt: new Date().toISOString(),
            completionReason: "superseded-without-candidate-change",
          } satisfies WorkflowState);
          setWorkflowToolsEnabled(false);
        }
      }
    }

    // pi-review emits started after fresh tree navigation, then sends its review
    // prompt as extension input. Apply the chosen runtime here so branch restore
    // cannot silently replace the requested audit model.
    if (
      event.source === "extension" &&
      audit?.reviewId &&
      !audit.runtimeApplied
    ) {
      const model = ctx.modelRegistry.find(audit.selectedModel.provider, audit.selectedModel.id);
      if (!model) audit.runtimeError = `selected model ${modelKey(audit.selectedModel)} unavailable in review branch`;
      else if (!(await pi.setModel(model))) audit.runtimeError = `selected model ${modelKey(audit.selectedModel)} has no usable credentials`;
      pi.setThinkingLevel(audit.selectedThinking);
      pi.setActiveTools(["read", "bash"]);
      audit.runtimeApplied = true;
    }
    return { action: "continue" as const };
  });

  pi.on("before_agent_start", (_event, ctx) => {
    lastCtx = ctx;
    if (!audit?.reviewId) return;
    audit.effectiveModel = ctx.model ? { provider: ctx.model.provider, id: ctx.model.id } : undefined;
    audit.effectiveThinking = ctx.thinkingLevel;
    if (!audit.runtimeApplied) audit.runtimeError = "review agent started before audit runtime was applied";
  });
  pi.on("model_select", (event, ctx) => {
    lastCtx = ctx;
    if (audit?.reviewId && !audit.settledAt) audit.effectiveModel = { provider: event.model.provider, id: event.model.id };
  });
  pi.on("thinking_level_select", (event, ctx) => {
    lastCtx = ctx;
    if (audit?.reviewId && !audit.settledAt) audit.effectiveThinking = event.level;
  });
  pi.on("agent_end", (_event, ctx) => {
    lastCtx = ctx;
    if (!audit?.reviewId || audit.settledAt) return;
    audit.effectiveModel = ctx.model ? { provider: ctx.model.provider, id: ctx.model.id } : audit.effectiveModel;
    audit.effectiveThinking = ctx.thinkingLevel ?? audit.effectiveThinking;
  });

  pi.on("tool_call", (event, ctx) => {
    lastCtx = ctx;
    if (!audit?.reviewId) return;
    if (audit.mutationDetected) {
      return { block: true, terminate: true, reason: "Candidate mutation was already detected; audit attempt is invalidated." };
    }
    if (event.toolName !== "read" && event.toolName !== "bash") {
      audit.blockedTools.push(event.toolName);
      return { block: true, reason: "Independent audit permits read/bash inspection only." };
    }
  });
  pi.on("tool_result", async (event, ctx) => {
    lastCtx = ctx;
    if (!audit?.reviewId || event.toolName !== "bash") return;
    const identity = await candidateIdentity(pi, ctx.cwd);
    if (!identity || identity.hash !== audit.candidate.hash) audit.mutationDetected = true;
  });

  // This does not run the workflow. It only prevents a candidate-bearing
  // activation from silently settling without the two required receipts and an
  // explicit final close by the parent.
  pi.on("agent_settled", async (_event, ctx) => {
    lastCtx = ctx;
    if (audit) return;
    const state = latest<WorkflowState>(ctx, WORKFLOW_STATE);
    if (!state?.active || !state.baseline) return;
    const current = await candidateIdentity(pi, ctx.cwd);
    if (!current || current.repoRoot !== state.baseline.repoRoot || current.hash === state.baseline.hash) return;

    const all = receipts(ctx, state.activationId);
    const closed = orderedClosed(all, current.hash);
    const interlockKey = `${state.activationId}:${current.hash}:${closed.early?.attemptId ?? "none"}:${closed.early?.status ?? "open"}:${closed.final?.attemptId ?? "none"}:${closed.final?.status ?? "open"}`;
    if (lastInterlockKey === interlockKey) return;
    lastInterlockKey = interlockKey;
    const content = closed.ok
      ? `Workflow completion interlock: Early and Final receipts are closed for ${current.hash}, but the workflow is not explicitly complete. Integrate the evidence, preserve the frozen candidate, finish the semantic Go/No-Go judgment, then call workflow_audit_gate action=complete. Any candidate change makes the receipts stale.`
      : `Workflow completion interlock: candidate state changed, but required audit receipts are open for ${current.hash}. Early: ${JSON.stringify(gate(closed.early))}. Final: ${JSON.stringify(gate(closed.final))}. Continue the normative workflow: close Early before verification/finalization, then close Final on the unchanged release candidate. Do not claim completion.`;
    pi.sendMessage(
      {
        customType: "workflow-audit-interlock",
        display: true,
        content,
        details: {
          activationId: state.activationId,
          candidate: current,
          early: gate(closed.early),
          final: gate(closed.final),
          readyForExplicitCompletion: closed.ok,
        },
      },
      { deliverAs: "followUp", triggerTurn: true },
    );
  });

  pi.registerTool({
    name: "workflow_audit_gate",
    label: "Workflow Audit Gate",
    description:
      "Start, inspect, or explicitly complete the two identity-bound audit gates for an activated /workflow request. begin freezes the current Git candidate identity, applies the parent-chosen audit model/reasoning after pi-review enters its fresh branch, captures the independent result, and closes only on exact lifecycle/identity/model/verdict conditions. Final requires Early for the same identity. complete closes the mechanical completion interlock after ordered receipts (or no candidate change). This tool does not choose models or decide finding materiality.",
    parameters: Type.Object({
      action: Type.Union([Type.Literal("status"), Type.Literal("begin"), Type.Literal("complete")]),
      phase: Type.Optional(Type.Union([Type.Literal("early"), Type.Literal("final")])),
      reviewArgs: Type.Optional(Type.String()),
      contract: Type.Optional(Type.String()),
      provider: Type.Optional(Type.String()),
      model: Type.Optional(Type.String()),
      thinking: Type.Optional(Type.Union([Type.Literal("off"), Type.Literal("minimal"), Type.Literal("low"), Type.Literal("medium"), Type.Literal("high"), Type.Literal("xhigh"), Type.Literal("max")])),
    }),
    async execute(_id, params, _signal, _update, ctx) {
      lastCtx = ctx;
      const state = latest<WorkflowState>(ctx, WORKFLOW_STATE);
      const current = await candidateIdentity(pi, ctx.cwd);
      const all = state && current ? receipts(ctx, state.activationId) : [];
      const closed = current ? orderedClosed(all, current.hash) : { early: undefined, final: undefined, ok: false };

      if (params.action === "status") {
        return response({
          active: state?.active ?? false,
          activationId: state?.activationId,
          baseline: state?.baseline,
          candidate: current,
          candidateChanged: current && state?.baseline ? current.hash !== state.baseline.hash : undefined,
          early: gate(closed.early),
          final: gate(closed.final),
          auditInProgress: audit ? { attemptId: audit.attemptId, phase: audit.phase, reviewId: audit.reviewId } : undefined,
        });
      }

      if (params.action === "complete") {
        if (!state?.active) return failure({ ok: false, error: "No active /workflow request." });
        if (!current || !state.baseline || current.repoRoot !== state.baseline.repoRoot) {
          return failure({ ok: false, error: "Stable Git baseline/current identity pair unavailable; mechanical completion cannot be established." });
        }
        const changed = current.hash !== state.baseline.hash;
        if (changed && !closed.ok) {
          return failure({
            ok: false,
            error: "Candidate-bearing workflow requires ordered Early and Final receipts for the exact current identity.",
            candidate: current,
            early: gate(closed.early),
            final: gate(closed.final),
          });
        }
        pi.appendEntry(WORKFLOW_STATE, {
          ...state,
          active: false,
          completedAt: new Date().toISOString(),
          completionReason: "explicit-completion",
        } satisfies WorkflowState);
        lastInterlockKey = undefined;
        setWorkflowToolsEnabled(false);
        return response({ ok: true, completed: true, candidateChanged: changed, candidate: current, early: gate(closed.early), final: gate(closed.final) });
      }

      if (!state?.active) return failure({ ok: false, error: "No active /workflow request." });
      if (!current) return failure({ ok: false, error: "Audit gate currently requires a Git working tree." });
      if (!ctx.hasUI) return failure({ ok: false, error: "pi-review audit execution requires an interactive Pi mode with UI support." });
      if (audit) return failure({ ok: false, error: `Audit ${audit.attemptId} (${audit.phase}) already in progress.` });
      if (!params.phase || !params.reviewArgs || !params.contract || !params.provider || !params.model || !params.thinking) {
        return failure({ ok: false, error: "begin requires phase, reviewArgs, contract, provider, model, and thinking." });
      }
      const argsError = validateReviewArgs(params.reviewArgs);
      if (argsError) return failure({ ok: false, error: argsError });
      const commands = new Set(pi.getCommands().map((command) => command.name));
      if (!commands.has("review") || !commands.has("end-review")) {
        return failure({ ok: false, error: "Pinned pi-review commands are unavailable." });
      }
      const selected = ctx.modelRegistry.find(params.provider, params.model);
      const scoped =
        ctx.scopedModels.length === 0 ||
        ctx.scopedModels.some((entry) => entry.model.provider === params.provider && entry.model.id === params.model);
      if (!selected || !scoped) return failure({ ok: false, error: `Audit model ${params.provider}/${params.model} unavailable in session scope.` });
      if (params.phase === "final" && closed.early?.status !== "closed") {
        return failure({ ok: false, error: "Final cannot start until Early is closed for the exact current identity.", early: gate(closed.early) });
      }

      lastInterlockKey = undefined;
      audit = {
        activationId: state.activationId,
        attemptId: randomUUID(),
        phase: params.phase,
        candidate: current,
        reviewArgs: params.reviewArgs.trim(),
        contract: compact(params.contract),
        selectedModel: { provider: params.provider, id: params.model },
        selectedThinking: params.thinking,
        parentModel: ctx.model ? { provider: ctx.model.provider, id: ctx.model.id } : undefined,
        parentThinking: pi.getThinkingLevel() as Thinking,
        parentTools: pi.getActiveTools(),
        startedAt: new Date().toISOString(),
        runtimeApplied: false,
        blockedTools: [],
        mutationDetected: false,
        endQueued: false,
      };
      pi.sendUserMessage(`/review ${audit.reviewArgs} --fresh --extra ${quoteArg(audit.contract)}`, {
        deliverAs: "followUp",
        expandPromptTemplates: true,
      });
      return response({
        ok: true,
        queued: true,
        activationId: audit.activationId,
        attemptId: audit.attemptId,
        phase: audit.phase,
        candidate: audit.candidate,
        selectedModel: audit.selectedModel,
        selectedThinking: audit.selectedThinking,
      });
    },
  });
}
