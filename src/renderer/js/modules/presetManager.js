/**
 * Preset Manager Module
 * 
 * Manages countdown timer presets including:
 * - Updating presets from current input values
 * - Resetting presets to default values
 * - Loading saved presets from localStorage
 * - Long-press to save current time to preset
 */

// Track long-press state
let longPressTimer = null;
let isLongPress = false;
const LONG_PRESS_DURATION = 800; // ms

/**
 * Initialize long-press handlers for all preset buttons
 * @param {Object} dependencies - Required dependencies
 */
export function initializeLongPressHandlers({ getElementById, statusBar }) {
  const presetButtons = document.querySelectorAll('.preset');
  
  presetButtons.forEach(button => {
    // Mouse events
    button.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return; // Only left click
      startLongPress(button, { getElementById, statusBar });
    });
    
    button.addEventListener('mouseup', () => {
      endLongPress();
    });
    
    button.addEventListener('mouseleave', () => {
      endLongPress();
    });
    
    // Touch events for mobile/tablet
    button.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent mouse events from firing
      startLongPress(button, { getElementById, statusBar });
    });
    
    button.addEventListener('touchend', () => {
      endLongPress();
    });
    
    button.addEventListener('touchcancel', () => {
      endLongPress();
    });
  });
}

/**
 * Start long-press detection
 */
function startLongPress(button, dependencies) {
  isLongPress = false;
  button.classList.add('holding');
  
  longPressTimer = setTimeout(() => {
    isLongPress = true;
    button.classList.remove('holding');
    
    // Save current time to this preset
    saveCurrentTimeToPreset(button, dependencies);
  }, LONG_PRESS_DURATION);
}

/**
 * End long-press detection
 */
function endLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  
  // Remove holding class from all buttons
  document.querySelectorAll('.preset').forEach(btn => {
    btn.classList.remove('holding');
  });
}

/**
 * Check if current interaction is a long-press
 */
export function checkIsLongPress() {
  const wasLongPress = isLongPress;
  isLongPress = false;
  return wasLongPress;
}

/**
 * Save current timer time to preset button
 */
function saveCurrentTimeToPreset(button, { getElementById, statusBar }) {
  const hours = parseInt(getElementById("hours").value) || 0;
  const minutes = parseInt(getElementById("minutes").value) || 0;
  const seconds = parseInt(getElementById("seconds").value) || 0;
  
  // Calculate total time in seconds
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const totalMinutes = Math.floor(totalSeconds / 60);
  
  // Don't allow empty or zero time
  if (totalSeconds === 0) {
    statusBar.warning("Please set a time before updating the preset!", 5000);
    return;
  }
  
  // Update button's data attribute and display text
  button.dataset.minutes = totalMinutes;
  
  // Format display text
  let displayText;
  if (hours > 0) {
    displayText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else if (minutes > 0) {
    displayText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    displayText = `00:${String(seconds).padStart(2, '0')}`;
  }
  
  button.textContent = displayText;
  
  // Save to localStorage
  const presetButtons = Array.from(document.querySelectorAll(".preset"));
  const presetIndex = presetButtons.indexOf(button);
  localStorage.setItem(`preset-${presetIndex}`, JSON.stringify({
    minutes: totalMinutes,
    displayText: displayText,
    totalSeconds: totalSeconds
  }));
  
  // Visual feedback - success flash
  button.style.backgroundColor = 'var(--countdown)';
  button.style.color = 'white';
  button.style.transform = 'scale(1.1)';
  
  setTimeout(() => {
    button.style.backgroundColor = '';
    button.style.color = '';
    button.style.transform = '';
  }, 300);
  
  statusBar.success(`Preset saved: ${displayText}`, 3000);
  console.log(`✅ Preset saved: ${displayText} (${totalSeconds} seconds)`);
}

/**
 * Update a preset button with current input values
 * @param {HTMLButtonElement} button - The preset button to update
 * @param {Object} dependencies - Required dependencies
 * @param {Function} dependencies.getElementById - Function to get element by ID
 * @param {Object} dependencies.statusBar - Status bar for showing messages
 */
export function updatePresetFromInputs(button, { getElementById, statusBar }) {
  const hours = parseInt(getElementById("hours").value) || 0;
  const minutes = parseInt(getElementById("minutes").value) || 0;
  const seconds = parseInt(getElementById("seconds").value) || 0;
  
  // Calculate total time in seconds
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const totalMinutes = Math.floor(totalSeconds / 60);
  
  // Don't allow empty or zero time
  if (totalSeconds === 0) {
    statusBar.warning("Please set a time before updating the preset!", 5000);
    return;
  }
  
  // Update button's data attribute and display text
  button.dataset.minutes = totalMinutes;
  
  // Format display text (show hours:minutes if hours > 0, otherwise just minutes:seconds)
  let displayText;
  if (hours > 0) {
    displayText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else if (minutes > 0) {
    displayText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  } else {
    displayText = `00:${String(seconds).padStart(2, '0')}`;
  }
  
  button.textContent = displayText;
  
  // Save to localStorage for persistence
  const presetButtons = Array.from(document.querySelectorAll(".preset"));
  const presetIndex = presetButtons.indexOf(button);
  localStorage.setItem(`preset-${presetIndex}`, JSON.stringify({
    minutes: totalMinutes,
    displayText: displayText,
    totalSeconds: totalSeconds
  }));
  
  // Visual feedback
  button.style.backgroundColor = 'var(--countdown)';
  button.style.color = 'white';
  setTimeout(() => {
    button.style.backgroundColor = '';
    button.style.color = '';
  }, 200);
  
  console.log(`Preset updated: ${displayText} (${totalSeconds} seconds)`);
}

/**
 * Resets all presets to default values
 */
export function resetPresetsToDefault() {
  // Default preset values: 5, 10, 15, 20, 25, 30, 45, 60 minutes
  const defaultPresets = [5, 10, 15, 20, 25, 30, 45, 60];
  const presetButtons = document.querySelectorAll(".preset");
  
  presetButtons.forEach((btn, index) => {
    if (index < defaultPresets.length) {
      const minutes = defaultPresets[index];
      btn.setAttribute("data-minutes", minutes);
      
      // Format time display
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const timeString = hours > 0 ? 
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00` : 
        `${String(mins).padStart(2, '0')}:00`;
      
      btn.textContent = timeString;
      
      // Clear saved preset from localStorage
      localStorage.removeItem(`preset-${index}`);
    }
  });
  
  console.log("Presets reset to default values");
}

/**
 * Loads saved presets from localStorage
 */
export function loadSavedPresets() {
  document.querySelectorAll(".preset").forEach((button, index) => {
    const savedPreset = localStorage.getItem(`preset-${index}`);
    if (savedPreset) {
      try {
        const presetData = JSON.parse(savedPreset);
        button.dataset.minutes = presetData.minutes;
        button.textContent = presetData.displayText;
        console.log(`Loaded preset ${index}: ${presetData.displayText}`);
      } catch (error) {
        console.warn(`Failed to load preset ${index}:`, error);
      }
    }
  });
}
