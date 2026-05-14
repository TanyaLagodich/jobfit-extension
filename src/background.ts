chrome.action.onClicked.addListener(async (tab) => {
  // Проверяем что мы на LinkedIn
  if (tab.url?.includes("linkedin.com/jobs") && tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_SIDEBAR" });
  }
});
