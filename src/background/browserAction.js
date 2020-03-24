browser.storage.local.get().then((currentState) => {
  if (!currentState.isEnabled) {
    browser.browserAction.setIcon({ path: 'icons/icon.svg' });
  }
});

browser.browserAction.onClicked.addListener(async () => {
  const state = await browser.storage.local.get();
  const isEnabled = !state.isEnabled;
  if (isEnabled) {
    browser.browserAction.setIcon({ path: 'icons/icon-color.svg' });
  } else {
    browser.browserAction.setIcon({ path: 'icons/icon.svg' });
  }
  return browser.storage.local.set({ isEnabled });
});
