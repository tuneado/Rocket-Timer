/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 *
 * Canvas Flash Effects
 * Handles flash animations for timer completion
 * /
 */
import { linear } from '../utils/easing.js';

/**
 * Flash effect configuration
 */
const FLASH_CONFIG = {
  cycles: 3,              // Number of flash cycles
  cycleDuration: 600,     // Duration of each cycle in ms
  flashColor: '#ff0000'   // Flash overlay color (red)
};

/**
 * Create and execute a flash animation using canvas overlay (red overlay only)
 * @param {Object} renderer - Canvas renderer instance (canvasRenderer or displayRenderer)
 * @param {Object} options - Optional configuration overrides
 * @returns {Object} Animation handle with an `active` flag
 */
export function createFlashAnimation(renderer, options = {}) {
  if (!renderer) {
    console.error('Flash animation requires a renderer instance');
    return null;
  }

  const config = { ...FLASH_CONFIG, ...options };
  const totalDuration = config.cycles * config.cycleDuration;
  const startTime = performance.now();
  
  // Store reference to flash overlay in renderer
  renderer.flashOverlay = {
    active: true,
    opacity: 0
  };

  // Expose handle so callers can track animation state
  const handle = renderer.flashOverlay;
  
  /**
   * Animation loop
   */
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    
    if (elapsed >= totalDuration) {
      // Animation complete - remove flash overlay
      renderer.flashOverlay.active = false;
      renderer.flashOverlay.opacity = 0;
      renderer.updateStyleCache();
      console.log('⚡ Flash animation completed');
      if (typeof config.onComplete === 'function') config.onComplete();
      return;
    }
    
    // Calculate current position in the cycle (0 to 1)
    const cycleProgress = (elapsed % config.cycleDuration) / config.cycleDuration;
    
    // Use linear easing (constant speed)
    const factor = 1 - linear(cycleProgress);
    
    // Update flash overlay opacity
    renderer.flashOverlay.opacity = factor;
    
    // Force canvas redraw
    renderer.updateStyleCache();
    
    requestAnimationFrame(animate);
  }
  
  // Start animation
  requestAnimationFrame(animate);
  console.log('⚡ Flash animation started');

  return handle;
}

