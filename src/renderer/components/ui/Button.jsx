import { h } from 'preact';

/**
 * Button Component
 * 
 * A versatile button component with multiple variants, sizes, and states.
 * 
 * @example
 * <Button variant="primary" size="md" onClick={handleClick}>Click Me</Button>
 * <Button variant="danger" size="lg" icon="bi-trash">Delete</Button>
 * <Button variant="ghost" loading>Loading...</Button>
 */

const variantClasses = {
  primary: `
    bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]
    text-white border-transparent
    hover:scale-105 hover:shadow-lg active:scale-95
  `,
  secondary: `
    bg-[var(--bg-muted)] hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]
    text-[var(--text-primary)] border-[var(--border-default)]
    hover:scale-105 hover:shadow-lg active:scale-95
  `,
  success: `
    bg-[var(--color-success)] hover:opacity-90 active:opacity-80
    text-white border-transparent
    hover:scale-105 hover:shadow-lg active:scale-95
  `,
  warning: `
    bg-[var(--color-warning)] hover:opacity-90 active:opacity-80
    text-white border-transparent
    hover:scale-105 hover:shadow-lg active:scale-95
  `,
  danger: `
    bg-[var(--color-danger)] hover:opacity-90 active:opacity-80
    text-white border-transparent
    hover:scale-105 hover:shadow-lg active:scale-95
  `,
  ghost: `
    bg-transparent hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]
    text-[var(--text-primary)] border-transparent
    hover:scale-105 hover:shadow-lg active:scale-95
  `,
  outline: `
    bg-transparent hover:bg-[var(--bg-hover)] active:bg-[var(--bg-active)]
    text-[var(--text-primary)] border-[var(--border-default)]
    hover:scale-105 hover:shadow-lg active:scale-95
  `,
};

const sizeClasses = {
  sm: 'h-[clamp(1.75rem,3.5vh,2rem)] px-[clamp(0.5rem,1vw,0.75rem)] text-[clamp(0.75rem,1.5vh,0.875rem)] gap-1.5',
  md: 'h-[clamp(2rem,4vh,2.5rem)] px-[clamp(0.75rem,1.2vw,1rem)] text-[clamp(0.875rem,1.8vh,0.875rem)] gap-[clamp(0.375rem,0.8vh,0.5rem)]',
  lg: 'h-[clamp(2.5rem,5vh,3rem)] px-[clamp(1rem,1.5vw,1.25rem)] text-[clamp(0.875rem,2vh,1rem)] gap-[clamp(0.375rem,0.8vh,0.5rem)]',
  xl: 'h-[clamp(3rem,6vh,4rem)] px-[clamp(1.25rem,2vw,1.5rem)] text-[clamp(1rem,2.5vh,1.125rem)] gap-[clamp(0.5rem,1vh,0.75rem)]',
  icon: 'h-[clamp(2rem,4vh,2.5rem)] w-[clamp(2rem,4vh,2.5rem)] p-0',
  'icon-sm': 'h-[clamp(1.75rem,3.5vh,2rem)] w-[clamp(1.75rem,3.5vh,2rem)] p-0',
  'icon-lg': 'h-[clamp(2.5rem,5vh,3rem)] w-[clamp(2.5rem,5vh,3rem)] p-0',
};

export function Button({
  children,
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  type = 'button',
  ...props
}) {
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg border
    transition-all duration-fast
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    select-none
  `;

  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.secondary,
    sizeClasses[size] || sizeClasses.md,
    fullWidth ? 'w-full' : '',
    className,
  ].join(' ').replace(/\s+/g, ' ').trim();

  const renderIcon = (iconName, position = 'left') => {
    if (!iconName) return null;
    return (
      <i 
        className={`bi ${iconName} ${loading && position === 'left' ? 'hidden' : ''}`}
        aria-hidden="true"
      />
    );
  };

  const renderSpinner = () => {
    if (!loading) return null;
    return (
      <svg 
        className="animate-spin h-4 w-4" 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle 
          className="opacity-25" 
          cx="12" cy="12" r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );
  };

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && renderSpinner()}
      {!loading && renderIcon(icon, 'left')}
      {children && <span>{children}</span>}
      {renderIcon(iconRight, 'right')}
    </button>
  );
}

export default Button;
