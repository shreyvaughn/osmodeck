# OsmoDeck build notes

OsmoDeck is a modified build of [Cloudroom](https://github.com/davidondrej/cloudroom) (Apache 2.0, built on BB, MIT). The upstream license and NOTICE files are unchanged and must stay.

## What differs from upstream

- **No account or sign-in.** The setup dialog and the sidebar sign-in button are removed, and `signIn()` on the server refuses (set `OSMODECK_ALLOW_SIGN_IN=1` to re-enable it for testing).
- **No telemetry.** The PostHog key is empty and telemetry defaults to off.
- **No update checks.** Auto-update, the version poll and the changelog feed are disabled.
- **Blocked hosts.** Electron cancels requests from the app's windows to cloudroom.dev, cloudroom.run, posthog.com and getbb.app.
- **Brand.** OsmoSync Membrane mark for every icon, off-white instead of lime.
- **Full rename.** Every Cloudroom name in code, UI, packages (`@osmodeck/*`), env vars (`OSMODECK_*`), files and identifiers is now OsmoDeck: bundle identifier `dev.osmodeck.gui`, scheme `osmodeck://`, data directory `~/.gui-osmodeck`, skills directory `~/.osmodeck`. On first launch `migrateLegacyHomeData` (`gui/packages/config/src/legacy-home-migration.ts`) moves `~/.gui-cloudroom`, `~/.gui-cloudroom-dev` and `~/.cloudroom` to the new names and leaves a symlink at each old path, because the database and agent session history store absolute paths. Migration `0136_rename_osmodeck_tables` renames the `cloudroom_threads` and `cloudroom_commands` tables. Deliberately unchanged: `LICENSE` and `NOTICE` (Apache 2.0 attribution), applied migrations `0000` to `0135` (the migrator checks their hashes), `gui/apps/connect/migrations`, the upstream repository URL, and the upstream `cloudroom.dev` and `cloudroom.run` hostnames (needed for the host block).
- **Save for later.** A thread menu action parks a live thread (and its child threads) out of the sidebar and unpins it; the built-in **Saved** nav entry (`/saved`) lists them by project, opens them to continue, and moves them back. Archive is unchanged. Stored as `threads.saved_at` (migration `0135_thread_saved_at`), API `POST /threads/:id/save-for-later` and `/restore-saved`.
- **Import chats by name.** Settings, Import chats, then **Pick chats by name** lists every Claude Code (CLI and IDE extension), Codex, Pi, Hermes and T3 Code chat found on this Mac by its custom name, with search and checkboxes, and imports only the ticked ones. Claude Code chats come from `~/.claude/projects` (or `CLAUDE_CONFIG_DIR`); Agent SDK sessions are skipped.
- Cloud threads, Teleport and the relay need an upstream cloud account and are unavailable. Local agents work.

## Build and install (macOS, Apple Silicon)

```sh
cd gui
pnpm install --frozen-lockfile
pnpm exec turbo run build typecheck --filter=@osmodeck/app --filter=@osmodeck/server --filter=@osmodeck/desktop --concurrency=2
cd apps/desktop
pnpm run package
node scripts/install-macos.mjs   # installs /Applications/OsmoDeck.app (quit the app first)
```

If launching the binary directly from a shell, unset `ELECTRON_RUN_AS_NODE`.

## Upstream

`upstream` remote is the original repository. The Apache 2.0 trademark clause means the upstream name and logo are not licensed; this build carries neither outside the attribution files. Merging upstream changes now needs the same rename applied to them.

## Known failing tests

16 app tests fail in `gui/apps/app` (missing fixtures, a QueryClient setup error, a `loop` vs `automation` command name, three settings titles). None come from the rebrand.
