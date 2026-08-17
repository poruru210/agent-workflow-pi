import { readFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { StringEnum } from "@earendil-works/pi-ai";
import {
  createAgentSession,
  DefaultResourceLoader,
  getAgentDir,
  ModelRuntime,
  SessionManager,
  type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const MAX_PARALLEL_JOBS = 4;
const OUTPUT_CHARS = 12_000;
const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;

type ThinkingLevel = (typeof THINKING_LEVELS)[number];

type Role = {
  prompt: string;
  tools: string[];
};

type UsageSummary = {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  cost: number;
  turns: number;
};

const JobSchema = Type.Object({
  id: Type.String({ description: "Versioned Job Lease identifier." }),
  role: Type.String({ description: "Role file basename under ~/.pi/agent/agents, without .md." }),
  model: Type.String({ description: "Exact provider/model key returned by workflow_models." }),
  thinking: StringEnum(THINKING_LEVELS),
  lease: Type.String({
    description: "Complete bounded Job Lease/context for this child. The child does not inherit the parent workflow.",
  }),
  cwd: Type.Optional(Type.String({ description: "Working directory. Relative paths resolve from the parent Pi cwd." })),
});

function parseRole(raw: string, roleName: string): Role {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`Role ${roleName} must contain YAML-style frontmatter.`);

  const toolsLine = match[1].match(/^tools:\s*(.+)$/m)?.[1];
  if (!toolsLine) throw new Error(`Role ${roleName} must declare tools: in frontmatter.`);

  const tools = toolsLine
    .split(",")
    .map((tool) => tool.trim())
    .filter(Boolean);
  if (tools.length === 0) throw new Error(`Role ${roleName} has an empty tool allowlist.`);

  return { prompt: match[2].trim(), tools };
}

async function loadRole(roleName: string): Promise<Role> {
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(roleName)) {
    throw new Error(`Invalid role name: ${roleName}`);
  }
  const path = join(getAgentDir(), "agents", `${roleName}.md`);
  return parseRole(await readFile(path, "utf8"), roleName);
}

function emptyUsage(): UsageSummary {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, cost: 0, turns: 0 };
}

function addUsage(total: UsageSummary, usage: any): void {
  total.input += usage?.input ?? 0;
  total.output += usage?.output ?? 0;
  total.cacheRead += usage?.cacheRead ?? 0;
  total.cacheWrite += usage?.cacheWrite ?? 0;
  total.cost += usage?.cost?.total ?? 0;
  total.turns += 1;
}

function finalAssistantText(messages: readonly any[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message?.role !== "assistant" || !Array.isArray(message.content)) continue;
    const text = message.content
      .filter((part: any) => part?.type === "text" && typeof part.text === "string")
      .map((part: any) => part.text)
      .join("\n")
      .trim();
    if (text) return text;
  }
  return "";
}

function clip(text: string): string {
  if (text.length <= OUTPUT_CHARS) return text;
  return `${text.slice(0, OUTPUT_CHARS)}\n\n[Output clipped in model context; full output is preserved in tool details.]`;
}

function resolveJobCwd(parentCwd: string, requested?: string): string {
  if (!requested) return parentCwd;
  return isAbsolute(requested) ? requested : resolve(parentCwd, requested);
}

export default function workflowHarness(pi: ExtensionAPI) {
  let runtimePromise: Promise<ModelRuntime> | undefined;
  const childRuntime = () => (runtimePromise ??= ModelRuntime.create());

  pi.registerTool({
    name: "workflow_models",
    label: "Workflow Models",
    description:
      "Return currently available Pi models after hard metadata filters. Use before delegation. Metadata and price are not quality rankings; apply the workflow's capability-sufficiency gate before optimizing cost.",
    parameters: Type.Object({
      provider: Type.Optional(Type.String()),
      minContextWindow: Type.Optional(Type.Integer({ minimum: 1 })),
      reasoning: Type.Optional(Type.Boolean()),
      image: Type.Optional(Type.Boolean()),
      search: Type.Optional(Type.String({ description: "Case-insensitive provider/model/name filter." })),
      offset: Type.Optional(Type.Integer({ minimum: 0 })),
      limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 50 })),
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const limit = params.limit ?? 20;
      const offset = params.offset ?? 0;
      const search = params.search?.toLowerCase();
      const catalog = ctx.modelRegistry
        .getAvailable()
        .filter((model) => !params.provider || model.provider === params.provider)
        .filter((model) => !search || `${model.provider}/${model.id} ${model.name}`.toLowerCase().includes(search))
        .filter((model) => !params.minContextWindow || model.contextWindow >= params.minContextWindow)
        .filter((model) => params.reasoning === undefined || model.reasoning === params.reasoning)
        .filter((model) => params.image === undefined || model.input.includes("image") === params.image)
        .map((model) => ({
          key: `${model.provider}/${model.id}`,
          name: model.name,
          contextWindow: model.contextWindow,
          maxTokens: model.maxTokens,
          reasoning: model.reasoning,
          input: model.input,
          costPerMillionTokens: model.cost,
        }))
        .sort((a, b) => a.key.localeCompare(b.key));
      const page = catalog.slice(offset, offset + limit);
      const payload = {
        total: catalog.length,
        offset,
        returned: page.length,
        hasMore: offset + page.length < catalog.length,
        models: page,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
        details: payload,
      };
    },
  });

  pi.registerTool({
    name: "workflow_delegate",
    label: "Workflow Delegate",
    description:
      "Run one to four independent bounded Job Leases as isolated in-memory Pi SDK child sessions. Jobs in the same call run concurrently. Call separately when jobs depend on previous results.",
    parameters: Type.Object({
      jobs: Type.Array(JobSchema, { minItems: 1, maxItems: MAX_PARALLEL_JOBS }),
    }),
    async execute(_toolCallId, params, signal, onUpdate, ctx) {
      const modelRuntime = await childRuntime();
      const available = await modelRuntime.getAvailable();
      let completed = 0;

      const run = async (job: (typeof params.jobs)[number]) => {
        const role = await loadRole(job.role);
        const model = available.find((candidate) => `${candidate.provider}/${candidate.id}` === job.model);
        if (!model) throw new Error(`Model is not currently available: ${job.model}`);
        if (job.thinking !== "off" && !model.reasoning) {
          throw new Error(`Model does not support reasoning: ${job.model}`);
        }

        const cwd = resolveJobCwd(ctx.cwd, job.cwd);
        const loader = new DefaultResourceLoader({
          cwd,
          agentDir: getAgentDir(),
          noExtensions: true,
          noSkills: true,
          noPromptTemplates: true,
          noThemes: true,
          noContextFiles: true,
          appendSystemPrompt: [],
          appendSystemPromptOverride: () => [role.prompt],
        });
        await loader.reload();

        const { session } = await createAgentSession({
          cwd,
          model,
          thinkingLevel: job.thinking as ThinkingLevel,
          tools: role.tools,
          modelRuntime,
          resourceLoader: loader,
          sessionManager: SessionManager.inMemory(cwd),
        });

        const usage = emptyUsage();
        const unsubscribe = session.subscribe((event) => {
          if (event.type === "message_end" && (event.message as any)?.role === "assistant") {
            addUsage(usage, (event.message as any).usage);
          }
        });
        const abort = () => void session.abort();
        signal?.addEventListener("abort", abort, { once: true });

        try {
          await session.prompt(`Job Lease ${job.id}\n\n${job.lease}`);
          const output = finalAssistantText(session.messages);
          const final = [...session.messages].reverse().find((message: any) => message?.role === "assistant") as any;
          return {
            id: job.id,
            role: job.role,
            model: job.model,
            thinking: job.thinking,
            cwd,
            tools: role.tools,
            ok: final?.stopReason === "stop",
            stopReason: final?.stopReason,
            errorMessage: final?.errorMessage,
            usage,
            output,
          };
        } finally {
          signal?.removeEventListener("abort", abort);
          unsubscribe();
          session.dispose();
        }
      };

      const results = await Promise.all(
        params.jobs.map(async (job) => {
          try {
            return await run(job);
          } catch (error) {
            return {
              id: job.id,
              role: job.role,
              model: job.model,
              thinking: job.thinking,
              ok: false,
              errorMessage: error instanceof Error ? error.message : String(error),
              usage: emptyUsage(),
              output: "",
            };
          } finally {
            completed += 1;
            onUpdate?.({
              content: [{ type: "text" as const, text: `Completed ${completed}/${params.jobs.length} delegated job(s).` }],
              details: { completed, total: params.jobs.length },
            });
          }
        }),
      );

      const summary = results
        .map((result) => {
          const status = result.ok ? "PASS" : "FAIL";
          const usage = result.usage;
          const stats = `${usage.turns}t in:${usage.input} out:${usage.output} cacheR:${usage.cacheRead} cacheW:${usage.cacheWrite} $${usage.cost.toFixed(4)}`;
          const body = result.output ? clip(result.output) : result.errorMessage ?? "(no output)";
          return `## ${result.id} — ${status} — ${result.role} — ${result.model}\n${stats}\n\n${body}`;
        })
        .join("\n\n");

      return {
        content: [{ type: "text" as const, text: summary }],
        details: { results },
      };
    },
  });
}
