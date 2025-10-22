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
    "position": { "x": "5%", "y": "15%" },
    "size": { "width": "90%", "height": "4%" },
    "cornerRadius": 25
  },
  "countdown": {
    "enabled": true,
    "position": { "x": "center", "y": "middle" },
    "fontSize": 250,
    "alignment": "center"
  },
  "clock": {
    "enabled": true,
    "position": { "x": "center", "y": "67%" },
    "fontSize": 90,
    "alignment": "center"
  },
  "elapsed": {
    "enabled": false,
    "position": { "x": "25%", "y": "15%" },
    "fontSize": 40,
    "alignment": "center"
  },
  "separator": {
    "enabled": true,
    "position": { "y": "75%" },
    "width": "90%",
    "thickness": 3,
    "orientation": "horizontal"
  },
  "message": {
    "enabled": true,
    "position": { "x": "center", "y": "85%" },
    "fontSize": 60,
    "alignment": "center",
    "maxLines": 2,
    "lineHeight": 1.3,
    "showBackground": false
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
    "position": { "x": "center", "y": "73%" },
    "fontSize": 50,
    "alignment": "center"
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
    "radius": 450,
    "thickness": 40,
    "startAngle": -90
  },
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
    return layouts[layoutId] || layouts.classic;
  }
  
  /**
   * Get all available layouts with metadata
   * @returns {Array} Array of layout info objects
   */
  static getAllLayouts() {
    return Object.keys(layouts).map(key => ({
      id: key,
      name: layouts[key].name,
      description: layouts[key].description
    }));
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
    return layouts.hasOwnProperty(layoutId);
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
