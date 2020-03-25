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
  console.log('Trying to click');
  const bonusIcon = document.getElementsByClassName('claimable-bonus__icon')[0];
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
  clearInterval(intervalId);
  // reusing the same interval
  intervalId = setInterval(() => {
    if (isLive()) {
      console.log('isLive');
      clearInterval(intervalId);
      waitForBonusButton();
    } else {
      console.log('not live');
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

const onMessage = (message, sender) => {
  console.log('message', message);
  if (sender.id === browser.runtime.id) {
    console.log('received message', message);
    isEnabled = message.isEnabled;
    if (isEnabled) {
      initialize();
    } else {
      clearInterval(intervalId);
    }
  }
}


browser.runtime.onMessage.addListener(onMessage);

window.onbeforeunload = function(e) {
  console.log('before unload');
  console.log(location.href);
  browser.runtime.onMessage.removeListener(onMessage);
};
