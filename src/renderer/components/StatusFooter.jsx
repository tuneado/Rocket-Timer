/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { Card } from './ui';
import { useAppState } from './useAppState.js';

const MESSAGE_COLORS = {
  success: 'var(--color-success)',
  info: 'var(--color-primary)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)'
};

const PERFORMANCE_COLORS = { good: '#4ade80', warning: '#fbbf24', critical: '#ef4444' };

const CAMERA = {
  live: { className: 'camera-live', color: '#4ade80', title: 'Camera Live' },
  error: { className: 'camera-error', color: '#f97316', title: 'Camera Unavailable' },
  inactive: { className: 'camera-inactive', color: '#9ca3af', title: 'Camera Inactive' }
};

function serverStatus(running, port, error) {
  if (running) {
    return {
      className: 'server-active',
      title: port
        ? `Unified API Server Running\nREST: :${port} | WebSocket: :8080 | OSC: :7000`
        : 'Unified API Server Running (REST, WebSocket, OSC)'
    };
  }
  // "Disabled in settings" is not an error
  if (error && error !== 'Disabled in settings') {
    return { className: 'server-error', title: 'Unified API Server Error' };
  }
  return { className: 'server-inactive', title: 'Unified API Server Inactive' };
}

export function StatusFooter() {
  const status = useAppState('ui.status');
  const performance = useAppState('ui.performance');
  const cameraStatus = useAppState('ui.cameraStatus');
  const serverRunning = useAppState('server.running');
  const serverPort = useAppState('server.port');
  const serverError = useAppState('server.error');

  const camera = CAMERA[cameraStatus === true ? 'live' : cameraStatus === 'error' ? 'error' : 'inactive'];
  const server = serverStatus(serverRunning, serverPort, serverError);

  return (
    <Card className="p-3 text-sm">
      <div className="flex items-center justify-between">
        <span id="statusMessage" className="text-text-secondary" style={{ color: MESSAGE_COLORS[status.type] }}>
          {status.text}
        </span>
        <div className="flex items-center gap-3">
          <i
            id="performanceStatus"
            className="bi bi-speedometer2"
            style={{ color: PERFORMANCE_COLORS[performance.level] || PERFORMANCE_COLORS.good }}
            role="img"
            aria-label={performance.title}
            data-tooltip={performance.title}
          />
          <i
            id="cameraStatus"
            className={`bi bi-camera-video ${camera.className}`}
            style={{ color: camera.color }}
            role="img"
            aria-label={camera.title}
            data-tooltip={camera.title}
          />
          <i
            id="serverStatus"
            className={`bi bi-broadcast ${server.className}`}
            role="img"
            aria-label={server.title}
            data-tooltip={server.title}
          />
        </div>
      </div>
    </Card>
  );
}
