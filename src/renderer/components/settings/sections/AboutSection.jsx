/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

export function AboutSection() {
  const [version, setVersion] = useState('1.0.0');

  useEffect(() => {
    window.electron?.getVersion?.().then(v => v && setVersion(v));
  }, []);

  return (
    <div className="flex flex-col items-center text-center gap-6 py-8">
      <img
        src="../assets/rocket-icon_transparent.png"
        alt="Rocket Timer"
        className="w-28 h-28 object-contain"
      />
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Rocket Timer</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Version {version}</p>
      </div>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm">
        The ultimate timer app for events.
      </p>
      <div className="text-xs text-[var(--text-muted)] space-y-1">
        <p>© 2026 50hz Event Solutions</p>
        <p>
          <a
            href="mailto:geral@50-hz.com"
            className="text-[var(--accent)] hover:underline"
          >
            geral@50-hz.com
          </a>
        </p>
        <p className="mt-2">Licensed under the GNU GPL-3.0</p>
        <p className="mt-3 text-[var(--text-secondary)]">Made with ❤️ by André Raimundo</p>
      </div>
    </div>
  );
}

export default AboutSection;
