/**
 * Keyboard Navigation Manager
 * Handles global keyboard shortcuts for timer controls
 */

export class KeyboardManager {
  constructor() {
    this.shortcuts = new Map();
    this.enabled = true;
    this.disabledShortcuts = new Set();
  }

  /**
   * Register a keyboard shortcut
   * @param {string} key - Key or key combination (e.g., 'space', 'r', 'ctrl+arrowup')
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
    // Block spacebar from natively activating focused buttons
    const blockSpaceOnButtons = (e) => {
      if (e.key === ' ' && e.target.matches('button')) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', blockSpaceOnButtons, true);
    document.addEventListener('keyup', blockSpaceOnButtons, true);

    document.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      
      // Don't trigger shortcuts when typing in form elements
      const active = document.activeElement;
      if (
        e.target.matches('input, textarea, select, [contenteditable]') ||
        (active && active.matches('input, textarea, select, [contenteditable]'))
      ) {
        return;
      }

      const key = this._getKeyString(e);
      const shortcut = this.shortcuts.get(key);

      if (shortcut && !this.disabledShortcuts.has(key)) {
        e.preventDefault();
        shortcut.handler(e);
      }
    });
  }

  /**
   * Enable keyboard shortcuts globally
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable keyboard shortcuts globally (e.g., when modal is open)
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Enable or disable a specific shortcut by key
   */
  setShortcutEnabled(key, enabled) {
    const normalizedKey = key.toLowerCase();
    if (enabled) {
      this.disabledShortcuts.delete(normalizedKey);
    } else {
      this.disabledShortcuts.add(normalizedKey);
    }
  }

  /**
   * Apply shortcut settings from saved configuration
   * @param {Object} shortcutSettings - Map of shortcut key to { enabled, key, description }
   */
  applySettings(shortcutSettings) {
    if (!shortcutSettings) return;
    for (const [key, config] of Object.entries(shortcutSettings)) {
      this.setShortcutEnabled(key, config.enabled);
    }
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

    // Normalize key names
    const KEY_MAP = {
      ' ': 'space',
    };

    const rawKey = e.key.toLowerCase();
    const key = KEY_MAP[rawKey] || rawKey;
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
        key,
        keyFormatted: this._formatKey(key),
        description: data.description,
        enabled: !this.disabledShortcuts.has(key)
      });
    }
    return shortcuts;
  }

  /**
   * Format key string for display
   * @private
   */
  _formatKey(key) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    return key
      .split('+')
      .map(k => {
        if (isMac && k === 'ctrl') return '\u2303';
        if (isMac && k === 'alt') return '\u2325';
        if (isMac && k === 'shift') return '\u21E7';
        if (isMac && k === 'meta') return '\u2318';
        if (k === 'arrowup') return '\u2191';
        if (k === 'arrowdown') return '\u2193';
        if (k === 'arrowleft') return '\u2190';
        if (k === 'arrowright') return '\u2192';
        if (k === 'space') return 'Space';
        return k.charAt(0).toUpperCase() + k.slice(1);
      })
      .join(' ');
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
