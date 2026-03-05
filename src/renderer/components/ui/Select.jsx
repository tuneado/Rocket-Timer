import { h } from 'preact';

/**
 * Select Component
 * 
 * A styled dropdown select component.
 * 
 * @example
 * <Select 
 *   label="Layout"
 *   value={selected}
 *   onChange={e => setSelected(e.target.value)}
 *   options={[
 *     { value: 'classic', label: 'Classic' },
 *     { value: 'minimal', label: 'Minimal' },
 *   ]}
 * />
 */

const sizeClasses = {
  sm: 'h-8 px-2 text-sm',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base',
};

export function Select({
  label,
  description,
  error,
  options = [],
  size = 'md',
  fullWidth = true,
  placeholder,
  className = '',
  selectClassName = '',
  disabled = false,
  required = false,
  id,
  children,
  ...props
}) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseSelectClasses = 'appearance-none bg-[var(--bg-input)] border border-[var(--border-default)] rounded-lg text-[var(--text-primary)] transition-all focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer pr-10';

  const errorClasses = error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]' : '';

  const selectClasses = `${baseSelectClasses} ${sizeClasses[size] || sizeClasses.md} ${fullWidth ? 'w-full' : ''} ${errorClasses} ${selectClassName}`.trim();

  const wrapperClasses = `${fullWidth ? 'w-full' : ''} ${className}`.trim();

  return (
    <div className={wrapperClasses}>
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
        >
          {label}
          {required && <span className="text-[var(--color-danger)] ml-1">*</span>}
        </label>
      )}
      
      {description && !error && (
        <p className="text-xs text-[var(--text-secondary)] mb-1.5">{description}</p>
      )}

      <div className="relative">
        <select
          id={selectId}
          className={selectClasses}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children || options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <i className="bi bi-chevron-down text-[var(--text-secondary)]" aria-hidden="true" />
        </div>
      </div>

      {error && (
        <p className="text-xs text-[var(--color-danger)] mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}

export default Select;
