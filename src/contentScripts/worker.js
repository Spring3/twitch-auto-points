// 14 minutes 57 seconds in ms
const ALMOST_FIFTEEN_MINUTES_MS = 15 * 60 * 1000 - 3000;
const THREE_SECONDS = 3 * 1000;

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
  return !!document.getElementsByClassName('live-indicator-container')[0];
}

function attemptToClick() {
  const bonusIcon = document.getElementsByClassName('claimable-bonus__icon')[0];
  if (bonusIcon) {
    bonusIcon.click();
    return true;
  }
  return false;
}

function waitForBonusButton() {
  let clickAttempts = 0;
  interval.set(() => {
    const clicked = attemptToClick();
    if (clicked) {
      pauseFor(ALMOST_FIFTEEN_MINUTES_MS);
    }
    
    clickAttempts ++;
    
    if (!clicked && clickAttempts > maxClickAttempts) {
      pauseFor(THREE_SECONDS);
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
  }, THREE_SECONDS);
}


function initialize() {
  clearTimeout(timeout);

  // initial check for the button
  attemptToClick();

  if (isLive()) {
    waitForBonusButton();
  } else {
    waitForWhenLive();
  }
}

const onMessage = (message, sender) => {
  if (sender.id === browser.runtime.id) {
    isEnabled = message.isEnabled;
    if (isEnabled) {
      initialize();
    } else {
      interval.clear();
      clearTimeout(timeout);
    }
  }
}


browser.runtime.onMessage.addListener(onMessage);
