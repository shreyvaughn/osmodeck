import { useIsCompactViewport } from "@osmodeck/shared-ui/hooks/use-compact-viewport";

export function useSplitWorkspaceActive(): boolean {
  const isCompactViewport = useIsCompactViewport();
  return !isCompactViewport;
}
