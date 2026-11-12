import type { ModelInfo } from "@anthropic-ai/claude-agent-sdk";
import { describe, expect, it } from "vitest";
import {
  applyClaudeEffortSettings,
  buildClaudeCodeModels,
} from "./model-list.js";

const DISCOVERED_MODELS: ModelInfo[] = [
  {
    value: "default",
    resolvedModel: "claude-opus-5[1m]",
    displayName: "Default (recommended)",
    description: "Opus 5 with 1M context",
  },
  {
    value: "opus[1m]",
    resolvedModel: "claude-opus-5[1m]",
    displayName: "Opus",
    description: "Opus 5 with 1M context",
  },
  {
    value: "claude-fable-5-1[1m]",
    resolvedModel: "claude-fable-5-1",
    displayName: "Fable",
    description: "Fable 5.1",
  },
  {
    value: "sonnet",
    resolvedModel: "claude-sonnet-5",
    displayName: "Sonnet",
    description: "Sonnet 5",
  },
  {
    value: "haiku",
    resolvedModel: "claude-haiku-4-5-20251001",
    displayName: "Haiku",
    description: "Fastest for quick answers",
  },
];

const LATEST_MODELS = [
  "claude-fable-5-2",
  "claude-opus-5-5[1m]",
  "claude-opus-5-5",
  "claude-sonnet-5-5",
  "claude-haiku-5-5",
];

describe("buildClaudeCodeModels", () => {
  it("offers only the latest Claude models, never aliases or older models", () => {
    const result = buildClaudeCodeModels(DISCOVERED_MODELS);

    expect(result.models.map((model) => model.model)).toEqual(LATEST_MODELS);
    expect(result.models.map((model) => model.displayName)).toEqual([
      "Fable 5.2",
      "Opus 5.5 (1M)",
      "Opus 5.5",
      "Sonnet 5.5",
      "Haiku 5.5",
    ]);
    expect(result.selectedOnlyModels).toEqual([]);
    expect(
      result.models.find((model) => model.isDefault)?.model,
    ).toBe("claude-opus-5-5[1m]");
  });

  it("offers the same list when the provider reports no models", () => {
    const result = buildClaudeCodeModels([]);

    expect(result.models.map((model) => model.model)).toEqual(LATEST_MODELS);
    expect(result.selectedOnlyModels).toEqual([]);
  });

  it("ignores discovered models outside the latest set", () => {
    const result = buildClaudeCodeModels([
      {
        value: "future",
        resolvedModel: "claude-future-6",
        displayName: "Future 6",
        description: "Newly discovered model",
      },
    ]);

    expect(result.models.map((model) => model.model)).toEqual(LATEST_MODELS);
  });

  it("prefers the discovered default model when it is in the latest set", () => {
    const result = buildClaudeCodeModels([
      {
        value: "default",
        resolvedModel: "claude-sonnet-5-5",
        displayName: "Default (recommended)",
        description: "Sonnet 5.5",
      },
    ]);

    expect(result.models.find((model) => model.isDefault)?.model).toBe(
      "claude-sonnet-5-5",
    );
  });

  it("gives Sonnet and Haiku only the efforts they support", () => {
    const efforts = (id: string) =>
      buildClaudeCodeModels([])
        .models.find((model) => model.model === id)
        ?.supportedReasoningEfforts.map((effort) => effort.reasoningEffort);

    expect(efforts("claude-sonnet-5-5")).toEqual(["low", "medium", "high", "max"]);
    expect(efforts("claude-haiku-5-5")).toEqual(["low"]);
  });
});

const OPUS = "claude-opus-5-5[1m]";
const perModel = (model: string, effortLevel: string) => ({
  modelSettings: { [model]: { effortLevel } },
});

// #656: per-model setting (no [1m], aliases resolved), then effortLevel.
it.each([
  [{}, "high", OPUS],
  [{ effortLevel: "xhigh" }, "xhigh", OPUS],
  [
    { effortLevel: "xhigh", ...perModel("claude-opus-5-5", "low") },
    "low",
    OPUS,
  ],
  [
    { effortLevel: "low", ...perModel("claude-fable-5-2", "xhigh") },
    "xhigh",
    "claude-fable-5-2",
  ],
  [{ effortLevel: "turbo" }, "high", OPUS],
])("applies Claude effort settings %j -> %s", (settings, expected, model) => {
  const { models, selectedOnlyModels } = applyClaudeEffortSettings(
    buildClaudeCodeModels(DISCOVERED_MODELS),
    settings,
    DISCOVERED_MODELS,
  );
  const found = [...models, ...selectedOnlyModels].find(
    (item) => item.model === model,
  );
  expect(found?.defaultReasoningEffort).toBe(expected);
});
