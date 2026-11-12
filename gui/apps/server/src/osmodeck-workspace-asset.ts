import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const windows = process.platform === "win32";
const bundledPython = new URL(windows ? "./assets/python/python.exe" : "./assets/python/bin/python3", import.meta.url);
export const OSMODECK_PYTHON_PATH = existsSync(bundledPython) ? fileURLToPath(bundledPython) : windows ? "python" : "python3";

export const OSMODECK_PREVIEW_SCRIPT_PATH = fileURLToPath(
  new URL("./assets/osmodeck-preview/client.py", import.meta.url),
);

export const OSMODECK_SYNC_SCRIPT_PATH = fileURLToPath(
  new URL("./assets/osmodeck-sync/client.py", import.meta.url),
);
