// Summarization function using Summarizer API directly
async function aiSummarizeWithPromptAPI(text, options = {}) {
  if (typeof Summarizer === 'undefined') {
    throw new Error('Summarizer API not supported in this browser.');
  }

  const summaryType = options.type || 'tl;dr';
  const summaryLength = options.length || 'short';

  console.log(`Summarization request: type=${summaryType}, length=${summaryLength}`);
  console.log('Text to summarize:', text.substring(0, 100));

  // Check availability
  const availability = await Summarizer.availability();
  if (availability === 'unavailable') {
    throw new Error('Summarizer API is unavailable on this device.');
  }

  console.log('Creating summarizer...');

  // Create summarizer
  const summarizer = await Summarizer.create({
    type: summaryType,
    format: options.format || 'plain-text',
    length: summaryLength,
    outputLanguage: 'en',
    expectedInputLanguages: ['en'],
    expectedContextLanguages: ['en'],
    sharedContext: options.sharedContext || 'Summarizing general English text.'
  });

  console.log('Summarizer created. Generating summary...');

  // Generate summary
  const summary = await summarizer.summarize(text, {
    context: options.context || 'Summarize this content clearly and concisely.'
  });

  console.log('Summary result:', summary);

  return summary;
}

// Legacy function for backward compatibility
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

// Translation function using Translator API directly
async function aiTranslateWithPromptAPI(text, options = {}) {
  if (typeof Translator === 'undefined') {
    throw new Error('Translator API not supported in this browser.');
  }

  const sourceLanguage = options.sourceLanguage || 'en';
  const targetLanguage = options.targetLanguage || 'es';

  console.log(`Translation request: ${sourceLanguage} -> ${targetLanguage}`);
  console.log('Text to translate:', text.substring(0, 100));

  // Check if translation is available for this language pair
  const availability = await Translator.availability({
    sourceLanguage: sourceLanguage,
    targetLanguage: targetLanguage,
  });

  if (availability === 'no') {
    throw new Error(`Translation from ${sourceLanguage} to ${targetLanguage} is not available.`);
  }

  console.log('Creating translator...');

  // Create translator with download progress monitoring
  const translator = await Translator.create({
    sourceLanguage: sourceLanguage,
    targetLanguage: targetLanguage,
    monitor(m) {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`Translation model downloaded ${(e.loaded * 100).toFixed(2)}%`);
      });
    },
  });

  console.log('Translator created. Translating text...');

  // Translate the text
  const translatedText = await translator.translate(text);

  console.log('Translation result:', translatedText);

  // Speak the translated text in the target language
  if (options.speak !== false) {
    speakInLanguage(translatedText, targetLanguage);
  }

  return translatedText;
}

// Legacy function for backward compatibility
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
  // Check if Prompt API is supported (using correct API check)
  const isPromptAPISupported = typeof LanguageModel !== 'undefined';
  
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
    // Check availability using the correct API
    const availability = await LanguageModel.availability();
    
    console.log('Language model availability:', availability);
    
    if (availability === 'unavailable') {
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
    
    // Create session with initial system prompt
    const session = await LanguageModel.create({
      initialPrompts: [
        {
          role: 'system',
          content: 'You are a helpful assistant that describes images for visually impaired users. Provide clear, concise, and informative descriptions.'
        }
      ]
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

// Function to check AI API availability and provide setup instructions
async function checkAIAvailability() {
  const status = {
    isSupported: false,
    isAvailable: false,
    capabilities: {},
    instructions: []
  };

  // Check if Prompt API (LanguageModel) exists
  if (typeof LanguageModel === 'undefined') {
    status.instructions.push('❌ Chrome Built-in AI (Prompt API) is not supported in this browser.');
    status.instructions.push('📋 Setup Instructions:');
    status.instructions.push('1. Download Chrome Canary or Chrome Dev (version 127+)');
    status.instructions.push('2. Enable flag: chrome://flags/#prompt-api-for-gemini-nano');
    status.instructions.push('3. Enable flag: chrome://flags/#optimization-guide-on-device-model (use "Enabled BypassPerfRequirement")');
    status.instructions.push('4. Restart Chrome');
    status.instructions.push('5. Download model at chrome://components/ (look for "Optimization Guide On Device Model")');
    status.instructions.push('6. Check chrome://on-device-internals for model status');
    return status;
  }

  status.isSupported = true;

  // Check Language Model (Prompt API) availability
  try {
    const availability = await LanguageModel.availability();
    status.capabilities.languageModel = { availability };
    
    if (availability === 'readily') {
      status.isAvailable = true;
      status.instructions.push('✅ Language Model (Prompt API) is ready to use!');
      
      // Get model parameters
      try {
        const params = await LanguageModel.params();
        status.capabilities.languageModel.params = params;
        status.instructions.push(`   Temperature: ${params.defaultTemperature} (max: ${params.maxTemperature})`);
        status.instructions.push(`   TopK: ${params.defaultTopK} (max: ${params.maxTopK})`);
      } catch (error) {
        status.instructions.push(`⚠️ Could not fetch model parameters: ${error.message}`);
      }
    } else if (availability === 'downloadable') {
      status.instructions.push('📥 Language Model is downloadable. User interaction required to start download.');
      status.instructions.push('   Click on the page, then the model will download automatically.');
    } else if (availability === 'downloading') {
      status.instructions.push('⏳ Language Model is currently downloading...');
      status.instructions.push('   Check progress at chrome://on-device-internals');
    } else {
      status.instructions.push(`❌ Language Model availability: ${availability}`);
      status.instructions.push('   Go to chrome://components/ and update "Optimization Guide On Device Model"');
    }
  } catch (error) {
    status.instructions.push(`⚠️ Language Model check failed: ${error.message}`);
    status.instructions.push('   Make sure all flags are enabled and Chrome is restarted');
  }

  // Check Summarizer API
  if (typeof Summarizer !== 'undefined') {
    try {
      const summarizerAvailability = await Summarizer.availability();
      status.capabilities.summarizer = summarizerAvailability;
      
      if (summarizerAvailability === 'readily') {
        status.instructions.push('✅ Summarizer API is ready to use!');
      } else if (summarizerAvailability === 'downloadable' || summarizerAvailability === 'downloading') {
        status.instructions.push(`⏳ Summarizer status: ${summarizerAvailability}`);
      } else {
        status.instructions.push(`❌ Summarizer availability: ${summarizerAvailability}`);
      }
    } catch (error) {
      status.instructions.push(`⚠️ Summarizer check failed: ${error.message}`);
    }
  } else {
    status.instructions.push('ℹ️ Summarizer API not found (may not be enabled yet)');
  }

  // Check Translator API
  if (typeof Translator !== 'undefined') {
    status.capabilities.translator = true;
    status.instructions.push('✅ Translator API is available!');
  } else {
    status.instructions.push('ℹ️ Translator API not found (may not be enabled yet)');
  }

  return status;
}

// Function to display AI availability status in console
async function displayAIStatus() {
  console.log('🔍 Checking Chrome Built-in AI availability...\n');
  const status = await checkAIAvailability();
  
  console.log('Support Status:', status.isSupported ? '✅ Supported' : '❌ Not Supported');
  console.log('Available Status:', status.isAvailable ? '✅ Available' : '⏳ Setup Required');
  console.log('\nCapabilities:', status.capabilities);
  console.log('\n📋 Instructions:');
  status.instructions.forEach(instruction => console.log(instruction));
  
  return status;
}

window.aiSummarizeWithBuiltIn = aiSummarizeWithBuiltIn;
window.aiSummarizeWithPromptAPI = aiSummarizeWithPromptAPI;
window.aiTranslateWithBuiltIn = aiTranslateWithBuiltIn;
window.aiTranslateWithPromptAPI = aiTranslateWithPromptAPI;
window.speakInLanguage = speakInLanguage;
window.aiDescribeImageWithPromptAPI = aiDescribeImageWithPromptAPI;
window.checkAIAvailability = checkAIAvailability;
window.displayAIStatus = displayAIStatus;