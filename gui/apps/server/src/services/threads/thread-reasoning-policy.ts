import type { ReasoningLevel } from "@osmodeck/domain";
import type { ProviderRegistryService } from "../providers/provider-registry.js";

export function getSupportedReasoningLevelsForProvider(
  registry: ProviderRegistryService,
  providerId: string,
): readonly ReasoningLevel[] {
  return registry.getServerCapabilities(providerId)?.reasoningLevels ?? [];
}
