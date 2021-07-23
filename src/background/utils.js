const throttledSetPoints = (setChannelPointsFn) => {
  const calls = {};
  return async (channelId, points) => {
    if (!calls[channelId]) {
      calls[channelId] = Date.now() - TEN_SECONDS_MS - 1;
    }

    const now = Date.now();
    const lastTime = calls[channelId];

    if (now - lastTime >= TEN_SECONDS_MS) {
      calls[channelId] = now;
      return setChannelPointsFn(channelId, points);
    }
  }
}

const toBadgeText = (number) => {
  if (number < 1e3) return String(number);
  if (number >= 1e3 && number < 1e6) return +(number / 1e3).toFixed(1) + "K";
  if (number >= 1e6 && number < 1e9) return +(number / 1e6).toFixed(1) + "M";
}

module.exports = {
  toBadgeText,
  throttledSetPoints
};
