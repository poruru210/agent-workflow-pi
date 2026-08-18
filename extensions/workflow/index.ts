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

function parseInlineList(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed.slice(1, -1).split(",").map((item) => unquoteScalar(item)).filter(Boolean);
  }
  return [unquoteScalar(trimmed)].filter(Boolean);
}

function loadWorkflowPreferredModels(): Record<string, string[]> {
  if (!fs.existsSync(AGENTS_DIR)) return {};

  const preferences: Record<string, string[]> = {};
  for (const entry of fs.readdirSync(AGENTS_DIR, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;

    const text = fs.readFileSync(path.join(AGENTS_DIR, entry.name), "utf-8");
    const frontmatter = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
    if (!frontmatter) continue;

    const lines = frontmatter.split(/\r?\n/);
    let name: string | undefined;
    const preferredModels: string[] = [];

    for (let i = 0; i < lines.length; i += 1) {
      const field = lines[i].match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*?)\s*$/);
      if (!field) continue;

      const key = field[1];
      const value = field[2];
      if (key === "name") {
        name = unquoteScalar(value);
        continue;
      }
      if (key === "workflowPreferredModel") {
        preferredModels.push(...parseInlineList(value));
        continue;
      }
      if (key !== "workflowPreferredModels") continue;

      if (value.trim()) {
        preferredModels.push(...parseInlineList(value));
        continue;
      }

      let j = i + 1;
      while (j < lines.length) {
        const item = lines[j].match(/^\s+-\s+(.+?)\s*$/);
        if (!item) break;
        preferredModels.push(unquoteScalar(item[1]));
        j += 1;
      }
      i = j - 1;
    }

    if (name && preferredModels.length > 0) preferences[name] = [...new Set(preferredModels.filter(Boolean))];
  }

  return preferences;
}

export default function workflowModelCatalog(pi: ExtensionAPI) {
  pi.registerTool({
    name: "workflow_models",
    label: "Workflow Models",
    description:
      "Inspect live Pi model facts for an explicitly activated workflow. Returns the current parent model/thinking state, the ordered per-session scoped model list when one exists, availability/context/modality/reasoning/price facts, and ordered declarative workflowPreferredModels metadata from workflow role definitions. Legacy scalar workflowPreferredModel is normalized to the same ordered list. This tool does not rank model quality, decide capability sufficiency, recommend a selected model, or decide workflow policy.",
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
      const sessionModelScope = ctx.scopedModels.map((entry, index) => ({
        priority: index + 1,
        key: `${entry.model.provider}/${entry.model.id}`,
        name: entry.model.name,
        thinkingLevel: entry.thinkingLevel,
      }));
      const sessionPriority = new Map(sessionModelScope.map((entry) => [entry.key, entry.priority]));
      const scopedThinking = new Map(
        ctx.scopedModels.map((entry) => [`${entry.model.provider}/${entry.model.id}`, entry.thinkingLevel]),
      );
      const available = scoped
        ? ctx.scopedModels.map((entry) => entry.model)
        : ctx.modelRegistry.getAvailable();

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
            sessionPriority: sessionPriority.get(key),
            scopedThinkingLevel: scopedThinking.get(key),
            costPerMillionTokens: model.cost,
          };
        });

      if (!scoped) catalog.sort((a, b) => a.key.localeCompare(b.key));

      const availability = new Set(available.map((model) => `${model.provider}/${model.id}`));
      const workflowPreferredModels = Object.fromEntries(
        Object.entries(loadWorkflowPreferredModels()).map(([agent, models]) => [
          agent,
          models.map((model, index) => ({
            priority: index + 1,
            model,
            available: availability.has(model),
            sessionPriority: sessionPriority.get(model),
          })),
        ]),
      );
      const page = catalog.slice(offset, offset + limit);
      const hasMore = offset + page.length < catalog.length;
      const parentModel = ctx.model
        ? { key: `${ctx.model.provider}/${ctx.model.id}`, name: ctx.model.name, thinkingLevel: ctx.thinkingLevel }
        : undefined;

      const payload = {
        scope: scoped ? "session" : "all-available",
        parentModel,
        sessionModelScope,
        workflowPreferredModels,
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
