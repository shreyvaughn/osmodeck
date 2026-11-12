import { existsSync, lstatSync, renameSync, symlinkSync } from "node:fs";
import { join } from "node:path";

/**
 * OsmoDeck used to keep its state under Cloudroom names. Each legacy directory
 * moves to its new name once, and a symlink stays at the old path so absolute
 * paths already stored in the database and in agent session history resolve.
 */
const LEGACY_HOME_DIRECTORIES: readonly (readonly [legacy: string, current: string])[] = [
  [".gui-cloudroom", ".gui-osmodeck"],
  [".gui-cloudroom-dev", ".gui-osmodeck-dev"],
  [".cloudroom", ".osmodeck"],
];

const LEGACY_DATA_FILE_STEMS = ["popups", "prompts", "setup-snapshot", "time-in-app"];

export interface LegacyHomeMigrationResult {
  moved: string[];
  failed: string[];
}

function isRealDirectory(path: string): boolean {
  try {
    const stat = lstatSync(path);
    return stat.isDirectory() && !stat.isSymbolicLink();
  } catch {
    return false;
  }
}

function moveLegacyDirectory(from: string, to: string): boolean {
  if (existsSync(to) || !isRealDirectory(from)) return false;
  renameSync(from, to);
  symlinkSync(to, from, "dir");
  return true;
}

function renameLegacyDataFiles(dataDir: string): void {
  if (!existsSync(dataDir)) return;
  for (const stem of LEGACY_DATA_FILE_STEMS) {
    const from = join(dataDir, `cloudroom-${stem}.json`);
    const to = join(dataDir, `osmodeck-${stem}.json`);
    if (existsSync(from) && !existsSync(to)) renameSync(from, to);
  }
}

/** Idempotent; safe to call on every launch. Failures are reported, never thrown. */
export function migrateLegacyHomeData(homeDir: string): LegacyHomeMigrationResult {
  const result: LegacyHomeMigrationResult = { moved: [], failed: [] };
  for (const [legacy, current] of LEGACY_HOME_DIRECTORIES) {
    try {
      if (moveLegacyDirectory(join(homeDir, legacy), join(homeDir, current))) {
        result.moved.push(legacy);
      }
    } catch {
      result.failed.push(legacy);
    }
  }
  try {
    renameLegacyDataFiles(join(homeDir, ".gui-osmodeck"));
  } catch {
    result.failed.push("data files");
  }
  return result;
}
