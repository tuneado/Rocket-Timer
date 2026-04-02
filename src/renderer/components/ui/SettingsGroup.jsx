/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';

/**
 * SettingsGroup Component
 * 
 * A container for grouping related settings items.
 * 
 * @example
 * <SettingsGroup title="Timer Settings">
 *   <SettingsItem title="..." />
 *   <SettingsItem title="..." />
 * </SettingsGroup>
 */

export function SettingsGroup({
  title,
  description,
  children,
  className = '',
}) {
  return (
    <div className={`mb-6 ${className}`}>
      {title && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-sm">
        {children}
      </div>
    </div>
  );
}

export default SettingsGroup;
