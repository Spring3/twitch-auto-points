// 14 minutes 58 seconds in ms
const ALMOST_FIFTEEN_MINUTES_MS = 15 * 60 * 1000 - 2000;
const TEN_SECONDS_MS = 10 * 1000;
const FIVE_SECONDS = 5 * 1000;

const maxClickAttempts = 5;
let isEnabled;
let intervalId;

function isLive() {
  return !!document.querySelector('.live-indicator');
}

function attemptToClick() {
  console.log('Trying to click');
  const bonusIcon = document.querySelector('.claimable-bonus__icon');
  if (bonusIcon) {
    bonusIcon.click();
    console.log('clicked');
    return true;
  }
  console.log('not clicked');
  return false;
}

function waitForBonusButton() {
  console.log('searching for button');
  let clickAttempts = 0;
  intervalId = setInterval(() => {
    const clicked = attemptToClick();
    console.log('clicked', clicked);
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
  console.log('waiting for when live');
  // reusing the same interval
  interval = setInterval(() => {
    if (isLive()) {
      clearInterval(interval);
      waitForBonusButton();
    }
  }, TEN_SECONDS_MS);
}


function initialize() {
  if (intervalId) {
    clearInterval(intervalId);
  }

  console.log('Initialized');
  // initial check for the button
  attemptToClick();

  if (isLive()) {
    waitForBonusButton();
  } else {
    waitForWhenLive();
  }
}


browser.runtime.onMessage.addListener((message, sender) => {
  console.log('message', message);
  if (sender.id === browser.runtime.id && message.isEnabled !== isEnabled) {
    console.log('received message', message);
    isEnabled = message.isEnabled;
    if (isEnabled) {
      initialize();
    } else {
      clearInterval(intervalId);
    }
  }
});
