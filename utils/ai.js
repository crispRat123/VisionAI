async function aiSummarizeWithBuiltIn(text, options = {}) {
  if (!('Summarizer' in self)) {
    throw new Error('Summarizer API not supported in this browser.');
  }

  const availability = await Summarizer.availability();
  if (availability === 'unavailable') {
    throw new Error('Summarizer API is unavailable on this device.');
  }

  console.log('Text to summarize:', text);

  const summarizer = await Summarizer.create({
    type: options.type || 'tldr',
    format: options.format || 'plain-text',
    length: options.length || 'short',
    outputLanguage: 'en',
    expectedInputLanguages: ['en'],
    expectedContextLanguages: ['en'],
    sharedContext: options.sharedContext || 'Summarizing general English text.'
  });

  console.log('Created summarizer');

  const summary = await summarizer.summarize(text, {
    context: options.context || 'Summarize this content clearly and concisely.'
  });

  console.log('Summary result:', summary);
  return summary;
}

async function aiTranslateWithBuiltIn(text, options = {}) {
  if (!('Translator' in self)) {
    throw new Error('Translator API not supported in this browser.');
  }

  const sourceLanguage = options.sourceLanguage || 'en';
  const targetLanguage = options.targetLanguage || 'es';

  console.log(`Translating from ${sourceLanguage} to ${targetLanguage}`);

  // Check if translation is available for this language pair
  const translatorCapabilities = await Translator.availability({
    sourceLanguage: sourceLanguage,
    targetLanguage: targetLanguage,
  });

  console.log('Translator capabilities:', translatorCapabilities);

  if (translatorCapabilities === 'no') {
    throw new Error(`Translation from ${sourceLanguage} to ${targetLanguage} is not available.`);
  }

  // Create translator with download progress monitoring
  const translator = await Translator.create({
    sourceLanguage: sourceLanguage,
    targetLanguage: targetLanguage,
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`Translation model downloaded ${e.loaded * 100}%`);
      });
    },
  });

  console.log('Created translator');

  // Translate the text
  const translatedText = await translator.translate(text);

  console.log('Translation result:', translatedText);
  return translatedText;
}

window.aiSummarizeWithBuiltIn = aiSummarizeWithBuiltIn;
window.aiTranslateWithBuiltIn = aiTranslateWithBuiltIn;