import type { EnvironmentProvisionCommand } from "@osmodeck/host-daemon-contract";

export interface EnvironmentProvisionRequest {
  command: EnvironmentProvisionCommand;
}
