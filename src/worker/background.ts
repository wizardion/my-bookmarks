chrome.runtime.onInstalled.addListener(async () => {
  await chrome.action.setPopup({ popup: '' });
});

chrome.action.onClicked.addListener(async () => {
  return chrome.tabs.create({ url: 'manager.html' });
});
