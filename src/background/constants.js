const TEN_SECONDS_MS = 10 * 1000;
const twitchUrlRegexp = /^https:\/\/www.twitch.tv\/*/;

const iconsEnabled = {
  16: "icons/icon-color-16.png",
  32: "icons/icon-color-32.png",
  48: "icons/icon-color-48.png",
  64: "icons/icon-color-64.png",
  96: "icons/icon-color-96.png",
  128: "icons/icon-color-128.png",
  256: "icons/icon-color-256.png"
};

const iconsDisabled = {
  16: "icons/icon-16.png",
  32: "icons/icon-32.png",
  48: "icons/icon-48.png",
  64: "icons/icon-64.png",
  96: "icons/icon-96.png",
  128: "icons/icon-128.png",
  256: "icons/icon-256.png"
}

module.exports = {
  TEN_SECONDS_MS,
  twitchUrlRegexp,
  iconsDisabled,
  iconsEnabled
};
