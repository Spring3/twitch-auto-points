const browser = require('webextension-polyfill');

const THIRTY_SECONDS_MS = 30 * 1000;
const THREE_SECONDS_MS = 3 * 1000;
// 14 minutes 30 seconds in ms
const ALMOST_FIFTEEN_MINUTES_MS = 15 * 60 * 1000 - THIRTY_SECONDS_MS;

const maxClickAttempts = 5;
let isEnabled;
let timeout;

const IntervalOperator = () => {
  let intervalId;

  return {
    set: (handler, interval) => {
      clearInterval(intervalId);
      intervalId = setInterval(handler, interval);
    },
    clear: () => {
      clearInterval(intervalId);
    }
  };
};

const interval = IntervalOperator();

function isLive() {
  return Boolean(
    document.getElementsByClassName('live-indicator-container')[0]
    || document.getElementsByClassName('tw-channel-status-text-indicator')[0]
    || document.querySelector('[status="tw-channel-status-indicator--live"]')
  );
}

function attemptToClick() {
  const bonusIcon = document.getElementsByClassName('claimable-bonus__icon')[0];
  if (bonusIcon) {
    bonusIcon.click();
    return true;
  }
  return false;
}

function tryToGetReceivedPoints() {
  const maxAttempts = 20;
  let attempts = 0;
  const pointsInterval = setInterval(() => {
    if (attempts === maxAttempts) {
      clearInterval(pointsInterval);
      console.error('Failed to find the amount of gathered points');
      // sending the default amount. For subbed people that would be incorrect, but that's better than loosing track of all of them
      browser.runtime.sendMessage({
        type: 'add_points',
        bonus: 50,
        channelId
      })
      return;
    }

    attempts += 1;
    const bonusAmount = document.querySelector('.community-points-summary__points-add-text')?.textContent;
    if (bonusAmount) {
      // slice to remove + at the beginning
      const bonusAmountInt = parseInt(bonusAmount.slice(1), 10);
      const channelId = document.querySelector('.tw-halo')?.getAttribute('href').split('/').pop();
      browser.runtime.sendMessage({
        type: 'add_points',
        bonus: bonusAmountInt,
        channelId
      });

      clearInterval(pointsInterval);
    }
  }, 500);
}

function waitForBonusButton() {
  let clickAttempts = 0;
  interval.set(() => {
    const clicked = attemptToClick();
    if (clicked) {
      tryToGetReceivedPoints();
      pauseFor(ALMOST_FIFTEEN_MINUTES_MS);
    }
    
    clickAttempts ++;
    
    if (!clicked && clickAttempts > maxClickAttempts) {
      pauseFor(THREE_SECONDS_MS);
    }
  }, 1000);
}

function pauseFor(duration) {
  interval.clear();
  timeout = setTimeout(() => {
    if (isLive()) {
      waitForBonusButton();
    } else {
      // if the channel went off but the button appeared there since the last timeout
      attemptToClick();
      waitForWhenLive();
    }
  }, duration);
}

function waitForWhenLive() {
  interval.clear();
  // reusing the same interval
  interval.set(() => {
    if (isLive()) {
      interval.clear();
      waitForBonusButton();
    }
  }, THREE_SECONDS_MS);
}


function initialize() {
  clearTimeout(timeout);

  // initial check for the button
  const clicked = attemptToClick();
  if (clicked) {
    tryToGetReceivedPoints();
  }

  if (isLive()) {
    waitForBonusButton();
  } else {
    waitForWhenLive();
  }
}

const onMessage = (message, sender) => {
  if (sender.id === browser.runtime.id) {
    if (typeof message.isEnabled !== 'undefined') {
      isEnabled = message.isEnabled;
      if (isEnabled) {
        initialize();
      } else {
        interval.clear();
        clearTimeout(timeout);
      }
    } else if (message.reset && isEnabled) {
      interval.clear();
      initialize();
    }
  }
}


browser.runtime.onMessage.addListener(onMessage);
