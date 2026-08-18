import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;

export default function workflowModelCatalog(pi: ExtensionAPI) {
  pi.registerTool({
    name: "workflow_models",
    label: "Workflow Models",
    description:
      "Inspect live Pi model facts for an explicitly activated workflow. Returns availability, context/modality, supported thinking levels, price metadata, and the current parent model/thinking state. It does not rank model quality, recommend models for roles, or decide workflow policy.",
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
