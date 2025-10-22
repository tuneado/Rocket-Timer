/**
 * Easing Functions
 * Common easing equations for animations
 */

/**
 * Ease-out cubic function
 * Starts fast, ends slow
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Ease-in-out sine function
 * Smooth acceleration and deceleration
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

/**
 * Ease-in-out quad function
 * @param {number} t - Progress (0-1)
 * @returns {number} Eased value (0-1)
 */
export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/**
 * Linear (no easing)
 * @param {number} t - Progress (0-1)
 * @returns {number} Same value (0-1)
 */
export function linear(t) {
  return t;
}
