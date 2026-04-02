/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';

/**
 * SettingsItem Component
 * 
 * A layout component for individual settings items with label and control.
 * 
 * @example
 * <SettingsItem 
 *   title="Auto-stop at zero"
 *   description="Stop timer when it reaches 00:00:00"
 * >
 *   <Switch checked={autoStop} onChange={setAutoStop} />
 * </SettingsItem>
 */

export function SettingsItem({
  title,
  description,
  children,
  block = false,
  className = '',
  id,
}) {
  if (block) {
    // Block layout: title/description on top, control below (full width)
    return (
      <div id={id} className={`py-4 px-5 border-b border-[var(--border-muted)] last:border-b-0 ${className}`}>
        <div className="mb-3">
          <div className="text-sm font-medium text-[var(--text-primary)]">
            {title}
          </div>
          {description && (
            <div className="text-xs text-[var(--text-secondary)] mt-1">
              {description}
            </div>
          )}
        </div>
        <div>
          {children}
        </div>
      </div>
    );
  }

  // Inline layout: title/description on left, control on right
  return (
    <div id={id} className={`flex items-center justify-between gap-4 py-4 px-5 border-b border-[var(--border-muted)] last:border-b-0 ${className}`}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--text-primary)]">
          {title}
        </div>
        {description && (
          <div className="text-xs text-[var(--text-secondary)] mt-0.5">
            {description}
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
}

export default SettingsItem;
