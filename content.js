chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "execute_action") {
    const { intent, target } = msg.action;
    if (intent === "click") {
      document.querySelector(target)?.click();
    } else if (intent === "describe_image") {
      const img = document.querySelector(target);
      const blob = await fetch(img.src).then((r) => r.blob());
      const desc = await aiPrompt({ input: blob });
      speak(desc.output); // from speech.js
    } else if (intent === "summarize_page") {
      const text = document.body.innerText.slice(0, 5000);
      const summary = await aiSummarize(text);
      speak(summary.output);
    }
  }
});
//
//  content.js
//  VisionAI
//
//  Created by Sidhant Semwal on 18/10/25.
//

