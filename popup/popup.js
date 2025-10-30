document.addEventListener('DOMContentLoaded', () => {
    const masterToggleContainer = document.getElementById('masterToggleContainer');
    const masterToggleSwitch = document.getElementById('masterToggleSwitch');
    const masterToggleSlider = document.getElementById('masterToggleSlider');
    const masterToggleText = document.getElementById('masterToggleText');
    const settingsContent = document.getElementById('settingsContent');
    const noneMode = document.getElementById('noneMode');
    const focusToggle = document.getElementById('focusToggle');
    const hoverToggle = document.getElementById('hoverToggle');
    const audioToggle = document.getElementById('audioToggle');
    const actionMode = document.getElementById('actionMode');
    const targetLanguage = document.getElementById('targetLanguage');
    const statusText = document.getElementById('status');

    chrome.storage.local.get(['extensionEnabled', 'focusModeEnabled', 'hoverModeEnabled', 'audioEnabled', 'actionMode', 'targetLanguage'], (result) => {
      const extensionEnabled = result.extensionEnabled !== undefined ? result.extensionEnabled : true;
      const focusEnabled = result.focusModeEnabled || false;
      const hoverEnabled = result.hoverModeEnabled || false;
      const audioEnabled = result.audioEnabled !== undefined ? result.audioEnabled : true;
      const savedActionMode = result.actionMode || 'summarize';
      const savedTargetLanguage = result.targetLanguage || 'es';
      
      updateMasterToggle(extensionEnabled);
      
      if (focusEnabled) {
        focusToggle.checked = true;
      } else if (hoverEnabled) {
        hoverToggle.checked = true;
      } else {
        noneMode.checked = true;
      }
      
      audioToggle.checked = audioEnabled;
      actionMode.value = savedActionMode;
      targetLanguage.value = savedTargetLanguage;
      
      updateStatus(extensionEnabled, focusEnabled, hoverEnabled, savedActionMode, audioEnabled);
    });

    masterToggleContainer.addEventListener('click', () => {
      const currentState = masterToggleSwitch.classList.contains('active');
      const newState = !currentState;
      
      updateMasterToggle(newState);
      chrome.storage.local.set({ extensionEnabled: newState });
      
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'extension_toggle',
              enabled: newState
            }).catch(() => {});
          }
        });
      });
      
      const focusEnabled = focusToggle.checked;
      const hoverEnabled = hoverToggle.checked;
      updateStatus(newState, focusEnabled, hoverEnabled, actionMode.value, audioToggle.checked);
    });

    focusToggle.addEventListener('change', () => {
      if (focusToggle.checked) {
        chrome.storage.local.set({ focusModeEnabled: true, hoverModeEnabled: false });
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'focus_mode_on' });
            chrome.tabs.sendMessage(tabs[0].id, { type: 'hover_mode_off' });
          }
        });
        
        chrome.storage.local.get(['extensionEnabled'], (result) => {
          const extensionEnabled = result.extensionEnabled !== undefined ? result.extensionEnabled : true;
          updateStatus(extensionEnabled, true, false, actionMode.value, audioToggle.checked);
        });
      }
    });

    hoverToggle.addEventListener('change', () => {
      if (hoverToggle.checked) {
        chrome.storage.local.set({ focusModeEnabled: false, hoverModeEnabled: true });
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'hover_mode_on' });
            chrome.tabs.sendMessage(tabs[0].id, { type: 'focus_mode_off' });
          }
        });
        
        chrome.storage.local.get(['extensionEnabled'], (result) => {
          const extensionEnabled = result.extensionEnabled !== undefined ? result.extensionEnabled : true;
          updateStatus(extensionEnabled, false, true, actionMode.value, audioToggle.checked);
        });
      }
    });

    noneMode.addEventListener('change', () => {
      if (noneMode.checked) {
        chrome.storage.local.set({ focusModeEnabled: false, hoverModeEnabled: false });
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'focus_mode_off' });
            chrome.tabs.sendMessage(tabs[0].id, { type: 'hover_mode_off' });
          }
        });
        
        chrome.storage.local.get(['extensionEnabled'], (result) => {
          const extensionEnabled = result.extensionEnabled !== undefined ? result.extensionEnabled : true;
          updateStatus(extensionEnabled, false, false, actionMode.value, audioToggle.checked);
        });
      }
    });

    audioToggle.addEventListener('change', () => {
      const isEnabled = audioToggle.checked;
      
      chrome.storage.local.set({ audioEnabled: isEnabled });
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'audio_toggle',
            audioEnabled: isEnabled
          });
        }
      });
      
      chrome.storage.local.get(['extensionEnabled'], (result) => {
        const extensionEnabled = result.extensionEnabled !== undefined ? result.extensionEnabled : true;
        updateStatus(extensionEnabled, focusToggle.checked, hoverToggle.checked, actionMode.value, isEnabled);
      });
    });

    actionMode.addEventListener('change', () => {
      const selectedMode = actionMode.value;
      
      chrome.storage.local.set({ actionMode: selectedMode });
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'action_mode_changed',
            actionMode: selectedMode,
            targetLanguage: targetLanguage.value
          });
        }
      });
      
      chrome.storage.local.get(['extensionEnabled'], (result) => {
        const extensionEnabled = result.extensionEnabled !== undefined ? result.extensionEnabled : true;
        updateStatus(extensionEnabled, focusToggle.checked, hoverToggle.checked, selectedMode, audioToggle.checked);
      });
    });

    targetLanguage.addEventListener('change', () => {
      const selectedLanguage = targetLanguage.value;
      
      chrome.storage.local.set({ targetLanguage: selectedLanguage });
      
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

    function updateMasterToggle(enabled) {
      if (enabled) {
        masterToggleSwitch.classList.add('active');
        masterToggleSlider.classList.add('active');
        masterToggleContainer.classList.remove('disabled');
        settingsContent.classList.remove('disabled');
        masterToggleText.textContent = '🚀 VisionAI Enabled';
      } else {
        masterToggleSwitch.classList.remove('active');
        masterToggleSlider.classList.remove('active');
        masterToggleContainer.classList.add('disabled');
        settingsContent.classList.add('disabled');
        masterToggleText.textContent = '⏸️ VisionAI Disabled';
      }
    }

    function updateStatus(extensionEnabled, focusEnabled, hoverEnabled, currentActionMode, audioEnabled) {
      if (!extensionEnabled) {
        statusText.textContent = 'Extension is disabled';
        statusText.style.color = '#dc3545';
        return;
      }
      
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
      
      let statusMessage = `Mode: ${actionText}`;
      
      if (modes.length > 0) {
        statusMessage += ` | Active: ${modes.join(' & ')}`;
        statusText.style.color = '#28a745';
      } else {
        statusMessage += ` | Active: Manual Selection`;
        statusText.style.color = '#666';
      }
      
      statusMessage += ` | Audio: ${audioEnabled ? 'ON' : 'OFF'}`;
      statusText.textContent = statusMessage;
    }
  });