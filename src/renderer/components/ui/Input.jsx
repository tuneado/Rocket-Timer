/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { useRef, useEffect } from 'preact/hooks';

/**
 * Input Component
 * 
 * A versatile input component supporting text, number, time, and other types.
 * 
 * @example
 * <Input label="Username" placeholder="Enter username" />
 * <Input type="number" min={0} max={100} suffix="%" />
 * <Input type="time" size="lg" />
 */

const sizeClasses = {
  sm: 'h-8 px-2 text-sm',
  md: 'h-10 px-3 text-sm',
  lg: 'h-12 px-4 text-base',
  xl: 'h-16 px-4 text-3xl font-mono', // For timer display inputs
};

export function Input({
  label,
  description,
  error,
  type = 'text',
  size = 'md',
  prefix,
  suffix,
  fullWidth = true,
  className = '',
  inputClassName = '',
  disabled = false,
  required = false,
  id,
  ...props
}) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseInputClasses = `
    bg-[var(--bg-input)]
    border border-[var(--border-default)]
    rounded-lg
    text-[var(--text-primary)]
    placeholder:text-[var(--text-muted)]
    transition-all duration-fast
    focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]
    disabled:opacity-50 disabled:cursor-not-allowed
    ${error ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]' : ''}
  `;

  const inputClasses = [
    baseInputClasses,
    sizeClasses[size] || sizeClasses.md,
    fullWidth && !prefix && !suffix ? 'w-full' : '',
    prefix ? 'rounded-l-none' : '',
    suffix ? 'rounded-r-none' : '',
    inputClassName,
  ].join(' ').replace(/\s+/g, ' ').trim();

  const wrapperClasses = `${fullWidth ? 'w-full' : ''} ${className}`;

  return (
    <div className={wrapperClasses}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
        >
          {label}
          {required && <span className="text-[var(--color-danger)] ml-1">*</span>}
        </label>
      )}
      
      {description && !error && (
        <p className="text-xs text-[var(--text-secondary)] mb-1.5">{description}</p>
      )}

      <div className={`flex ${fullWidth ? 'w-full' : ''}`}>
        {prefix && (
          <span className={`
            inline-flex items-center px-3
            bg-[var(--bg-muted)] border border-r-0 border-[var(--border-default)]
            rounded-l-lg text-sm text-[var(--text-secondary)]
            ${sizeClasses[size]?.includes('h-8') ? 'h-8' : ''}
            ${sizeClasses[size]?.includes('h-10') ? 'h-10' : ''}
            ${sizeClasses[size]?.includes('h-12') ? 'h-12' : ''}
            ${sizeClasses[size]?.includes('h-16') ? 'h-16' : ''}
          `}>
            {prefix}
          </span>
        )}
        
        <input
          id={inputId}
          type={type}
          className={inputClasses}
          disabled={disabled}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : description ? `${inputId}-desc` : undefined}
          {...props}
        />
        
        {suffix && (
          <span className={`
            inline-flex items-center px-3
            bg-[var(--bg-muted)] border border-l-0 border-[var(--border-default)]
            rounded-r-lg text-sm text-[var(--text-secondary)]
            ${sizeClasses[size]?.includes('h-8') ? 'h-8' : ''}
            ${sizeClasses[size]?.includes('h-10') ? 'h-10' : ''}
            ${sizeClasses[size]?.includes('h-12') ? 'h-12' : ''}
            ${sizeClasses[size]?.includes('h-16') ? 'h-16' : ''}
          `}>
            {suffix}
          </span>
        )}
      </div>

      {error && (
        <p id={`${inputId}-error`} className="text-xs text-[var(--color-danger)] mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * TimeInput Component
 * 
 * A specialized input group for time (HH:MM:SS) entry.
 * 
 * @example
 * <TimeInput 
 *   hours={0} minutes={10} seconds={0}
 *   onHoursChange={setHours}
 *   onMinutesChange={setMinutes}
 *   onSecondsChange={setSeconds}
 * />
 */
export function TimeInput({
  hours = 0,
  minutes = 0,
  seconds = 0,
  onHoursChange,
  onMinutesChange,
  onSecondsChange,
  size = 'lg',
  disabled = false,
  className = '',
  ...props
}) {
  const timeInputClasses = `
    w-20 text-center font-mono
    bg-[var(--bg-input)]
    border-2 border-[var(--border-default)]
    rounded-lg
    text-[var(--text-primary)]
    transition-all duration-fast
    focus:outline-none focus:border-[var(--color-primary)]
    disabled:opacity-50
  `;

  const sizeMap = {
    sm: 'h-10 text-lg',
    md: 'h-12 text-xl',
    lg: 'h-16 text-3xl',
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} {...props}>
      <input
        type="number"
        min="0"
        max="99"
        value={hours}
        onChange={(e) => onHoursChange?.(parseInt(e.target.value) || 0)}
        className={`${timeInputClasses} ${sizeMap[size]}`}
        disabled={disabled}
        aria-label="Hours"
      />
      <span className="text-2xl font-bold text-[var(--text-secondary)]">:</span>
      <input
        type="number"
        min="0"
        max="59"
        value={minutes}
        onChange={(e) => onMinutesChange?.(parseInt(e.target.value) || 0)}
        className={`${timeInputClasses} ${sizeMap[size]}`}
        disabled={disabled}
        aria-label="Minutes"
      />
      <span className="text-2xl font-bold text-[var(--text-secondary)]">:</span>
      <input
        type="number"
        min="0"
        max="59"
        value={seconds}
        onChange={(e) => onSecondsChange?.(parseInt(e.target.value) || 0)}
        className={`${timeInputClasses} ${sizeMap[size]}`}
        disabled={disabled}
        aria-label="Seconds"
      />
    </div>
  );
}

export default Input;
