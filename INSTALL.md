# Install OsmoDeck (guide for AI coding agents)

This guide is written for an AI coding agent (Claude Code, Codex, Cursor and similar) that installs OsmoDeck for a user. Humans can follow it too. Run every step in order, check each result, and stop on the first failure.

To use it, a person can paste this prompt into their agent:

```text
Install OsmoDeck from https://github.com/shreyvaughn/osmodeck by following INSTALL.md in that repository. Run each check, stop and tell me if one fails, and ask me before you replace an existing /Applications/OsmoDeck.app.
```

## Rules for the agent

- Target: macOS 13 or newer on Apple Silicon (arm64). On any other platform, stop and tell the user. The desktop build is arm64 macOS only.
- Do not use `sudo` for any step in this guide.
- Do not install Homebrew, Node.js, pnpm, Python or Xcode tools without asking the user first. Tell the user which one is missing and the command you plan to run.
- Do not enter, create or ask for API keys. OsmoDeck uses the agent CLIs the user has already installed and signed in to.
- Do not quit, launch or replace a running `/Applications/OsmoDeck.app` without asking the user.
- Do not change files outside the clone folder, except `/Applications/OsmoDeck.app` in step 5.
- If a command fails, show the user the last 30 lines of output. Do not retry with flags that skip checks (`--no-frozen-lockfile`, `--force`, `--ignore-scripts`).

## 1. Check the machine

Run each command and compare the output with the expected value.

```sh
uname -sm                 # expected: Darwin arm64
sw_vers -productVersion   # expected: 13.0 or newer
xcode-select -p           # expected: a path; if it fails, Xcode Command Line Tools are missing
git --version             # expected: any version
node --version            # expected: v22.19.0 or newer
python3 --version         # expected: Python 3.11 or newer
```

Fixes, after the user agrees:

| Missing | Command |
|---|---|
| Xcode Command Line Tools | `xcode-select --install` (opens a system dialog the user must accept) |
| Node.js 22.19+ | `brew install node@22`, or the user's version manager (nvm, fnm, mise). The repo pins it in `gui/.nvmrc`. |
| Python 3.11+ | `brew install python@3.12` |

pnpm does not need a separate install. Step 3 uses the exact pnpm version the repo pins (10.34.9) through Corepack, with `npx` as a fallback.

## 2. Get the source

```sh
git clone https://github.com/shreyvaughn/osmodeck.git
cd osmodeck
```

If the folder already exists, run `git -C osmodeck pull --ff-only` instead and continue from inside it.

## 3. Install dependencies

```sh
cd gui
corepack enable 2>/dev/null; pnpm --version || npx --yes pnpm@10.34.9 --version
pnpm install --frozen-lockfile
```

If `pnpm --version` does not print `10.34.9`, use `npx --yes pnpm@10.34.9` in place of `pnpm` for the rest of this guide.

Expected: the install ends with `Done in ...`. Warnings that start with `WARN  Failed to create bin at` are normal on a first install: those files are created by the build in the next step.

## 4. Build

```sh
pnpm exec turbo run build typecheck --filter=@osmodeck/app --filter=@osmodeck/server --filter=@osmodeck/desktop --concurrency=2
```

Expected: the last lines show `Tasks: N successful, N total` with the two numbers equal. This takes about one to five minutes.

Native modules (SQLite, file watching, terminals) compile during install. If the build fails with a `node-gyp` or `gyp` error, step 1's Xcode Command Line Tools or Python check failed: fix that, delete `node_modules`, and run step 3 again.

## 5. Package and install the app

Ask the user before this step if `/Applications/OsmoDeck.app` already exists, and ask them to quit it first.

```sh
cd apps/desktop
pnpm run package
node scripts/install-macos.mjs
```

Expected: `pnpm run package` prints `macOS code signing via keychain auto-discovery; artifacts stay unsigned if no identity is installed.` (most users have no Apple Developer ID, so the app stays unsigned and that is fine) and writes `release.noindex/mac-arm64/OsmoDeck.app`. The installer copies it to `/Applications/OsmoDeck.app`, and backs up any previous copy to `~/Library/Application Support/OsmoDeck/installer-backups.noindex` first. It never launches the app.

To check the result without changing anything, run `node scripts/install-macos.mjs --check`.

## 6. Hand over to the user

Tell the user:

1. Open OsmoDeck from Applications. The build is not notarized, so the first time macOS may block it: right-click the app in Finder, choose **Open**, then **Open** again.
2. Agents run through the CLIs already on this Mac. Install and sign in to at least one, for example Claude Code (`claude`) or Codex (`codex`), then start a thread in OsmoDeck.
3. App data lives in `~/.gui-osmodeck`.

## Dev mode (no install)

To run without packaging, from `gui/` after step 4:

```sh
pnpm dev                                          # terminal 1: backend and browser UI
pnpm exec turbo run dev --filter=@osmodeck/desktop  # terminal 2: Electron
```

Dev mode uses its own ports and profile, separate from the installed app. If you start the Electron binary directly from a shell, unset `ELECTRON_RUN_AS_NODE` first.

## Update

```sh
cd osmodeck
git pull --ff-only
```

Then repeat steps 3, 4 and 5. Ask the user to quit OsmoDeck before step 5. The app applies its own database migrations on launch.

## Uninstall

Ask the user before deleting anything. App data in `~/.gui-osmodeck` holds their thread history.

```sh
rm -rf /Applications/OsmoDeck.app
rm -rf ~/.gui-osmodeck                  # only if the user wants their data removed
```

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `ERR_PNPM_UNSUPPORTED_ENGINE` or `Unsupported engine` | Node.js is older than 22.19. Upgrade it (step 1). |
| `ERR_PNPM_OUTDATED_LOCKFILE` | The clone is not clean. Run `git status` in the repo, and `git checkout -- gui/pnpm-lock.yaml` if only the lockfile changed. |
| `gyp ERR!` during install | Xcode Command Line Tools or Python 3.11+ missing (step 1). |
| `Build the source app inside release.noindex first.` | Step 5's `pnpm run package` did not finish. Run it again and read its error. |
| macOS says the app is damaged or from an unidentified developer | Right-click, **Open**. If it still refuses, run `xattr -dr com.apple.quarantine /Applications/OsmoDeck.app` after the user agrees. |
| `Not the stable OsmoDeck app: /Applications/OsmoDeck.app` | The app already in Applications is not this build (another bundle ID). Ask the user to quit it and move it to the Trash, then run the installer again. |
| `Packaged migrations differ. Review the database change separately; app was not replaced.` | The new build changes the app database. The installer refuses on purpose. Tell the user; with their go-ahead, quit OsmoDeck, move the old app to the Trash and run the installer again. Data in `~/.gui-osmodeck` is kept and migrated on launch. |
| No agents to pick in a new thread | No agent CLI is installed or signed in. Install one and sign in from a terminal first. |
