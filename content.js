document.addEventListener('mouseup', async (event) => {
  const selection = window.getSelection();
  const selectedText = selection && selection.toString().trim();

  if (selectedText && selectedText.length > 10) {
    const confirmSummarize = confirm('Do you want to summarize the selected text?');
    if (!confirmSummarize) return;

    try {
      // Summarize selected text
      const summary = await aiSummarizeWithBuiltIn(selectedText, {
        type: 'tldr',
        format: 'plain-text',
        length: 'short',
        outputLanguage: 'en'
      });

      // Show custom floating popup
      showSummaryPopup(summary);

      // Speak the summary simultaneously
      speak(summary);

    } catch (e) {
      alert('Summarizer error: ' + e.message);
    }
  }
});

function speak(text) {
  if (!text) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function showSummaryPopup(summaryText) {
  // Remove old popup if any
  const oldPopup = document.getElementById('visionai-summary-popup');
  if (oldPopup) oldPopup.remove();

  // Create popup
  const popup = document.createElement('div');
  popup.id = 'visionai-summary-popup';
  popup.textContent = summaryText;
  Object.assign(popup.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    background: '#fff',
    color: '#000',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    zIndex: 999999,
    maxWidth: '300px',
    fontFamily: 'sans-serif',
    fontSize: '14px',
    whiteSpace: 'pre-wrap'
  });

  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '5px',
    right: '8px',
    border: 'none',
    background: 'transparent',
    fontSize: '16px',
    cursor: 'pointer'
  });
  closeBtn.onclick = () => popup.remove();

  popup.appendChild(closeBtn);
  document.body.appendChild(popup);
}
let focusSummarizeMode = false;

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === 'focus_mode_on') {
    focusSummarizeMode = true;
    speak('Focus summarize mode is now active. Move with Tab to focus content and press Enter to summarize.');
    enableFocusSummarize();
  } else if (msg.type === 'focus_mode_off') {
    focusSummarizeMode = false;
    speak('Focus summarize mode is now off.');
    disableFocusSummarize();
  }
});

function enableFocusSummarize() {
  document.addEventListener('keydown', handleFocusSummarizeKey);
}

function disableFocusSummarize() {
  document.removeEventListener('keydown', handleFocusSummarizeKey);
}

async function handleFocusSummarizeKey(e) {
  if (!focusSummarizeMode) return;
  if (e.key !== 'Enter') return; // only trigger with Enter

  const el = document.activeElement;
  if (!el) return;

  let text = '';

  // Grab text based on element type
  if (el.innerText) text = el.innerText.trim();
  else if (el.value) text = el.value.trim();

  // Fallback to a small region of the page
  if (!text || text.length < 20) {
    text = document.body.innerText.slice(0, 5000);
  }

  try {
    speak('Summarizing focused content.');
    const summary = await aiSummarizeWithBuiltIn(text, {
      type: 'tldr',
      format: 'plain-text',
      length: 'short',
      outputLanguage: 'en'
    });
    // Speak the summary aloud and show popup
    speak(summary);
    showSummaryPopup(summary);
  } catch (err) {
    speak('Summarization failed: ' + err.message);
  }
}

// Reuse your existing speak() and showSummaryPopup() from before.
