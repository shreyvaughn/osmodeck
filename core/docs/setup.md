# Run OsmoDeck on Ubuntu 24.04

OsmoDeck Core runs Codex or Pi through an HTTP API. No OsmoDeck account or GUI is required. Start with Codex below; [Pi configuration](harnesses.md#configure) uses the same service and API.

Use a **fresh VM for one trusted user**, with sudo access, systemd, cgroup v2, and space for your repositories and tools. Disk warnings start at 5 GB available; there is no fixed agent allowance or additional reserve. The installer does not configure quotas or change `/etc/fstab`. Containers and other Linux distributions are outside this guide.

Agents run without approval prompts and share their account's files. Do not give that account sudo or access to a Docker socket.

## Quick install

This fork publishes no prebuilt core releases, and the upstream install script installs the upstream build. Follow the manual steps below to build and install the core from source.

## Connect the desktop app

In the OsmoDeck app (built from this repository), open **Settings → OsmoDeck account → Connect your own Core**. Enter the HTTPS URL and the token from `sudo grep ^OSMODECK_TOKEN= /etc/osmodeck/core.env`. No OsmoDeck account is needed. Cloud threads then run on this machine and share its files.

## Your own server vs OsmoDeck Cloud

**Works on your own server:**

- Codex and Pi, set up in `core.env`. Claude Code, Cursor, OpenCode, Hermes, Devin, Droid, fx, and OpenClaw turn on once they are installed and signed in under the agent account.
- Cloud threads from the desktop app, with Mac access, web previews, secret requests, and synced skills and logins.
- Saved history, kept on this machine.

**OsmoDeck Cloud only:**

- GPUs, Cloud loops, and computer use. Local loops still work.
- Settings → Cloud environment (API keys, repos, setup script). Install your tools on the server yourself.
- Phone access while your Mac is off.
- One isolated sandbox per thread. Here, every thread shares one machine, so use it for one trusted user.

**History:** to back it up, run `sudo systemctl stop osmodeck`, copy `OSMODECK_STATE_DIR` (default `/var/lib/osmodeck/history`), then start it again. Moving history from OsmoDeck Cloud to your server isn't supported yet.

## Upgrade

Pick a `core-v` version from the [releases](https://github.com/davidondrej/cloudroom/releases), then:

```sh
v=X.Y.Z; a=$(uname -m)
curl -fsSLO https://github.com/davidondrej/cloudroom/releases/download/core-v$v/osmodeck-core-$v-linux-$a.tar.gz
mkdir core-$v && tar -xzf osmodeck-core-$v-linux-$a.tar.gz -C core-$v
sudo python3 core-$v/install/update.py upgrade "$PWD/core-$v"
sudo cat /var/lib/osmodeck-update/state.json
```

The script waits until agents are idle, backs up the old core, swaps it, checks every session, and rolls back on failure. Your settings, logins, and history stay. `"result": "updated"` means done; `waiting` means agents were busy, so run it again later. It never downgrades.

Upgrades don't add accounts or change SSH when `OSMODECK_STORE=self-hosted`. Mac access, secret requests, and previews run over Core's own port. A server already on SSH previews keeps them untouched.

## If something fails

```sh
sudo journalctl -u osmodeck.service -n 50 --no-pager
api http://127.0.0.1:9840/v1/health
sudo -u osmodeck-agent -H /usr/local/bin/codex login status
```

A failed readiness check usually means the journal or disk protection needs attention. A failed agent start may mean login or model configuration. There is no fixed limit on open harness sessions; actual concurrency depends on available VM resources. Keep logs private when asking for help.

## Machines without systemd

Run `install/sandbox-start.sh` as root, detached, on every boot. It parses (never sources) `image.env` and `/etc/osmodeck/core.env`, creates the agents' cgroup, runs Core as `osmodeck` with only the capabilities it needs, and restarts it after a crash. Containers without cgroups run Core in [container mode](storage.md#containers). A second start is a no-op. The log is `/var/log/osmodeck/core.log`. With `"agent_sudo": true` in `storage.json`, agents keep sudo on that machine. Before a stop, `POST /v1/drain {"hold":true}` refuses new work and reports whether anything still runs; `{"hold":false}` reopens it.

## Cloud folders

Send `"workspace":"PROJECT_ID"` and optional `"workspace_name":"project-name"` with `POST /v1/sessions`. The core creates an empty directory under `/code` and starts the harness. Repeated workspace IDs reuse their recorded directory; name collisions never overwrite another folder. No Git repository, local source folder, archive upload, or sync worker is required. The agent can clone a repository or install dependencies after starting. Send `"workspace":"root"` to start in `/code` itself, outside any project folder.

`GET /v1/workspaces/PROJECT_ID` returns the mapping; `GET /v1/sessions/SESSION_ID/workspace` returns the actual directory and Git metadata, which may be null. `/code` belongs to the unprivileged agent; the installer prepares it. Existing folders, nested mappings, session IDs, and history remain intact. No new environment variable or SQL migration is required.

The capability is `direct_workspaces: true`. Archive import, preparation, and activation endpoints are removed. Old project-sync requests are rejected, including reads, so an empty cloud folder cannot trigger local deletions.

## Skills and login sync

Run `python3 src/sync/client.py configure LOCAL_SYNC_DIR --connection PRIVATE_CONNECTION_JSON` on the Mac or Linux. The private JSON contains the existing core `url`, `token`, and optional `gateToken`; use mode 0600. This installs an independent background job for skills, supported settings, and Codex login only: a LaunchAgent on macOS, a systemd user service on Linux. Python 3.11+ is needed for Codex TOML settings. `status` reports state; `stop` removes the job. Other systems, such as Windows, can configure with `--no-start`, then supervise `run` themselves. Do not start your own `run` for a folder that the app or `configure` already started; setup then fails with "Another sync helper is still running".

Project files, unpublished Git changes, and project `.env` files no longer sync. Use Git or explicit message attachments. Conflicting skill/settings changes are preserved; offline changes catch up. `POST /v1/sync` handles device registration/status, file operations remain under `/v1/sync/{id}`, and `GET /v1/settings` is read-only.

On upgrade, stop old repository-sync workers before releasing pending starts. Reconfiguring the helper removes repository roots and aliases without deleting original files, old baselines, or recovery copies. Review queued prompts before restarting the core: previously waiting sessions can now start. Verify with `python3 tests/workspaces.py` and `python3 tests/sync_e2e.py`.
