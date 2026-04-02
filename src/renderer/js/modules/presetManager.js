/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Preset Manager Module
 * Manages countdown timer presets including:
 * - Updating presets from current input values
 * - Resetting presets to default values
 * - Loading/saving presets via settings (single source of truth)
 * - Long-press to save current time to preset
 * Preset format (normalized): { id: <number>, name: <string>, time: <seconds> }
 * /
 */
// Track long-press state
let longPressTimer = null;
let isLongPress = false;
const LONG_PRESS_DURATION = 800; // ms

/**
 * Format seconds into a display string
 */
function formatPresetDisplay(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

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
  const displayText = formatPresetDisplay(totalSeconds);
  button.textContent = displayText;
  
  // Persist to settings
  const presetButtons = Array.from(document.querySelectorAll(".preset"));
  const presetIndex = presetButtons.indexOf(button);
  savePresetToSettings(presetIndex, { name: `Preset ${presetIndex + 1}`, time: totalSeconds });
  
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
  const displayText = formatPresetDisplay(totalSeconds);
  button.textContent = displayText;
  
  // Persist to settings
  const presetButtons = Array.from(document.querySelectorAll(".preset"));
  const presetIndex = presetButtons.indexOf(button);
  savePresetToSettings(presetIndex, { name: `Preset ${presetIndex + 1}`, time: totalSeconds });
  
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
 * Save a single preset to settings via IPC
 */
async function savePresetToSettings(index, { name, time }) {
  try {
    const settings = await window.electron.settings.getAll();
    const presets = settings.presets || [];
    presets[index] = { id: index + 1, name, time };
    await window.electron.settings.save('presets', presets);
  } catch (error) {
    console.warn('Failed to save preset to settings:', error);
  }
}

/**
 * Resets all presets to default values and saves to settings
 */
export async function resetPresetsToDefault() {
  const defaultPresets = [
    { id: 1, name: 'Preset 1', time: 300 },
    { id: 2, name: 'Preset 2', time: 600 },
    { id: 3, name: 'Preset 3', time: 900 },
    { id: 4, name: 'Preset 4', time: 1200 },
    { id: 5, name: 'Preset 5', time: 1500 },
    { id: 6, name: 'Preset 6', time: 1800 },
    { id: 7, name: 'Preset 7', time: 2700 },
    { id: 8, name: 'Preset 8', time: 3600 }
  ];

  applyPresetsToButtons(defaultPresets);

  // Save to settings
  try {
    await window.electron.settings.save('presets', defaultPresets);
  } catch (error) {
    console.warn('Failed to save default presets to settings:', error);
  }

  // Clear legacy localStorage presets
  for (let i = 0; i < 8; i++) {
    localStorage.removeItem(`preset-${i}`);
  }

  console.log("Presets reset to default values");
}

/**
 * Apply an array of preset objects to the DOM buttons
 * @param {Array<{id, name, time}>} presets
 */
export function applyPresetsToButtons(presets) {
  const presetButtons = document.querySelectorAll(".preset");
  presetButtons.forEach((btn, index) => {
    if (index < presets.length) {
      const preset = presets[index];
      const totalMinutes = Math.floor(preset.time / 60);
      btn.dataset.minutes = totalMinutes;
      btn.textContent = formatPresetDisplay(preset.time);
    }
  });
}

/**
 * Loads presets from settings and applies to buttons.
 * Falls back to localStorage for migration from older versions.
 */
export async function loadSavedPresets() {
  try {
    const settings = await window.electron.settings.getAll();
    if (settings.presets && settings.presets.length > 0) {
      applyPresetsToButtons(settings.presets);
      console.log(`Loaded ${settings.presets.length} presets from settings`);
      return;
    }
  } catch (error) {
    console.warn('Failed to load presets from settings:', error);
  }

  // Fallback: migrate from localStorage
  document.querySelectorAll(".preset").forEach((button, index) => {
    const savedPreset = localStorage.getItem(`preset-${index}`);
    if (savedPreset) {
      try {
        const presetData = JSON.parse(savedPreset);
        button.dataset.minutes = presetData.minutes;
        button.textContent = presetData.displayText;
        console.log(`Loaded preset ${index} from localStorage: ${presetData.displayText}`);
      } catch (error) {
        console.warn(`Failed to load preset ${index}:`, error);
      }
    }
  });
}
