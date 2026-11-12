import type { PermissionMode } from "@osmodeck/domain";
import type { IconName } from "@osmodeck/shared-ui/icon";
import {
  PERMISSION_MODE_OPTIONS as CORE_PERMISSION_MODE_OPTIONS,
  type PermissionModeOption as CorePermissionModeOption,
} from "@osmodeck/client-core";

export interface PermissionModeOption extends CorePermissionModeOption {
  iconName: IconName;
}

const PERMISSION_MODE_ICONS: Record<PermissionMode, IconName> = {
  "accept-edits": "EditFile",
  auto: "SecurityCheck",
  full: "Zap",
};

export const PERMISSION_MODE_OPTIONS: PermissionModeOption[] =
  CORE_PERMISSION_MODE_OPTIONS.map((option) => ({
    ...option,
    iconName: PERMISSION_MODE_ICONS[option.value],
  }));
