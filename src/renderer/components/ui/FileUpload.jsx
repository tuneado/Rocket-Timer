/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { useRef } from 'preact/hooks';
import Button from './Button.jsx';

/**
 * FileUpload Component
 * 
 * A file picker with filename display and clear button.
 * 
 * @example
 * <FileUpload 
 *   label="Custom Sound"
 *   accept="audio/*"
 *   fileName={soundName}
 *   onChange={handleFileSelect}
 *   onClear={handleClear}
 * />
 */

export function FileUpload({
  label,
  description,
  accept,
  fileName,
  onChange,
  onClear,
  buttonText = 'Choose file...',
  noFileText = 'No file selected',
  icon = 'bi-upload',
  disabled = false,
  error,
  className = '',
  id,
  ...props
}) {
  const inputRef = useRef(null);
  const fileInputId = id || `file-${Math.random().toString(36).substr(2, 9)}`;

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onChange) {
      onChange(file, e);
    }
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onClear?.();
  };

  return (
    <div className={className}>
      {label && (
        <label 
          className="block text-sm font-medium text-[var(--text-primary)] mb-1.5"
        >
          {label}
        </label>
      )}
      
      {description && (
        <p className="text-xs text-[var(--text-secondary)] mb-2">{description}</p>
      )}

      <div className="flex flex-col gap-2">
        {/* File input row */}
        <div className="flex items-stretch gap-0">
          {/* Hidden file input */}
          <input
            ref={inputRef}
            type="file"
            id={fileInputId}
            accept={accept}
            onChange={handleChange}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          
          {/* Button trigger */}
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            className={`
              inline-flex items-center gap-2 px-4 h-10
              bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)]
              border border-[var(--border-default)] border-r-0
              rounded-l-lg
              text-sm font-medium text-[var(--text-primary)]
              transition-colors duration-fast
              disabled:opacity-50 disabled:cursor-not-allowed
              cursor-pointer
            `}
          >
            <i className={`bi ${icon}`} aria-hidden="true" />
            <span>{buttonText}</span>
          </button>
          
          {/* Filename display */}
          <div className={`
            flex-1 flex items-center px-3 h-10
            bg-[var(--bg-input)]
            border border-[var(--border-default)]
            rounded-r-lg
            text-sm
            truncate
            ${fileName ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}
          `}>
            {fileName || noFileText}
          </div>
        </div>

        {/* Clear button (shown when file selected) */}
        {fileName && onClear && (
          <Button
            variant="ghost"
            size="sm"
            icon="bi-x-circle"
            onClick={handleClear}
            disabled={disabled}
            className="self-start"
          >
            Clear
          </Button>
        )}
      </div>

      {error && (
        <p className="text-xs text-[var(--color-danger)] mt-1.5">
          {error}
        </p>
      )}
    </div>
  );
}

export default FileUpload;
