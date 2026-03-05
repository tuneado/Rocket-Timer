/**
 * Keyboard Navigation Manager
 * Handles global keyboard shortcuts for timer controls
 */

export class KeyboardManager {
  constructor() {
    this.shortcuts = new Map();
    this.enabled = true;
  }

  /**
   * Register a keyboard shortcut
   * @param {string} key - Key or key combination (e.g., 'Space', 'r', 'Ctrl+s')
   * @param {Function} handler - Function to call when shortcut is pressed
   * @param {string} description - Human-readable description
   */
  register(key, handler, description = '') {
    this.shortcuts.set(key.toLowerCase(), { handler, description });
  }

  /**
   * Initialize keyboard event listener
   */
  init() {
    document.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      
      // Don't trigger shortcuts if user is typing in an input/textarea
      if (e.target.matches('input, textarea, select')) {
        return;
      }

      const key = this._getKeyString(e);
      const shortcut = this.shortcuts.get(key);

      if (shortcut) {
        e.preventDefault();
        shortcut.handler(e);
      }
    });
  }

  /**
   * Enable keyboard shortcuts
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable keyboard shortcuts (e.g., when modal is open)
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Get normalized key string from event
   * @private
   */
  _getKeyString(e) {
    const modifiers = [];
    if (e.ctrlKey) modifiers.push('ctrl');
    if (e.altKey) modifiers.push('alt');
    if (e.shiftKey) modifiers.push('shift');
    if (e.metaKey) modifiers.push('meta');

    const key = e.key.toLowerCase();
    modifiers.push(key);

    return modifiers.join('+');
  }

  /**
   * Get all registered shortcuts (for help display)
   */
  getShortcuts() {
    const shortcuts = [];
    for (const [key, data] of this.shortcuts.entries()) {
      shortcuts.push({
        key: this._formatKey(key),
        description: data.description
      });
    }
    return shortcuts;
  }

  /**
   * Format key string for display
   * @private
   */
  _formatKey(key) {
    return key
      .split('+')
      .map(k => k.charAt(0).toUpperCase() + k.slice(1))
      .join('+');
  }
}

// Visual feedback utilities
export const VisualFeedback = {
  /**
   * Add pulse animation to element
   */
  pulse(element) {
    element.style.animation = 'none';
    setTimeout(() => {
      element.style.animation = 'pulse 0.3s ease-out';
    }, 10);
  },

  /**
   * Add success flash to button
   */
  flashSuccess(button) {
    const originalClass = button.className;
    button.classList.add('is-success');
    setTimeout(() => {
      button.className = originalClass;
    }, 200);
  },

  /**
   * Add error shake to element
   */
  shake(element) {
    element.style.animation = 'shake 0.4s ease-out';
    setTimeout(() => {
      element.style.animation = '';
    }, 400);
  },

  /**
   * Show loading state on button
   */
  setLoading(button, isLoading) {
    if (isLoading) {
      button.classList.add('is-loading');
      button.disabled = true;
    } else {
      button.classList.remove('is-loading');
      button.disabled = false;
    }
  },

  /**
   * Add ripple effect to button
   */
  ripple(button, event) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add('ripple');

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }
};
