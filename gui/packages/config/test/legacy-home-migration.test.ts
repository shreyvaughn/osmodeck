import { lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { migrateLegacyHomeData } from "../src/legacy-home-migration.js";

function makeHome(): string {
  return mkdtempSync(join(tmpdir(), "osmodeck-home-"));
}

describe("migrateLegacyHomeData", () => {
  it("moves legacy directories, leaves symlinks, and renames state files", () => {
    const home = makeHome();
    mkdirSync(join(home, ".gui-cloudroom"));
    writeFileSync(join(home, ".gui-cloudroom", "bb.db"), "db");
    writeFileSync(join(home, ".gui-cloudroom", "cloudroom-popups.json"), "{}");
    mkdirSync(join(home, ".cloudroom", "skills"), { recursive: true });

    const result = migrateLegacyHomeData(home);

    expect(result).toEqual({ moved: [".gui-cloudroom", ".cloudroom"], failed: [] });
    expect(readFileSync(join(home, ".gui-osmodeck", "bb.db"), "utf8")).toBe("db");
    expect(readFileSync(join(home, ".gui-osmodeck", "osmodeck-popups.json"), "utf8")).toBe("{}");
    expect(lstatSync(join(home, ".gui-cloudroom")).isSymbolicLink()).toBe(true);
    expect(readlinkSync(join(home, ".gui-cloudroom"))).toBe(join(home, ".gui-osmodeck"));
    expect(readFileSync(join(home, ".gui-cloudroom", "bb.db"), "utf8")).toBe("db");
    expect(lstatSync(join(home, ".osmodeck", "skills")).isDirectory()).toBe(true);
  });

  it("is a no-op on the second run and when the new directory already exists", () => {
    const home = makeHome();
    mkdirSync(join(home, ".gui-cloudroom"));
    migrateLegacyHomeData(home);
    expect(migrateLegacyHomeData(home)).toEqual({ moved: [], failed: [] });

    const other = makeHome();
    mkdirSync(join(other, ".gui-cloudroom"));
    mkdirSync(join(other, ".gui-osmodeck"));
    expect(migrateLegacyHomeData(other).moved).toEqual([]);
    expect(lstatSync(join(other, ".gui-cloudroom")).isSymbolicLink()).toBe(false);
  });
});
