export type ClaudeCodeReasoningLevel =
  | "low"
  | "medium"
  | "high"
  | "xhigh"
  | "ultracode"
  | "max";

export interface ClaudeCodeReasoningEffortData {
  reasoningEffort: ClaudeCodeReasoningLevel;
  description: string;
}

export interface ClaudeCodeCatalogEntryData {
  model: string;
  description: string;
  defaultReasoningEffort: ClaudeCodeReasoningLevel;
}

export function claudeModelLabel(id: string, tag?: string): string | null {
  const [, family, major, minor, oneMillion] =
    /^claude-([a-z]+)-(\d+)(?:-(\d{1,2}))?(?:-\d{8})?(\[1m\])?$/u.exec(id) ?? [];
  if (!family || !major) return null;
  const name = `${family.charAt(0).toUpperCase()}${family.slice(1)} ${minor ? `${major}.${minor}` : major}`;
  const tags = [oneMillion ? "1M" : "", tag ?? ""].filter(Boolean).join(", ");
  return tags ? `${name} (${tags})` : name;
}

export const CLAUDE_XHIGH_CAPABLE_REASONING_EFFORT_DATA: readonly ClaudeCodeReasoningEffortData[] =
  [
    { reasoningEffort: "low", description: "Low reasoning effort" },
    { reasoningEffort: "medium", description: "Medium reasoning effort" },
    { reasoningEffort: "high", description: "High reasoning effort" },
    { reasoningEffort: "xhigh", description: "Extra high reasoning effort" },
    {
      reasoningEffort: "ultracode",
      description:
        "Extra high reasoning effort plus multi-agent workflow orchestration",
    },
    { reasoningEffort: "max", description: "Maximum reasoning effort" },
  ];

export const DEFAULT_CLAUDE_CODE_MODEL = "claude-opus-5-5[1m]";

/** Latest Claude models only. No moving aliases (opus, sonnet, best) and no older versions. */
export const CLAUDE_CODE_ACTIVE_CATALOG_DATA: readonly ClaudeCodeCatalogEntryData[] =
  [
    {
      model: "claude-fable-5-2",
      description: "Fable 5.2 for the most demanding reasoning",
      defaultReasoningEffort: "high",
    },
    {
      model: DEFAULT_CLAUDE_CODE_MODEL,
      description: "Opus 5.5 with 1M context for complex long coding sessions",
      defaultReasoningEffort: "high",
    },
    {
      model: "claude-opus-5-5",
      description: "Opus 5.5 for complex coding tasks",
      defaultReasoningEffort: "high",
    },
    {
      model: "claude-sonnet-5-5",
      description: "Sonnet 5.5 for everyday coding tasks",
      defaultReasoningEffort: "medium",
    },
    {
      model: "claude-haiku-5-5",
      description: "Haiku 5.5 for quick answers",
      defaultReasoningEffort: "low",
    },
  ];
