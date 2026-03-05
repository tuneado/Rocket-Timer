/**
 * Canvas Flash Effects
 * Handles flash animations for timer completion
 */

import { interpolateColor } from '../utils/colorUtils.js';
import { linear } from '../utils/easing.js';

/**
 * Flash effect configuration
 */
const FLASH_CONFIG = {
  cycles: 3,              // Number of flash cycles
  cycleDuration: 600,     // Duration of each cycle in ms
  flashColor: '#ff0000',  // Flash overlay color (red)
  textColor: '#000000'    // Text color during flash (black)
};

/**
 * Create and execute a flash animation using canvas overlay
 * @param {Object} renderer - Canvas renderer instance (canvasRenderer or displayRenderer)
 * @param {Object} options - Optional configuration overrides
 */
export function createFlashAnimation(renderer, options = {}) {
  if (!renderer) {
    console.error('Flash animation requires a renderer instance');
    return;
  }

  const config = { ...FLASH_CONFIG, ...options };
  const root = document.documentElement;
  const totalDuration = config.cycles * config.cycleDuration;
  const startTime = performance.now();
  
  // Store original colors
  const originalColors = {
    countdown: getComputedStyle(root).getPropertyValue('--canvas-countdown-color').trim(),
    clock: getComputedStyle(root).getPropertyValue('--canvas-clock-color').trim(),
    elapsed: getComputedStyle(root).getPropertyValue('--canvas-elapsed-color').trim(),
    message: getComputedStyle(root).getPropertyValue('--canvas-message-color').trim(),
    separator: getComputedStyle(root).getPropertyValue('--canvas-separator-color').trim()
  };
  
  // Store reference to flash overlay in renderer
  renderer.flashOverlay = {
    active: true,
    opacity: 0
  };
  
  /**
   * Animation loop
   */
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    
    if (elapsed >= totalDuration) {
      // Animation complete - remove flash overlay and restore colors
      renderer.flashOverlay.active = false;
      renderer.flashOverlay.opacity = 0;
      restoreColors();
      console.log('⚡ Flash animation completed');
      return;
    }
    
    // Calculate current position in the cycle (0 to 1)
    const cycleProgress = (elapsed % config.cycleDuration) / config.cycleDuration;
    
    // Use linear easing (constant speed)
    // This creates: smooth linear transition from 0 to 1 and back
    const factor = 1 - linear(cycleProgress);
    
    // Update flash overlay opacity (100% opaque when active)
    renderer.flashOverlay.opacity = factor;
    
    // Update text colors to black during flash
    applyTextColors(factor);
    
    // Force canvas redraw
    renderer.updateStyleCache();
    
    requestAnimationFrame(animate);
  }
  
  /**
   * Apply text colors based on animation factor
   */
  function applyTextColors(factor) {
    root.style.setProperty('--canvas-countdown-color', 
      interpolateColor(originalColors.countdown, config.textColor, factor));
    root.style.setProperty('--canvas-clock-color', 
      interpolateColor(originalColors.clock, config.textColor, factor));
    root.style.setProperty('--canvas-elapsed-color', 
      interpolateColor(originalColors.elapsed, config.textColor, factor));
    root.style.setProperty('--canvas-message-color', 
      interpolateColor(originalColors.message, config.textColor, factor));
    root.style.setProperty('--canvas-separator-color', 
      interpolateColor(originalColors.separator, config.textColor, factor));
  }
  
  /**
   * Restore original colors after animation
   */
  function restoreColors() {
    root.style.setProperty('--canvas-countdown-color', originalColors.countdown);
    root.style.setProperty('--canvas-clock-color', originalColors.clock);
    root.style.setProperty('--canvas-elapsed-color', originalColors.elapsed);
    root.style.setProperty('--canvas-message-color', originalColors.message);
    root.style.setProperty('--canvas-separator-color', originalColors.separator);
    
    // Force final redraw - UnifiedCanvasRenderer automatically renders
    renderer.updateStyleCache();
    
    // No need to call renderer.draw() as UnifiedCanvasRenderer handles its own rendering loop
  }
  
  // Start animation
  requestAnimationFrame(animate);
  console.log('⚡ Flash animation started');
}

