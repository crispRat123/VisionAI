// Listen for summarize_selection message from popup
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  console.log('Content script received message:', msg);
  if (msg.type === 'summarize_selection') {
    const selection = window.getSelection();
    const selectedText = selection && selection.toString().trim();
    console.log('Selected text:', selectedText);
    if (selectedText && selectedText.length > 10) {
      try {
        console.log('Calling aiSummarizeWithBuiltIn');
        const summary = await aiSummarizeWithBuiltIn(selectedText, {
          type: 'tldr',
          format: 'plain-text',
          length: 'short',
          outputLanguage: 'en'
        });
        sendResponse({ summary: summary.output });
        speak(summary.output);
      } catch (e) {
        sendResponse({ summary: 'Summarizer error: ' + e.message });
      }
    } else {
      sendResponse({ summary: 'Please select some text (at least 10 characters) on the page.' });
    }
    return true; // Keep the message channel open for async response
  }
});
// Summarize selected text using built-in AI when user selects text
document.addEventListener('mouseup', async (event) => {
  const selection = window.getSelection();
  const selectedText = selection && selection.toString().trim();
  if (selectedText && selectedText.length > 10) { // Only summarize if selection is reasonably long
    if (confirm('Summarize the selected text?')) {
      try {
        const summary = await aiSummarizeWithBuiltIn(selectedText, {
          type: 'tldr',
          format: 'plain-text',
          length: 'short'
        });
  alert('Summary:\n' + summary.output);
  speak(summary.output);
      } catch (e) {
        alert('Summarizer error: ' + e.message);
      }
    }
  }
});
let visionAIActive = false;
let lastElement = null;
let mouseMoveHandler = null;

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "visionai_toggle_on") {
    visionAIActive = true;
    // Speak a summary of the current tab
    const text = document.title + '. ' + document.body.innerText.slice(0, 5000);
    const summary = await (typeof aiSummarize === 'function' ? aiSummarize(text) : { output: text });
    if (summary && summary.output) speak(summary.output);

    // Add mousemove handler
    if (!mouseMoveHandler) {
      mouseMoveHandler = (e) => {
        if (!visionAIActive) return;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el && el !== lastElement) {
          lastElement = el;
          let type = el.tagName.toLowerCase();
          let role = '';
          if (type === 'button' || el.getAttribute('role') === 'button') role = 'button';
          else if (type === 'input') role = 'textbox';
          else if (type === 'textarea') role = 'textbox';
          else if (type === 'a') role = 'link';
          else if (el.getAttribute('role')) role = el.getAttribute('role');
          else role = type;
          let alt = el.getAttribute('alt') || el.getAttribute('aria-label') || '';
          let desc = `You are on a ${role}`;
          if (alt) desc += `, alt text: ${alt}`;
          speak(desc);
        }
      };
      document.addEventListener('mousemove', mouseMoveHandler);
    }
  } else if (msg.type === "visionai_toggle_off") {
    visionAIActive = false;
    lastElement = null;
    if (mouseMoveHandler) {
      document.removeEventListener('mousemove', mouseMoveHandler);
      mouseMoveHandler = null;
    }
  } else if (msg.type === "execute_action") {
    const { intent, target, text, prompt, targetLang } = msg.action;
    if (intent === "click") {
      document.querySelector(target)?.click();
    } else if (intent === "describe_image") {
      const img = document.querySelector(target);
      const blob = await fetch(img.src).then((r) => r.blob());
      const desc = await aiPrompt({ input: blob });
      speak(desc.output);
    } else if (intent === "summarize_page") {
      const textToSummarize = text || document.body.innerText.slice(0, 5000);
      const summary = await aiSummarize(textToSummarize);
      speak(summary.output);
    } else if (intent === "proofread") {
      const proof = await aiProofread(text);
      speak(proof.output);
    } else if (intent === "translate") {
      const translation = await aiTranslate(text, targetLang || 'en');
      speak(translation.output);
    } else if (intent === "write") {
      const written = await aiWrite(prompt);
      speak(written.output);
    } else if (intent === "rewrite") {
      const rewritten = await aiRewrite(text);
      speak(rewritten.output);
    }
  }
});
//
//  content.js
//  VisionAI
//
//  Created by Sidhant Semwal on 18/10/25.
//

