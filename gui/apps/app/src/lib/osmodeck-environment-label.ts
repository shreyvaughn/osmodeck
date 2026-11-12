import type { IconName } from "@osmodeck/shared-ui/icon";

export const OSMODECK_LOCAL_PRIMARY = "Local";
export const OSMODECK_LOCAL_WORKTREE = "Local Worktree";
export const OSMODECK_CLOUD_PRIMARY = "Cloud";
export const OSMODECK_CLOUD_WORKTREE = "Cloud Worktree";

export function osmodeckEnvironmentPresentation(
  providerId: string | null | undefined,
  place: "local" | "cloud",
): { label: string; icon: IconName } | null {
  if (providerId === "project-checkout") {
    return place === "cloud"
      ? { label: OSMODECK_CLOUD_PRIMARY, icon: "Cloud" }
      : { label: OSMODECK_LOCAL_PRIMARY, icon: "Laptop" };
  }
  if (providerId === "git-worktree") {
    return place === "cloud"
      ? { label: OSMODECK_CLOUD_WORKTREE, icon: "Cloud" }
      : { label: OSMODECK_LOCAL_WORKTREE, icon: "Laptop" };
  }
  return null;
}
