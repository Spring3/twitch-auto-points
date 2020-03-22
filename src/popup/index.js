browser.tabs.executeScript({ file: '/contentScripts/collector.js' })
  .catch((error) => {
    console.error(error);
  });
