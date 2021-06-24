const { throttledSetPoints, toBadgeText } = require('./utils.js');

const Extension = (browser) => {
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
        text: toBadgeText(points),
        tabId
      });
    } else {
      const tabs = await browser.tabs.query({ url: `https://www.twitch.tv/${channelId}` });
      for (const tab of tabs) {
        browser.browserAction.setBadgeText({
          text: toBadgeText(points),
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

module.exports = {
  Extension
};
