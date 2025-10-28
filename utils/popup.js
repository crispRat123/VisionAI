document.getElementById('summarize-btn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { type: 'summarize_selection' },
      (response) => {
        if (response && response.summary) {
          document.getElementById('summary-output').innerText = response.summary;
        } else {
          document.getElementById('summary-output').innerText = 'No response received.';
        }
      }
    );
  });
});
// popup.js
document.addEventListener('DOMContentLoaded', async () => {
  const focusToggle = document.getElementById('focusToggle');
  const status = document.getElementById('status');

  // Load saved toggle state
  chrome.storage.sync.get(['focusSummarizeEnabled'], (res) => {
    focusToggle.checked = !!res.focusSummarizeEnabled;
    status.textContent = res.focusSummarizeEnabled
      ? 'Focus Summarize Mode is ON'
      : 'Focus Summarize Mode is OFF';
  });

  // When toggled, update storage and notify content script
  focusToggle.addEventListener('change', () => {
    const enabled = focusToggle.checked;
    chrome.storage.sync.set({ focusSummarizeEnabled: enabled });

    status.textContent = enabled
      ? 'Focus Summarize Mode is ON'
      : 'Focus Summarize Mode is OFF';

    // Notify active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: enabled ? 'focus_mode_on' : 'focus_mode_off'
      });
    });
  });
});
