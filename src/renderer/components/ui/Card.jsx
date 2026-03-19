import { h } from 'preact';

/**
 * Card Component
 * 
 * A container component for grouping related content.
 * 
 * @example
 * <Card>
 *   <Card.Header title="Settings" icon="bi-gear" />
 *   <Card.Content>Content here</Card.Content>
 * </Card>
 * 
 * Or simple usage:
 * <Card title="Settings">Content here</Card>
 */

export function Card({ 
  children, 
  title,
  icon,
  action,
  className = '',
  noPadding = false,
  ...props 
}) {
  const baseClasses = `
    bg-[var(--bg-surface)] 
    border border-[var(--border-default)] 
    rounded-xl 
    shadow-card
    overflow-hidden
  `;

  const classes = [baseClasses, className].join(' ').replace(/\s+/g, ' ').trim();

  return (
    <div className={classes} {...props}>
      {title && (
        <CardHeader title={title} icon={icon} action={action} />
      )}
      <div className={noPadding ? '' : 'p-[clamp(0.5rem,1.2vh,1rem)]'}>
        {children}
      </div>
    </div>
  );
}

export function CardHeader({ 
  title, 
  subtitle,
  icon, 
  action,
  className = '' 
}) {
  return (
    <div className={`
      flex items-center justify-between
      px-[clamp(0.5rem,1.2vh,1rem)] py-[clamp(0.4rem,1vh,0.75rem)]
      border-b border-[var(--border-muted)]
      bg-[var(--bg-muted)]
      ${className}
    `}>
      <div className="flex items-center gap-2">
        {icon && <i className={`bi ${icon} text-[var(--text-secondary)]`} aria-hidden="true" />}
        <div>
          <h3 className="font-semibold text-[clamp(0.75rem,1.5vh,0.875rem)] text-[var(--text-primary)]">{title}</h3>
          {subtitle && (
            <p className="text-[clamp(0.625rem,1.2vh,0.75rem)] text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardContent({ children, className = '', noPadding = false }) {
  return (
    <div className={`${noPadding ? '' : 'p-[clamp(0.5rem,1.2vh,1rem)]'} ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`
      px-[clamp(0.5rem,1.2vh,1rem)] py-[clamp(0.5rem,1vh,0.75rem)]
      border-t border-[var(--border-muted)]
      bg-[var(--bg-muted)]
      flex items-center justify-end gap-[clamp(0.375rem,0.8vh,0.5rem)]
      ${className}
    `}>
      {children}
    </div>
  );
}

// Attach sub-components for compound component pattern
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
