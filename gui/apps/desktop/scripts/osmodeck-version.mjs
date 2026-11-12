import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);

const displayVersionPattern = /^v([1-9]\d*)$/;

export const osmodeckVersionPath = resolve(
  dirname(scriptPath),
  "..",
  ".osmodeck-version",
);

export function stampRequested(env) {
  return env.BB_OSMODECK_STAMP === "1";
}

export function nextOsmoDeckVersion(current) {
  const match = displayVersionPattern.exec(String(current ?? "").trim());
  if (match === null) {
    return "v1";
  }

  return `v${Number(match[1]) + 1}`;
}

// The corner shows v1, v2, v3. macOS wants three integers, so the bundle is 1.0.0.
export function osmodeckBundleVersion(version) {
  const match = displayVersionPattern.exec(version);
  if (match === null) {
    throw new Error(`Invalid OsmoDeck version "${version}".`);
  }

  return `${match[1]}.0.0`;
}

export async function readOsmoDeckVersion({ allowMissing = false } = {}) {
  let text;
  try {
    text = await readFile(osmodeckVersionPath, "utf8");
  } catch (error) {
    if (allowMissing && error.code === "ENOENT") {
      return "dev";
    }
    throw new Error(
      `Missing ${osmodeckVersionPath}. Run node scripts/osmodeck-version.mjs first.`,
    );
  }

  const version = text.trim();
  if (!displayVersionPattern.test(version)) {
    throw new Error(`Invalid OsmoDeck version "${version}".`);
  }

  return version;
}

async function main() {
  let current = "";
  try {
    current = await readFile(osmodeckVersionPath, "utf8");
  } catch {
    current = "";
  }

  const version = nextOsmoDeckVersion(current);
  await writeFile(osmodeckVersionPath, `${version}\n`);
  console.log(version);
}

if (resolve(process.argv[1] ?? "") === scriptPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
