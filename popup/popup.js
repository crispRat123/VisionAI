//
//  popup.js
//  VisionAI
//
//  Created by Sidhant Semwal on 18/10/25.
//

document.getElementById("startBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "start_listening" });
});
