import type { HostDaemonSkillTree } from "@osmodeck/host-daemon-contract";

export type FetchSkillTree = (treeHash: string) => Promise<HostDaemonSkillTree>;
