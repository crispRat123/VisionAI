//
//  popup.js
//  VisionAI
//
//  Created by Sidhant Semwal on 18/10/25.
//


document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('toggleBtn');
  let isOn = false;

  btn.addEventListener('click', () => {
    isOn = !isOn;
    btn.textContent = isOn ? '🟢 On' : '🔴 Off';
    // Send a message to the active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: isOn ? 'visionai_toggle_on' : 'visionai_toggle_off'
        });
      }
    });
  });
  // Summarize Selection button logic
  const summarizeBtn = document.getElementById('summarizeBtn');
  const summaryResult = document.getElementById('summaryResult');

  summarizeBtn.addEventListener('click', () => {
    console.log('Summarize button clicked');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log('Found active tab:', tabs[0]);
      if (tabs[0]?.id) {
        console.log('Sending summarize_selection message to content script');
        chrome.tabs.sendMessage(tabs[0].id, { type: 'summarize_selection' }, (response) => {
          console.log('Got response:', response);
          if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
            summaryResult.textContent = 'Error: ' + chrome.runtime.lastError.message;
          } else if (response && response.summary) {
            summaryResult.textContent = response.summary;
          } else {
            summaryResult.textContent = 'No summary returned.';
          }
        });
      }
    });
  });
});
