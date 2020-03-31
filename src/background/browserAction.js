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

const twitchUrlRegexp = /^https:\/\/www.twitch.tv\/*/;

let isEnabled;

browser.storage.local.get().then((currentState) => {
  isEnabled = typeof currentState.isEnabled === 'boolean' ? currentState.isEnabled : true;
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
      for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        emitStatus(tab.id, isEnabled);
      }
    });
}

function emitStatus(tabId, isEnabled) {
  if (isEnabled) {
    unlockForTab(tabId);
  } else {
    lockForTab(tabId);
  }
  browser.tabs.sendMessage(tabId, { isEnabled });
}

function lockForTab(tabId) {
  browser.browserAction.disable(tabId);
}

function unlockForTab(tabId) {
  browser.browserAction.enable(tabId);
}

browser.storage.onChanged.addListener((changes, areaName) => {
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


console.log('location', window.location.href);

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && changeInfo.url) {
    console.log('changeInfo', changeInfo);
    // if redirecting within twitch
    if (!redirectedToTwitch[tabId] && twitchUrlRegexp.test(changeInfo.url)) {
      console.log('valid url', (changeInfo || tab).url);
      unlockForTab(tabId);
      redirectedToTwitch[tabId] = true;
    // if was on twitch, but is redirecting outside
    } else if (redirectedToTwitch[tabId] && !twitchUrlRegexp.test(changeInfo.url)) {
      lockForTab(tabId);
      console.log('leaving twitch', changeInfo.url);
      delete redirectedToTwitch[tabId];
    // if not twitch
    } else if (!redirectedToTwitch[tabId] && !twitchUrlRegexp.test(changeInfo.url)) {
      console.log('not twitch', changeInfo.url);
      lockForTab(tabId);
    }
  } else if (changeInfo.status === 'complete' && redirectedToTwitch[tabId]) {
    console.log('changeInfo', changeInfo);
    emitStatus(tabId, isEnabled);
  }
});

browser.tabs.onRemoved.addListener((tabId) => {
  if (redirectedToTwitch[tabId]) {
    delete redirectedToTwitch[tabId];
  }
})

// browser.runtime.onMessage.addListener((message, sender) => {
//   console.log('sender', sender);
//   console.log('message', message);
//   if (sender.origin === 'https://www.twitch.tv') {
//     const tabId = sender.tab.id;
//     if (!twitchUrlRegexp.test(message.url)) {
//       console.log('false');
//       emitStatus(tabId, false);
//     } else if (typeof isEnabled === 'boolean') {
//       console.log('returning', isEnabled);
//       emitStatus(sender.tab.id, isEnabled);
//     } else {
//       browser.storage.local.get().then((currentState) => {
//         console.log('returning', typeof currentState.isEnabled === 'boolean' ? currentState.isEnabled : true);
//         const isEnabled = typeof currentState.isEnabled === 'boolean' ? currentState.isEnabled : true;
//         emitStatus(sender.tab.id, isEnabled);
//       });
//     }
//   }
// })
