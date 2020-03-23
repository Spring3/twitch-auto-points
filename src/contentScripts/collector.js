// 14 minutes 58 seconds in ms
const ALMOST_FIFTEEN_MINUTES_MS = 15 * 60 * 1000 - 2000;

let intervalId;

function isLive() {
  return !!document.querySelector('.live-indicator');
}

function attemptToClick() {
  const bonusIcon = document.querySelector('.claimable-bonus__icon');
  if (bonusIcon) {
    console.log('Found a button');
    bonusIcon.click();
    return true;
  }
  return false;
}

function startInterval() {
  intervalId = setInterval(() => {
    const clicked = attemptToClick();
    if (clicked) {
      pauseForFifteenMinutes();
    }
  }, 1000);
}

function pauseForFifteenMinutes() {
  clearInterval(intervalId);
  setTimeout(() => {
    startInterval();
  }, ALMOST_FIFTEEN_MINUTES_MS);
}


// initial check for the button
attemptToClick();

if (isLive()) {
  console.log('Live');
  startInterval();
} else {

}

console.log('Loaded content script');
