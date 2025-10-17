importScripts("utils/speech.js", "utils/ai.js");

let listening = false;

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.type === "voice_command") {
    const text = msg.text;
    const action = await interpretCommand(text); // ai.js helper
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: "execute_action", action });
    });
  }
});

async function interpretCommand(text) {
  const prompt = `You are a web navigation AI. Interpret this command: "${text}". Output a structured JSON with intent and target.`;
  const result = await aiPrompt(prompt); // from ai.js
  return JSON.parse(result.output);
}
//
//  background.js
//  VisionAI
//
//  Created by Sidhant Semwal on 18/10/25.
//

