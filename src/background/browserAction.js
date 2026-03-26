import browser from "webextension-polyfill";

const iconsEnabled = {
  16: "/icons/icon-color-16.png",
  32: "/icons/icon-color-32.png",
  128: "/icons/icon-color-128.png",
};

const iconsDisabled = {
  16: "/icons/icon-16.png",
  32: "/icons/icon-32.png",
  128: "/icons/icon-128.png",
};

const twitchUrlRegexp = /^https:\/\/www.twitch.tv\/.+/;
const TEN_SECONDS_MS = 10 * 1000;

// Helper to format badge numbers
const toBadgeText = (number) => {
  if (!number || number < 1) return "";
  if (number < 1e3) return String(number);
  if (number < 1e6) return +(number / 1e3).toFixed(1) + "K";
  return +(number / 1e6).toFixed(1) + "M";
};

/**
 * MV3 State Management:
 * Because Service Workers are ephemeral, we use a helper to
 * always get the freshest data from storage.
 */
const getStorageData = async () => {
  const data = await browser.storage.local.get();
  return {
    isEnabled: data.isEnabled !== false, // Default to true
    channelPoints: data.channelPoints || {},
    lastCalls: data.lastCalls || {},
  };
};

const updateExtensionIcon = (isEnabled) => {
  const icons = isEnabled ? iconsEnabled : iconsDisabled;
  browser.action.setIcon({ path: icons });
};

const updateBadgeForChannel = async (channelId, tabId) => {
  const { channelPoints } = await getStorageData();
  const points = channelPoints[channelId] || 0;

  try {
    await browser.action.setBadgeText({
      text: toBadgeText(points),
      tabId,
    });
  } catch (error) {
    // If the tab is gone, we just ignore the error.
    console.debug(`Tab ${tabId} closed before badge could update.`);
  }
};

// Main Logic Functions
const setChannelPointsThrottled = async (channelId, bonus) => {
  const { channelPoints, lastCalls } = await getStorageData();
  const now = Date.now();
  const lastTime = lastCalls[channelId] || 0;

  if (now - lastTime >= TEN_SECONDS_MS) {
    const updatedPoints = (channelPoints[channelId] || 0) + bonus;

    // Update storage
    await browser.storage.local.set({
      channelPoints: { ...channelPoints, [channelId]: updatedPoints },
      lastCalls: { ...lastCalls, [channelId]: now },
    });

    // Update UI across all tabs for this channel
    const tabs = await browser.tabs.query({
      url: `*://*.twitch.tv/${channelId}*`,
    });
    for (const tab of tabs) {
      updateBadgeForChannel(channelId, tab.id);
    }
  }
};

// --- Listeners ---

// Handle Browser Action Click (Toggle Enable/Disable)
browser.action.onClicked.addListener(async () => {
  const { isEnabled } = await getStorageData();
  const newState = !isEnabled;

  await browser.storage.local.set({ isEnabled: newState });
  updateExtensionIcon(newState);

  // Notify all Twitch tabs of the state change
  const tabs = await browser.tabs.query({ url: "*://*.twitch.tv/*" });
  for (const tab of tabs) {
    browser.tabs.sendMessage(tab.id, { isEnabled: newState }).catch((err) => {
      /* Ignore errors for tabs without content scripts */
      console.warn(`Could not message tab ${tab.id}: ${err.message}`);
    });
  }
});

// Handle Tab Updates (Badge and Content Script Sync)
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!tab.url || !twitchUrlRegexp.test(tab.url)) {
    try {
      await browser.action.disable(tabId);
    } catch (error) {} // If the tab is gone, we just ignore the error.
    return;
  }

  try {
    await browser.action.enable(tabId);

    if (changeInfo.status === "complete") {
      const urlParts = new URL(tab.url).pathname.split("/");
      const channelId = urlParts[1]; // Twitch channel name is the first path segment

      if (channelId) {
        const { isEnabled } = await getStorageData();
        await updateBadgeForChannel(channelId, tabId);

        browser.tabs
          .sendMessage(tabId, {
            isEnabled,
            url: tab.url,
            reset: true,
          })
          .catch(() => {});
      }
    }
  } catch (error) {
    console.error("Error in onUpdated:", error.message);
  }
});

// Handle Messages from Content Scripts
browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === "add_points" && message.channelId) {
    await setChannelPointsThrottled(message.channelId, message.bonus);
  }
});

// Initial Setup when extension installs/updates
browser.runtime.onInstalled.addListener(async () => {
  const { isEnabled } = await getStorageData();
  updateExtensionIcon(isEnabled);
});
