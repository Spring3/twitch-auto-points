// 14 minutes 58 seconds in ms
const ALMOST_FIFTEEN_MINUTES_MS = 15 * 60 * 1000 - 2000;
const ONE_MINUTE_MS = 60 * 1000;
const FIVE_SECONDS = 5 * 1000;

const maxClickAttempts = 5;
let intervalId;

function isLive() {
  return !!document.querySelector('.live-indicator');
}

function attemptToClick() {
  const bonusIcon = document.querySelector('.claimable-bonus__icon');
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
    waitForBonusButton();
  }, duration);
}

function waitForWhenLive() {
  // reusing the same interval
  interval = setInterval(() => {
    if (isLive()) {
      clearInterval(interval);
      waitForBonusButton();
    }
  }, ONE_MINUTE_MS);
}


// initial check for the button
attemptToClick();

if (isLive()) {
  waitForBonusButton();
} else {
  waitForWhenLive();
}
