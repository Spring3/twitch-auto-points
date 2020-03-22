setInterval(() => {
  const bonusIcon = document.querySelector('.claimable-bonus__icon');
  console.log('Found the following:', bonusIcon);
  if (bonusIcon) {
    bonusIcon.click();
  }
}, 1000);

console.log('Loaded content script');
