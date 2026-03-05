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
      <div className={noPadding ? '' : 'p-4'}>
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
      px-4 py-3
      border-b border-[var(--border-muted)]
      bg-[var(--bg-muted)]
      ${className}
    `}>
      <div className="flex items-center gap-2">
        {icon && <i className={`bi ${icon} text-[var(--text-secondary)]`} aria-hidden="true" />}
        <div>
          <h3 className="font-semibold text-sm text-[var(--text-primary)]">{title}</h3>
          {subtitle && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardContent({ children, className = '', noPadding = false }) {
  return (
    <div className={`${noPadding ? '' : 'p-4'} ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`
      px-4 py-3
      border-t border-[var(--border-muted)]
      bg-[var(--bg-muted)]
      flex items-center justify-end gap-2
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
