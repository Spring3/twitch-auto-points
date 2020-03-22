const ONE_MINUTE_MS = 60 * 1000;

let intervalId;

function startInterval() {
  intervalId = setInterval(() => {
    const bonusIcon = document.querySelector('.claimable-bonus__icon');
    console.log('Found the following:', bonusIcon);
    if (bonusIcon) {
      bonusIcon.click();
    }
  }, 1000);
}

function pauseInterval(durationMS) {
  clearInterval(intervalId);
  setTimeout(() => {
    startInterval();
  }, ONE_MINUTE_MS);
}

startInterval();

console.log('Loaded content script');
