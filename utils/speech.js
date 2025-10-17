//
//  speech.js.swift
//  VisionAI
//
//  Created by Sidhant Semwal on 18/10/25.
//

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  speechSynthesis.speak(utter);
}

function startListening(callback) {
  const rec = new webkitSpeechRecognition();
  rec.lang = "en-US";
  rec.onresult = (e) => callback(e.results[0][0].transcript);
  rec.start();
}
