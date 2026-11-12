import type { CSSProperties } from "react";
import { isPresentationTintColor } from "@osmodeck/domain";
import type { TimelineRowPresentation } from "@osmodeck/server-contract";
import { type IconName } from "@osmodeck/shared-ui/icon";

export function presentationIconName(
  presentation: { icon: TimelineRowPresentation["icon"] } | undefined,
): IconName | undefined {
  return presentation?.icon.glyph;
}

export function presentationTintStyle(
  presentation:
    | { tint?: TimelineRowPresentation["tint"] | null | undefined }
    | undefined,
): CSSProperties | undefined {
  const tint = presentation?.tint;
  if (
    tint === undefined ||
    tint === null ||
    !isPresentationTintColor(tint.light) ||
    !isPresentationTintColor(tint.dark)
  ) {
    return undefined;
  }
  return { color: `light-dark(${tint.light.trim()}, ${tint.dark.trim()})` };
}
