import { COMPUTER } from "@osmodeck/domain";

const CLI_PATH =
  "/Applications/OsmoDeck.app/Contents/Resources/app.asar.unpacked/node_modules/bb-app/host-daemon/dist/room-cli";
const RELEASES_URL = "https://github.com/davidondrej/cloudroom/releases/latest";

const said = (text?: string | null) =>
  text?.trim() ? `: "${text.trim().replace(/\s+/g, " ").slice(0, 400)}".` : ".";

/** A technical error as one short, plain line for a banner. The full text stays in its tooltip and the fix prompt. */
export const plainError = (error: string) =>
  error.includes("storage unsafe")
    ? "Cloud disk is full"
    : error === "OsmoDeck request cancelled or timed out"
      ? "Cloud didn't answer in time"
      : error.replace(/^OsmoDeck rejected the request \(HTTP \d+\): /, "");

const fixPrompt = (problem: string, look: string) =>
  `${problem} ${look} Find the root cause and fix it without losing any work, then tell me what was wrong. If \`room-cli\` is not on your PATH, use ${CLI_PATH}.`;

export const cloudThreadFixPrompt = (threadId: string, agent: string, error?: string | null) =>
  fixPrompt(
    `My OsmoDeck Cloud thread ${threadId} (${agent}) failed${said(error)}`,
    `Investigate with \`room-cli thread show ${threadId}\` and \`room-cli vm run '<command>'\` on my cloud VM.`,
  );

export const syncFixPrompt = (state: string, issue?: string | null) =>
  fixPrompt(
    `OsmoDeck's automatic sync between this computer and my cloud VM is not working (state: ${state})${said(issue)}`,
    "Check `room-cli cloud status --json`, ~/.gui-osmodeck/osmodeck-sync/, and the logs in ~/.gui-osmodeck/logs/.",
  );

export const projectFilesFixPrompt = (threadId: string, error?: string | null) =>
  fixPrompt(
    `OsmoDeck could not move my work to the cloud for thread ${threadId}${said(error)}`,
    `Check \`room-cli thread show ${threadId}\` and \`room-cli cloud thread-workspace ${threadId}\`, then copy any missing project files with \`room-cli vm push\`.`,
  );

export const cloudUnavailableFixPrompt = (error?: string | null) =>
  fixPrompt(
    `My OsmoDeck desktop app cannot reach my cloud VM${said(error)}`,
    "Check `room-cli cloud status --json`, then run `room-cli vm run 'systemctl status osmodeck --no-pager; df -h'` if the VM answers.",
  );

export const crashFixPrompt = (error: string) =>
  fixPrompt(
    `The OsmoDeck desktop app crashed${said(error)}`,
    "Check the logs in ~/.gui-osmodeck/logs/ and `room-cli status --json`.",
  );

export const phoneCrashFixPrompt = (error: string, host: string, page: string, macOff: boolean) =>
  `The OsmoDeck phone app (${host}) crashed on ${page} while my ${COMPUTER} was ${macOff ? "off" : "on"}${said(error)} Tell me what most likely went wrong and how to get it working again. If my ${COMPUTER} is on, check \`room-cli status --json\` there.`;

export const appUpdateFixPrompt = (current: string, latest: string | null) =>
  `Update my OsmoDeck desktop app from version ${current} to ${latest ?? "the newest version"}. Download the newest release for this computer from ${RELEASES_URL}, quit OsmoDeck, replace the old app (on macOS: /Applications/OsmoDeck.app), and reopen it. Do not delete ~/.gui-osmodeck; it holds my data. Confirm the new version when you are done.`;
