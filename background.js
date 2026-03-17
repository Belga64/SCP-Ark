const STORAGE_KEY = "scpList";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  // Toggle de marcar como lido/não lido a partir do content-scplist.js
  if (msg.scpToggle) {
    chrome.storage.local.get(STORAGE_KEY, (data) => {
      const list = data[STORAGE_KEY] || {};

      if (msg.value) {
        list[msg.scp] = true;
      } else {
        delete list[msg.scp];
      }

      chrome.storage.local.set({ [STORAGE_KEY]: list }, () => {
        console.log("SCP updated:", msg.scp, msg.value);
        sendResponse({ ok: true });
      });
    });

    return true;
  }
});
