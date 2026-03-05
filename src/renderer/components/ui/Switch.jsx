import { h } from 'preact';

/**
 * Switch Component
 * 
 * A toggle switch for boolean values.
 * 
 * @example
 * <Switch 
 *   checked={enabled}
 *   onChange={e => setEnabled(e.target.checked)}
 *   label="Enable notifications"
 * />
 */

export function Switch({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className = '',
  id,
  ...props
}) {
  const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`;
  
  // Size configurations with CSS variable for knob translation
  const sizeConfig = {
    sm: { track: 'w-8 h-4', knob: 'w-3 h-3', translatePx: '16px' },
    md: { track: 'w-11 h-6', knob: 'w-5 h-5', translatePx: '20px' },
    lg: { track: 'w-14 h-7', knob: 'w-6 h-6', translatePx: '28px' },
  };

  const cfg = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          id={switchId}
          defaultChecked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only"
          role="switch"
          {...props}
        />
        
        {/* Track - uses CSS sibling selector to respond to input:checked */}
        <div className={`${cfg.track} rounded-full switch-track peer-disabled:opacity-50 peer-disabled:cursor-not-allowed`}>
          {/* Knob - uses CSS sibling selector for position */}
          <div 
            className={`${cfg.knob} bg-[var(--switch-knob)] rounded-full shadow-md absolute top-0.5 left-0.5 switch-knob`}
            style={{ '--switch-translate': cfg.translatePx }}
          />
        </div>
      </label>
      
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label 
              htmlFor={switchId}
              className="text-sm font-medium text-[var(--text-primary)] cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <span className="text-xs text-[var(--text-secondary)]">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default Switch;
