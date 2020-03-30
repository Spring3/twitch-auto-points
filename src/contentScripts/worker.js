// 14 minutes 58 seconds in ms
const ALMOST_FIFTEEN_MINUTES_MS = 15 * 60 * 1000 - 2000;
const FIVE_SECONDS = 5 * 1000;

const maxClickAttempts = 5;
let isEnabled;
let intervalId;

function isLive() {
  return !!document.getElementsByClassName('live-indicator')[0];
}

function attemptToClick() {
  const bonusIcon = document.getElementsByClassName('claimable-bonus__icon')[0];
  console.log('icon', bonusIcon);
  if (bonusIcon) {
    bonusIcon.click();
    return true;
  }
  return false;
}

function waitForBonusButton() {
  let clickAttempts = 0;
  console.log('looking for button');
  intervalId = setInterval(() => {
    const clicked = attemptToClick();
    console.log('click', clicked);
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
  console.log('pausing for', duration);
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
  console.log('waiting when live');
  clearInterval(intervalId);
  // reusing the same interval
  intervalId = setInterval(() => {
    if (isLive()) {
      clearInterval(intervalId);
      waitForBonusButton();
    }
  }, FIVE_SECONDS);
}


function initialize() {
  console.log('INTERVAL', intervalId);
  if (intervalId) {
    console.log('CLEARING');
    clearInterval(intervalId);
  }

  console.log('initializing');

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
      clearInterval(intervalId);
      initialize();
    } else {
      clearInterval(intervalId);
    }
  }
}


browser.runtime.onMessage.addListener(onMessage);
