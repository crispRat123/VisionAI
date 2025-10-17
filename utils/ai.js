//
//  ai.js
//  VisionAI
//
//  Created by Sidhant Semwal on 18/10/25.
//

async function aiPrompt(input) {
  const response = await ai.prompt({ model: "gemini-nano", input });
  return response;
}

async function aiSummarize(text) {
  const response = await ai.summarizer.summarizeText(text);
  return response;
}

