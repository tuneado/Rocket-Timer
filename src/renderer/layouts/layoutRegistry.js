/**
 * Canvas Layout Registry
 * Manages available canvas layouts for the timer display
 * Layouts define positioning and structure; styling comes from CSS
 * 
 * Note: This file is designed to work in the browser renderer process.
 * Layout JSON files should be loaded via fetch or embedded directly.
 */

// Embedded layout definitions (avoids fetch/require complexity)
const classicLayout = {
  "name": "Classic",
  "description": "Traditional centered layout with all elements visible",
  "resolution": {
    "width": 1920,
    "height": 1080
  },
  "progressBar": {
    "enabled": true,
    "zIndex": 20,
    "position": { "x": "5%", "y": "15%" },
    "size": { "width": "90%", "height": "4%" },
    "cornerRadius": 25
  },
  "countdown": {
    "enabled": true,
    "zIndex": 40,
    "position": { "x": "center", "y": "middle" },
    "fontSize": 250,
    "alignment": "center",
    "opacity": 1.0,
    "background": {
      "enabled": false,
      "color": "rgba(0, 0, 0, 0.7)",
      "padding": 20,
      "borderRadius": 15
    }
  },
  "clock": {
    "enabled": true,
    "zIndex": 50,
    "position": { "x": "center", "y": "67%" },
    "fontSize": 90,
    "alignment": "center",
    "opacity": 0.8,
    "background": {
      "enabled": false,
      "color": "rgba(0, 0, 0, 0.6)",
      "padding": 15,
      "borderRadius": 10
    }
  },
  "elapsed": {
    "enabled": false,
    "zIndex": 60,
    "position": { "x": "25%", "y": "15%" },
    "fontSize": 40,
    "alignment": "center",
    "opacity": 1.0,
    "background": {
      "enabled": false,
      "color": "rgba(0, 0, 0, 0.6)",
      "padding": 10,
      "borderRadius": 8
    }
  },
  "endTime": {
    "enabled": false,
    "zIndex": 70,
    "position": { "x": "85%", "y": "15%" },
    "fontSize": 40,
    "alignment": "center",
    "format": "HH:MM:SS",
    "label": "ENDS AT",
    "showLabel": false,
    "labelSize": 20,
    "opacity": 0.8,
    "background": {
      "enabled": false,
      "color": "rgba(0, 0, 0, 0.6)",
      "padding": 10,
      "borderRadius": 8
    }
  },
  "separator": {
    "enabled": true,
    "zIndex": 30,
    "position": { "y": "75%" },
    "width": "90%",
    "thickness": 3,
    "orientation": "horizontal"
  },
  "message": {
    "enabled": true,
    "zIndex": 80,
    "position": { "x": "center", "y": "85%" },
    "fontSize": 60,
    "alignment": "center",
    "maxLines": 2,
    "lineHeight": 1.3,
    "showBackground": false,
    "opacity": 1.0
  }
};

const minimalLayout = {
  "name": "Minimal",
  "description": "Clean design with only countdown and message",
  "resolution": {
    "width": 1920,
    "height": 1080
  },
  "progressBar": {
    "enabled": false
  },
  "video": { "enabled": false },
  "countdown": {
    "enabled": true,
    "position": { "x": "center", "y": "middle" },
    "fontSize": 280,
    "alignment": "center"
  },
  "clock": {
    "enabled": false
  },
  "elapsed": {
    "enabled": false
  },
  "endTime": {
    "enabled": false,
    "position": { "x": "center", "y": "35%" },
    "fontSize": 50,
    "alignment": "center",
    "format": "HH:MM:SS",
    "label": "ENDS AT"
  },
  "separator": {
    "enabled": false
  },
  "message": {
    "enabled": true,
    "position": { "x": "center", "y": "75%" },
    "fontSize": 90,
    "alignment": "center",
    "maxLines": 2,
    "lineHeight": 1.3,
    "showBackground": false
  }
};

const clockFocusLayout = {
  "name": "Clock Focus",
  "description": "Large clock display with countdown below",
  "resolution": {
    "width": 1920,
    "height": 1080
  },
  "progressBar": {
    "enabled": false,
    "position": { "x": "10%", "y": "5%" },
    "size": { "width": "80%", "height": "3%" },
    "cornerRadius": 20
  },
  "video": { "enabled": false },
  "countdown": {
    "enabled": false,
    "position": { "x": "center", "y": "65%" },
    "fontSize": 120,
    "alignment": "center"
  },
  "clock": {
    "enabled": true,
    "position": { "x": "center", "y": "middle" },
    "fontSize": 280,
    "alignment": "center"
  },
  "elapsed": {
    "enabled": false
  },
  "endTime": {
    "enabled": false,
    "position": { "x": "85%", "y": "15%" },
    "fontSize": 40,
    "alignment": "center",
    "format": "HH:MM:SS",
    "label": "ENDS AT"
  },
  "separator": {
    "enabled": false,
    "position": { "y": "middle" },
    "width": "80%",
    "thickness": 3,
    "orientation": "horizontal"
  },
  "message": {
    "enabled": false,
    "position": { "x": "center", "y": "85%" },
    "fontSize": 60,
    "alignment": "center",
    "maxLines": 2,
    "lineHeight": 1.3,
    "showBackground": true
  }
};

const detailedLayout = {
  "name": "Detailed",
  "description": "Complete information with countdown, clock, and elapsed time",
  "resolution": {
    "width": 1920,
    "height": 1080
  },
  "progressBar": {
    "enabled": true,
    "position": { "x": "10%", "y": "8%" },
    "size": { "width": "80%", "height": "3%" },
    "cornerRadius": 20
  },
  "video": { "enabled": false },
  "countdown": {
    "enabled": true,
    "position": { "x": "center", "y": "40%" },
    "fontSize": 180,
    "alignment": "center"
  },
  "clock": {
    "enabled": true,
    "position": { "x": "center", "y": "60%" },
    "fontSize": 70,
    "alignment": "center"
  },
  "elapsed": {
    "enabled": true,
    "position": { "x": "30%", "y": "73%" },
    "fontSize": 70,
    "alignment": "center",
    "format": "HH:MM",
    "label": "ELAPSED",
    "showLabel": true,
    "labelSize": 35
  },
  "endTime": {
    "enabled": true,
    "position": { "x": "70%", "y": "73%" },
    "fontSize": 70,
    "alignment": "center",
    "format": "HH:MM",
    "label": "ENDS AT",
    "showLabel": true,
    "labelSize": 35
  },
  "separator": {
    "enabled": true,
    "position": { "y": "82%" },
    "width": "90%",
    "thickness": 3,
    "orientation": "horizontal"
  },
  "message": {
    "enabled": true,
    "position": { "x": "center", "y": "90%" },
    "fontSize": 60,
    "alignment": "center",
    "maxLines": 1,
    "lineHeight": 1.2,
    "showBackground": true
  }
};

const circularLayout = {
  "name": "Circular",
  "description": "Circular progress ring with countdown and clock in center",
  "resolution": {
    "width": 1920,
    "height": 1080
  },
  "progressBar": {
    "enabled": true,
    "type": "circular",
    "position": { "x": "center", "y": "middle" },
    "size": { "width": "83%", "height": "83%" },
    "thickness": 40,
    "startAngle": -90
  },
  "video": { "enabled": false },
  "countdown": {
    "enabled": true,
    "position": { "x": "center", "y": "47%" },
    "fontSize": 160,
    "alignment": "center"
  },
  "clock": {
    "enabled": true,
    "position": { "x": "center", "y": "57%" },
    "fontSize": 65,
    "alignment": "center"
  },
  "elapsed": {
    "enabled": false
  },
  "endTime": {
    "enabled": false,
    "position": { "x": "85%", "y": "15%" },
    "fontSize": 35,
    "alignment": "center",
    "format": "HH:MM:SS",
    "label": "ENDS AT"
  },
  "separator": {
    "enabled": false
  },
  "message": {
    "enabled": true,
    "position": { "x": "center", "y": "85%" },
    "fontSize": 60,
    "alignment": "center",
    "maxLines": 2,
    "lineHeight": 1.3,
    "showBackground": true
  }
};

const videoLayout = {
  "name": "Video Input",
  "description": "16:9 video input with timer overlay in bottom bar",
  "resolution": {
    "width": 1920,
    "height": 1080
  },
  "videoFrame": {
    "enabled": true,
    "position": { "x": 0, "y": 0 },
    "size": { "width": 1920, "height": 1080 },
    "opacity": 1.0
  },
  "video": {
    "enabled": true,
    "position": { "x": 0, "y": 0 },
    "size": { "width": "100%", "height": "100%" },
    "opacity": 1.0
  },
  "bottomBar": {
    "enabled": true,
    "position": { "x": "25%", "y": 1080 - 175 },
    "size": { "width": "50%", "height": 175 },
    "backgroundColor": "rgba(0, 0, 0, 0.85)",
    "borderColor": "#333333",
    "borderWidth": 2
  },
  "progressBar": {
    "enabled": true,
    "position": { "x": "27.5%", "y": 940 },
    "size": { "width": "45%", "height": 20 },
    "cornerRadius": 10
  },
  "countdown": {
    "enabled": true,
    "position": { "x": "50%", "y": 1010 },
    "fontSize": 85,
    "alignment": "center"
  },
  "clock": {
    "enabled": false,
    "position": { "x": "50%", "y": 1010 },
    "fontSize": 85,
    "alignment": "center"
  },
  "elapsed": {
    "enabled": false,
    "position": { "x": "75%", "y": 1010 },
    "fontSize": 65,
    "alignment": "center"
  },
  "endTime": {
    "enabled": false,
    "position": { "x": "85%", "y": 1010 },
    "fontSize": 50,
    "alignment": "center",
    "format": "HH:MM:SS",
    "label": "ENDS AT"
  },
  "separator": {
    "enabled": false
  },
  "message": {
    "enabled": true,
    "position": { "x": "center", "y": "45%" },
    "fontSize": 80,
    "alignment": "center",
    "maxLines": 3,
    "lineHeight": 1.4,
    "showBackground": true
  }
};

// Layout registry
const layouts = {
  classic: classicLayout,
  minimal: minimalLayout,
  clockfocus: clockFocusLayout,
  detailed: detailedLayout,
  circular: circularLayout,
  video: videoLayout
};

// Custom layouts storage (loaded from localStorage)
let customLayouts = {};

// Load custom layouts from localStorage
function loadCustomLayouts() {
  try {
    const stored = localStorage.getItem('customLayouts');
    if (stored) {
      customLayouts = JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load custom layouts:', error);
    customLayouts = {};
  }
}

// Save custom layouts to localStorage
function saveCustomLayouts() {
  try {
    localStorage.setItem('customLayouts', JSON.stringify(customLayouts));
  } catch (error) {
    console.error('Failed to save custom layouts:', error);
  }
}

// Initialize custom layouts on load
if (typeof window !== 'undefined') {
  loadCustomLayouts();
}

/**
 * Layout Registry API
 */
class LayoutRegistry {
  /**
   * Get a specific layout by ID
   * @param {string} layoutId - The layout identifier
   * @returns {object} Layout configuration object
   */
  static getLayout(layoutId) {
    return layouts[layoutId] || customLayouts[layoutId] || layouts.classic;
  }
  
  /**
   * Get all available layouts with metadata
   * @returns {Array} Array of layout info objects
   */
  static getAllLayouts() {
    const builtinLayouts = Object.keys(layouts).map(key => ({
      id: key,
      name: layouts[key].name,
      description: layouts[key].description,
      type: 'builtin'
    }));
    
    const customLayoutsList = Object.keys(customLayouts).map(key => ({
      id: key,
      name: customLayouts[key].name,
      description: customLayouts[key].description,
      type: 'custom'
    }));
    
    return [...builtinLayouts, ...customLayoutsList];
  }
  
  /**
   * Get the default layout ID
   * @returns {string} Default layout identifier
   */
  static getDefaultLayout() {
    return 'classic';
  }
  
  /**
   * Check if a layout ID exists
   * @param {string} layoutId - The layout identifier to check
   * @returns {boolean} True if layout exists
   */
  static hasLayout(layoutId) {
    return layouts.hasOwnProperty(layoutId) || customLayouts.hasOwnProperty(layoutId);
  }
  
  /**
   * Get built-in layouts only
   * @returns {Array} Array of built-in layout info objects
   */
  static getBuiltinLayouts() {
    return Object.keys(layouts).map(key => ({
      id: key,
      name: layouts[key].name,
      description: layouts[key].description,
      resolution: layouts[key].resolution,
      type: 'builtin'
    }));
  }
  
  /**
   * Get custom layouts only
   * @returns {Array} Array of custom layout info objects
   */
  static getCustomLayouts() {
    return Object.keys(customLayouts).map(key => ({
      id: key,
      name: customLayouts[key].name,
      description: customLayouts[key].description,
      resolution: customLayouts[key].resolution,
      type: 'custom'
    }));
  }
  
  /**
   * Add a custom layout
   * @param {string} layoutId - Unique identifier for the layout
   * @param {object} layoutData - The layout configuration object
   * @returns {boolean} True if successfully added
   */
  static addCustomLayout(layoutId, layoutData) {
    try {
      // Validate required fields
      if (!layoutData.name || !layoutData.resolution) {
        throw new Error('Layout must have name and resolution');
      }
      
      // Ensure ID doesn't conflict with built-in layouts
      if (layouts.hasOwnProperty(layoutId)) {
        throw new Error('Layout ID conflicts with built-in layout');
      }
      
      customLayouts[layoutId] = layoutData;
      saveCustomLayouts();
      return true;
    } catch (error) {
      console.error('Failed to add custom layout:', error);
      return false;
    }
  }
  
  /**
   * Remove a custom layout
   * @param {string} layoutId - The layout identifier to remove
   * @returns {boolean} True if successfully removed
   */
  static removeCustomLayout(layoutId) {
    if (customLayouts.hasOwnProperty(layoutId)) {
      delete customLayouts[layoutId];
      saveCustomLayouts();
      return true;
    }
    return false;
  }
  
  /**
   * Clear all custom layouts
   * @returns {boolean} True if successfully cleared
   */
  static clearAllCustomLayouts() {
    try {
      customLayouts = {};
      saveCustomLayouts();
      return true;
    } catch (error) {
      console.error('Failed to clear custom layouts:', error);
      return false;
    }
  }
  
  /**
   * Validate a layout configuration
   * @param {object} layoutData - The layout configuration to validate
   * @returns {object} Validation result with isValid and errors
   */
  static validateLayout(layoutData) {
    const errors = [];
    
    try {
      // Check basic structure
      if (!layoutData || typeof layoutData !== 'object') {
        errors.push('Layout must be a valid object');
        return { isValid: false, errors };
      }
      
      // Required fields
      if (!layoutData.name || typeof layoutData.name !== 'string') {
        errors.push('Layout must have a valid name');
      }
      
      if (!layoutData.resolution || !layoutData.resolution.width || !layoutData.resolution.height) {
        errors.push('Layout must have resolution with width and height');
      }
      
      // Validate elements
      const requiredElements = ['countdown', 'clock', 'progressBar', 'separator', 'message', 'elapsed', 'endTime', 'video'];
      for (const element of requiredElements) {
        if (!layoutData[element]) {
          errors.push(`Missing ${element} configuration`);
          continue;
        }
        
        const config = layoutData[element];
        
        // Check enabled property
        if (typeof config.enabled !== 'boolean') {
          errors.push(`${element}.enabled must be a boolean`);
        }
        
        // Check position if element is enabled
        if (config.enabled && config.position) {
          // Separator can have only x (vertical) or only y (horizontal)
          if (element === 'separator') {
            if (config.position.x === undefined && config.position.y === undefined) {
              errors.push(`${element}.position must have at least x or y coordinate`);
            }
          } else {
            // Other elements need both x and y
            if (config.position.x === undefined || config.position.x === null) {
              errors.push(`${element}.position.x is required when enabled`);
            }
            if (config.position.y === undefined || config.position.y === null) {
              errors.push(`${element}.position.y is required when enabled`);
            }
          }
        }
        
        // Element-specific validations
        if (element === 'countdown' || element === 'clock' || element === 'message') {
          if (config.enabled && (!config.fontSize || config.fontSize <= 0)) {
            errors.push(`${element}.fontSize must be a positive number when enabled`);
          }
          if (config.enabled && !config.alignment) {
            errors.push(`${element}.alignment is required when enabled (center, left, right)`);
          }
        }
        
        // Validate separator-specific properties
        if (element === 'separator' && config.enabled) {
          if (!config.orientation || !['horizontal', 'vertical'].includes(config.orientation)) {
            errors.push(`${element}.orientation must be 'horizontal' or 'vertical'`);
          }
        }
        
        // Validate progressBar-specific properties
        if (element === 'progressBar' && config.enabled) {
          if (!config.size || !config.size.width || !config.size.height) {
            errors.push(`${element}.size with width and height is required when enabled`);
          }
        }
      }
      
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// For Node.js module exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LayoutRegistry;
}

// For browser global
if (typeof window !== 'undefined') {
  window.LayoutRegistry = LayoutRegistry;
}
