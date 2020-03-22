// 14 minutes 58 seconds in ms
const ALMOST_FIFTEEN_MINUTES_MS = 15 * 60 * 1000 - 2000;

let intervalId;

function startInterval() {
  intervalId = setInterval(() => {
    const bonusIcon = document.querySelector('.claimable-bonus__icon');
    console.log('Found the following:', bonusIcon);
    if (bonusIcon) {
      bonusIcon.click();
      pauseInterval();
    }
  }, 1000);
}

function pauseInterval() {
  clearInterval(intervalId);
  setTimeout(() => {
    startInterval();
  }, ALMOST_FIFTEEN_MINUTES_MS);
}

startInterval();

console.log('Loaded content script');
