document.addEventListener('DOMContentLoaded', () => {
    const focusToggle = document.getElementById('focusToggle');
    const hoverToggle = document.getElementById('hoverToggle');
    const actionMode = document.getElementById('actionMode');
    const targetLanguage = document.getElementById('targetLanguage');
    const statusText = document.getElementById('status');

    // Load saved state from storage
    chrome.storage.local.get(['focusModeEnabled', 'hoverModeEnabled', 'actionMode', 'targetLanguage'], (result) => {
      const focusEnabled = result.focusModeEnabled || false;
      const hoverEnabled = result.hoverModeEnabled || false;
      const savedActionMode = result.actionMode || 'summarize';
      const savedTargetLanguage = result.targetLanguage || 'es';
      
      focusToggle.checked = focusEnabled;
      hoverToggle.checked = hoverEnabled;
      actionMode.value = savedActionMode;
      targetLanguage.value = savedTargetLanguage;
      
      updateStatus(focusEnabled, hoverEnabled, savedActionMode);
    });

    // Handle focus toggle change
    focusToggle.addEventListener('change', () => {
      const isEnabled = focusToggle.checked;
      
      // Save state to storage
      chrome.storage.local.set({ focusModeEnabled: isEnabled });
      
      // Send message to active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: isEnabled ? 'focus_mode_on' : 'focus_mode_off'
          });
        }
      });
      
      updateStatus(isEnabled, hoverToggle.checked, actionMode.value);
    });

    // Handle hover toggle change
    hoverToggle.addEventListener('change', () => {
      const isEnabled = hoverToggle.checked;
      
      // Save state to storage
      chrome.storage.local.set({ hoverModeEnabled: isEnabled });
      
      // Send message to active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: isEnabled ? 'hover_mode_on' : 'hover_mode_off'
          });
        }
      });
      
      updateStatus(focusToggle.checked, isEnabled, actionMode.value);
    });

    // Handle action mode change
    actionMode.addEventListener('change', () => {
      const selectedMode = actionMode.value;
      
      // Save state to storage
      chrome.storage.local.set({ actionMode: selectedMode });
      
      // Send message to active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'action_mode_changed',
            actionMode: selectedMode,
            targetLanguage: targetLanguage.value
          });
        }
      });
      
      updateStatus(focusToggle.checked, hoverToggle.checked, selectedMode);
    });

    // Handle target language change
    targetLanguage.addEventListener('change', () => {
      const selectedLanguage = targetLanguage.value;
      
      // Save state to storage
      chrome.storage.local.set({ targetLanguage: selectedLanguage });
      
      // Send message to active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'action_mode_changed',
            actionMode: actionMode.value,
            targetLanguage: selectedLanguage
          });
        }
      });
    });

    function updateStatus(focusEnabled, hoverEnabled, currentActionMode) {
      const modes = [];
      if (focusEnabled) modes.push('Focus (Tab + K)');
      if (hoverEnabled) modes.push('Hover (Mouse)');
      
      let actionText = '';
      if (currentActionMode === 'summarize') {
        actionText = 'Summarize';
      } else if (currentActionMode === 'translate') {
        const langName = targetLanguage.options[targetLanguage.selectedIndex].text.split('(')[0].trim();
        actionText = `Translate to ${langName}`;
      } else if (currentActionMode === 'both') {
        const langName = targetLanguage.options[targetLanguage.selectedIndex].text.split('(')[0].trim();
        actionText = `Summarize + Translate to ${langName}`;
      }
      
      let statusMessage = '';
      if (modes.length > 0 || currentActionMode) {
        statusMessage = `Mode: ${actionText}`;
        if (modes.length > 0) {
          statusMessage += ` | Active: ${modes.join(' & ')}`;
        }
        statusText.style.color = '#28a745';
      } else {
        statusMessage = `Mode: ${actionText}`;
        statusText.style.color = '#666';
      }
      statusText.textContent = statusMessage;
    }
  });