# OsmoDeck

OsmoDeck is a macOS desktop app for running local AI coding agents (Claude Code, Codex, Pi and others) in threads, side by side. It is a modified fork of [Cloudroom](https://github.com/davidondrej/cloudroom) (Apache 2.0), which is built on [BB](https://github.com/get-bb/bb) (MIT).

**What this fork changes:** no account or sign-in, no telemetry, no update checks, and the app's windows cannot reach the upstream hosted service. It adds saved threads, pick-by-name chat import, and a model picker that shows only the latest Claude models. Full list: [BUILD.md](BUILD.md).

**What it does not include:** the upstream hosted cloud (Cloud threads, Teleport, relay). Local agents work fully. You can still run the Rust core on your own Linux machine: see [core/docs/setup.md](core/docs/setup.md).

OsmoDeck is not affiliated with or endorsed by the upstream project.

## Install with an AI agent

Paste this into Claude Code, Codex or another coding agent on your Mac:

```text
Install OsmoDeck from https://github.com/shreyvaughn/osmodeck by following INSTALL.md in that repository. Run each check, stop and tell me if one fails, and ask me before you replace an existing /Applications/OsmoDeck.app.
```

[INSTALL.md](INSTALL.md) has the step-by-step guide the agent follows, with expected output for each step and fixes for common errors.

## Quick start (macOS, Apple Silicon)

Requirements: macOS 13+, Git, Node.js 22.19+, pnpm 10.34.9, Python 3.11+, Xcode Command Line Tools. Rust 1.89+ only if you build the core.

```sh
git clone https://github.com/shreyvaughn/osmodeck.git
cd osmodeck/gui
pnpm install --frozen-lockfile
pnpm exec turbo run build typecheck --filter=@osmodeck/app --filter=@osmodeck/server --filter=@osmodeck/desktop --concurrency=2
```

Then either run it in dev mode or package and install it:

```sh
# dev mode: backend + browser UI, then Electron in a second terminal
pnpm dev
pnpm exec turbo run dev --filter=@osmodeck/desktop

# or package and install /Applications/OsmoDeck.app (unsigned)
cd apps/desktop
pnpm run package
node scripts/install-macos.mjs
```

The packaged app is not code-signed. On first open, right-click it in Finder and choose **Open**. If you launch the binary from a shell, unset `ELECTRON_RUN_AS_NODE` first.

Agents use your own installed and signed-in CLIs (for example `claude`, `codex`). OsmoDeck stores no API keys of its own. App data lives in `~/.gui-osmodeck`.

## Repository layout

- [`gui/`](gui/): the desktop app (Electron, React, Hono server, host daemon). Build details: [gui/README.md](gui/README.md).
- [`core/`](core/): the Rust service that runs agents on a Linux machine and saves their history.
- [`skills/`](skills/): the skills every OsmoDeck agent ships with.

## Build the core (optional)

```sh
cd core
cargo build --locked --release
cargo test --locked --all-targets
```

Core docs: [setup](core/docs/setup.md) · [HTTP API](core/docs/api.md) · [storage](core/docs/storage.md) · [harnesses](core/docs/harnesses.md) · [session lifecycle](core/docs/session-lifecycle.md)

## Security

Agents run without approval prompts, so only run OsmoDeck on machines and projects you trust. Report vulnerabilities privately: see [SECURITY.md](.github/SECURITY.md).

## License

Apache 2.0, see [LICENSE](LICENSE). Upstream and BB attribution is in [NOTICE](NOTICE). The upstream name and logo are not part of this license and are not used here outside the attribution files.
