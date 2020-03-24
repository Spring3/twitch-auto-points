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

browser.storage.local.get().then(async (currentState) => {
  if (!currentState.isEnabled) {
    browser.browserAction.setIcon({ path: iconsDisabled });
  }
});

browser.browserAction.onClicked.addListener(async () => {
  const state = await browser.storage.local.get();
  const isEnabled = !state.isEnabled;
  if (isEnabled) {
    browser.browserAction.setIcon({ path: iconsEnabled });
  } else {
    browser.browserAction.setIcon({ path: iconsDisabled });
  }
  return browser.storage.local.set({ isEnabled });
});
