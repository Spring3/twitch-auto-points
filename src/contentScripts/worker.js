// 14 minutes 58 seconds in ms
const ALMOST_FIFTEEN_MINUTES_MS = 15 * 60 * 1000 - 2000;
const TEN_SECONDS_MS = 10 * 1000;
const FIVE_SECONDS = 5 * 1000;

const maxClickAttempts = 5;
let isEnabled;
let intervalId;

function isLive() {
  return !!document.getElementsByClassName('live-indicator')[0];
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
  intervalId = setInterval(() => {
    const clicked = attemptToClick();
    if (clicked) {
      pauseFor(ALMOST_FIFTEEN_MINUTES_MS);
    }
    
    clickAttempts ++;
    
    if (!clicked && clickAttempts > maxClickAttempts) {
      pauseFor(FIVE_SECONDS);
    }
  }, 1000);
}

function pauseFor(duration) {
  clearInterval(intervalId);
  setTimeout(() => {
    if (isLive()) {
      waitForBonusButton();
    } else {
      waitForWhenLive();
    }
  }, duration);
}

function waitForWhenLive() {
  clearInterval(intervalId);
  // reusing the same interval
  intervalId = setInterval(() => {
    if (isLive()) {
      clearInterval(intervalId);
      waitForBonusButton();
    }
  }, TEN_SECONDS_MS);
}


function initialize() {
  if (intervalId) {
    clearInterval(intervalId);
  }

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
      clearInterval(intervalId);
    }
  }
}


browser.runtime.onMessage.addListener(onMessage);
