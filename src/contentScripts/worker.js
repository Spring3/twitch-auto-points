// 14 minutes 58 seconds in ms
const ALMOST_FIFTEEN_MINUTES_MS = 15 * 60 * 1000 - 2000;
const FIVE_SECONDS = 5 * 1000;

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
  interval.set(() => {
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
  interval.clear();
  timeout = setTimeout(() => {
    if (isLive()) {
      waitForBonusButton();
    } else {
      waitForWhenLive();
    }
  }, duration);
}

function waitForWhenLive() {
  console.log('waiting when live');
  interval.clear();
  // reusing the same interval
  interval.set(() => {
    if (isLive()) {
      interval.clear();
      waitForBonusButton();
    }
  }, FIVE_SECONDS);
}


function initialize() {
  console.log('initializing');
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
