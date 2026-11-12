import type {
  AvailableModel,
  ModelReasoningEffort,
} from "@get-bb/plugin-sdk/provider-bridge";
import {
  CLAUDE_CODE_ACTIVE_CATALOG_DATA,
  CLAUDE_XHIGH_CAPABLE_REASONING_EFFORT_DATA,
  DEFAULT_CLAUDE_CODE_MODEL,
  claudeModelLabel,
} from "./model-catalog-data.js";

export function cloneReasoningEfforts(
  efforts: readonly ModelReasoningEffort[],
): ModelReasoningEffort[] {
  return efforts.map((effort) => ({ ...effort }));
}

export interface ClaudeCodeCatalogEntry {
  id: string;
  model: string;
  displayName: string;
  description: string;
  supportedReasoningEfforts: readonly ModelReasoningEffort[];
  defaultReasoningEffort: AvailableModel["defaultReasoningEffort"];
}

export const CLAUDE_XHIGH_CAPABLE_REASONING_EFFORTS: readonly ModelReasoningEffort[] =
  CLAUDE_XHIGH_CAPABLE_REASONING_EFFORT_DATA.map((effort) => ({ ...effort }));

export { DEFAULT_CLAUDE_CODE_MODEL };

const SONNET_REASONING_EFFORTS: readonly ModelReasoningEffort[] =
  CLAUDE_XHIGH_CAPABLE_REASONING_EFFORTS.filter((effort) =>
    ["low", "medium", "high", "max"].includes(effort.reasoningEffort),
  );
const HAIKU_REASONING_EFFORTS: readonly ModelReasoningEffort[] =
  CLAUDE_XHIGH_CAPABLE_REASONING_EFFORTS.filter(
    (effort) => effort.reasoningEffort === "low",
  );

function reasoningEffortsFor(model: string): readonly ModelReasoningEffort[] {
  if (model.startsWith("claude-sonnet-")) return SONNET_REASONING_EFFORTS;
  if (model.startsWith("claude-haiku-")) return HAIKU_REASONING_EFFORTS;
  return CLAUDE_XHIGH_CAPABLE_REASONING_EFFORTS;
}

export const CLAUDE_CODE_ACTIVE_CATALOG: readonly ClaudeCodeCatalogEntry[] =
  CLAUDE_CODE_ACTIVE_CATALOG_DATA.map((entry) => ({
    id: entry.model,
    model: entry.model,
    displayName: claudeModelLabel(entry.model) ?? entry.model,
    description: entry.description,
    supportedReasoningEfforts: reasoningEffortsFor(entry.model),
    defaultReasoningEffort: entry.defaultReasoningEffort,
  }));
