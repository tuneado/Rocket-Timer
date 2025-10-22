/**
 * Color Utilities
 * Functions for color manipulation and interpolation
 */

/**
 * Interpolate between two hex or rgba colors
 * @param {string} color1 - Start color (hex or rgba)
 * @param {string} color2 - End color (hex or rgba)
 * @param {number} factor - Interpolation factor (0-1)
 * @returns {string} Interpolated color
 */
export function interpolateColor(color1, color2, factor) {
  // Handle rgba colors
  if (color1.startsWith('rgba')) {
    const rgba = color1.match(/[\d.]+/g);
    const r1 = parseInt(rgba[0]);
    const g1 = parseInt(rgba[1]);
    const b1 = parseInt(rgba[2]);
    const a = parseFloat(rgba[3]);
    
    const r = Math.round(r1 + (255 - r1) * factor);
    const g = Math.round(g1 + (0 - g1) * factor);
    const b = Math.round(b1 + (0 - b1) * factor);
    
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  
  // Handle hex colors
  const c1 = parseInt(color1.replace('#', ''), 16);
  const c2 = parseInt(color2.replace('#', ''), 16);
  
  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;
  
  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;
  
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
