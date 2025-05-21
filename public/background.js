chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['injectIframePanel.js'] // Ce fichier doit contenir `injectIframePanel()` et l’appeler directement
  });
});
