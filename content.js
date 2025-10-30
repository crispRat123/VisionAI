document.addEventListener('mouseup', async (event) => {
    // Check if extension is enabled
    if (!extensionEnabled) return;
    
    const selection = window.getSelection();
    const selectedText = selection && selection.toString().trim();

    if (selectedText && selectedText.length > 10) {
      let actionText = '';
      if (actionMode === 'summarize') {
        actionText = 'summarize';
      } else if (actionMode === 'translate') {
        actionText = 'translate';
      } else if (actionMode === 'both') {
        actionText = 'summarize and translate';
      }
      
      const confirmAction = confirm(`Do you want to ${actionText} the selected text?`);
      if (!confirmAction) return;

      try {
        let finalText = '';
        
        // Handle different action modes
        if (actionMode === 'summarize') {
          // Only summarize
          if (audioEnabled) speak('Summarizing selected text.');
          finalText = await aiSummarizeWithBuiltIn(selectedText, {
            type: 'tldr',
            format: 'plain-text',
            length: 'short',
            outputLanguage: 'en'
          });
        } 
        else if (actionMode === 'translate') {
          // Only translate (detect source language or assume English)
          if (audioEnabled) speak('Translating selected text.');
          finalText = await aiTranslateWithBuiltIn(selectedText, {
            sourceLanguage: 'en', // You can add language detection later
            targetLanguage: targetLanguage,
            speak: audioEnabled // Enable automatic speech in target language
          });
        }
        else if (actionMode === 'both') {
          // Summarize first, then translate
          if (audioEnabled) speak('Summarizing selected text.');
          const summary = await aiSummarizeWithBuiltIn(selectedText, {
            type: 'tldr',
            format: 'plain-text',
            length: 'short',
            outputLanguage: 'en'
          });
          
          if (targetLanguage !== 'en') {
            if (audioEnabled) speak('Translating summary.');
            finalText = await aiTranslateWithBuiltIn(summary, {
              sourceLanguage: 'en',
              targetLanguage: targetLanguage,
              speak: audioEnabled // Enable automatic speech in target language
            });
          } else {
            finalText = summary;
          }
        }

        // Show custom floating popup
        showSummaryPopup(finalText);

        // Speak the result only if we didn't translate (translation already speaks)
        if (actionMode === 'summarize' && audioEnabled) {
          speak(finalText);
        }

      } catch (e) {
        alert('Error: ' + e.message);
        console.error('Action error:', e);
      }
    }
  });

  function speak(text) {
    if (!text) return;
    
    // Cancel any ongoing speech to prevent overlap
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function showSummaryPopup(summaryText) {
    // Remove old popup if any
    const oldPopup = document.getElementById('visionai-summary-popup');
    if (oldPopup) oldPopup.remove();

    // Create popup
    const popup = document.createElement('div');
    popup.id = 'visionai-summary-popup';
    popup.textContent = summaryText;
    Object.assign(popup.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#fff',
      color: '#000',
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '15px',
      paddingTop: '35px', // Extra space for buttons
      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
      zIndex: 999999,
      maxWidth: '300px',
      fontFamily: 'sans-serif',
      fontSize: '14px',
      whiteSpace: 'pre-wrap'
    });

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '5px',
      right: '8px',
      border: 'none',
      background: 'transparent',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#666',
      fontWeight: 'bold',
      padding: '0',
      width: '24px',
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      transition: 'background-color 0.2s, color 0.2s'
    });
    closeBtn.onmouseover = () => {
      closeBtn.style.backgroundColor = '#f0f0f0';
      closeBtn.style.color = '#000';
    };
    closeBtn.onmouseout = () => {
      closeBtn.style.backgroundColor = 'transparent';
      closeBtn.style.color = '#666';
    };
    closeBtn.onclick = () => {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      popup.remove();
    };

    // Add copy button
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋';
    copyBtn.title = 'Copy to clipboard';
    Object.assign(copyBtn.style, {
      position: 'absolute',
      top: '5px',
      right: '40px',
      border: 'none',
      background: 'transparent',
      fontSize: '16px',
      cursor: 'pointer',
      padding: '4px 8px',
      borderRadius: '4px',
      transition: 'background-color 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });
    copyBtn.onmouseover = () => {
      copyBtn.style.backgroundColor = '#f0f0f0';
    };
    copyBtn.onmouseout = () => {
      copyBtn.style.backgroundColor = 'transparent';
    };
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(summaryText);
        // Visual feedback - change icon temporarily
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓';
        copyBtn.style.color = '#28a745';
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.color = '';
        }, 1500);
      } catch (err) {
        console.error('Failed to copy text:', err);
        // Fallback: show error feedback
        copyBtn.textContent = '✗';
        copyBtn.style.color = '#dc3545';
        setTimeout(() => {
          copyBtn.textContent = '📋';
          copyBtn.style.color = '';
        }, 1500);
      }
    };

    popup.appendChild(closeBtn);
    popup.appendChild(copyBtn);
    document.body.appendChild(popup);
  }
  let focusSummarizeMode = false;
  let hoverSummarizeMode = false;
  let actionMode = 'summarize'; // 'summarize', 'translate', or 'both'
  let targetLanguage = 'es';
  let audioEnabled = true; // Default to true
  let extensionEnabled = true; // Master toggle - default to true
  let hoverTimeout = null;
  let lastHoveredElement = null;
  let currentHoveredElement = null; // Track currently hovered element for K key

  // Check if modes are enabled on page load
  chrome.storage.local.get(['extensionEnabled', 'focusModeEnabled', 'hoverModeEnabled', 'audioEnabled', 'actionMode', 'targetLanguage'], (result) => {
    if (result.extensionEnabled !== undefined) {
      extensionEnabled = result.extensionEnabled;
    }
    if (result.focusModeEnabled) {
      focusSummarizeMode = true;
      enableFocusSummarize();
      if (result.audioEnabled !== false && extensionEnabled) {
        speak('Focus summarize mode is active. Navigate with Tab and press K to summarize.');
      }
    }
    if (result.hoverModeEnabled) {
      hoverSummarizeMode = true;
      enableHoverSummarize();
      if (result.audioEnabled !== false && extensionEnabled) {
        speak('Hover summarize mode is active. Hover over content to summarize.');
      }
    }
    if (result.actionMode) {
      actionMode = result.actionMode;
    }
    if (result.targetLanguage) {
      targetLanguage = result.targetLanguage;
    }
    if (result.audioEnabled !== undefined) {
      audioEnabled = result.audioEnabled;
    }
  });

  chrome.runtime.onMessage.addListener(async (msg) => {
    if (msg.type === 'extension_toggle') {
      extensionEnabled = msg.enabled;
      console.log('Extension enabled:', extensionEnabled);
      if (!extensionEnabled) {
        // Disable all modes when extension is turned off
        if (focusSummarizeMode) {
          disableFocusSummarize();
        }
        if (hoverSummarizeMode) {
          disableHoverSummarize();
        }
      } else {
        // Re-enable modes based on saved state when extension is turned on
        chrome.storage.local.get(['focusModeEnabled', 'hoverModeEnabled'], (result) => {
          if (result.focusModeEnabled) {
            enableFocusSummarize();
          }
          if (result.hoverModeEnabled) {
            enableHoverSummarize();
          }
        });
      }
    } else if (msg.type === 'focus_mode_on') {
      if (extensionEnabled) {
        focusSummarizeMode = true;
        if (audioEnabled) {
          speak('Focus mode activated. Navigate with Tab and press K to process content.');
        }
        enableFocusSummarize();
      }
    } else if (msg.type === 'focus_mode_off') {
      focusSummarizeMode = false;
      // Don't speak when turning off - it's usually during a mode switch
      disableFocusSummarize();
    } else if (msg.type === 'hover_mode_on') {
      if (extensionEnabled) {
        hoverSummarizeMode = true;
        if (audioEnabled) {
          speak('Hover mode activated. Hover over content and press K to process.');
        }
        enableHoverSummarize();
      }
    } else if (msg.type === 'hover_mode_off') {
      hoverSummarizeMode = false;
      // Don't speak when turning off - it's usually during a mode switch
      disableHoverSummarize();
    } else if (msg.type === 'audio_toggle') {
      audioEnabled = msg.audioEnabled;
      console.log('Audio enabled:', audioEnabled);
    } else if (msg.type === 'action_mode_changed') {
      actionMode = msg.actionMode;
      targetLanguage = msg.targetLanguage;
      console.log('Action mode updated:', { actionMode, targetLanguage });
    }
  });

  function enableFocusSummarize() {
    document.addEventListener('keydown', handleFocusSummarizeKey);
  }

  function disableFocusSummarize() {
    document.removeEventListener('keydown', handleFocusSummarizeKey);
  }

  function enableHoverSummarize() {
    document.addEventListener('mouseover', handleHoverSummarize);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('keydown', handleHoverSummarizeKey);
  }

  function disableHoverSummarize() {
    document.removeEventListener('mouseover', handleHoverSummarize);
    document.removeEventListener('mouseout', handleMouseOut);
    document.removeEventListener('keydown', handleHoverSummarizeKey);
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
    currentHoveredElement = null;
  }

  async function handleHoverSummarizeKey(e) {
    if (!hoverSummarizeMode || !extensionEnabled) return;
    
    // Trigger with 'K' key
    if (e.key.toLowerCase() !== 'k') return;

    // Prevent default action
    e.preventDefault();
    e.stopPropagation();

    if (!currentHoveredElement) {
      if (audioEnabled) speak('No element is currently hovered. Hover over content first.');
      return;
    }

    console.log('Processing hovered element with K key:', currentHoveredElement.tagName);

    // Check if the hovered element is an image
    if (currentHoveredElement.tagName === 'IMG') {
      await describeImage(currentHoveredElement);
      return;
    }

    // Check if hovering over a container with an image
    const imageInElement = currentHoveredElement.querySelector('img');
    if (imageInElement) {
      await describeImage(imageInElement);
      return;
    }

    // Process text content
    await processTextContent(currentHoveredElement);
  }

  // Shared function to extract and process text content from an element
  async function processTextContent(el) {
    console.log('Processing element:', el.tagName, el);

    let text = '';

    // First, check if the element or its closest parent is a paragraph
    const paragraph = el.closest('p');
    if (paragraph && paragraph.innerText && paragraph.innerText.trim().length > 20) {
      text = paragraph.innerText.trim();
      console.log('Got text from paragraph:', text.substring(0, 100));
    }
    // If not in a paragraph, try to get text from the element
    else if (el.innerText && el.innerText.trim().length > 20) {
      text = el.innerText.trim();
      console.log('Got text from element innerText:', text.substring(0, 100));
    } 
    // For input/textarea elements
    else if (el.value && el.value.trim().length > 20) {
      text = el.value.trim();
      console.log('Got text from input value:', text.substring(0, 100));
    }
    // Try textContent
    else if (el.textContent && el.textContent.trim().length > 20) {
      text = el.textContent.trim();
      console.log('Got text from textContent:', text.substring(0, 100));
    }

    // If still no substantial text, look for surrounding paragraphs
    if (!text || text.length < 20) {
      console.log('Text too short, looking for surrounding paragraphs');
      
      // Try to find all paragraphs in the nearest container
      const container = el.closest('article, main, section, div[role="article"], div[role="main"], .content, .post, .article');
      
      if (container) {
        // Get all paragraphs within the container
        const paragraphs = container.querySelectorAll('p');
        if (paragraphs.length > 0) {
          // Combine text from all paragraphs
          text = Array.from(paragraphs)
            .map(p => p.innerText.trim())
            .filter(t => t.length > 0)
            .join(' ')
            .slice(0, 5000);
          console.log('Got text from container paragraphs:', text.substring(0, 100));
        }
      }
      
      // If still nothing, try the parent element
      if ((!text || text.length < 20) && el.parentElement && el.parentElement.innerText) {
        text = el.parentElement.innerText.trim();
        console.log('Got text from parent element:', text.substring(0, 100));
      }
      
      // Last resort: get the nearest semantic container
      if (!text || text.length < 20) {
        const semanticContainer = el.closest('article, main, section, [role="article"], [role="main"]');
        if (semanticContainer && semanticContainer.innerText) {
          text = semanticContainer.innerText.trim().slice(0, 5000);
          console.log('Got text from semantic container:', text.substring(0, 100));
        } else {
          // Ultimate fallback: use body text
          text = document.body.innerText.trim().slice(0, 5000);
          console.log('Using body text as fallback');
        }
      }
    }

    // Final check
    if (!text || text.length < 10) {
      if (audioEnabled) speak('Could not find any content to process. Please select an element with text.');
      return;
    }

    console.log('Final text to process (length ' + text.length + '):', text.substring(0, 200));

    try {
      let finalText = '';
      
      // Handle different action modes
      if (actionMode === 'summarize') {
        // Only summarize
        if (audioEnabled) speak('Summarizing. Please wait.');
        finalText = await aiSummarizeWithBuiltIn(text, {
          type: 'tldr',
          format: 'plain-text',
          length: 'short',
          outputLanguage: 'en'
        });
      } 
      else if (actionMode === 'translate') {
        // Only translate
        if (audioEnabled) speak('Translating. Please wait.');
        finalText = await aiTranslateWithBuiltIn(text, {
          sourceLanguage: 'en',
          targetLanguage: targetLanguage,
          speak: audioEnabled // Enable automatic speech in target language
        });
      }
      else if (actionMode === 'both') {
        // Summarize first, then translate
        if (audioEnabled) speak('Summarizing. Please wait.');
        const summary = await aiSummarizeWithBuiltIn(text, {
          type: 'tldr',
          format: 'plain-text',
          length: 'short',
          outputLanguage: 'en'
        });
        
        if (targetLanguage !== 'en') {
          if (audioEnabled) speak('Translating summary.');
          finalText = await aiTranslateWithBuiltIn(summary, {
            sourceLanguage: 'en',
            targetLanguage: targetLanguage,
            speak: audioEnabled // Enable automatic speech in target language
          });
        } else {
          finalText = summary;
        }
      }

      // Show custom floating popup
      showSummaryPopup(finalText);

      // Speak the result only if we didn't translate (translation already speaks)
      if (actionMode === 'summarize' && audioEnabled) {
        speak(finalText);
      }

    } catch (err) {
      alert('Error: ' + err.message);
      console.error('Processing error:', err);
    }
  }

  async function handleFocusSummarizeKey(e) {
    if (!focusSummarizeMode || !extensionEnabled) return;
    
    // Trigger with 'K' key
    if (e.key.toLowerCase() !== 'k') return;

    // Prevent default action
    e.preventDefault();
    e.stopPropagation();

    const el = document.activeElement;
    if (!el) {
      if (audioEnabled) speak('No element is currently focused.');
      return;
    }

    console.log('Focused element:', el.tagName, el);

    // Check if the focused element is an image
    if (el.tagName === 'IMG') {
      await describeImage(el);
      return;
    }

    // Check if the focused element contains an image
    const imageInElement = el.querySelector('img');
    if (imageInElement) {
      await describeImage(imageInElement);
      return;
    }

    // Process text content using shared function
    await processTextContent(el);
  }

  // Hover mode handlers
  function handleHoverSummarize(e) {
    if (!hoverSummarizeMode || !extensionEnabled) return;
    
    const el = e.target;
    
    // Track the current hovered element for K key handler
    currentHoveredElement = el;
    
    // Ignore if hovering over our own popup
    if (el.id === 'visionai-summary-popup' || el.closest('#visionai-summary-popup')) {
      currentHoveredElement = null;
      return;
    }
    
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    
    // Note: Auto-processing is disabled. Press K to process the hovered element.
    // Removed automatic processing after timeout for better user control
  }

  function handleMouseOut(e) {
    if (!hoverSummarizeMode || !extensionEnabled) return;
    
    // Clear the current hovered element when mouse leaves
    const el = e.target;
    if (currentHoveredElement === el) {
      currentHoveredElement = null;
    }
    
    // Clear timeout when mouse leaves
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
  }

  // Function to describe images using Prompt API
  async function describeImage(imgElement) {
    console.log('Describing image:', imgElement);
    
    try {
      const altText = imgElement.alt || '';
      const imageUrl = imgElement.src || imgElement.currentSrc || '';
      
      if (!imageUrl) {
        console.log('No image URL found');
        if (audioEnabled) {
          speak('Image found but no URL available.');
        }
        return;
      }
      
      if (audioEnabled) {
        if (altText && altText.trim().length > 0) {
          speak('Image detected. Reading alt text and description.');
        } else {
          speak('Image detected without alt text. Providing description.');
        }
      }
      
      // Get description using Prompt API (with fallback)
      let description = await aiDescribeImageWithPromptAPI(imageUrl, altText);
      
      console.log('Image description:', description);
      
      let finalDescription = description;
      
      // Handle translation based on action mode
      if (actionMode === 'translate') {
        // Only translate the description
        if (targetLanguage !== 'en') {
          if (audioEnabled) speak('Translating image description.');
          finalDescription = await aiTranslateWithBuiltIn(description, {
            sourceLanguage: 'en',
            targetLanguage: targetLanguage,
            speak: audioEnabled // Enable automatic speech in target language
          });
        }
      } 
      else if (actionMode === 'both') {
        // Summarize description first (keep it concise), then translate
        if (audioEnabled) speak('Processing image description.');
        
        // For images, descriptions are already concise, but we can shorten if needed
        let processedDescription = description;
        
        // Only summarize if description is longer than 200 characters
        if (description.length > 200) {
          try {
            processedDescription = await aiSummarizeWithBuiltIn(description, {
              type: 'tldr',
              format: 'plain-text',
              length: 'short',
              outputLanguage: 'en'
            });
          } catch (err) {
            console.log('Could not summarize description, using original:', err);
            processedDescription = description;
          }
        }
        
        // Then translate if target language is not English
        if (targetLanguage !== 'en') {
          if (audioEnabled) speak('Translating image description.');
          finalDescription = await aiTranslateWithBuiltIn(processedDescription, {
            sourceLanguage: 'en',
            targetLanguage: targetLanguage,
            speak: audioEnabled // Enable automatic speech in target language
          });
        } else {
          finalDescription = processedDescription;
        }
      }
      // If actionMode is 'summarize', just use the original description (already concise)
      
      // Show the final description in popup
      showSummaryPopup(finalDescription);
      
      // Speak the description only if we didn't translate (translation already speaks)
      if (actionMode === 'summarize' && audioEnabled) {
        speak(finalDescription);
      }
      
    } catch (err) {
      console.error('Image description error:', err);
      
      // Provide fallback description even on error
      const altText = imgElement.alt || '';
      let fallbackDescription = '';
      
      if (altText && altText.trim().length > 0) {
        fallbackDescription = `Image with alt text: "${altText}"`;
      } else {
        const imageName = (imgElement.src || '').split('/').pop() || 'unknown image';
        fallbackDescription = `Image detected: ${imageName}. No description available.`;
      }
      
      // Try to translate fallback description if needed
      if ((actionMode === 'translate' || actionMode === 'both') && targetLanguage !== 'en') {
        try {
          fallbackDescription = await aiTranslateWithBuiltIn(fallbackDescription, {
            sourceLanguage: 'en',
            targetLanguage: targetLanguage,
            speak: audioEnabled
          });
        } catch (translateErr) {
          console.error('Could not translate fallback description:', translateErr);
          // Use original fallback if translation fails
        }
      }
      
      showSummaryPopup(fallbackDescription);
      
      // Speak fallback only if we didn't translate (translation already speaks)
      if (actionMode === 'summarize' && audioEnabled) {
        speak(fallbackDescription);
      }
    }
  }