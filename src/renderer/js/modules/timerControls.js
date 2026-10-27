/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Timer Controls Module
 * Timer completion effects (flash, sound). The countdown itself runs in the
 * main process: src/core/timerEngine.js
 * /
 */
import { createFlashAnimation } from '../../../core/display/canvasEffects.js';

/**
 * Flash red background with black text at timer completion
 * @param {Object} canvasRenderer - The canvas renderer instance
 * @param {Object} ipcRenderer - The IPC renderer for display window communication
 */
export function flashAtZero(canvasRenderer, ipcRenderer, options = {}) {
  // Send flash event to display window
  if (window.electron && ipcRenderer) {
    ipcRenderer.send('flash-at-zero');
  }
  
  // Trigger flash animation on main window
  createFlashAnimation(canvasRenderer, options);
}

/**
 * Play the default beep sound using Web Audio API
 */
function playDefaultBeep() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800; // Hz
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

/**
 * Timer reached zero (event from the timer engine): flash and sound, per settings.
 * Auto-reset is handled by the engine in the main process.
 * @param {Object} deps
 * @param {Function} deps.flashAtZero - Function to trigger flash animation
 */
export async function handleTimerComplete({ flashAtZero }) {
  try {
    const settings = await window.electron.settings.getAll();

    if (settings.flashAtZero) {
      flashAtZero();
    }

    if (settings.soundNotification) {
      // Custom sound first, falling back to the beep
      if (settings.customSoundFile) {
        try {
          const audio = new Audio(settings.customSoundFile);
          audio.volume = 0.5;
          await audio.play();
        } catch (error) {
          console.error('❌ Error playing custom sound, falling back to beep:', error);
          playDefaultBeep();
        }
      } else {
        playDefaultBeep();
      }
    }
  } catch (error) {
    console.error('Error handling timer completion:', error);
  }
}
