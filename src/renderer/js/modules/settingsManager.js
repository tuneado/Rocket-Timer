/**
 * Settings Manager Module
 * 
 * Manages application settings including:
 * - Loading and applying settings from the settings store
 * - Applying canvas color customizations
 * - Setting default time, layout, and theme
 */

/**
 * Loads and applies all settings
 * @param {Object} timerState - Timer state object
 * @param {Object} dependencies - Required dependencies
 * @param {Function} dependencies.getElementById - Function to get DOM elements
 */
export async function loadAndApplySettings(timerState, { getElementById }) {
  try {
    const settings = await window.electron.settings.getAll();
    console.log('Loaded settings:', settings);
    console.log('🔍 DEBUGGING: settings.defaultLayout =', settings.defaultLayout);
    
    // Apply default time
    if (settings.defaultTime) {
      const { hours, minutes, seconds } = settings.defaultTime;
      const timeInSeconds = (hours * 3600) + (minutes * 60) + seconds;
      timerState.setLastSetTime(timeInSeconds);
      timerState.setRemainingTime(timeInSeconds);
      timerState.setTotalTime(timeInSeconds);
      
      // Update input fields
      const hoursInput = getElementById('hours');
      const minutesInput = getElementById('minutes');
      const secondsInput = getElementById('seconds');
      if (hoursInput) hoursInput.value = hours;
      if (minutesInput) minutesInput.value = minutes;
      if (secondsInput) secondsInput.value = seconds;
      
      console.log('Applied default time:', hours, 'h', minutes, 'm', seconds, 's');
      console.log('Timer state after applying default time - remaining:', timerState.remainingTime, 'total:', timerState.totalTime);
    }
    
    // Apply default layout
    if (settings.defaultLayout) {
      console.log('🔧 SettingsManager: Setting canvasLayout to:', settings.defaultLayout);
      localStorage.setItem('canvasLayout', settings.defaultLayout);
      const layoutSelector = getElementById('layoutSelector');
      if (layoutSelector) {
        layoutSelector.value = settings.defaultLayout;
        console.log('🔧 SettingsManager: Layout selector set to:', settings.defaultLayout);
      }
    }
    
    // Apply default theme
    if (settings.defaultTheme) {
      const theme = settings.defaultTheme === 'auto' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : settings.defaultTheme;
      
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
      
      const themeToggle = getElementById('themeToggle');
      if (themeToggle) {
        themeToggle.checked = theme === 'dark';
      }
    }
    
    // Apply canvas colors if they exist
    if (settings.colors) {
      applyCanvasColors(settings.colors);
    }
    
    // Store matchTimerColor in localStorage for canvas access
    if (typeof settings.matchTimerColor !== 'undefined') {
      localStorage.setItem('matchTimerColor', settings.matchTimerColor.toString());
    }
    
    // Store clockFormat in localStorage for fast access from clock and timer managers
    if (settings.clockFormat) {
      localStorage.setItem('clockFormat', settings.clockFormat);
    }
    
    // Store clock format in localStorage for cross-window access
    if (settings.clockFormat) {
      localStorage.setItem('clockFormat', settings.clockFormat);
    } else {
      localStorage.setItem('clockFormat', '24h'); // Default
    }
        // Store watermark setting in localStorage
    if (settings.showWatermark !== undefined) {
      localStorage.setItem('showWatermark', settings.showWatermark.toString());
    }
      } catch (error) {
    console.error('Error loading settings:', error);
  }
}

/**
 * Applies canvas color customizations from settings
 * @param {Object} colors - Color settings object
 */
export function applyCanvasColors(colors) {
  const root = document.documentElement;
  
  if (colors.countdown) root.style.setProperty('--canvas-countdown-color', colors.countdown);
  if (colors.clock) root.style.setProperty('--canvas-clock-color', colors.clock);
  if (colors.elapsed) root.style.setProperty('--canvas-elapsed-color', colors.elapsed);
  if (colors.message) root.style.setProperty('--canvas-message-color', colors.message);
  if (colors.messageBackground) root.style.setProperty('--canvas-message-background-color', colors.messageBackground);
  if (colors.separator) root.style.setProperty('--canvas-separator-color', colors.separator);
  if (colors.background) root.style.setProperty('--canvas-background', colors.background);
  if (colors.progressSuccess) {
    root.style.setProperty('--canvas-progress-success-start', colors.progressSuccess);
    root.style.setProperty('--canvas-progress-success-end', colors.progressSuccess);
  }
  if (colors.progressWarning) {
    root.style.setProperty('--canvas-progress-warning-start', colors.progressWarning);
    root.style.setProperty('--canvas-progress-warning-end', colors.progressWarning);
  }
  if (colors.progressDanger) {
    root.style.setProperty('--canvas-progress-danger-start', colors.progressDanger);
    root.style.setProperty('--canvas-progress-danger-end', colors.progressDanger);
  }
  
  console.log('Applied canvas colors from settings');
}
