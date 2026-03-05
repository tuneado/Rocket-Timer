/**
 * Message Manager Module
 * 
 * Manages the message display system including:
 * - Character counter with visual warnings
 * - Display/hide message functionality
 * - Clear message
 * - Clipboard paste integration (Cmd+V / Ctrl+V)
 */

import appState from './appState.js';

/**
 * Updates the character counter display with color coding
 * @param {HTMLInputElement} messageInput - The message input element
 * @param {HTMLElement} charCounter - The character counter element
 */
export function updateCharCounter(messageInput, charCounter) {
  const currentLength = messageInput.value.length;
  const maxLength = messageInput.getAttribute('maxlength') || 100;
  
  charCounter.textContent = `${currentLength}/${maxLength}`;
  
  // Change color based on character count
  charCounter.classList.remove('warning', 'danger');
  if (currentLength >= maxLength * 0.9) {
    charCounter.classList.add('danger');
  } else if (currentLength >= maxLength * 0.7) {
    charCounter.classList.add('warning');
  }
}

/**
 * Displays or hides a message on the canvas and display window
 * @param {Object} messageState - Message state object
 * @param {Function} messageState.isDisplayed - Get displayed state
 * @param {Function} messageState.setDisplayed - Set displayed state
 * @param {Object} dependencies - Required dependencies
 * @param {HTMLInputElement} dependencies.messageInput - Message input element
 * @param {HTMLButtonElement} dependencies.displayMessageBtn - Display/hide button
 * @param {Object} dependencies.canvasRenderer - Canvas renderer instance
 * @param {Object} dependencies.ipcRenderer - IPC renderer for sending updates
 * @param {Function} dependencies.updateButtonIcon - Function to update button icon/text
 * @param {Function} dependencies.hideMessage - Function to hide the message
 */
export function displayMessage(messageState, { messageInput, displayMessageBtn, canvasRenderer, ipcRenderer, updateButtonIcon, hideMessage, statusBar }) {
  const message = messageInput.value.trim();
  
  if (!messageState.isDisplayed()) {
    // Display message
    if (!message) {
      statusBar.warning('Please enter a message to display.', 5000);
      return;
    }
    
    // Update canvas renderer
    if (canvasRenderer) {
      canvasRenderer.setState({
        message: message,
        showMessage: true
      });
    }
    
    // Send message to display window via IPC
    if (window.electron && ipcRenderer) {
      ipcRenderer.send('display-message', message);
    }
    
    // Update button state
    updateButtonIcon(displayMessageBtn, 'eye-slash-fill', 'Hide Message');
    messageState.setDisplayed(true);
    
    // Update appState for API consistency
    appState.update({
      'message.visible': true,
      'message.text': message
    });
  } else {
    // Hide message
    hideMessage();
  }
}

/**
 * Hides the currently displayed message
 * @param {Object} messageState - Message state object
 * @param {Function} messageState.setDisplayed - Set displayed state
 * @param {Object} dependencies - Required dependencies
 * @param {HTMLButtonElement} dependencies.displayMessageBtn - Display/hide button
 * @param {Object} dependencies.canvasRenderer - Canvas renderer instance
 * @param {Object} dependencies.ipcRenderer - IPC renderer for sending updates
 * @param {Function} dependencies.updateButtonIcon - Function to update button icon/text
 */
export function hideMessage(messageState, { displayMessageBtn, canvasRenderer, ipcRenderer, updateButtonIcon }) {
  // Update canvas renderer
  if (canvasRenderer) {
    canvasRenderer.setState({
      message: '',
      showMessage: false
    });
  }
  
  // Clear message from display window
  if (window.electron && ipcRenderer) {
    ipcRenderer.send('clear-message');
  }
  
  // Update button state
  updateButtonIcon(displayMessageBtn, 'display-fill', 'Display Message');
  messageState.setDisplayed(false);
  
  // Update appState for API consistency
  appState.update({
    'message.visible': false,
    'message.text': ''
  });
}

/**
 * Clears the message input and hides if currently displayed
 * @param {Object} messageState - Message state object
 * @param {Function} messageState.isDisplayed - Get displayed state
 * @param {Object} dependencies - Required dependencies
 * @param {HTMLInputElement} dependencies.messageInput - Message input element
 * @param {HTMLElement} dependencies.charCounter - Character counter element
 * @param {Function} dependencies.updateCharCounter - Function to update character counter
 * @param {Function} dependencies.hideMessage - Function to hide the message
 */
export function clearMessage(messageState, { messageInput, charCounter, updateCharCounter, hideMessage }) {
  messageInput.value = '';
  updateCharCounter(messageInput, charCounter);
  
  // Hide message if it's currently displayed
  if (messageState.isDisplayed()) {
    hideMessage();
  }
}

/**
 * Handles paste from clipboard with maxlength enforcement
 * @param {HTMLInputElement} messageInput - The message input element
 * @param {Function} updateCharCounter - Function to update character counter
 */
export async function manualPaste(messageInput, updateCharCounter) {
  try {
    const clipboardText = await window.electron.clipboard.readText();
    if (clipboardText) {
      const maxLength = parseInt(messageInput.getAttribute('maxlength')) || 100;
      const currentPos = messageInput.selectionStart;
      const currentValue = messageInput.value;
      const beforeCursor = currentValue.substring(0, currentPos);
      const afterCursor = currentValue.substring(messageInput.selectionEnd);
      
      // Calculate how much text can be pasted
      const availableSpace = maxLength - beforeCursor.length - afterCursor.length;
      const textToPaste = clipboardText.substring(0, Math.max(0, availableSpace));
      
      // Insert the text
      const newValue = beforeCursor + textToPaste + afterCursor;
      messageInput.value = newValue;
      
      // Set cursor position after pasted text
      const newCursorPos = beforeCursor.length + textToPaste.length;
      messageInput.setSelectionRange(newCursorPos, newCursorPos);
      
      // Update character counter
      updateCharCounter();
      
      console.log('Manual paste successful:', textToPaste.length, 'characters');
    }
  } catch (error) {
    console.error('Manual paste failed:', error);
  }
}

/**
 * Handles paste events
 * @param {Event} event - The paste event
 * @param {Function} manualPaste - The manual paste function
 */
export async function handlePaste(event, manualPaste) {
  console.log('Paste event detected');
  event.preventDefault(); // Prevent default paste behavior
  
  // Use the working manual paste logic
  await manualPaste();
}

/**
 * Handles keyboard shortcuts including Ctrl+V/Cmd+V
 * @param {KeyboardEvent} event - The keyboard event
 * @param {Function} manualPaste - The manual paste function
 */
export function handleKeyDown(event, manualPaste) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isCtrlV = (isMac && event.metaKey && event.key === 'v') || 
                  (!isMac && event.ctrlKey && event.key === 'v');
  
  if (isCtrlV) {
    console.log('Ctrl+V detected, triggering manual paste');
    event.preventDefault();
    manualPaste();
    return;
  }
}
