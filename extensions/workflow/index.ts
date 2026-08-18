import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;

export default function workflowModelCatalog(pi: ExtensionAPI) {
  pi.registerTool({
    name: "workflow_models",
    label: "Workflow Models",
    description:
      "Inspect the live Pi model catalog for delegation/model-selection decisions. Returns availability/capability/price metadata only; it does not delegate or rank model quality.",
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

      const catalog = available
        .filter((model) => !params.provider || model.provider === params.provider)
        .filter((model) => !search || `${model.provider}/${model.id} ${model.name}`.toLowerCase().includes(search))
        .filter((model) => !params.minContextWindow || model.contextWindow >= params.minContextWindow)
        .filter((model) => params.reasoning === undefined || model.reasoning === params.reasoning)
        .filter((model) => params.image === undefined || model.input.includes("image") === params.image)
        .map((model) => {
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
            key: `${model.provider}/${model.id}`,
            name: model.name,
            contextWindow: model.contextWindow,
            maxTokens: model.maxTokens,
            reasoning: model.reasoning,
            supportedThinkingLevels,
            thinkingLevelMap: model.thinkingLevelMap,
            input: model.input,
            scopedThinkingLevel: scopedThinking.get(`${model.provider}/${model.id}`),
            costPerMillionTokens: model.cost,
          };
        })
        .sort((a, b) => a.key.localeCompare(b.key));

      const page = catalog.slice(offset, offset + limit);
      const payload = {
        scope: scoped ? "session" : "all-available",
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
}
