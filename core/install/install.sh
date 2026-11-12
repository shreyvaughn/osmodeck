#!/bin/bash
# Install OsmoDeck core on a fresh Ubuntu 24.04 VM from a CI-tested release (docs/setup.md).
#   curl -fsSL https://cloudroom.dev/install.sh -o install.sh
#   sudo bash install.sh [--version X.Y.Z]
# History stays in the local journal (ADR 0237). To save it elsewhere, set OSMODECK_API_URL to a compatible server.
set -euo pipefail

REPO=davidondrej/cloudroom
LIB=/usr/local/lib/osmodeck
ETC=/etc/osmodeck
version=''

fail() { echo "OsmoDeck install failed: $*" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case $1 in
    --version) version=${2:-}; [[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail '--version needs X.Y.Z'; shift 2 ;;
    *) fail "unknown option $1" ;;
  esac
done

[ "$(id -u)" = 0 ] || fail 'run as root, for example with sudo'
command -v systemctl >/dev/null || fail 'systemd is required'
[ -f /sys/fs/cgroup/cgroup.controllers ] || fail 'cgroup v2 is required'
[ ! -e $ETC/core.env ] || fail "$ETC/core.env already exists. This script only does fresh installs; see docs/setup.md to upgrade."
. /etc/os-release
[ "${ID:-}" = ubuntu ] && [ "${VERSION_ID:-}" = 24.04 ] || echo "Warning: only Ubuntu 24.04 is tested; this is ${PRETTY_NAME:-unknown}." >&2

api=${OSMODECK_API_URL:-}
[ -z "$api" ] || [[ $api =~ ^https://[A-Za-z0-9.:/_-]+[A-Za-z0-9_-]$ ]] || fail 'OSMODECK_API_URL must be an https:// URL without a trailing slash'

echo 'Installing packages...'
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq curl git ca-certificates python3 openssl >/dev/null

echo 'Downloading the release...'
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
url=$(python3 - "$REPO" "$(uname -m)" "$version" <<'PY'
import json, sys, urllib.error, urllib.request
repo, arch, version = sys.argv[1:]
def get(path):
    with urllib.request.urlopen(f'https://api.github.com/repos/{repo}/{path}', timeout=30) as response:
        return json.load(response)
# App releases share this repo, so look for core-v tags: the exact tag, else the newest one in the first 500 releases.
try:
    releases = [get(f'releases/tags/core-v{version}')] if version else (r for page in range(1, 6) for r in get(f'releases?per_page=100&page={page}'))
    for release in releases:
        for asset in release['assets'] if release['tag_name'].startswith('core-v') else ():
            if asset['name'] == f'osmodeck-core-{release["tag_name"][6:]}-linux-{arch}.tar.gz':
                sys.exit(print(asset['browser_download_url']))
except urllib.error.HTTPError as error:
    if error.code != 404:
        raise
sys.exit(f'No osmodeck-core {version or "release"} build for {arch}. Follow the manual steps in docs/setup.md to build from source.')
PY
)
curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 --retry 3 -o "$stage/release.tar.gz" "$url"
tar -xzf "$stage/release.tar.gz" -C "$stage" --no-same-owner
sum=$(python3 -c 'import json, sys; print(json.load(open(sys.argv[1]))["sha256"])' "$stage/update-manifest.json")
echo "$sum  $stage/osmodeck" | sha256sum --check --status || fail 'the downloaded binary does not match its manifest'

# Agents and Command Guard need Node.js system-wide, not only in an administrator's nvm.
if ! [ -x /usr/local/bin/node ] && ! [ -x /usr/bin/node ]; then
  echo 'Installing Node.js 24...'
  case $(uname -m) in x86_64) node_arch=x64 ;; aarch64) node_arch=arm64 ;; *) fail "no Node.js build for $(uname -m)" ;; esac
  node_dist=https://nodejs.org/dist/latest-v24.x
  node_sum=$(curl --fail --silent --show-error --proto '=https' --tlsv1.2 --retry 3 "$node_dist/SHASUMS256.txt" | grep -E " node-v24\.[0-9.]+-linux-$node_arch\.tar\.gz$") || fail 'Node.js 24 was not found on nodejs.org'
  curl --fail --silent --show-error --proto '=https' --tlsv1.2 --retry 3 -o "$stage/node.tar.gz" "$node_dist/${node_sum##* }"
  echo "${node_sum%% *}  $stage/node.tar.gz" | sha256sum --check --status || fail 'the Node.js download does not match its checksum'
  tar -xzf "$stage/node.tar.gz" -C /usr/local --strip-components=1 --no-same-owner --wildcards '*/bin/*' '*/include/*' '*/lib/*' '*/share/*'
fi

echo 'Creating accounts and folders...'
id osmodeck >/dev/null 2>&1 ||
  useradd --system --user-group --create-home --home-dir /var/lib/osmodeck --shell /usr/sbin/nologin osmodeck
id osmodeck-agent >/dev/null 2>&1 || useradd --create-home --user-group --shell /bin/bash osmodeck-agent
agent_home=$(getent passwd osmodeck-agent | cut -d: -f6)
chmod 700 /var/lib/osmodeck "$agent_home"
install -d -m 700 -o osmodeck -g osmodeck /var/lib/osmodeck/history
install -d -m 750 -o root -g osmodeck $ETC
install -d -m 755 $LIB
install -d -m 700 -o osmodeck-agent -g osmodeck-agent /code
install -m 755 "$stage/osmodeck" $LIB/osmodeck
install -m 755 "$stage/install/configure.py" $LIB/configure.py
install -m 755 "$stage/install/previews.py" $LIB/previews.py
install -m 644 "$stage/install/osmodeck.service" /etc/systemd/system/osmodeck.service

echo 'Writing configuration...'
token=$(openssl rand -hex 32)
(
  umask 077
  set -C
  cat > $ETC/core.env <<EOF
OSMODECK_TOKEN=$token
OSMODECK_LISTEN=127.0.0.1:9840
OSMODECK_STORE=self-hosted
OSMODECK_STATE_DIR=/var/lib/osmodeck/history
OSMODECK_ACCOUNT_HOME=$agent_home
EOF
  if [ -n "$api" ]; then echo "OSMODECK_API_URL=$api" >> $ETC/core.env; else echo 'OSMODECK_LOCAL_HISTORY=1' >> $ETC/core.env; fi
)
chown osmodeck:osmodeck $ETC/core.env
python3 $LIB/configure.py --storage-only $ETC
# Mac access, secret requests, and previews, with no new account and no SSH changes. Core still runs without them.
python3 $LIB/previews.py --tunnel /var/lib/osmodeck/history >/dev/null ||
  echo 'Warning: Mac access, secret requests, and previews are not set up. Upgrading Core retries this.' >&2

echo 'Starting the service...'
systemctl daemon-reload
systemctl enable --now osmodeck.service
for _ in $(seq 30); do
  printf 'header = "Authorization: Bearer %s"\n' "$token" |
    curl --config - --silent --fail http://127.0.0.1:9840/v1/health >/dev/null && break
  sleep 1
done || true
systemctl is-active --quiet osmodeck.service || fail 'the service did not start; check: journalctl -u osmodeck.service -n 50'

cat <<EOF

OsmoDeck core $("$LIB/osmodeck" --version | cut -d' ' -f2) is running on 127.0.0.1:9840.
The API token is in $ETC/core.env (readable by root only).

One step remains:
Install a harness and sign in as the osmodeck-agent account (docs/setup.md, docs/harnesses.md).
   For Codex or Pi, add its settings to $ETC/core.env. Then run: sudo systemctl restart osmodeck

Run your first task: docs/setup.md#5-run-your-first-task
EOF
