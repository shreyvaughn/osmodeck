import type { AvailableModel } from "@get-bb/plugin-sdk/provider-bridge";
import type { ModelInfo } from "@anthropic-ai/claude-agent-sdk";
import {
  CLAUDE_CODE_ACTIVE_CATALOG,
  DEFAULT_CLAUDE_CODE_MODEL,
  cloneReasoningEfforts,
  type ClaudeCodeCatalogEntry,
} from "./model-catalog.js";

function buildCatalogModel(entry: ClaudeCodeCatalogEntry): AvailableModel {
  return {
    id: entry.id,
    model: entry.model,
    displayName: entry.displayName,
    description: entry.description,
    supportedReasoningEfforts: cloneReasoningEfforts(
      entry.supportedReasoningEfforts,
    ),
    defaultReasoningEffort: entry.defaultReasoningEffort,
    isDefault: false,
  };
}

function resolveDiscoveredDefaultModel(
  discoveredModels: readonly ModelInfo[],
): string | null {
  const defaultModel = discoveredModels.find(
    (model) => model.value === "default",
  );
  return defaultModel?.resolvedModel ?? null;
}

function markDefaultModel(
  models: AvailableModel[],
  discoveredModels: readonly ModelInfo[],
): AvailableModel[] {
  const discoveredDefault = resolveDiscoveredDefaultModel(discoveredModels);
  const defaultModel =
    discoveredDefault &&
    models.some((model) => model.model === discoveredDefault)
      ? discoveredDefault
      : models.some((model) => model.model === DEFAULT_CLAUDE_CODE_MODEL)
        ? DEFAULT_CLAUDE_CODE_MODEL
        : models[0]?.model;
  return models.map((model) =>
    model.model === defaultModel ? { ...model, isDefault: true } : model,
  );
}

interface ListClaudeCodeModelsResult {
  models: AvailableModel[];
  selectedOnlyModels: AvailableModel[];
}

/** The picker shows only the latest Claude models in the catalog. Moving aliases
 *  (default, opus, sonnet, best) and older models the CLI reports are left out. */
export function buildClaudeCodeModels(
  discoveredModels: readonly ModelInfo[],
): ListClaudeCodeModelsResult {
  const models = CLAUDE_CODE_ACTIVE_CATALOG.map(buildCatalogModel);
  return {
    models: markDefaultModel(models, discoveredModels),
    selectedOnlyModels: [],
  };
}

export interface ClaudeEffortSettings {
  effortLevel?: unknown;
  modelSettings?: Record<string, { effortLevel?: unknown } | null | undefined>;
}

/** The user's own Claude Code effort (`modelSettings[<model>]` first, then
 *  `effortLevel`) becomes a model's default when the model supports it, so a
 *  new thread nobody picked a level for matches the terminal (#656). Aliases
 *  such as `opus` are looked up under the model they resolve to. */
export function applyClaudeEffortSettings(
  catalog: ListClaudeCodeModelsResult,
  settings: ClaudeEffortSettings,
  discoveredModels: readonly ModelInfo[] = [],
): ListClaudeCodeModelsResult {
  const apply = (model: AvailableModel): AvailableModel => {
    const resolved =
      discoveredModels.find((discovered) => discovered.value === model.model)
        ?.resolvedModel ?? model.model;
    const key = resolved.replace(/\[1m\]$/u, "");
    const level =
      settings.modelSettings?.[key]?.effortLevel ?? settings.effortLevel;
    const match = model.supportedReasoningEfforts.find(
      (effort) => effort.reasoningEffort === level,
    );
    return match
      ? { ...model, defaultReasoningEffort: match.reasoningEffort }
      : model;
  };
  return {
    models: catalog.models.map(apply),
    selectedOnlyModels: catalog.selectedOnlyModels.map(apply),
  };
}
