const browser = require('webextension-polyfill');
const { Extension } = require('./extension.js');
const { twitchUrlRegexp } = require('./constants.js');

const redirectedToTwitch = {};
const extension = Extension(browser);
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
    browser.tabs.sendMessage(tabId, { reset: true });
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
// TODO: add color themes based on the amount of points collected
// TODO: sync info between devices
