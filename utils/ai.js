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

  // Check if translation is available for this language pair
  const availability = await Translator.availability({
    sourceLanguage: sourceLanguage,
    targetLanguage: targetLanguage,
  });

  if (availability === 'no') {
    throw new Error(`Translation from ${sourceLanguage} to ${targetLanguage} is not available.`);
  }

  console.log('Text to translate:', text);

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
  
  // Speak the translated text in the target language
  if (options.speak !== false) {
    speakInLanguage(translatedText, targetLanguage);
  }
  
  return translatedText;
}

// Helper function to speak text in a specific language
function speakInLanguage(text, languageCode) {
  if (!text) return;
  
  // Cancel any ongoing speech to prevent overlap
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Map language codes to speech synthesis language codes
  const languageMap = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-PT',
    'ru': 'ru-RU',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'zh': 'zh-CN',
    'ar': 'ar-SA',
    'hi': 'hi-IN',
    'bn': 'bn-IN',
    'nl': 'nl-NL',
    'pl': 'pl-PL',
    'tr': 'tr-TR',
    'vi': 'vi-VN',
    'th': 'th-TH',
    'id': 'id-ID'
  };
  
  utterance.lang = languageMap[languageCode] || 'en-US';
  utterance.rate = 1;
  utterance.pitch = 1;
  
  console.log(`Speaking in ${utterance.lang}:`, text.substring(0, 50));
  window.speechSynthesis.speak(utterance);
}

// Function to describe images using Prompt API or fallback to alt text
async function aiDescribeImageWithPromptAPI(imageUrl, altText = '') {
  // Check if Prompt API is supported
  const isPromptAPISupported = ('ai' in self) && ('languageModel' in self.ai);
  
  console.log('Prompt API supported:', isPromptAPISupported);
  
  if (!isPromptAPISupported) {
    console.log('Prompt API not available, using fallback description');
    // Fallback: Use alt text or generate basic description
    if (altText && altText.trim().length > 0) {
      return `Image with alt text: "${altText}". This describes what the image contains.`;
    } else {
      // Extract filename from URL for context
      const filename = imageUrl.split('/').pop().split('?')[0] || 'image';
      return `Image detected: ${filename}. No alternative text is available for this image. Consider asking the website owner to add descriptive alt text for better accessibility.`;
    }
  }

  try {
    const { available } = await self.ai.languageModel.availability();
    
    console.log('Language model availability:', available);
    
    if (available === 'no') {
      console.log('Language model not available, using fallback');
      // Fallback description
      if (altText && altText.trim().length > 0) {
        return `Image with alt text: "${altText}". This describes what the image contains.`;
      } else {
        const filename = imageUrl.split('/').pop().split('?')[0] || 'image';
        return `Image detected: ${filename}. No alternative text available.`;
      }
    }

    console.log('Creating language model session for image description');
    
    const session = await self.ai.languageModel.create({
      systemPrompt: 'You are a helpful assistant that describes images for visually impaired users. Provide clear, concise, and informative descriptions.'
    });

    let prompt = '';
    if (altText && altText.trim().length > 0) {
      prompt = `The image has alt text: "${altText}". Please provide a brief, helpful description of what this image likely shows based on this alt text. Keep it under 3 sentences.`;
    } else {
      prompt = `This image has no alt text. Based on the context of the image URL: "${imageUrl}", please provide a brief description of what type of image this might be and suggest what it could contain. Keep it under 3 sentences.`;
    }

    console.log('Prompt for image description:', prompt);
    
    const description = await session.prompt(prompt);
    
    console.log('Image description result:', description);
    
    session.destroy();
    
    return description;
  } catch (error) {
    console.error('Prompt API error:', error);
    
    // Fallback description
    if (altText && altText.trim().length > 0) {
      return `Image with alt text: "${altText}". This describes what the image contains.`;
    } else {
      const filename = imageUrl.split('/').pop().split('?')[0] || 'image';
      return `Image detected: ${filename}. No alternative text is available for this image.`;
    }
  }
}

window.aiSummarizeWithBuiltIn = aiSummarizeWithBuiltIn;
window.aiTranslateWithBuiltIn = aiTranslateWithBuiltIn;
window.speakInLanguage = speakInLanguage;
window.aiDescribeImageWithPromptAPI = aiDescribeImageWithPromptAPI;