const DESKTOP_RELEASE_CHANNEL_ENV_NAME = "BB_DESKTOP_RELEASE_CHANNEL";

export const OSMODECK_UPDATE_BASE_URL =
  "https://github.com/davidondrej/cloudroom/releases/latest/download/";

export function resolveDesktopReleaseChannel(env) {
  const rawChannel = env[DESKTOP_RELEASE_CHANNEL_ENV_NAME]?.trim();
  if (rawChannel === undefined || rawChannel.length === 0) {
    return "latest";
  }
  if (rawChannel === "latest" || rawChannel === "nightly") {
    return rawChannel;
  }

  throw new Error(
    `${DESKTOP_RELEASE_CHANNEL_ENV_NAME} must be latest or nightly, got ${rawChannel}.`,
  );
}

export function resolveDesktopBuildPlatform(nodePlatform) {
  if (nodePlatform === "darwin") {
    return "macos";
  }
  if (nodePlatform === "linux") {
    return "linux";
  }
  if (nodePlatform === "win32") {
    return "windows";
  }

  throw new Error(
    `Desktop builds support darwin, linux, and win32 only, got ${nodePlatform}.`,
  );
}

export function createDesktopReleaseConfig(channel) {
  if (channel === "nightly") {
    return {
      appId: "dev.osmodeck.gui.nightly",
      applicationName: "OsmoDeck Nightly",
      artifactName: "gui-osmodeck-nightly-${version}-${arch}.${ext}",
      iconFileName: "icon-nightly.png",
      linuxDesktopName: "osmodeck-nightly.desktop",
      // The Linux binary name must differ from stable so both channels can be
      // installed at once without one shadowing the other on PATH.
      linuxExecutableName: "gui-osmodeck-nightly",
      macIconPath: "assets/icon-nightly.icns",
      releaseTag: "desktop-nightly",
      updateMetadataFileNames: {
        linux: "nightly-linux.yml",
        macos: "nightly-mac.yml",
        windows: "nightly.yml",
      },
      // electron-builder names the per-user install folder after the package:
      // %LOCALAPPDATA%\Programs\OsmoDeck-Nightly.
      windowsInstallName: "OsmoDeck-Nightly",
    };
  }

  return {
    appId: "dev.osmodeck.gui",
    applicationName: "OsmoDeck",
    artifactName: "${productName}-${version}-${arch}.${ext}",
    iconFileName: "icon.png",
    linuxDesktopName: "osmodeck.desktop",
    linuxExecutableName: "gui-osmodeck",
    macIconPath: "assets/icon.icns",
    releaseTag: "desktop-latest",
    updateMetadataFileNames: {
      linux: "latest-linux.yml",
      macos: "latest-mac.yml",
      windows: "latest.yml",
    },
    windowsInstallName: "OsmoDeck",
  };
}
