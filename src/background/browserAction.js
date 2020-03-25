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

let isEnabled = true;

browser.storage.local.get().then((currentState) => {
  isEnabled = !!currentState.isEnabled;
  if (!isEnabled) {
    browser.browserAction.setIcon({ path: iconsDisabled });
  }
});

browser.browserAction.onClicked.addListener(() => {
  browser.storage.local.set({ isEnabled: !isEnabled });
});

function broadcastUpdate(isEnabled) {
  browser.tabs.query({ url: 'https://www.twitch.tv/*' })
    .then((tabs) => {
      console.log('tabs', tabs);
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        emitStatus(tab.id, isEnabled);
      }
    });
}

function emitStatus(tabId, isEnabled) {
  browser.tabs.sendMessage(tabId, { isEnabled });
}

browser.storage.onChanged.addListener((changes, areaName) => {
  console.log('changed', changes);
  if (areaName === 'local' && changes.isEnabled && changes.isEnabled.newValue !== undefined) {
    isEnabled = changes.isEnabled.newValue;
    if (isEnabled) {
      browser.browserAction.setIcon({ path: iconsEnabled });
    } else {
      browser.browserAction.setIcon({ path: iconsDisabled });
    }
    broadcastUpdate(isEnabled);
  }
});

const redirectedToTwitch = {};

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log(redirectedToTwitch);
  if (changeInfo.status === 'loading') {
    console.log('changeInfo', changeInfo);
    if (/^https:\/\/www.twitch.tv\/*/.test(changeInfo.url)) {
      console.log('loading', tab.url);
      redirectedToTwitch[tabId] = true;
      // if was on twitch, but is redirecting outside
    } else if (redirectedToTwitch[tabId]) {
      console.log('bye twitch');
      delete redirectedToTwitch[tabId];
    }
  } else if (changeInfo.status === 'complete' && redirectedToTwitch[tabId]) {
    emitStatus(tabId, isEnabled);
  }
}, { properties: ['status'] });
