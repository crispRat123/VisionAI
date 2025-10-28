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

window.aiSummarizeWithBuiltIn = aiSummarizeWithBuiltIn;
