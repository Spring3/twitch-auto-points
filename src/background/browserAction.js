const browser = require('webextension-polyfill');

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
const TEN_SECONDS_MS = 10 * 1000;

const throttledSetPoints = (setChannelPointsFn) => {
  const calls = {};
  return async (channelId, points) => {
    if (!calls[channelId]) {
      calls[channelId] = Date.now() - TEN_SECONDS_MS - 1;
    }

    const now = Date.now();
    const lastTime = calls[channelId];

    if (now - lastTime >= TEN_SECONDS_MS) {
      calls[channelId] = now;
      return setChannelPointsFn(channelId, points);
    }
  }
}

const Extension = () => {
  const state = {
    isEnabled: true,
    channelPoints: {}
  };

  const updateExtensionIcon = (isEnabled) => {
    const icons = isEnabled ? iconsEnabled : iconsDisabled;
    browser.browserAction.setIcon({ path: icons });
  }

  const initialize = async () => {
    const persistedState = await browser.storage.local.get();
    const { isEnabled, ...channelPoints } = persistedState;
    if (typeof isEnabled !== 'boolean') {
      state.isEnabled = true;
      await browser.storage.local.set({ isEnabled: true });
    } else {
      state.isEnabled = isEnabled;

      if (!isEnabled) {
        updateExtensionIcon(isEnabled);
      }
    }

    state.channelPoints = {
      ...channelPoints
    };
  }

  const updateTab = async (update, tabId) => {
    if (tabId) {
      browser.tabs.sendMessage(tabId, update);
    } else {
      const tabs = await browser.tabs.query({ url: 'https://www.twitch.tv/*' });
      for (const tab of tabs) {
        browser.tabs.sendMessage(tab.id, update);
      }
    }
  };

  const updateBadgeForChannel = async ({ channelId, tabId }) => {
    const points = getChannelPoints(channelId);
    if (tabId) {
      browser.browserAction.setBadgeText({
        text: String(points),
        tabId
      });
    } else {
      const tabs = await browser.tabs.query({ url: `https://www.twitch.tv/${channelId}` });
      for (const tab of tabs) {
        browser.browserAction.setBadgeText({
          text: String(points),
          tabId: tab.id
        });
      }
    }
  }

  const getChannelPoints = (channelId) => {
    return state.channelPoints[channelId] || 0
  };

  const setChannelPoints = async (channelId, points) => {
    await browser.storage.local.set({ [channelId]: points });
    state.channelPoints[channelId] = points;
    await updateBadgeForChannel({ channelId });
  }
  
  const lockForTab = (tabId) => {
    browser.browserAction.disable(tabId);
  }

  const unlockForTab = (tabId) => {
    browser.browserAction.enable(tabId);
  }

  return {
    initialize,
    updateBadgeForChannel,
    updateTab,
    lockForTab,
    unlockForTab,
    getChannelPoints,
    setChannelPoints: throttledSetPoints(setChannelPoints),
    isEnabled: () => {
      return state.isEnabled;
    },
    setEnabled: async (value) => {
      await browser.storage.local.set({ isEnabled: value });
      await updateTab({ isEnabled: value });
      updateExtensionIcon(value);
      state.isEnabled = value;
    }
  }

}

const redirectedToTwitch = {};
const extension = Extension();
extension.initialize();

browser.browserAction.onClicked.addListener(async () => {
  await extension.setEnabled(!extension.isEnabled());
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    // if redirecting within twitch
    if (
      (!redirectedToTwitch[tabId] && changeInfo.url && twitchUrlRegexp.test(changeInfo.url))
      || (!changeInfo.url && twitchUrlRegexp.test(tab.url))      
    ) {
      extension.unlockForTab(tabId);
      redirectedToTwitch[tabId] = true;
    // if was on twitch, but is redirecting outside
    } else if (redirectedToTwitch[tabId] && changeInfo.url && !twitchUrlRegexp.test(changeInfo.url)) {
      extension.lockForTab(tabId);
      delete redirectedToTwitch[tabId];
    // if not twitch
    } else if (!redirectedToTwitch[tabId] && changeInfo.url && !twitchUrlRegexp.test(changeInfo.url)) {
      extension.lockForTab(tabId);
      // page redirect outside twitch
    } else if (!changeInfo.url) {
      extension.lockForTab(tabId);
    }
  } else if (changeInfo.status === 'complete' && redirectedToTwitch[tabId]) {
    const channelId = new URL(tab.url).pathname.split('/').pop();
    extension.updateBadgeForChannel({
      channelId,
      tabId: tab.id
    });
    await extension.updateTab({ isEnabled: extension.isEnabled(), url: tab.url }, tabId);
  }
});

browser.tabs.onRemoved.addListener((tabId) => {
  if (redirectedToTwitch[tabId]) {
    delete redirectedToTwitch[tabId];
  }
})

const onContentScriptMessage = async (message, sender) => {
  if (sender.id === browser.runtime.id) {
    if (message.type === 'add_points') {
      const channelId = message.channelId;
      const pointsCollectedForChannel = extension.getChannelPoints(channelId);
      const updatedAmount = pointsCollectedForChannel + message.bonus;
      extension.setChannelPoints(channelId, updatedAmount);
    }
  }
}

browser.runtime.onMessage.addListener(onContentScriptMessage);
// TODO: round the number by adding K or M to the number when > 1000
// TODO: add color themes based on the amount of points collected
