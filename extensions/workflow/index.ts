import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;
const AGENTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "agents");

function unquoteScalar(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function markdownFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".md")) files.push(full);
  }
  return files;
}

function loadAgentPreferences(): Record<string, string> {
  const preferences: Record<string, string> = {};
  for (const file of markdownFiles(AGENTS_DIR)) {
    const text = fs.readFileSync(file, "utf-8");
    const match = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!match) continue;

    let name: string | undefined;
    let preferredModel: string | undefined;
    for (const line of match[1].split(/\r?\n/)) {
      const field = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*?)\s*$/);
      if (!field) continue;
      if (field[1] === "name") name = unquoteScalar(field[2]);
      if (field[1] === "workflowPreferredModel") preferredModel = unquoteScalar(field[2]);
    }

    if (name && preferredModel) preferences[name] = preferredModel;
  }
  return preferences;
}

export default function workflowModelCatalog(pi: ExtensionAPI) {
  pi.registerTool({
    name: "workflow_models",
    label: "Workflow Models",
    description:
      "Inspect live Pi model facts for workflow delegation/model decisions. Returns availability, context/modality, supported thinking levels, price metadata, current parent model/thinking, and optional per-agent workflowPreferredModel metadata read from agent definitions. It does not rank model quality or decide workflow policy. For availability-wide comparison, load the complete catalog once per parent session and reuse it until registry/session scope or agent definitions materially change.",
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
      const limit = params.limit ?? 50;
      const offset = params.offset ?? 0;
      const search = params.search?.toLowerCase();
      const scoped = ctx.scopedModels.length > 0;
      const scopedThinking = new Map(
        ctx.scopedModels.map((entry) => [
          `${entry.model.provider}/${entry.model.id}`,
          entry.thinkingLevel,
        ]),
      );
      const available = scoped
        ? ctx.scopedModels.map((entry) => entry.model)
        : ctx.modelRegistry.getAvailable();
      const agentPreferences = loadAgentPreferences();

      const catalog = available
        .filter((model) => !params.provider || model.provider === params.provider)
        .filter((model) => !search || `${model.provider}/${model.id} ${model.name}`.toLowerCase().includes(search))
        .filter((model) => !params.minContextWindow || model.contextWindow >= params.minContextWindow)
        .filter((model) => params.reasoning === undefined || model.reasoning === params.reasoning)
        .filter((model) => params.image === undefined || model.input.includes("image") === params.image)
        .map((model) => {
          const key = `${model.provider}/${model.id}`;
          const supportedThinkingLevels = model.reasoning === false
            ? ["off"]
            : !model.thinkingLevelMap
              ? THINKING_LEVELS.filter((level) => level !== "max")
              : THINKING_LEVELS.filter((level) => {
                  const mapped = model.thinkingLevelMap?.[level];
                  if (mapped === null) return false;
                  if (level === "xhigh" || level === "max") return mapped !== undefined;
                  return true;
                });

          return {
            key,
            name: model.name,
            contextWindow: model.contextWindow,
            maxTokens: model.maxTokens,
            reasoning: model.reasoning,
            supportedThinkingLevels,
            input: model.input,
            scopedThinkingLevel: scopedThinking.get(key),
            costPerMillionTokens: model.cost,
          };
        })
        .sort((a, b) => a.key.localeCompare(b.key));

      const availability = new Set(available.map((model) => `${model.provider}/${model.id}`));
      const resolvedAgentPreferences = Object.fromEntries(
        Object.entries(agentPreferences).map(([agent, model]) => [
          agent,
          { model, available: availability.has(model) },
        ]),
      );
      const page = catalog.slice(offset, offset + limit);
      const hasMore = offset + page.length < catalog.length;
      const parentModel = ctx.model
        ? {
            key: `${ctx.model.provider}/${ctx.model.id}`,
            name: ctx.model.name,
            thinkingLevel: ctx.thinkingLevel,
          }
        : undefined;

      const payload = {
        scope: scoped ? "session" : "all-available",
        parentModel,
        agentPreferences: resolvedAgentPreferences,
        total: catalog.length,
        offset,
        returned: page.length,
        hasMore,
        ...(hasMore
          ? { selectionWarning: "Catalog is incomplete. Fetch the next page before making an availability-wide model decision." }
          : {}),
        models: page,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload) }],
        details: payload,
      };
    },
  });
}
