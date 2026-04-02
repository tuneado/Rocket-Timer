/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';

/**
 * ColorPicker Component
 * 
 * A color input with label and preview.
 * 
 * @example
 * <ColorPicker 
 *   label="Countdown Color"
 *   value="#4caf50"
 *   onChange={e => setColor(e.target.value)}
 * />
 */

export function ColorPicker({
  label,
  value = '#000000',
  onChange,
  disabled = false,
  showHex = true,
  size = 'md',
  className = '',
  id,
  ...props
}) {
  const colorId = id || `color-${Math.random().toString(36).substr(2, 9)}`;
  
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const colorSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {label && (
        <label 
          htmlFor={colorId}
          className="text-sm text-[var(--text-primary)] min-w-0 flex-shrink"
        >
          {label}
        </label>
      )}
      
      <div className="flex items-center gap-2 ml-auto">
        {showHex && (
          <span className="text-xs font-mono text-[var(--text-secondary)] uppercase">
            {value}
          </span>
        )}
        
        <div className={`
          relative ${colorSize}
          rounded-lg
          overflow-hidden
          border-2 border-[var(--border-default)]
          transition-colors duration-fast
          hover:border-[var(--color-primary)]
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}>
          <input
            type="color"
            id={colorId}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`
              absolute inset-0
              ${colorSize}
              cursor-pointer
              border-0
              p-0
              ${disabled ? 'cursor-not-allowed' : ''}
            `}
            style={{ 
              appearance: 'none',
              WebkitAppearance: 'none',
            }}
            {...props}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * ColorPickerGrid Component
 * 
 * A grid of color pickers for multiple color settings.
 * 
 * @example
 * <ColorPickerGrid 
 *   colors={[
 *     { id: 'countdown', label: 'Countdown', value: '#4caf50' },
 *     { id: 'clock', label: 'Clock', value: '#999999' },
 *   ]}
 *   onChange={(id, value) => handleColorChange(id, value)}
 * />
 */
export function ColorPickerGrid({
  colors = [],
  onChange,
  columns = 2,
  className = '',
}) {
  return (
    <div 
      className={`grid gap-3 ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {colors.map((color) => (
        <ColorPicker
          key={color.id}
          label={color.label}
          value={color.value}
          onChange={(e) => onChange?.(color.id, e.target.value)}
          disabled={color.disabled}
        />
      ))}
    </div>
  );
}

export default ColorPicker;
