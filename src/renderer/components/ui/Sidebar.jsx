import { h } from 'preact';

/**
 * Sidebar Component
 * 
 * Navigation sidebar for settings pages.
 * 
 * @example
 * <Sidebar 
 *   items={[
 *     { id: 'display', label: 'Display', icon: 'bi-display' },
 *     { id: 'timer', label: 'Timer', icon: 'bi-stopwatch' },
 *   ]}
 *   activeId={currentSection}
 *   onSelect={setCurrentSection}
 * />
 */

export function Sidebar({
  items = [],
  activeId,
  onSelect,
  header,
  footer,
  className = '',
}) {
  return (
    <aside className={`w-[200px] flex-shrink-0 bg-[var(--sidebar-bg)] border-r border-[var(--border-default)] flex flex-col h-full ${className}`}>
      {/* Header */}
      {header && (
        <div className="p-4 border-b border-[var(--border-muted)]">
          {header}
        </div>
      )}
      
      {/* Navigation items */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {items.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            active={activeId === item.id}
            onClick={() => onSelect?.(item.id)}
            badge={item.badge}
          />
        ))}
      </nav>
      
      {/* Footer */}
      {footer && (
        <div className="p-4 border-t border-[var(--border-muted)]">
          {footer}
        </div>
      )}
    </aside>
  );
}

export function SidebarItem({
  icon,
  label,
  active = false,
  badge,
  onClick,
  className = '',
}) {
  const buttonClasses = active 
    ? 'bg-[var(--nav-active)] text-[var(--nav-active-text)]'
    : 'text-[var(--text-secondary)] hover:bg-[var(--nav-hover)] hover:text-[var(--text-primary)]';
  
  const badgeClasses = active 
    ? 'bg-white/20 text-white' 
    : 'bg-[var(--bg-muted)] text-[var(--text-secondary)]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-left transition-colors ${buttonClasses} ${className}`}
    >
      {icon && (
        <i className={`bi ${icon} text-base`} aria-hidden="true" />
      )}
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${badgeClasses}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

// Attach sub-component
Sidebar.Item = SidebarItem;

export default Sidebar;
