browser.browserAction.onClicked.addListener(async () => {
  const state = await browser.storage.local.get();
  browser.browserAction.setIcon({ path: state.isEnabled ? 'icons/icon-light.svg' : 'icons/icon.svg' });
  return browser.storage.local.set({
    isEnabled: !state.isEnabled
  });
});
