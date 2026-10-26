/**
 * Rocket Timer — Professional Countdown & Timer Solution
 * @copyright 2026 50hz Event Solutions <geral@50-hz.com>
 * @author André Raimundo
 * @license GPL-3.0 — see LICENSE file for details
 * @see https://github.com/tuneado/Rocket-Timer
 */
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { SettingsGroup } from '../../ui/SettingsGroup.jsx';
import { SettingsItem } from '../../ui/SettingsItem.jsx';
import { Input } from '../../ui/Input.jsx';
import { Switch } from '../../ui/Switch.jsx';
import { Button } from '../../ui/Button.jsx';
import { useSettings, useIpc } from '../settingsContext.jsx';

const requestStatus = () => window.electron.ipcRenderer.send('request-server-status');

/**
 * ApiSection - API & Integration settings
 */
export function ApiSection() {
  const { settings, save, notify } = useSettings();
  const enabled = settings.companionServerEnabled !== false;
  const port = settings.companionServerPort || 9999;
  const allowExternal = !!settings.companionAllowExternal;

  // Server status from the main process
  const [status, setStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  useIpc('companion-server-status', setStatus);
  useEffect(requestStatus, []);

  const copy = (text, message = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text);
    notify(message, 'success');
  };

  const testConnection = async () => {
    setTesting(true);
    const reply = new Promise((resolve) => {
      const stop = window.electron.ipcRenderer.on('companion-server-status', (s) => { stop(); resolve(s); });
      setTimeout(() => { stop(); resolve(null); }, 1500);
    });
    requestStatus();
    const result = await reply;
    setTesting(false);
    if (result?.running) {
      notify('✅ Connection successful! Unified API Server is responding on all protocols.', 'success');
    } else {
      notify('❌ Cannot connect to Unified API Server. Make sure it\'s running.', 'error');
    }
  };

  const endpoints = [
    ['REST API', `http://localhost:${status?.port || port}/api`],
    ['WebSocket', `ws://localhost:${settings.websocketPort || 8080}`],
    ['OSC Control', `osc://localhost:${settings.oscPort || 7000}`]
  ];

  return (
    <div className="settings-section">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
        API & Integration
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Configure unified API system with REST, WebSocket, and OSC protocols
      </p>

      <SettingsGroup title="Unified API Server">
        <SettingsItem
          title="Enable Unified API Server"
          description="Multi-protocol API server with REST HTTP, WebSocket, and OSC support for external control"
        >
          <Switch
            checked={enabled}
            onChange={async (e) => {
              await save('companionServerEnabled', e.target.checked);
              notify(`Unified API Server (REST, WebSocket, OSC) will ${e.target.checked ? 'start' : 'stop'} on next launch. Restart required.`, 'info');
              requestStatus();
            }}
          />
        </SettingsItem>

        <SettingsItem
          title="Server Port"
          description="Port number for API server (requires restart)"
        >
          <Input
            type="number"
            min="1024"
            max="65535"
            className="w-24"
            value={port}
            onChange={(e) => {
              const portNum = parseInt(e.target.value, 10);
              if (!(portNum >= 1024 && portNum <= 65535)) {
                notify('Port must be between 1024 and 65535', 'error');
                e.target.value = port;
                return;
              }
              save('companionServerPort', portNum);
              notify('Port setting saved. Restart required.', 'info');
            }}
          />
        </SettingsItem>

        <SettingsItem
          block
          title="Server Status"
          description="Current status and endpoint information"
        >
          <div className="server-status-container space-y-3">
            <ServerStatus enabled={enabled} status={status} />

            {enabled && status?.running && (
              <div className="space-y-2">
                {endpoints.map(([label, url]) => (
                  <div key={label} className="endpoint-item flex items-center gap-2 text-sm">
                    <strong className="text-[var(--text-primary)]">{label}:</strong>
                    <code className="px-2 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-secondary)] font-mono text-xs">
                      {url}
                    </code>
                    <Button variant="ghost" size="sm" className="p-1" icon="bi-clipboard" title="Copy" onClick={() => copy(url)} />
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              icon="bi-arrow-repeat"
              disabled={testing}
              className={testing ? 'opacity-50 cursor-wait' : ''}
              onClick={testConnection}
            >
              Test Connection
            </Button>
          </div>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="API Documentation">
        <SettingsItem
          block
          title="Available Endpoints"
          description="REST API endpoints for timer control"
        >
          <div className="api-docs space-y-2">
            <ApiEndpoint method="GET" path="/api/timer/state" desc="Get timer state with warning levels & colors" />
            <ApiEndpoint method="POST" path="/api/timer/start" desc="Start the timer" />
            <ApiEndpoint method="POST" path="/api/timer/stop" desc="Stop/pause the timer" />
            <ApiEndpoint method="POST" path="/api/timer/reset" desc="Reset timer to last set time" />
            <ApiEndpoint method="POST" path="/api/timer/set-time" desc="Set time (hours, minutes, seconds or total seconds)" />
            <ApiEndpoint method="POST" path="/api/timer/adjust" desc="Adjust time by ±seconds" />
            <ApiEndpoint method="POST" path="/api/message/show" desc="Display custom message" />
            <ApiEndpoint method="POST" path="/api/layout" desc="Change timer layout" />
          </div>

          <Button
            variant="ghost"
            icon="bi-book"
            className="mt-4"
            onClick={() => window.electron.ipcRenderer.send('open-api-docs')}
          >
            View Full Documentation
          </Button>
        </SettingsItem>
      </SettingsGroup>

      <SettingsGroup title="Security">
        <SettingsItem
          title="Allow External Access"
          description="Allow connections from other devices on the network (not just localhost)"
        >
          <Switch
            checked={allowExternal}
            onChange={async (e) => {
              await save('companionAllowExternal', e.target.checked);
              notify('External access setting saved. Restart required.', 'info');
            }}
          />
        </SettingsItem>

        <SettingsItem
          block
          title="Network Access"
          description="Local IP addresses for external access"
        >
          <NetworkAddresses enabled={allowExternal} port={port} onCopy={(url) => copy(url, 'Address copied to clipboard!')} />
        </SettingsItem>
      </SettingsGroup>
    </div>
  );
}

function ServerStatus({ enabled, status }) {
  let dot = 'inactive';
  let text = 'Checking...';
  if (!enabled) {
    text = 'Disabled';
  } else if (status?.running) {
    dot = 'active';
    text = 'Running (REST, WebSocket, OSC)';
  } else if (status?.error) {
    dot = 'error';
    text = `Error: ${status.error}`;
  } else if (status) {
    text = 'Offline (Restart required)';
  }
  return (
    <div className="flex items-center gap-2">
      <span className={`status-dot ${dot}`} />
      <span className="text-sm text-[var(--text-secondary)]">{text}</span>
    </div>
  );
}

const InfoNote = ({ tone = 'neutral', icon, children }) => (
  <div className={`p-4 rounded-lg text-sm flex items-center gap-2 ${tone === 'warning'
    ? 'bg-amber-500/10 text-amber-500'
    : 'bg-[var(--bg-surface-raised)] text-[var(--text-secondary)]'}`}>
    <i className={`bi ${icon}`} />
    {children}
  </div>
);

function NetworkAddresses({ enabled, port, onCopy }) {
  const [addresses, setAddresses] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    window.electron.ipcRenderer.invoke('get-network-addresses')
      .then(setAddresses)
      .catch((err) => setError(err.message));
  }, [enabled]);

  if (!enabled) {
    return <InfoNote icon="bi-info-circle">Enable external access to see available network addresses</InfoNote>;
  }
  if (error) {
    return <InfoNote tone="warning" icon="bi-exclamation-triangle">Could not load network addresses: {error}</InfoNote>;
  }
  if (!addresses) return null;
  if (addresses.length === 0) {
    return <InfoNote tone="warning" icon="bi-exclamation-triangle">No external network interfaces found</InfoNote>;
  }

  return (
    <div className="network-addresses">
      {addresses.map(({ name, address }) => {
        const url = `http://${address}:${port}/api`;
        return (
          <div key={`${name}-${address}`} className="network-address-item">
            <div>
              <strong>{name}</strong>
              <code>{url}</code>
            </div>
            <button
              className="px-2 py-1 text-xs rounded bg-[var(--bg-surface-raised)] hover:bg-[var(--bg-hover)] copy-btn"
              title="Copy"
              onClick={() => onCopy(url)}
            >
              <i className="bi bi-clipboard" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/**
 * ApiEndpoint - Helper component for API endpoint display
 */
function ApiEndpoint({ method, path, desc }) {
  const methodColors = {
    GET: 'bg-[var(--color-success)] text-white',
    POST: 'bg-[var(--color-primary)] text-white',
    PUT: 'bg-[var(--color-warning)] text-black',
    DELETE: 'bg-[var(--color-danger)] text-white',
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${methodColors[method] || ''}`}>
        {method}
      </span>
      <code className="px-2 py-0.5 rounded bg-[var(--bg-inset)] text-[var(--text-secondary)] font-mono text-xs">
        {path}
      </code>
      <span className="text-[var(--text-muted)] text-xs">{desc}</span>
    </div>
  );
}

export default ApiSection;
